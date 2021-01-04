import * as Colyseus from "colyseus.js";

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

