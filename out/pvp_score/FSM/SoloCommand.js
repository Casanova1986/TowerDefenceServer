"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttackCommand = exports.RematchCommand = exports.UpgradeShipCommand = exports.LifeCommand = exports.LoseLifeCommand = exports.ScoreCommand = exports.StartCommand = exports.ReadyCommand = exports.LeaveRoomCommand = exports.JoinRoomCommand = void 0;
const command_1 = require("@colyseus/command");
const SoloPlayerProfile_1 = require("../SoloPlayerProfile");
const SoloGameFSM_1 = require("./SoloGameFSM");
const config_1 = require("../../config");
class JoinRoomCommand extends command_1.Command {
    execute({ sessionId } = this.payload) {
        let player = new SoloPlayerProfile_1.SoloPlayerProfile();
        player.SessionId = sessionId;
        player.Profile = new SoloPlayerProfile_1.SoloGameProfile();
        player.IsConnected = true;
        this.state.Players[sessionId] = player;
        config_1.Config.Log("Joined!", sessionId);
    }
}
exports.JoinRoomCommand = JoinRoomCommand;
class LeaveRoomCommand extends command_1.Command {
    execute({ sessionId, fsm } = this.payload) {
        let player = this.state.Players[sessionId];
        fsm.PlayerLeave(player);
        config_1.Config.Log(`Leave : ${sessionId}`);
    }
}
exports.LeaveRoomCommand = LeaveRoomCommand;
class ReadyCommand extends command_1.Command {
    execute({ sessionId, options, fsm } = this.payload) {
        let player = this.state.Players[sessionId];
        /*
        let player = new SoloPlayerProfile();
        player.SessionId = sessionId;
        player.IsConnected = true;
         */
        player.AttackTypes = options.AttackIds || [0, 1, 2, 4, 9];
        //player.AttackTypes = [3, 5, 6, 7, 8, 9];
        player.AttackLevel = 0;
        for (let i = 0; i < options.Ships.length; i++) {
            let ship = new SoloPlayerProfile_1.ShipDataServer();
            ship.Id = options.Ships[i].Id;
            ship.SkinId = options.Ships[i].SkinId;
            ship.Star = options.Ships[i].Star;
            ship.UpgradeableIndex = options.Ships[i].UpgradeableIndex;
            player.Ships[i] = ship;
        }
        player.RocketId = options.RocketId;
        player.Elo = fsm.room.results != undefined ? fsm.room.results[player.RocketId].Elo : 100;
        player.IsReady = false;
        player.MaxUnlocked = options.MaxUnlocked;
        //player.Profile = new SoloGameProfile();
        player.Profile.Life = player.Ships.length;
        player.Profile.Score = 0;
        player.Profile.Upgrade = 0;
        player.triggerAll();
        //this.state.triggerAll();
        //this.state.Players[sessionId] = player;
        fsm.ReadyGame();
        config_1.Config.Log(`ready from ${sessionId} Max: ${player.MaxUnlocked} Life: ${player.Profile.Life}`);
    }
}
exports.ReadyCommand = ReadyCommand;
class StartCommand extends command_1.Command {
    execute({ sessionId, fsm } = this.payload) {
        let player = this.state.Players[sessionId];
        player.IsReady = true;
        player.IsRematch = false;
        fsm.StartGame();
        config_1.Config.Log(`Start : ${sessionId}`);
    }
}
exports.StartCommand = StartCommand;
class ScoreCommand extends command_1.Command {
    execute({ sessionId, score } = this.payload) {
        let player = this.state.Players[sessionId];
        player.Profile.Score = score;
        //Config.Log(`update score from ${player.SessionId}: ${player.Profile.Score}`);
    }
}
exports.ScoreCommand = ScoreCommand;
class LoseLifeCommand extends command_1.Command {
    execute({ sessionId, fsm } = this.payload) {
        let player = this.state.Players[sessionId];
        player.Profile.Life -= 1;
        if (player.Profile.Life <= 0)
            fsm.PlayerDead(player);
        config_1.Config.Log(`update life from ${player.SessionId}: ${player.Profile.Life}`);
    }
}
exports.LoseLifeCommand = LoseLifeCommand;
class LifeCommand extends command_1.Command {
    execute({ sessionId, life, fsm } = this.payload) {
        let player = this.state.Players[sessionId];
        player.Profile.Life = life;
        if (player.Profile.Life <= 0)
            fsm.PlayerDead(player);
        config_1.Config.Log(`update life from ${player.SessionId}: ${player.Profile.Life}`);
    }
}
exports.LifeCommand = LifeCommand;
class UpgradeShipCommand extends command_1.Command {
    execute({ sessionId, upgrades } = this.payload) {
        let player = this.state.Players[sessionId];
        player.Profile.Upgrade += upgrades;
        config_1.Config.Log(`update upgrade from ${player.SessionId}: ${player.Profile.Upgrade}`);
    }
}
exports.UpgradeShipCommand = UpgradeShipCommand;
class RematchCommand extends command_1.Command {
    execute({ client, fsm } = this.payload) {
        let player = this.state.Players[client.sessionId];
        player.IsReady = false;
        player.IsRematch = true;
        player.Profile.Life = player.Ships.length;
        player.Profile.Score = 0;
        player.Profile.Upgrade = 0;
        player.AttackLevel = 0;
        fsm.PlayerRematch(client);
        config_1.Config.Log(`rematch from ${player.SessionId}`);
    }
}
exports.RematchCommand = RematchCommand;
class AttackCommand extends command_1.Command {
    execute({ client, attackType } = this.payload) {
        let player = this.state.Players[client.sessionId];
        let time;
        let data;
        switch (attackType) {
            case SoloGameFSM_1.AttackType.SmokingBomb:
            case SoloGameFSM_1.AttackType.SlowingBomb:
            case SoloGameFSM_1.AttackType.InverseBomb:
            case SoloGameFSM_1.AttackType.WishingStar:
            case SoloGameFSM_1.AttackType.Blindfolded:
            case SoloGameFSM_1.AttackType.FrenzyFire:
            case 11:
                time = 10;
                break;
            case SoloGameFSM_1.AttackType.HurtfulFriend:
                time = 0;
                data = { Amount: 5, Range: 1.5 };
                break;
            case SoloGameFSM_1.AttackType.DeathClock:
                time = 15;
                break;
            case SoloGameFSM_1.AttackType.LockDown:
                time = 5;
                break;
            case SoloGameFSM_1.AttackType.ScaleOfJustice:
                time = 0;
                data = { StealCount: 2 };
                break;
            default:
                time = 0;
                data = {};
        }
        this.room.broadcast("ATTACK", { AttackId: attackType, Time: time, AttackerId: player.SessionId, Data: data });
        config_1.Config.Log(`Attack from ${player.SessionId}: type: ${SoloGameFSM_1.AttackType[attackType]}`);
    }
}
exports.AttackCommand = AttackCommand;
//# sourceMappingURL=SoloCommand.js.map