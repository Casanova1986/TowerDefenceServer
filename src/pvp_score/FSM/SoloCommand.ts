import {Command} from "@colyseus/command";
import {SoloRoomState} from "../SoloRoomState";
import {ShipDataServer, SoloGameProfile, SoloPlayerProfile} from "../SoloPlayerProfile";
import {AttackType, SoloGameFSM} from "./SoloGameFSM";
import {Client} from "colyseus";
import {Config} from "../../config";

export class JoinRoomCommand extends Command<SoloRoomState, { sessionId: string }> {
    execute({sessionId} = this.payload) {
        let player = new SoloPlayerProfile();
        player.SessionId = sessionId;
        player.Profile = new SoloGameProfile();
        player.IsConnected = true;
        this.state.Players[sessionId] = player;
        Config.Log("Joined!", sessionId);
    }
}

export class LeaveRoomCommand extends Command<SoloRoomState, { sessionId: string, fsm: SoloGameFSM }> {
    execute({sessionId, fsm} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[sessionId];
        fsm.PlayerLeave(player);
        Config.Log(`Leave : ${sessionId}`);
    }
}

export class ReadyCommand extends Command<SoloRoomState, { sessionId: string, options: any, fsm: SoloGameFSM }> {
    execute({sessionId, options, fsm} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[sessionId];
        /*
        let player = new SoloPlayerProfile();
        player.SessionId = sessionId;
        player.IsConnected = true;        
         */
        player.AttackTypes = options.AttackIds || [0, 1, 2, 4, 9];
        //player.AttackTypes = [3, 5, 6, 7, 8, 9];
        player.AttackLevel = 0;
        for (let i = 0; i < options.Ships.length; i++) {
            let ship = new ShipDataServer();
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
        Config.Log(`ready from ${sessionId} Max: ${player.MaxUnlocked} Life: ${player.Profile.Life}`);
    }
}

export class StartCommand extends Command<SoloRoomState, { sessionId: string, fsm: SoloGameFSM }> {
    execute({sessionId, fsm} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[sessionId];
        player.IsReady = true;
        player.IsRematch = false;
        fsm.StartGame();
        Config.Log(`Start : ${sessionId}`);
    }
}

export class ScoreCommand extends Command<SoloRoomState, { sessionId: string, score: number }> {
    execute({sessionId, score} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[sessionId];
        player.Profile.Score = score;
        //Config.Log(`update score from ${player.SessionId}: ${player.Profile.Score}`);
    }
}

export class LoseLifeCommand extends Command<SoloRoomState, { sessionId: string, fsm: SoloGameFSM }> {
    execute({sessionId, fsm} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[sessionId];
        player.Profile.Life -= 1;
        if (player.Profile.Life <= 0)
            fsm.PlayerDead(player);
        Config.Log(`update life from ${player.SessionId}: ${player.Profile.Life}`);
    }
}

export class LifeCommand extends Command<SoloRoomState, { sessionId: string, life: number, fsm: SoloGameFSM }> {
    execute({sessionId, life, fsm} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[sessionId];
        player.Profile.Life = life;
        if (player.Profile.Life <= 0)
            fsm.PlayerDead(player);
        Config.Log(`update life from ${player.SessionId}: ${player.Profile.Life}`);
    }
}

export class UpgradeShipCommand extends Command<SoloRoomState, { sessionId: string, upgrades: number }> {
    execute({sessionId, upgrades} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[sessionId];
        player.Profile.Upgrade += upgrades;
        Config.Log(`update upgrade from ${player.SessionId}: ${player.Profile.Upgrade}`);
    }
}

export class RematchCommand extends Command<SoloRoomState, { client: Client, fsm: SoloGameFSM }> {
    execute({client, fsm} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[client.sessionId];
        player.IsReady = false;
        player.IsRematch = true;
        player.Profile.Life = player.Ships.length;
        player.Profile.Score = 0;
        player.Profile.Upgrade = 0;
        player.AttackLevel = 0;
        fsm.PlayerRematch(client);
        Config.Log(`rematch from ${player.SessionId}`);
    }
}

export class AttackCommand extends Command<SoloRoomState, { client: Client, attackType: AttackType }> {
    execute({client, attackType} = this.payload) {
        let player: SoloPlayerProfile = this.state.Players[client.sessionId];
        let time: number;
        let data: any;
        switch (attackType) {
            case AttackType.SmokingBomb:
            case AttackType.SlowingBomb:
            case AttackType.InverseBomb:
            case AttackType.WishingStar:
            case AttackType.Blindfolded:
            case AttackType.FrenzyFire:
            case 11:
                time = 10;
                break;
            case AttackType.HurtfulFriend:
                time = 0;
                data = {Amount: 5, Range: 1.5};
                break
            case AttackType.DeathClock:
                time = 15;
                break;
            case AttackType.LockDown:
                time = 5;
                break;
            case AttackType.ScaleOfJustice:
                time = 0;
                data = {StealCount: 2};
                break;
            default:
                time = 0;
                data = {};
        }

        this.room.broadcast("ATTACK", {AttackId: attackType, Time: time, AttackerId: player.SessionId, Data: data});
        Config.Log(`Attack from ${player.SessionId}: type: ${AttackType[attackType]}`);
    }
}
