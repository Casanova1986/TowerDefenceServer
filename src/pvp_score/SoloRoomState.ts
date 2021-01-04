import {MapSchema, Schema, type} from "@colyseus/schema";
import {SoloPlayerProfile} from "./SoloPlayerProfile";
import {BaseRoomState} from "./BaseRoomState";

export class SoloRoomState extends BaseRoomState {

    @type({map: SoloPlayerProfile})
    Players = new MapSchema<SoloPlayerProfile>();

    @type("number")
    State: number;
}