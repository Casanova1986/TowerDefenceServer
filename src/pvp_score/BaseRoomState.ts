import { Schema, type } from "@colyseus/schema";

export class BaseRoomState extends Schema {

    @type("number")
    Time: number;


}