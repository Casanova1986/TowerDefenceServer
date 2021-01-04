"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stateless_1 = require("stateless");
const rxjs_1 = require("rxjs");
const PvPCommand_1 = require("./PvPCommand");
var Trigger;
(function (Trigger) {
    Trigger["CreateGame"] = "CreateGame";
    Trigger["StartGame"] = "StartGame";
    Trigger["EndGame"] = "EndGame";
    Trigger["AllPlayerDead"] = "AllPlayerDead";
    Trigger["PlayerDisconnect"] = "PlayerDisconnect";
    Trigger["Replay"] = "Replay";
})(Trigger || (Trigger = {}));
var FSMState;
(function (FSMState) {
    FSMState["OnPrepare"] = "OnPrepare";
    // OnStart = 'OnStart',
    FSMState["OnPlaying"] = "OnPlaying";
    FSMState["OnEndGame"] = "OnEndGame";
    FSMState["OnReplay"] = "OnReplay";
})(FSMState || (FSMState = {}));
class StartGameMessage {
}
exports.StartGameMessage = StartGameMessage;
class EndGameMessage {
}
exports.EndGameMessage = EndGameMessage;
class GameFSM {
    // stopCallTimer(): any {
    //     console.log("stopCallTimer");
    // }
    // startCallTimer(): any {
    //     console.log("startCallTimer");
    // }
    constructor(room, roomState, dispatcher) {
        this.phoneCall = new stateless_1.StateMachine(FSMState.OnPrepare);
        this.timmer1second = rxjs_1.interval(1000);
        this.defaultTime = 30;
        this.room = room;
        this.roomState = roomState;
        this.dispatcher = dispatcher;
        console.log("startCallTvGameFSMGameFSMimer");
        this.listDispose = new rxjs_1.Subscription();
        this.phoneCall.configure(FSMState.OnPrepare)
            .onEntry(() => { console.log("----------------- Init Game"); })
            .permit(Trigger.StartGame, FSMState.OnPlaying);
        // this.phoneCall.configure(State.OnStart)
        //     .permit(Trigger.CallConnected, State.OnPlaying);
        this.phoneCall.configure(FSMState.OnPlaying)
            .onEntry(() => this.OnStartGame())
            // .onExit(() => this.stopCallTimer())
            .onActivate(() => this.OnPlaying())
            .permit(Trigger.AllPlayerDead, FSMState.OnEndGame)
            .permit(Trigger.PlayerDisconnect, FSMState.OnEndGame)
            .permit(Trigger.EndGame, FSMState.OnEndGame);
        this.phoneCall.configure(FSMState.OnEndGame)
            // .onEntry(() => this.OnStartGame())
            // .onExit(() => this.stopCallTimer())
            .onActivate(() => this.OnEndGame())
            .permit(Trigger.Replay, FSMState.OnReplay);
    }
    StartGame() {
        this.phoneCall.fire(Trigger.StartGame);
        // this.phoneCall.fire(Trigger.LeftMessage);
        // this.phoneCall.activate();
    }
    OnStartGame() {
        //console.log("OnStartGame");
    }
    OnPlaying() {
        //emit value in sequence every 1 second
        this.roomState.StartGame();
        this.time = this.defaultTime;
        const subscribe = this.timmer1second.subscribe(val => {
            //console.log(val);
            this.time -= 1;
            this.roomState.update(this.time);
            if (this.roomState.state == 2) {
                subscribe.unsubscribe();
                this.phoneCall.fire(Trigger.EndGame);
            }
            if (this.time <= 0) {
                subscribe.unsubscribe();
                this.phoneCall.fire(Trigger.EndGame);
            }
        });
        this.listDispose.add(subscribe);
    }
    EndGame() {
        this.phoneCall.fire(Trigger.EndGame);
    }
    OnEndGame() {
        //console.log("EndGame");
        this.Dispose();
    }
    OnReady(client) {
        this.dispatcher.dispatch(new PvPCommand_1.ReadyCommand(), { sessionId: client.sessionId });
        if (this.roomState.IsAllReady()) {
            this.StartGame();
        }
    }
    OnJoinCommand(client, message) {
        //console.log("----OnJoinCommand-------" + client.sessionId);
        this.dispatcher.dispatch(new PvPCommand_1.JoinRoomCommand(), { sessionId: client.sessionId });
        if (this.roomState.IsMaxPlayer()) {
            let a = new StartGameMessage();
            a.type = " Thông báo từ server";
            this.room.broadcast("start_game", a);
            // let a = new Message();
            // this.room.broadcast<Message>("start_game", a);
        }
    }
    playerDie(client, message) {
        //console.log("----PlayerDeadCommand-------" + client.sessionId);
        this.dispatcher.dispatch(new PvPCommand_1.PlayerDeadCommand(), { sessionId: client.sessionId });
    }
    Dispose() {
        if (!this.listDispose.closed)
            this.listDispose.unsubscribe();
        this.roomState.Dispose();
    }
}
exports.GameFSM = GameFSM;
//# sourceMappingURL=GameFSM.js.map