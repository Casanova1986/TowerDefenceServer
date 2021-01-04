"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoloRoomState = void 0;
const schema_1 = require("@colyseus/schema");
const SoloPlayerProfile_1 = require("./SoloPlayerProfile");
const BaseRoomState_1 = require("./BaseRoomState");
class SoloRoomState extends BaseRoomState_1.BaseRoomState {
    constructor() {
        super(...arguments);
        this.Players = new schema_1.MapSchema();
    }
}
__decorate([
    schema_1.type({ map: SoloPlayerProfile_1.SoloPlayerProfile })
], SoloRoomState.prototype, "Players", void 0);
__decorate([
    schema_1.type("number")
], SoloRoomState.prototype, "State", void 0);
exports.SoloRoomState = SoloRoomState;
//# sourceMappingURL=SoloRoomState.js.map