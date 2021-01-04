"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@colyseus/command");
const State_1 = require("./State");
class JoinRoomCommand extends command_1.Command {
    execute({ sessionId } = this.payload) {
        console.log("client joined!", sessionId);
        let player = new State_1.Player();
        this.state.OnUserJoin(sessionId, player);
    }
}
exports.JoinRoomCommand = JoinRoomCommand;
class ShootCommand extends command_1.Command {
    // validate({ sessionId, index } = this.payload) {
    //   const player = this.state.players.get(sessionId);
    //   return player !== undefined && player.cards[index] !== undefined;
    // }
    execute({ enemyId, damage } = this.payload) {
        this.state.currentWave.Shoot(enemyId, damage);
    }
}
exports.ShootCommand = ShootCommand;
class ReadyCommand extends command_1.Command {
    execute({ sessionId } = this.payload) {
        this.state.OnReady(sessionId);
    }
}
exports.ReadyCommand = ReadyCommand;
//# sourceMappingURL=PvPCommand.js.map