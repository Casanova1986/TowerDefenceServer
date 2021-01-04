import {Schema, type} from "@colyseus/schema";

export class BasePlayerProfile extends Schema {
    @type("string")
    RocketId: string;

    @type("string")
    SessionId: string;

    @type("string")
    DisplayName: string;

    @type("string")
    CountryCode: string;

    @type("string")
    AvatarUrl: string;

    @type("boolean")
    IsReady: boolean = false;

    @type("boolean")
    IsConnected: boolean = false;
    
}