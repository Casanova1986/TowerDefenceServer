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
class SendScoreRoomCommand extends command_1.Command {
    execute({ sessionId, score } = this.payload) {
        this.state.sendScore(sessionId, score);
    }
}
exports.SendScoreRoomCommand = SendScoreRoomCommand;
// export class ChangeShipRoomCommand extends Command<RoomState, { sessionId: string, shipId: number }> {
//     execute({ sessionId, shipId } = this.payload) {
//         console.log("change Ship", shipId);
//         this.state.changeShip(sessionId, shipId);
//     }
// }
class ItemUpgradeCommand extends command_1.Command {
    execute({ sessionId } = this.payload) {
        console.log("client PlayerDeadCommand!", sessionId);
        this.state.itemUpgrade(sessionId);
    }
}
exports.ItemUpgradeCommand = ItemUpgradeCommand;
class PlayerDeadCommand extends command_1.Command {
    execute({ sessionId } = this.payload) {
        console.log("client PlayerDeadCommand!", sessionId);
        this.state.playerDie(sessionId);
    }
}
exports.PlayerDeadCommand = PlayerDeadCommand;
class ReadyCommand extends command_1.Command {
    execute({ sessionId } = this.payload) {
        this.state.OnReady(sessionId);
    }
}
exports.ReadyCommand = ReadyCommand;
class ReplayCommand extends command_1.Command {
    execute({ sessionId } = this.payload) {
        this.state.replay(sessionId);
    }
}
exports.ReplayCommand = ReplayCommand;
//# sourceMappingURL=PvPCommand.js.map