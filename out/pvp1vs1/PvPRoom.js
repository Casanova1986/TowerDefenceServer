"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
const colyseus_1 = require("colyseus");
const State_1 = require("./State");
const GameFSM_1 = require("./GameFSM");
const command_1 = require("@colyseus/command");
const schema_1 = require("@colyseus/schema");
class Message extends schema_1.Schema {
}
__decorate([
    schema_1.type("number")
], Message.prototype, "num", void 0);
__decorate([
    schema_1.type("string")
], Message.prototype, "str", void 0);
exports.Message = Message;
class PvPRoom extends colyseus_1.Room {
    constructor() {
        // When room is initialized
        super(...arguments);
        this.dispatcher = new command_1.Dispatcher(this);
    }
    onCreate(options) {
        this.maxClients = 2;
        console.log("DemoRoom created!", options);
        this.reset();
        // this.state.StartGame();
        this.resetAutoDisposeTimeout(20);
        this.setMetadata({
            str: "hello",
            number: 10
        });
        this.setPatchRate(1000 / 20);
        this.setSimulationInterval((dt) => this.update(dt));
        this.onMessage(0, (client, message) => {
            client.send(0, message);
        });
        this.onMessage("schema", (client) => {
            const message = new Message();
            message.num = Math.floor(Math.random() * 100);
            message.str = "sending to a single client";
            client.send(message);
        });
        this.onMessage("ready", (client) => {
            this.gameFSM.OnReady(client);
        });
        this.onMessage("shoot", (client, message) => {
            this.gameFSM.OnShoot(client, message);
        });
        this.onMessage("*", (client, type, message) => {
            console.log(`received message "${type}" from ${client.sessionId}:`, message);
        });
    }
    onAuth(client, options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("onAuth(), options!", options);
            return true; //await User.findById(verifyToken(options.token)._id);
        });
    }
    onJoin(client, options /*, user: IUser*/) {
        this.gameFSM.OnJoinCommand(client, options);
    }
    onLeave(client, consented) {
        return __awaiter(this, void 0, void 0, function* () {
            //this.state.entities[client.sessionId].connected = false;
            try {
                if (consented) {
                    throw new Error("consented leave!");
                }
                console.log("let's wait for reconnection!");
                const newClient = yield this.allowReconnection(client, 10);
                console.log("reconnected!", newClient.sessionId);
            }
            catch (e) {
                console.log("disconnected!", client.sessionId);
                delete this.state.Players[client.sessionId];
            }
        });
    }
    update(dt) {
        // console.log("num clients:", Object.keys(this.clients).length);
    }
    onDispose() {
        this.gameFSM.Dispose();
    }
    reset() {
        let state = new State_1.RoomState(this);
        this.setState(state);
        this.gameFSM = new GameFSM_1.GameFSM(this, state, this.dispatcher); // Check lại có thể lỗi
    }
}
exports.PvPRoom = PvPRoom;
//# sourceMappingURL=PvPRoom.js.map