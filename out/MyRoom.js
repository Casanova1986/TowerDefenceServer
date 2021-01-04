"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoom = void 0;
const colyseus_1 = require("colyseus");
class MyRoom extends colyseus_1.Room {
    onCreate(options) {
        this.onMessage("type", (client, message) => {
            // handle "type" message
        });
    }
    onJoin(client, options) {
    }
    onLeave(client, consented) {
    }
    onDispose() {
    }
}
exports.MyRoom = MyRoom;
//# sourceMappingURL=MyRoom.js.map