"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Colyseus = __importStar(require("colyseus.js"));
var client = new Colyseus.Client('ws://localhost:2568');
client.join("pvp_survival").then(room => {
    console.log(room.sessionId, "joined", room.name);
    room.onStateChange((state) => {
        console.log(room.name, "has new state:", state);
    });
    room.onError((code, message) => {
        //console.log(client.id, "couldn't join", room.name);
    });
    room.onLeave((code) => {
        //console.log(client.id, "left", room.name);
    });
}).catch(e => {
    console.log("JOIN ERROR", e);
});
//# sourceMappingURL=spaceshooter_client.js.map