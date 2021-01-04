import http from "http";
import express from "express";
import serveIndex from 'serve-index';
import path from 'path';
import cors from "cors";
import { Server, RedisPresence } from "colyseus";
import { monitor } from "@colyseus/monitor";
// import socialRoutes from "@colyseus/social/express"
import { MongooseDriver } from "colyseus/lib/matchmaker/drivers/MongooseDriver"

import { matchMaker } from "colyseus";
import { SoloRoom } from "./pvp_score/SoloRoom";
import { SurvivalRoom } from "./survival_room/SurvivalRoom";

import basicAuth from "express-basic-auth";
import { Config, Environment } from "./config";


//const PORT = (Number(process.env.PORT) + Number(process.env.NODE_APP_INSTANCE)) || 2568;
const app = express()

app.use(cors());
app.use(express.json())

const server = http.createServer(app);
let gameServer;

if (Config.env == Environment.PRODUCTION) {
  gameServer = new Server({
    server: server,
    pingInterval: 1500,
    pingMaxRetries: 5,
    express: app,
    presence: new RedisPresence(),
    driver: new MongooseDriver(),
  });

} else {
  gameServer = new Server({
    server: server,
    pingInterval: 1500,
    pingMaxRetries: 5,
  });

}

// register your room handlers
// gameServer.define('pvp_room', PvPRoom);
gameServer.define('pvp_squad', SoloRoom);
gameServer.define('pvp_survival', SurvivalRoom);

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

const basicAuthMiddleware = basicAuth({
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

gameServer.listen(Config.port);

gameServer.onShutdown(function () {
  console.log("master process is being shut down!");
});

console.log(`Environment: ${Environment[Config.env]}`)
console.log(`Listening on ws://localhost:${Config.port}`)

// for (let i = 0; i < 1000; i++) {
//   CreateRoom();
// }




// async function CreateRoom() {
//   const room = await matchMaker.createRoom("pvp_room", { mode: "duo" });
//   console.log(room);

// }


app.use('/', serveIndex(path.join(__dirname, "testbot"), { 'icons': true }))
app.use('/', express.static(path.join(__dirname, "testbot")));


// (optional) attach web monitoring panel
app.use('/colyseus', monitor());

app.post('/api/create_room', async (req: any, res) => {
  try {
    let post_params = req.body;
    const room = await matchMaker.createRoom(post_params.mode, { levels: post_params.levels, results: post_params.results });
    //console.log(room);
    return res.send(room.roomId);
  } catch (error) {
    return res.status(500).send("Server error!");
  }
});