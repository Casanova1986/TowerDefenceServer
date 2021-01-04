"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoloGameFSM = exports.AttackType = void 0;
const stateless_1 = require("stateless");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const command_1 = require("@colyseus/command");
const SoloCommand_1 = require("./SoloCommand");
const request = require("request");
const config_1 = require("../../config");
var Trigger;
(function (Trigger) {
    Trigger["StartGame"] = "StartGame";
    Trigger["ReadyGame"] = "ReadyGame";
    Trigger["TimeOver"] = "TimeOver";
    Trigger["PlayerDead"] = "PlayerDead";
    Trigger["PlayerLeave"] = "PlayerLeave";
    Trigger["PlayerRematch"] = "PlayerRematch";
    Trigger["Close"] = "Close";
})(Trigger || (Trigger = {}));
var GameState;
(function (GameState) {
    GameState["Prepare"] = "Prepare";
    GameState["Ready"] = "Ready";
    GameState["Playing"] = "Playing";
    GameState["EndGame"] = "EndGame";
    GameState["Rematch"] = "Rematch";
    GameState["CloseGame"] = "CloseGame";
})(GameState || (GameState = {}));
var AttackType;
(function (AttackType) {
    AttackType[AttackType["SmokingBomb"] = 0] = "SmokingBomb";
    AttackType[AttackType["SlowingBomb"] = 1] = "SlowingBomb";
    AttackType[AttackType["InverseBomb"] = 2] = "InverseBomb";
    AttackType[AttackType["FrenzyFire"] = 3] = "FrenzyFire";
    AttackType[AttackType["LockDown"] = 4] = "LockDown";
    AttackType[AttackType["Blindfolded"] = 5] = "Blindfolded";
    AttackType[AttackType["HurtfulFriend"] = 6] = "HurtfulFriend";
    AttackType[AttackType["ScaleOfJustice"] = 7] = "ScaleOfJustice";
    AttackType[AttackType["DeathClock"] = 8] = "DeathClock";
    AttackType[AttackType["WishingStar"] = 9] = "WishingStar";
})(AttackType = exports.AttackType || (exports.AttackType = {}));
const env = process.env.NODE_ENV || 'development';
class SoloGameFSM {
    constructor(room, roomState) {
        this.fsm = new stateless_1.StateMachine(GameState.Prepare);
        this.timmer1second = rxjs_1.timer(0, 1000);
        this.defaultTime = 180;
        this.round = 0;
        this.lifeScore = 5000;
        this.room = room;
        this.roomState = roomState;
        this.dispatcher = new command_1.Dispatcher(room);
        this.listDispose = new rxjs_1.Subscription();
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
    CheckPlayersReady() {
        for (let key in this.roomState.Players) {
            let player = this.roomState.Players[key];
            if (!player.IsReady) {
                return false;
            }
        }
        return true;
    }
    CheckPlayersRematch() {
        for (let key in this.roomState.Players) {
            let player = this.roomState.Players[key];
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
    PlayerDead(player) {
        this.fsm.fire(Trigger.PlayerDead, player);
    }
    PlayerLeave(player) {
        this.fsm.fire(Trigger.PlayerLeave, player);
    }
    PlayerRematch(client) {
        this.fsm.fire(Trigger.PlayerRematch, client);
    }
    CloseGame() {
        this.fsm.fire(Trigger.Close);
    }
    OnPrepare() {
        this.listDispose.add(rxjs_1.timer(1000 * 30).subscribe(_ => {
            this.fsm.deactivate();
            this.room.lock();
            this.OnCloseGame();
        }));
    }
    OnReady() {
        return __awaiter(this, void 0, void 0, function* () {
            this.levels = this.room.levels.slice();
            for (let i = this.levels.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
                [this.levels[i], this.levels[j]] = [this.levels[j], this.levels[i]];
            }
            config_1.Config.Log(this.levels);
            this.readyMessage = { Levels: this.levels, Result: this.room.results };
            yield new Promise(resolve => setTimeout(resolve, 1000));
            this.room.broadcast("READY_GAME", { Levels: this.levels, Result: this.room.results });
        });
    }
    OnStartGame() {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log("OnStartGame");
            config_1.Config.Log(`OnStartGame`);
            this.listDispose.unsubscribe();
            yield this.room.lock();
            this.round++;
            //await new Promise(resolve => setTimeout(resolve, 1500));
            let subscribe = this.timmer1second.subscribe(secondsLapse => {
                this.roomState.Time = (this.defaultTime - secondsLapse) * 1000;
                if (this.roomState.Time <= 0) {
                    subscribe.unsubscribe();
                    this.fsm.fire(Trigger.TimeOver);
                }
            });
            this.listDispose = new rxjs_1.Subscription();
            this.listDispose.add(subscribe);
            for (let key in this.roomState.Players) {
                let player = this.roomState.Players[key];
                let playerSubcribe = this.timmer1second
                    .pipe(operators_1.map(_ => player))
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
                        let message = { AttackId: attackId, SessionId: player.SessionId, Ratio: 3 };
                        //console.log(message);
                        this.room.broadcast("HAVE_ATTACK", message);
                    }
                });
                this.listDispose.add(playerSubcribe);
            }
            this.room.broadcast("START_GAME", { Levels: this.levels, Result: this.room.results });
            //console.log("broadcast START_GAME");
        });
    }
    OnCloseGame() {
        //console.log(`OnCloseGame`);
        this.room.broadcast("CLOSE_GAME", {});
        this.listDispose.unsubscribe();
        this.listDispose = new rxjs_1.Subscription();
        let _room = this.room;
        let roomDispose = rxjs_1.timer(1000 * 120).subscribe(_ => _room.disconnect().catch(() => {
        }));
        this.listDispose.add(roomDispose);
        //this.room.disconnect();
    }
    OnEndGamePlayerDead(player) {
        //console.log(`OnEndGamePlayerDead ${player.SessionId}`);
        this.EndGame(player, false, false);
        if (this.round > this.room.maxRematch)
            this.CloseGame();
    }
    OnEndGamePlayerLeave(player) {
        //console.log(`OnEndGamePlayerLeave ${player.SessionId}`);
        this.EndGame(player, true, false);
        this.CloseGame();
    }
    OnEndGameTimeOver() {
        let player;
        let min = Number.MAX_SAFE_INTEGER;
        for (let key in this.roomState.Players) {
            let p1 = this.roomState.Players[key];
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
    EndGame(loser, isLeft, checkDraw) {
        this.listDispose.unsubscribe();
        let winner = loser;
        for (let key in this.roomState.Players) {
            let player = this.roomState.Players[key];
            player.IsReady = false;
            if (loser.SessionId != key) {
                winner = player;
            }
        }
        let winnerResult = this.room.results != undefined ? this.room.results[winner.RocketId] :
            { win: 10, lose: 0, draw: 0, Elo: 100 };
        let loserResult = this.room.results != undefined ? this.room.results[loser.RocketId] :
            { win: 0, lose: -10, draw: 0, Elo: 100 };
        this.endMessage = {
            LoserData: { Id: loser.SessionId, Result: loserResult, Score: loser.Profile.Score, Life: loser.Profile.Life },
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
    SendLogError(error) {
        let Server_url = config_1.Config.SquadEndGame;
        request.post(Server_url, {
            json: {
                mode: "LogError",
                log: error
            }
        }, (error, res, body) => {
            if (error) {
                console.error(error);
            }
        });
    }
    SendEndGameResult(winner, loser, result) {
        // Báo sang Server Logic kết quả
        let Server_url = config_1.Config.SquadEndGame;
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
                console.error(error);
                //reject(error);
                //return;
            }
            //console.log(`statusCode: ${res.statusCode}`)
            //console.log(body);
            //resolve(body);
        });
    }
    CalculateElo() {
        //this.results = options.results
        //Request lại Elo Result
        let Server_url = config_1.Config.CalculateElo;
        let players = [];
        let i = 0;
        for (let key in this.roomState.Players) {
            let player = this.roomState.Players[key];
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
                    console.error(error);
                    //reject(error);
                    //return;
                }
                else {
                    this.room.results = body;
                    for (let key in this.roomState.Players) {
                        let player = this.roomState.Players[key];
                        player.Elo = this.room.results != undefined ? this.room.results[player.RocketId].Elo : 100;
                    }
                }
            });
        }
    }
    Dispose() {
        if (!this.listDispose.closed)
            this.listDispose.unsubscribe();
    }
    JoinPlayer(client, options) {
        if (this.fsm.state == GameState.Prepare) {
            this.dispatcher.dispatch(new SoloCommand_1.JoinRoomCommand(), { sessionId: client.sessionId });
            let data = options.Data;
            this.dispatcher.dispatch(new SoloCommand_1.ReadyCommand(), {
                sessionId: client.sessionId, options: data, fsm: this
            });
        }
    }
    DisconnectPlayer(client) {
        this.dispatcher.dispatch(new SoloCommand_1.LeaveRoomCommand(), { sessionId: client.sessionId, fsm: this });
    }
    ReadyPlayer(client, options) {
        this.dispatcher.dispatch(new SoloCommand_1.StartCommand(), {
            sessionId: client.sessionId, fsm: this
        });
    }
    UpdateScore(client, options) {
        if (this.fsm.state == GameState.Playing) {
            this.dispatcher.dispatch(new SoloCommand_1.ScoreCommand(), { sessionId: client.sessionId, score: options });
        }
    }
    LoseLife(client) {
        if (this.fsm.state == GameState.Playing) {
            this.dispatcher.dispatch(new SoloCommand_1.LoseLifeCommand(), { sessionId: client.sessionId, fsm: this });
        }
    }
    UpdateLife(client, life) {
        if (this.fsm.state == GameState.Playing) {
            this.dispatcher.dispatch(new SoloCommand_1.LifeCommand(), { sessionId: client.sessionId, life: life, fsm: this });
        }
    }
    UpgradeShip(client, upgrade) {
        if (this.fsm.state == GameState.Playing) {
            this.dispatcher.dispatch(new SoloCommand_1.UpgradeShipCommand(), { sessionId: client.sessionId, upgrades: upgrade });
        }
    }
    Rematch(client) {
        if (this.fsm.state == GameState.EndGame || this.fsm.state == GameState.Rematch) {
            this.dispatcher.dispatch(new SoloCommand_1.RematchCommand(), { client, fsm: this });
            this.room.broadcast("REMATCH", {}, { except: client });
        }
    }
    ReconnectPlayer(client) {
        switch (this.fsm.state) {
            case GameState.Playing:
                client.send("START_GAME", { Levels: this.levels });
                break;
            case GameState.Ready:
                client.send("READY_GAME", this.readyMessage);
                break;
            case GameState.EndGame:
            case GameState.CloseGame:
                client.send("END_GAME", this.endMessage);
                break;
            case GameState.Rematch:
                let player = this.roomState.Players[client.sessionId];
                if (!player.IsRematch)
                    client.send("REMATCH", {});
                break;
        }
    }
    Emote(client, data) {
        this.room.broadcast("EMOTE", { Id: data.Id, SessionId: client.sessionId }, { except: client });
    }
    Attack(client, data) {
        let attack = AttackType[data.AttackId];
        if (this.fsm.state == GameState.Playing && attack != undefined) {
            this.dispatcher.dispatch(new SoloCommand_1.AttackCommand(), { client: client, attackType: data.AttackId });
        }
    }
    ClearAttack(client, data) {
        if (this.fsm.state == GameState.Playing) {
            this.room.broadcast("CLEAR_ATTACK", {
                AttackId: data.AttackId,
                SessionId: client.sessionId
            }, { except: client });
        }
    }
}
exports.SoloGameFSM = SoloGameFSM;
//# sourceMappingURL=SoloGameFSM.js.map