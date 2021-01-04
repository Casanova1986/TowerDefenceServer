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
exports.SoloRoom = void 0;
const colyseus_1 = require("colyseus");
const SoloRoomState_1 = require("./SoloRoomState");
const SoloGameFSM_1 = require("./FSM/SoloGameFSM");
class SoloRoom extends colyseus_1.Room {
    onCreate(options) {
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
        });
    }
    onAuth(client, options) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log("onAuth(), options!", options);
            return true; //await Usert.findById(verifyToken(options.token)._id);
        });
    }
    onJoin(client, options /*, user: IUser*/) {
        this.gameFSM.JoinPlayer(client, options);
    }
    onLeave(client, consented) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let player = this.state.Players[client.sessionId];
                player.IsConnected = false;
                if (consented) {
                    throw new Error("consented leave!");
                }
                console.log("let's wait for reconnection!");
                const newClient = yield this.allowReconnection(client, 15);
                console.log("reconnected!", newClient.sessionId);
                player.IsConnected = true;
                player.triggerAll();
                yield new Promise(resolve => setTimeout(resolve, 500));
                this.gameFSM.ReconnectPlayer(client);
            }
            catch (e) {
                console.log("disconnected!", client.sessionId);
                this.gameFSM.DisconnectPlayer(client);
            }
        });
    }
    update(dt) {
        // console.log("num clients:", Object.keys(this.clients).length);
    }
    onDispose() {
        this.gameFSM.Dispose();
    }
    CreateRoomState() {
        let state = new SoloRoomState_1.SoloRoomState();
        this.setState(state);
        this.gameFSM = new SoloGameFSM_1.SoloGameFSM(this, state);
        //console.log(`SoloRoom created!`);
    }
}
exports.SoloRoom = SoloRoom;
//# sourceMappingURL=SoloRoom.js.map