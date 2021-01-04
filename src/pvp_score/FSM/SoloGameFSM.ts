import {StateMachine} from 'stateless';
import {Observable, Subscription, timer} from 'rxjs';
import {map} from 'rxjs/operators';
import {Dispatcher} from '@colyseus/command';
import {Client} from 'colyseus';
import {SoloRoomState} from "../SoloRoomState";
import {
    AttackCommand,
    JoinRoomCommand,
    LeaveRoomCommand, LifeCommand,
    LoseLifeCommand,
    ReadyCommand, RematchCommand,
    ScoreCommand, StartCommand,
    UpgradeShipCommand
} from "./SoloCommand";
import {SoloRoom} from "../SoloRoom";
import {SoloPlayerProfile} from "../SoloPlayerProfile";
import request = require('request');
import {Config} from '../../config';
import {UmlDotGraph} from "stateless/graph";

enum Trigger {
    StartGame = "StartGame",
    ReadyGame = "ReadyGame",
    TimeOver = "TimeOver",
    PlayerDead = "PlayerDead",
    PlayerLeave = "PlayerLeave",
    PlayerRematch = "PlayerRematch",
    Close = "Close"
}

enum GameState {
    Prepare = "Prepare",
    Ready = "Ready",
    Playing = "Playing",
    EndGame = "EndGame",
    Rematch = "Rematch",
    CloseGame = "CloseGame"
}

export enum AttackType {
    SmokingBomb = 0,
    SlowingBomb = 1,
    InverseBomb = 2,
    FrenzyFire = 3,
    LockDown = 4,
    Blindfolded = 5,
    HurtfulFriend = 6,
    ScaleOfJustice = 7,
    DeathClock = 8,
    WishingStar = 9,
}

const env = process.env.NODE_ENV || 'development';

export class SoloGameFSM {

    fsm = new StateMachine<GameState, Trigger>(GameState.Prepare);
    roomState: SoloRoomState;
    dispatcher: Dispatcher;
    room: SoloRoom;
    timmer1second: Observable<number> = timer(0, 1000);

    listDispose: Subscription;

    defaultTime: number = 180;
    time: number;
    round: number = 0;
    lifeScore: number = 5000;
    endMessage: any;
    readyMessage: any;
    private levels: number[];

    constructor(room: SoloRoom, roomState: SoloRoomState) {
        this.room = room;
        this.roomState = roomState;
        this.dispatcher = new Dispatcher(room);
        this.listDispose = new Subscription();

        this.fsm.onUnhandledTrigger((state, trigger) => {
            //console.log(`onUnhandledTrigger ${state} - ${trigger}`)
        });

        this.fsm.configure(GameState.Prepare)
            .onActivate(() => this.OnPrepare())
            .permitIf(Trigger.ReadyGame, GameState.Ready, () => {
                let playersCount = Object.keys(this.roomState.Players).length;
                return room.maxClients == playersCount;
            })
            .permit(Trigger.PlayerLeave, GameState.CloseGame);

        this.fsm.configure(GameState.Ready)
            .onEntry(() => this.OnReady())
            .onEntryFrom(Trigger.PlayerRematch, () => this.CalculateElo())
            .permitIf(Trigger.StartGame, GameState.Playing, () => this.CheckPlayersReady())
            .permit(Trigger.PlayerLeave, GameState.CloseGame);

        this.fsm.configure(GameState.Playing)
            .onEntry(() => this.OnStartGame())
            .permit(Trigger.PlayerDead, GameState.EndGame)
            .permit(Trigger.PlayerLeave, GameState.EndGame)
            .permit(Trigger.TimeOver, GameState.EndGame);

        this.fsm.configure(GameState.EndGame)
            .onEntryFrom(Trigger.PlayerDead, (transition, player) => this.OnEndGamePlayerDead(player))
            .onEntryFrom(Trigger.PlayerLeave, (transition, player) => this.OnEndGamePlayerLeave(player))
            .onEntryFrom(Trigger.TimeOver, () => this.OnEndGameTimeOver())
            .permit(Trigger.Close, GameState.CloseGame)
            .permit(Trigger.PlayerLeave, GameState.CloseGame)
            .permit(Trigger.PlayerRematch, GameState.Rematch);

        this.fsm.configure(GameState.CloseGame)
            .onEntry(() => this.OnCloseGame());

        this.fsm.configure(GameState.Rematch)
            .permitIf(Trigger.PlayerRematch, GameState.Ready, () => this.CheckPlayersRematch())
            .permit(Trigger.PlayerLeave, GameState.CloseGame);

        //const graph = UmlDotGraph.format(this.fsm.getInfo());
        
        this.fsm.activate();
    }

    private CheckPlayersReady() {
        for (let key in this.roomState.Players) {
            let player: SoloPlayerProfile = this.roomState.Players[key];
            if (!player.IsReady) {
                return false;
            }
        }

        return true;
    }

    private CheckPlayersRematch() {
        for (let key in this.roomState.Players) {
            let player: SoloPlayerProfile = this.roomState.Players[key];
            if (!player.IsRematch) {
                return false;
            }
        }

        return true;
    }

    ReadyGame() {
        this.fsm.fire(Trigger.ReadyGame);
    }

    StartGame() {
        this.fsm.fire(Trigger.StartGame);
    }

    PlayerDead(player: SoloPlayerProfile) {
        this.fsm.fire(Trigger.PlayerDead, player);
    }

    PlayerLeave(player: SoloPlayerProfile) {
        this.fsm.fire(Trigger.PlayerLeave, player);
    }

    PlayerRematch(client: Client) {
        this.fsm.fire(Trigger.PlayerRematch, client);
    }

    CloseGame() {
        this.fsm.fire(Trigger.Close);
    }

    private OnPrepare() {
        this.listDispose.add(timer(1000 * 30).subscribe(_ => {
            this.fsm.deactivate();
            this.room.lock();
            this.OnCloseGame();
        }));
    }

    private async OnReady() {
        this.levels = this.room.levels.slice();
        for (let i = this.levels.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
            [this.levels[i], this.levels[j]] = [this.levels[j], this.levels[i]];
        }
        Config.Log(this.levels);
        this.readyMessage = {Levels: this.levels, Result: this.room.results};
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.room.broadcast("READY_GAME", {Levels: this.levels, Result: this.room.results});
    }

    private async OnStartGame() {
        //console.log("OnStartGame");
        Config.Log(`OnStartGame`);

        this.listDispose.unsubscribe();
        await this.room.lock();
        this.round++;
        //await new Promise(resolve => setTimeout(resolve, 1500));
        let subscribe = this.timmer1second.subscribe(secondsLapse => {
            this.roomState.Time = (this.defaultTime - secondsLapse) * 1000;
            if (this.roomState.Time <= 0) {
                subscribe.unsubscribe();
                this.fsm.fire(Trigger.TimeOver);
            }
        });
        this.listDispose = new Subscription();
        this.listDispose.add(subscribe);

        for (let key in this.roomState.Players) {
            let player: SoloPlayerProfile = this.roomState.Players[key];
            let playerSubcribe = this.timmer1second
                .pipe(map(_ => player))
                .subscribe(p => {
                    let loseLives = Object.keys(p.Ships).length - p.Profile.Life;
                    switch (loseLives) {
                        case 0:
                            p.AttackLevel += 2;
                            break;
                        case 1:
                            p.AttackLevel += 3;
                            break;
                        case 2:
                            p.AttackLevel += 4;
                            break;
                        default:
                            p.AttackLevel += 5;
                            break;
                    }

                    if (p.AttackLevel >= 100) {
                        p.AttackLevel -= 100;
                        let attackId = p.AttackTypes[Math.floor(Math.random() * p.AttackTypes.length)];
                        let message = {AttackId: attackId, SessionId: player.SessionId, Ratio: 3};
                        //console.log(message);
                        this.room.broadcast("HAVE_ATTACK", message);
                    }
                });
            this.listDispose.add(playerSubcribe);
        }

        this.room.broadcast("START_GAME", {Levels: this.levels, Result: this.room.results});
        //console.log("broadcast START_GAME");
    }

    private OnCloseGame() {
        //console.log(`OnCloseGame`);
        this.room.broadcast("CLOSE_GAME", {});
        this.listDispose.unsubscribe();
        this.listDispose = new Subscription();
        let _room = this.room;
        let roomDispose = timer(1000 * 120).subscribe(_ => _room.disconnect().catch(() => {
        }));
        this.listDispose.add(roomDispose);
        //this.room.disconnect();
    }

    private OnEndGamePlayerDead(player: SoloPlayerProfile) {
        //console.log(`OnEndGamePlayerDead ${player.SessionId}`);
        this.EndGame(player, false, false);
        if (this.round > this.room.maxRematch)
            this.CloseGame();
    }

    private OnEndGamePlayerLeave(player: SoloPlayerProfile) {
        //console.log(`OnEndGamePlayerLeave ${player.SessionId}`);
        this.EndGame(player, true, false);
        this.CloseGame();
    }

    private OnEndGameTimeOver() {
        let player: SoloPlayerProfile;
        let min = Number.MAX_SAFE_INTEGER;
        for (let key in this.roomState.Players) {
            let p1: SoloPlayerProfile = this.roomState.Players[key];
            let life = p1.Profile.Life;
            if (p1.Profile.Life > 3)
                life = 3;
            let total = p1.Profile.Score + this.lifeScore * life;
            p1.Profile.Score = total;
            if (total < min) {
                min = total;
                player = p1;
            }
        }
        this.EndGame(player, false, true);
        if (this.round > this.room.maxRematch)
            this.CloseGame();
        //console.log(`OnEndGameTimeOver ${player.SessionId}`);
    }

    private EndGame(loser: SoloPlayerProfile, isLeft: boolean, checkDraw: boolean) {
        this.listDispose.unsubscribe();
        let winner = loser;
        for (let key in this.roomState.Players) {
            let player: SoloPlayerProfile = this.roomState.Players[key];
            player.IsReady = false;
            if (loser.SessionId != key) {
                winner = player;
            }
        }

        let winnerResult = this.room.results != undefined ? this.room.results[winner.RocketId] :
            {win: 10, lose: 0, draw: 0, Elo: 100};
        let loserResult = this.room.results != undefined ? this.room.results[loser.RocketId] :
            {win: 0, lose: -10, draw: 0, Elo: 100};

        this.endMessage = {
            LoserData: {Id: loser.SessionId, Result: loserResult, Score: loser.Profile.Score, Life: loser.Profile.Life},
            WinnerData: {
                Id: winner.SessionId,
                Result: winnerResult,
                Score: winner.Profile.Score,
                Life: winner.Profile.Life
            },
            CanRematch: this.round <= this.room.maxRematch,
            IsLeft: isLeft,
            LifeBonus: this.lifeScore
        };

        /*
        if (!isLeft) {
            if (winner.Profile.Score == 0) {
                this.SendLogError(winner.RocketId);
            }
            if (loser.Profile.Score == 0) {
                this.SendLogError(loser.RocketId);
            }
        }        
         */

        //console.log(this.endMessage);
        this.SendEndGameResult(winner, loser, checkDraw ? (winner.Profile.Score == loser.Profile.Score ? 0.5 : 1) : 1);
        this.room.broadcast("END_GAME", this.endMessage);
    }

    private SendLogError(error: string) {
        let Server_url = Config.SquadEndGame;

        request.post(Server_url, {
            json: {
                mode: "LogError",
                log: error
            }
        }, (error, res, body) => {
            if (error) {
                console.error(error)
            }
        })
    }

    private SendEndGameResult(winner: SoloPlayerProfile, loser: SoloPlayerProfile, result: number) {
        // Báo sang Server Logic kết quả

        let Server_url = Config.SquadEndGame;

        request.post(Server_url, {
            json: {
                mode: "Squad",
                player1: winner.RocketId,
                player1_score: winner.Profile.Score,
                player2: loser.RocketId,
                player2_score: loser.Profile.Score,
                isWin: result,
                round: this.round,
                roomId: this.room.roomId
            }
        }, (error, res, body) => {
            if (error) {
                console.error(error)
                //reject(error);
                //return;
            }
            //console.log(`statusCode: ${res.statusCode}`)
            //console.log(body);
            //resolve(body);
        })
    }

    private CalculateElo() {
        //this.results = options.results
        //Request lại Elo Result

        let Server_url = Config.CalculateElo;
        let players = [];
        let i = 0;
        for (let key in this.roomState.Players) {
            let player: SoloPlayerProfile = this.roomState.Players[key];
            if (player.RocketId != undefined) {
                players[i] = player.RocketId;
                i++;
            }
        }

        if (players.length > 1) {
            request.post(Server_url, {
                json: {
                    player1: players[0],
                    player2: players[1],
                }
            }, (error, res, body) => {
                if (error) {
                    console.error(error)
                    //reject(error);
                    //return;
                } else {
                    this.room.results = body;
                    for (let key in this.roomState.Players) {
                        let player: SoloPlayerProfile = this.roomState.Players[key];
                        player.Elo = this.room.results != undefined ? this.room.results[player.RocketId].Elo : 100;
                    }
                }
            })
        }

    }

    Dispose() {
        if (!this.listDispose.closed)
            this.listDispose.unsubscribe();
    }


    JoinPlayer(client: Client, options: any) {
        if (this.fsm.state == GameState.Prepare) {
            this.dispatcher.dispatch(new JoinRoomCommand(), {sessionId: client.sessionId});
            let data = options.Data;
            this.dispatcher.dispatch(new ReadyCommand(), {
                sessionId: client.sessionId, options: data, fsm: this
            });

        }
    }

    DisconnectPlayer(client: Client) {
        this.dispatcher.dispatch(new LeaveRoomCommand(), {sessionId: client.sessionId, fsm: this});
    }

    ReadyPlayer(client: Client, options: any) {
        this.dispatcher.dispatch(new StartCommand(), {
            sessionId: client.sessionId, fsm: this
        });
    }

    UpdateScore(client: Client, options: any) {
        if (this.fsm.state == GameState.Playing) {
            this.dispatcher.dispatch(new ScoreCommand(), {sessionId: client.sessionId, score: options});
        }
    }

    LoseLife(client: Client) {
        if (this.fsm.state == GameState.Playing) {
            this.dispatcher.dispatch(new LoseLifeCommand(), {sessionId: client.sessionId, fsm: this});
        }
    }

    UpdateLife(client: Client, life: any) {
        if (this.fsm.state == GameState.Playing) {
            this.dispatcher.dispatch(new LifeCommand(), {sessionId: client.sessionId, life: life, fsm: this});
        }
    }

    UpgradeShip(client: Client, upgrade: any) {
        if (this.fsm.state == GameState.Playing) {
            this.dispatcher.dispatch(new UpgradeShipCommand(), {sessionId: client.sessionId, upgrades: upgrade});
        }
    }

    Rematch(client: Client) {
        if (this.fsm.state == GameState.EndGame || this.fsm.state == GameState.Rematch) {
            this.dispatcher.dispatch(new RematchCommand(), {client, fsm: this});
            this.room.broadcast("REMATCH", {}, {except: client});
        }
    }

    ReconnectPlayer(client: Client) {
        switch (this.fsm.state) {
            case GameState.Playing:
                client.send("START_GAME", {Levels: this.levels});
                break;
            case GameState.Ready:
                client.send("READY_GAME", this.readyMessage);
                break;
            case GameState.EndGame:
            case GameState.CloseGame:
                client.send("END_GAME", this.endMessage);
                break;
            case GameState.Rematch:
                let player: SoloPlayerProfile = this.roomState.Players[client.sessionId];
                if (!player.IsRematch)
                    client.send("REMATCH", {});
                break;
        }
    }

    Emote(client: Client, data: any) {
        this.room.broadcast("EMOTE", {Id: data.Id, SessionId: client.sessionId}, {except: client});
    }


    Attack(client: Client, data: any) {
        let attack = AttackType[data.AttackId];
        if (this.fsm.state == GameState.Playing && attack != undefined) {
            this.dispatcher.dispatch(new AttackCommand(), {client: client, attackType: data.AttackId});
        }
    }

    ClearAttack(client: Client, data: any) {
        if (this.fsm.state == GameState.Playing) {
            this.room.broadcast("CLEAR_ATTACK", {
                AttackId: data.AttackId,
                SessionId: client.sessionId
            }, {except: client});
        }
    }
}

