import {Schema, ArraySchema, type} from "@colyseus/schema";
import {BasePlayerProfile} from "./BasePlayerProfile";
import {AttackType} from "./FSM/SoloGameFSM";

export class SoloGameProfile extends Schema {
    @type("number")
    Score: number = 0;

    @type("number")
    Upgrade: number = 0;

    @type("number")
    Life: number;
}

export class ShipDataServer extends Schema {
    @type("number")
    Id: number = 0;

    @type("number")
    Star: number = 0;

    @type("number")
    SkinId: number = 0;

    @type("number")
    UpgradeableIndex: number = 0;
}


export class SoloPlayerProfile extends BasePlayerProfile {

    @type(SoloGameProfile)
    Profile: SoloGameProfile;

    @type([ShipDataServer])
    Ships: ArraySchema<ShipDataServer> = new ArraySchema<ShipDataServer>();

    @type("number")
    Elo: number;

    @type("number")
    MaxUnlocked: number;
    
    //Non sync field 
    AttackLevel : number;
    AttackTypes: AttackType[];
    IsRematch: boolean = false;
}

