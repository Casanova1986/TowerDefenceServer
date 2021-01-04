import { Client, Room } from "colyseus";
import { SoloRoomState } from "./SoloRoomState";
import { SoloGameFSM } from "./FSM/SoloGameFSM";

export class SoloRoom extends Room<SoloRoomState> {
    // When room is initialized

    gameFSM: SoloGameFSM;
    levels: number[];
    maxRematch: number;
    results: any;

    onCreate(options: any) {
        this.maxClients = 2;

        //this.levels = options.levels || [11, 17, 30, 32];
        this.levels = options.levels || [11];
        this.results = options.results;
        this.maxRematch = options.maxRematch || 1;
        this.CreateRoomState();
        this.resetAutoDisposeTimeout(20);
        this.setSeatReservationTime(100000);
        this.autoDispose = false;
        this.setPatchRate(1000 / 20);
        this.setSimulationInterval((dt) => this.update(dt));

        this.onMessage("READY", (client, data) => {
            this.gameFSM.ReadyPlayer(client, data);
        });

        this.onMessage("SEND_SCORE", (client, data) => {
            this.gameFSM.UpdateScore(client, data.Score);

        });

        this.onMessage("SEND_UPGRADE", (client, data) => {
            this.gameFSM.UpgradeShip(client, data.Upgrade);
        });

        this.onMessage("SEND_LIFE", (client, data) => {
            this.gameFSM.UpdateLife(client, data.Life);
        });

        this.onMessage("LOSE_LIFE", (client) => {
            this.gameFSM.LoseLife(client);
        });

        this.onMessage("REMATCH", (client, data) => {
            this.gameFSM.Rematch(client);
        });

        this.onMessage("EMOTE", (client, data) => {
            this.gameFSM.Emote(client, data);
        });

        this.onMessage("ATTACK", (client, data) => {
            this.gameFSM.Attack(client, data);
        });

        this.onMessage("CLEAR_ATTACK", (client, data) => {
            this.gameFSM.ClearAttack(client, data);
        });

        this.onMessage("*", (client, type, message) => {
            console.log(`received message "${type}" from ${client.sessionId}:`, message);
        });

        this.onMessage(1, (client) => {
            //if (Math.random()<0.5)
            client.send(1, "pong");
        })
    }

    async onAuth(client: Client, options: any) {
        //console.log("onAuth(), options!", options);
        return true; //await Usert.findById(verifyToken(options.token)._id);
    }


    onJoin(client: Client, options: any/*, user: IUser*/) {
        this.gameFSM.JoinPlayer(client, options);
    }

    async onLeave(client: Client, consented: boolean) {
        try {
            let player = this.state.Players[client.sessionId];
            player.IsConnected = false;
            if (consented) {
                throw new Error("consented leave!");
            }

            console.log("let's wait for reconnection!");
            const newClient = await this.allowReconnection(client, 15);
            console.log("reconnected!", newClient.sessionId);
            player.IsConnected = true;
            player.triggerAll();
            await new Promise(resolve => setTimeout(resolve, 500));
            this.gameFSM.ReconnectPlayer(client);
        } catch (e) {
            console.log("disconnected!", client.sessionId);
            this.gameFSM.DisconnectPlayer(client);
        }
    }

    update(dt?: number) {
        // console.log("num clients:", Object.keys(this.clients).length);
    }

    onDispose() {
        this.gameFSM.Dispose();
    }

    CreateRoomState() {
        let state = new SoloRoomState();
        this.setState(state);
        this.gameFSM = new SoloGameFSM(this, state);
        //console.log(`SoloRoom created!`);
    }
}