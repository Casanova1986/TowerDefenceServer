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
const schema_1 = require("@colyseus/schema");
// import { verifyToken, User, IUser } from "@colyseus/social";
class Entity extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = 0;
        this.y = 0;
    }
}
__decorate([
    schema_1.type("number")
], Entity.prototype, "x", void 0);
__decorate([
    schema_1.type("number")
], Entity.prototype, "y", void 0);
class Player extends Entity {
    constructor() {
        super(...arguments);
        this.connected = true;
    }
}
__decorate([
    schema_1.type("boolean")
], Player.prototype, "connected", void 0);
class Enemy extends Entity {
    constructor() {
        super(...arguments);
        this.power = Math.random() * 10;
    }
}
__decorate([
    schema_1.type("number")
], Enemy.prototype, "power", void 0);
class State extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.entities = new schema_1.MapSchema();
    }
}
__decorate([
    schema_1.type({ map: Entity })
], State.prototype, "entities", void 0);
/**
 * Demonstrate sending schema data types as messages
 */
class Message extends schema_1.Schema {
}
__decorate([
    schema_1.type("number")
], Message.prototype, "num", void 0);
__decorate([
    schema_1.type("string")
], Message.prototype, "str", void 0);
class DemoRoom extends colyseus_1.Room {
    onCreate(options) {
        console.log("DemoRoom created!", options);
        this.setState(new State());
        this.populateEnemies();
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
        this.onMessage("move_right", (client) => {
            this.state.entities[client.sessionId].x += 0.01;
            this.broadcast("hello", { hello: "hello world" });
        });
        this.onMessage("*", (client, type, message) => {
            console.log(`received message "${type}" from ${client.sessionId}:`, message);
        });
    }
    onAuth(client, options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("onAuth(), options!", options);
            return true; // await User.findById(verifyToken(options.token)._id);
        });
    }
    populateEnemies() {
        for (let i = 0; i <= 3; i++) {
            const enemy = new Enemy();
            enemy.x = Math.random() * 2;
            enemy.y = Math.random() * 2;
            this.state.entities[colyseus_1.generateId()] = enemy;
        }
    }
    onJoin(client, options /*, user: IUser*/) {
        console.log("client joined!", client.sessionId);
        this.state.entities[client.sessionId] = new Player();
        client.send("type", { hello: true });
    }
    onLeave(client, consented) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.entities[client.sessionId].connected = false;
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
                delete this.state.entities[client.sessionId];
            }
        });
    }
    update(dt) {
        // console.log("num clients:", Object.keys(this.clients).length);
    }
    onDispose() {
        console.log("disposing DemoRoom...");
    }
}
exports.DemoRoom = DemoRoom;
//# sourceMappingURL=DemoRoom.js.map