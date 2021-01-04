"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const serve_index_1 = __importDefault(require("serve-index"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const colyseus_1 = require("colyseus");
const monitor_1 = require("@colyseus/monitor");
// import socialRoutes from "@colyseus/social/express"
const MongooseDriver_1 = require("colyseus/lib/matchmaker/drivers/MongooseDriver");
const colyseus_2 = require("colyseus");
const SoloRoom_1 = require("./pvp_score/SoloRoom");
const SurvivalRoom_1 = require("./survival_room/SurvivalRoom");
const express_basic_auth_1 = __importDefault(require("express-basic-auth"));
const config_1 = require("./config");
//const PORT = (Number(process.env.PORT) + Number(process.env.NODE_APP_INSTANCE)) || 2568;
const app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
let gameServer;
if (config_1.Config.env == config_1.Environment.PRODUCTION) {
    gameServer = new colyseus_1.Server({
        server: server,
        pingInterval: 1500,
        pingMaxRetries: 5,
        express: app,
        presence: new colyseus_1.RedisPresence(),
        driver: new MongooseDriver_1.MongooseDriver(),
    });
}
else {
    gameServer = new colyseus_1.Server({
        server: server,
        pingInterval: 1500,
        pingMaxRetries: 5,
    });
}
// register your room handlers
// gameServer.define('pvp_room', PvPRoom);
gameServer.define('pvp_squad', SoloRoom_1.SoloRoom);
gameServer.define('pvp_survival', SurvivalRoom_1.SurvivalRoom);
/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);
const basicAuthMiddleware = express_basic_auth_1.default({
    // list of users and passwords
    users: {
        "admin": "1846Rocket$AdminSpace@@",
        "dungpa": "DungPAAdminSpace_1234@",
    },
    // sends WWW-Authenticate header, which will prompt the user to fill
    // credentials in
    challenge: true
});
// // register colyseus monitor AFTER registering your room handlers
// app.use("/colyseus", basicAuthMiddleware, monitor({
//   columns: [
//     'roomId',
//     'name',
//     'clients',
//     { metadata: "spectators" }, // display 'spectators' from metadata
//     'locked',
//     'elapsedTime'
//   ]
// }));
gameServer.listen(config_1.Config.port);
gameServer.onShutdown(function () {
    console.log("master process is being shut down!");
});
console.log(`Environment: ${config_1.Environment[config_1.Config.env]}`);
console.log(`Listening on ws://localhost:${config_1.Config.port}`);
// for (let i = 0; i < 1000; i++) {
//   CreateRoom();
// }
// async function CreateRoom() {
//   const room = await matchMaker.createRoom("pvp_room", { mode: "duo" });
//   console.log(room);
// }
app.use('/', serve_index_1.default(path_1.default.join(__dirname, "testbot"), { 'icons': true }));
app.use('/', express_1.default.static(path_1.default.join(__dirname, "testbot")));
// (optional) attach web monitoring panel
app.use('/colyseus', monitor_1.monitor());
app.post('/api/create_room', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let post_params = req.body;
        const room = yield colyseus_2.matchMaker.createRoom(post_params.mode, { levels: post_params.levels, results: post_params.results });
        //console.log(room);
        return res.send(room.roomId);
    }
    catch (error) {
        return res.status(500).send("Server error!");
    }
}));
//# sourceMappingURL=index.js.map