import { Room, Client } from "colyseus";
import { SurvivalConfig } from "./SurvivalConfig";
import { Observable, Subscription, timer } from 'rxjs';
import { Schema, type } from "@colyseus/schema";



class SurvivalState extends Schema {
  @type("number")
  Time: number = 0;
}

class PlayerInfo {
  Pos: number;
  Name: string;
  Avatar: string;
  WavePass: number;
  Alive: boolean;
  RemainTime: number; // thời gian còn lại để đạt đến TargetWave
  TargetWave: number;// Mục tiêu người chơi cần đến trước khi hết thời gian

  public constructor(init?: Partial<PlayerInfo>) {
    Object.assign(this, init);
  }
}




enum SurvivalGameState {
  Waiting = 0,
  Playing = 1,
  Finish = 2,
}

export class SurvivalRoom extends Room<SurvivalState> {



  mapPlayers: Map<string, PlayerInfo>;
  dataPlayers: Object = {};

  dicPlayer = {}

  timmer1second: Observable<number> = timer(0, 1000);
  listDispose: Subscription;
  gameState: SurvivalGameState = SurvivalGameState.Waiting;

  WaitingTime: number = SurvivalConfig.WaitingTime;
  constructor() {
    super()

    this.mapPlayers = new Map<string, PlayerInfo>();
    this.WaitingTime = SurvivalConfig.WaitingTime;
    this.listDispose = new Subscription();
  }


  /* #region Main */
  onCreate(options: any) {
    //this.WaitingTime = SurvivalConfig.WaitingTime;
    //setInterval(this.update, 1000);

    this.setSeatReservationTime(300);
    this.maxClients = 35;
    let state = new SurvivalState();

    //this.setSimulationInterval((dt) => this.update(dt));

    this.setState(state);
    this.gameState = SurvivalGameState.Waiting;

    this.listDispose.unsubscribe();


    let subscribe = this.timmer1second.subscribe(secondsLapse => {
      this.WaitingTime = (SurvivalConfig.WaitingTime - secondsLapse);

      if (this.gameState === SurvivalGameState.Waiting) {
        if (this.WaitingTime <= 0) {

          console.log('TimeOut');
        }
        else {
          console.log(this.WaitingTime);
        }
      }
      else if (this.gameState === SurvivalGameState.Playing) {
        this.mapPlayers.forEach((player, key) => {
          player.RemainTime--;
        });
      }

      console.log(this.mapPlayers);


    });
    this.listDispose = new Subscription();
    this.listDispose.add(subscribe);



    // this.onMessage("*", (client, message) => {
    //   console.log('onMessage *', message);
    // });

    this.onMessage("message", (client, message) => {
      console.log('onMessage *', message);
      client.send('message', message);
    });

    this.onMessage("READY", (client, message) => {
      this.mapPlayers.set(client.id, new PlayerInfo({
        Name: message.DisplayName,
        WavePass: 0,
        Avatar: message.AvatarUrl,
        Alive: true,
        RemainTime: SurvivalConfig.RoundTime,
      }));

      this.broadcast("OTHER_PLAYER_JOIN", { currentPlayerJoin: this.mapPlayers.size, maxPlayerJoin: SurvivalConfig.MaxPlayerIngame })

      if (this.mapPlayers.size === 4) {
        this.lock()


        this.gameState = SurvivalGameState.Playing;
        this.broadcast('START_GAME', {
          timePlay: 180,
          idShipPlay: 22,
          Levels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5),
          waves: [1, 2, 1, 0, 0, 2, 1, 1, 0, 2],
          supports: [1, 2, 1, 2, 1, 2, 1, 2],
          levelSupports: [1, 2, 1, 2, 1, 2, 1, 2],
          isItems: [0, 2, 1, 2, 1, 2, 1, 2]
        });
        this.sendLeaderboard();
        // client.send('START_GAME', {
        //   timePlay: 180,
        //   idShipPlay: 21,
        //   Levels: [1, 3, 4, 2, 5, 6, 8, 9, 7, 0],
        //   waves: [1, 2, 1, 0, 0, 2, 1, 1, 0, 2],
        //   supports: [1, 2, 1, 2, 1, 2, 1, 2],
        //   levelSupports: [1, 2, 1, 2, 1, 2, 1, 2],
        //   isItems: [0, 2, 1, 2, 1, 2, 1, 2]
        // })
      }
      // client.send('START_GAME', {
      //   timePlay: 180,
      //   idShipPlay: 21,
      //   Levels: [1, 3, 4, 2, 5, 6, 8, 9, 7, 0],
      //   waves: [1, 2, 1, 0, 0, 2, 1, 1, 0, 2],
      //   supports: [1, 2, 1, 2, 1, 2, 1, 2],
      //   levelSupports: [1, 2, 1, 2, 1, 2, 1, 2],
      //   isItems: [0, 2, 1, 2, 1, 2, 1, 2]
      // })


      console.log('mapvalue', Array.from(this.mapPlayers.values()))

      console.log('onMessage READY', message);

    });


    this.onMessage("SEND_TRAP", (client, message) => {
      console.log('SEND_TRAP', message)
      setTimeout(() => {
        client.send('RECEIVE_TRAP', {
          trapId: Math.floor((Math.random() * 7)),
          Time: 10
        });
      }, 2000);
    });

    this.onMessage("LOSE_LIFE", (client, message) => {
      console.log('LOSE_LIFE', message);

      this.mapPlayers.get(client.id).Alive = false;
      this.sendLeaderboard()

      client.send('END_GAME', {
        Pos: 1,
        Name: 'yourname',
        WavePass: 12,
        Rewards: {
          1: 2,
        }
      })

    });

    this.onMessage("SEND_WAVE_PASS", (client, message) => {
      console.log('SEND_WAVE_PASS', message)


      this.mapPlayers.get(client.id).WavePass = this.mapPlayers.get(client.id).WavePass + 1;
      this.sendLeaderboard()

      // setTimeout(() => {
      //   client.send('LEADERBOARD_CHANGE', {
      //     alive: this.lsPlayers.length,
      //     leaderboards: this.lsPlayers.map((player, index) => {
      //       player.Pos = index;
      //       return player;
      //     })
      //   });
      // }, 2000);
    });

    this.onMessage(1, (client) => {
      //if (Math.random()<0.5)
      client.send(1, "pong");
    })
    console.log('onCreate', this.roomId);

  }

  /* #endregion */

  onJoin(client: Client, options: any) {
    console.log('onJoin', client.id);



    client.send("READY_GAME",
      {
        Level0: 4,
        wave0: 1,
      })



    let userFind = this.clients.find(cli => cli.id === client.id);
    if (userFind)
      console.log(this.roomId, 'Found', userFind.id);


  }

  onLeave(client: Client, consented: boolean) {
    this.mapPlayers.delete(client.id);
    console.log('onLeave', client.id);
  }

  onDispose() {
    this.listDispose.unsubscribe();
    console.log('onDispose');
  }



  update(dt: number) {
    //this.WaitingTime--;
    console.log("Remain Time", this.WaitingTime, SurvivalConfig.WaitingTime);
  }

  gameStart() {

  }

  sendLeaderboard() {

    let leaderboards = Array.from(this.mapPlayers.values()).sort((a, b) => b.WavePass - a.WavePass);

    var numAlive = 0;
    let rsLeaderBoad = leaderboards.map((player, index) => {
      if (player.Alive)
        numAlive++;
      player.Pos = index;
      return player;
    });

    this.broadcast('LEADERBOARD_CHANGE', {
      alive: numAlive,
      leaderboards: rsLeaderBoad,
    });

  }


  getRandomList(length: number, max: number) {
    var randomList = [];
    for (let index = 0; index < length; index++) {
      randomList.push(Math.random() * max)
    }
    return randomList;
  }

}
