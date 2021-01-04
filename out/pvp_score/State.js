"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = require("@colyseus/schema");
class Ship extends schema_1.Schema {
}
__decorate([
    schema_1.type("number")
], Ship.prototype, "ID", void 0);
__decorate([
    schema_1.type("number")
], Ship.prototype, "skin", void 0);
__decorate([
    schema_1.type("number")
], Ship.prototype, "tier", void 0);
__decorate([
    schema_1.type("boolean")
], Ship.prototype, "status", void 0);
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.ships = new schema_1.ArraySchema();
        this.IsReady = false;
    }
}
__decorate([
    schema_1.type("string")
], Player.prototype, "ID", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "displayName", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "countryCode", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "avatarUrl", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "score", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "upgrade", void 0);
__decorate([
    schema_1.type([Ship])
], Player.prototype, "ships", void 0);
__decorate([
    schema_1.type("boolean")
], Player.prototype, "IsReady", void 0);
exports.Player = Player;
class RoomState extends schema_1.Schema {
    constructor(room) {
        super();
        this.Players = new schema_1.MapSchema();
        this.room = room;
    }
    Init() {
        // Random List Level
        let player = this.Players["key"];
        player.avatarUrl = 'ádasd';
    }
    OnUserJoin(sessionId, player) {
        console.log("sessionId" + sessionId);
        this.Players[sessionId] = player;
        const length = Object.keys(this.Players).length;
        console.log("All User =>", length);
        for (let key in this.Players) {
            const player = this.Players[key];
            console.log(key, player);
        }
    }
    OnReady(sessionId) {
        let player = this.Players[sessionId];
        player.IsReady = true;
    }
    IsAllReady() {
        let allReady = true;
        for (let key in this.Players) {
            let player = this.Players[key];
            if (!player.IsReady) {
                allReady = false;
            }
        }
        return allReady;
    }
    IsMaxPlayer() {
        let players = Object.keys(this.Players).length;
        console.log("players " + players);
        return players == 2;
    }
    StartGame() {
        //this.currentWave = this.wave[0];
        this.Init();
    }
    update(time) {
        this.time = time;
    }
    Dispose() {
    }
    replay(sessionId) {
        let player = this.Players[sessionId];
        player.IsReady = true;
    }
    sendScore(playerId, score) {
    }
    changeShip(playerId, shipId) {
    }
    playerDie(sessionId) {
        let player = this.Players[sessionId];
        for (let i = 0; i < player.ships.length; i++) {
            if (player.ships[i].ID != -1) {
                player.ships[i].ID = -1;
                break;
            }
        }
    }
    itemUpgrade(sessionId) {
    }
}
__decorate([
    schema_1.type({ map: Player })
], RoomState.prototype, "Players", void 0);
__decorate([
    schema_1.type("number")
], RoomState.prototype, "state", void 0);
__decorate([
    schema_1.type("number")
], RoomState.prototype, "time", void 0);
exports.RoomState = RoomState;
//# sourceMappingURL=State.js.map