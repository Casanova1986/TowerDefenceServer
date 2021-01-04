"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = require("@colyseus/schema");
const colyseus_1 = require("colyseus");
const stateless_1 = require("stateless");
const rxjs_1 = require("rxjs");
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.IsReady = false;
    }
}
__decorate([
    schema_1.type("boolean")
], Player.prototype, "IsReady", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "ID", void 0);
exports.Player = Player;
var EnemyTrigger;
(function (EnemyTrigger) {
    EnemyTrigger["None"] = "None";
    EnemyTrigger["Shoot"] = "Shoot";
    EnemyTrigger["Jump"] = "Jump";
    EnemyTrigger["Idle"] = "Idle";
    EnemyTrigger["Start"] = "Start";
})(EnemyTrigger || (EnemyTrigger = {}));
var EnemyState;
(function (EnemyState) {
    EnemyState["OnInit"] = "OnInit";
    EnemyState["OnMove"] = "OnMove";
    // OnStart = 'OnStart',
    EnemyState["OnIdle"] = "OnIdle";
    EnemyState["OnShoot"] = "OnShoot";
    EnemyState["OnJump"] = "OnJump";
})(EnemyState || (EnemyState = {}));
class EnemyShootMessage {
}
class EnemyJumpMessage {
}
class Enemy extends schema_1.Schema {
    constructor(Id, Hp, room) {
        super();
        this.enemyFSM = new stateless_1.StateMachine(EnemyState.OnInit);
        this.ID = Id;
        this.Hp = Hp;
        this.MoveTime = 5000;
        this.DelayAction = 3000;
        this.DelayShoot = 2000;
        this.DelayJump = 5000;
        this.room = room;
        this.listDispose = new rxjs_1.Subscription();
        this.enemyFSM.configure(EnemyState.OnInit)
            .permit(EnemyTrigger.Start, EnemyState.OnMove);
        this.enemyFSM.configure(EnemyState.OnMove)
            .onEntry(() => {
            const source = rxjs_1.timer(this.MoveTime);
            const subscribe = source.subscribe(val => {
                this.enemyFSM.fire(EnemyTrigger.Idle);
                subscribe.unsubscribe();
            });
            this.listDispose.add(subscribe);
        })
            .permit(EnemyTrigger.Idle, EnemyState.OnIdle);
        this.enemyFSM.configure(EnemyState.OnIdle)
            .onEntry(() => {
            if (Math.round(Math.random())) {
                this.nextState = EnemyTrigger.Shoot;
            }
            else {
                this.nextState = EnemyTrigger.Jump;
            }
            console.log("onEntry.OnIdle");
        })
            // .onExit(() => this.stopCallTimer())
            .onActivate(() => {
            let delayTime = this.DelayAction;
            if (this.nextState == EnemyTrigger.Shoot) {
                delayTime = this.DelayShoot;
            }
            else if (this.nextState == EnemyTrigger.Jump) {
                delayTime = this.DelayJump;
            }
            const source = rxjs_1.timer(this.MoveTime);
            const subscribe = source.subscribe(val => {
                this.enemyFSM.fire(this.nextState);
                subscribe.unsubscribe();
            });
            this.listDispose.add(subscribe);
        })
            .permit(EnemyTrigger.Jump, EnemyState.OnJump)
            .permit(EnemyTrigger.Shoot, EnemyState.OnShoot);
        this.enemyFSM.configure(EnemyState.OnJump)
            .onEntry(() => {
            this.Jump("ABC");
            const source = rxjs_1.timer(this.DelayAction);
            const subscribe = source.subscribe(val => {
                this.enemyFSM.fire(EnemyTrigger.Idle);
                subscribe.unsubscribe();
            });
            this.listDispose.add(subscribe);
        })
            .permit(EnemyTrigger.Idle, EnemyState.OnIdle);
        this.enemyFSM.configure(EnemyState.OnShoot)
            .onEntry(() => {
            this.Shoot();
            const source = rxjs_1.timer(this.DelayAction);
            const subscribe = source.subscribe(val => {
                this.enemyFSM.fire(EnemyTrigger.Idle);
                subscribe.unsubscribe();
            });
            this.listDispose.add(subscribe);
        })
            .permit(EnemyTrigger.Idle, EnemyState.OnIdle);
    }
    Start() {
        this.enemyFSM.fire(EnemyTrigger.Start);
    }
    TakeDamage(damage) {
        this.Hp -= damage;
        if (this.Hp <= 0) {
            this.Dead();
            return true;
        }
        else {
            return false;
        }
    }
    Dead() {
        this.IsDead = true;
        this.listDispose.unsubscribe();
    }
    Shoot() {
        let msg = new EnemyShootMessage();
        msg.Id = this.ID;
        this.room.broadcast("enemy_shoot", msg);
        console.log(this.ID + "Shoot");
    }
    Jump(target) {
        let msg = new EnemyJumpMessage();
        msg.Id = this.ID;
        this.room.broadcast("enemy_jump", msg);
        console.log(this.ID + "Jump");
    }
    Dispose() {
        this.listDispose.unsubscribe();
    }
}
__decorate([
    schema_1.type("string")
], Enemy.prototype, "ID", void 0);
__decorate([
    schema_1.type("number")
], Enemy.prototype, "Hp", void 0);
__decorate([
    schema_1.type("number")
], Enemy.prototype, "State", void 0);
__decorate([
    schema_1.type("boolean")
], Enemy.prototype, "IsDead", void 0);
exports.Enemy = Enemy;
class WaveMoveController extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.Enemies = new schema_1.MapSchema();
    }
    Start() {
        for (let key in this.Enemies) {
            const enemy = this.Enemies[key];
            enemy.Start();
        }
    }
    IsComplete() {
        let allDie = true;
        for (let key in this.Enemies) {
            const enemy = this.Enemies[key];
            if (!enemy.IsDead) {
                return false;
            }
        }
        return allDie;
    }
    Shoot(enemyId, damage) {
        let Enemy = this.Enemies[enemyId];
        if (Enemy.TakeDamage(damage)) {
            delete this.Enemies[enemyId];
        }
    }
    Dispose() {
        for (let key in this.Enemies) {
            const enemy = this.Enemies[key];
            enemy.Dispose();
            delete this.Enemies[key];
        }
    }
}
__decorate([
    schema_1.type("string")
], WaveMoveController.prototype, "ID", void 0);
__decorate([
    schema_1.type({ map: Enemy })
], WaveMoveController.prototype, "Enemies", void 0);
// class WaveHouseController extends Schema {
//     @type([WaveMoveController])
//     blocks = new ArraySchema<WaveMoveController>();
// }
class RoomState extends schema_1.Schema {
    constructor(room) {
        super();
        this.Players = new schema_1.MapSchema();
        this.wave = new Array();
        this.playerCount = 0;
        this.room = room;
    }
    Init() {
        let move_wave = new WaveMoveController();
        move_wave.ID = "WAVE 1";
        let ID = this.enemyId();
        move_wave.Enemies[ID] = new Enemy(ID, 7, this.room);
        ID = this.enemyId();
        move_wave.Enemies[ID] = new Enemy(ID, 6, this.room);
        this.wave.push(move_wave);
        let move_wave2 = new WaveMoveController();
        move_wave2.ID = "WAVE 2";
        ID = this.enemyId();
        move_wave2.Enemies[ID] = new Enemy(ID, 4, this.room);
        ID = this.enemyId();
        move_wave2.Enemies[ID] = new Enemy(ID, 2, this.room);
        this.wave.push(move_wave2);
        let move_wave3 = new WaveMoveController();
        move_wave3.ID = "Wave3";
        ID = this.enemyId();
        move_wave3.Enemies[ID] = new Enemy(ID, 5, this.room);
        ID = this.enemyId();
        move_wave3.Enemies[ID] = new Enemy(ID, 3, this.room);
        this.wave.push(move_wave3);
        let move_wave4 = new WaveMoveController();
        move_wave4.ID = "WAVE 4";
        ID = this.enemyId();
        move_wave2.Enemies[ID] = new Enemy(ID, 23, this.room);
        this.wave.push(move_wave4);
    }
    enemyId() {
        return colyseus_1.generateId();
    }
    OnUserJoin(sessionId, player) {
        console.log("sessionId" + sessionId);
        this.Players[sessionId] = player;
        this.playerCount++;
        let players = Object.keys(this.Players).length;
        const length = Object.keys(this.Players).length;
        console.log("Map length =>", length);
        for (let key in this.Players) {
            const player = this.Players[key];
            console.log(key, player);
        }
        console.log(this.playerCount + "OnUserJoin players " + players);
    }
    OnReady(sessionId) {
        let player = this.Players[sessionId];
        player.IsReady = true;
    }
    IsAllReady() {
        let allReady = true;
        for (let key in this.Players) {
            const player = this.Players[key];
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
        this.currentWave = this.wave[this.wave.length - 1];
        this.currentWave.Start();
    }
    update(time) {
        this.time = time;
        if (this.currentWave.IsComplete()) {
            if (this.wave.length > 0) {
                this.nextWave();
            }
            else {
                this.state = 2;
            }
        }
    }
    nextWave() {
        this.wave.pop();
        this.currentWave = this.wave[this.wave.length - 1];
        this.currentWave.Start();
    }
    Dispose() {
        if (this.currentWave)
            this.currentWave.Dispose();
    }
}
__decorate([
    schema_1.type({ map: Player })
], RoomState.prototype, "Players", void 0);
__decorate([
    schema_1.type(WaveMoveController)
], RoomState.prototype, "currentWave", void 0);
__decorate([
    schema_1.type("number")
], RoomState.prototype, "state", void 0);
__decorate([
    schema_1.type("number")
], RoomState.prototype, "time", void 0);
exports.RoomState = RoomState;
//# sourceMappingURL=State.js.map