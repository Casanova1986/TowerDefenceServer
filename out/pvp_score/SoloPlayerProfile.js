"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoloPlayerProfile = exports.ShipDataServer = exports.SoloGameProfile = void 0;
const schema_1 = require("@colyseus/schema");
const BasePlayerProfile_1 = require("./BasePlayerProfile");
class SoloGameProfile extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.Score = 0;
        this.Upgrade = 0;
    }
}
__decorate([
    schema_1.type("number")
], SoloGameProfile.prototype, "Score", void 0);
__decorate([
    schema_1.type("number")
], SoloGameProfile.prototype, "Upgrade", void 0);
__decorate([
    schema_1.type("number")
], SoloGameProfile.prototype, "Life", void 0);
exports.SoloGameProfile = SoloGameProfile;
class ShipDataServer extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.Id = 0;
        this.Star = 0;
        this.SkinId = 0;
        this.UpgradeableIndex = 0;
    }
}
__decorate([
    schema_1.type("number")
], ShipDataServer.prototype, "Id", void 0);
__decorate([
    schema_1.type("number")
], ShipDataServer.prototype, "Star", void 0);
__decorate([
    schema_1.type("number")
], ShipDataServer.prototype, "SkinId", void 0);
__decorate([
    schema_1.type("number")
], ShipDataServer.prototype, "UpgradeableIndex", void 0);
exports.ShipDataServer = ShipDataServer;
class SoloPlayerProfile extends BasePlayerProfile_1.BasePlayerProfile {
    constructor() {
        super(...arguments);
        this.Ships = new schema_1.ArraySchema();
        this.IsRematch = false;
    }
}
__decorate([
    schema_1.type(SoloGameProfile)
], SoloPlayerProfile.prototype, "Profile", void 0);
__decorate([
    schema_1.type([ShipDataServer])
], SoloPlayerProfile.prototype, "Ships", void 0);
__decorate([
    schema_1.type("number")
], SoloPlayerProfile.prototype, "Elo", void 0);
__decorate([
    schema_1.type("number")
], SoloPlayerProfile.prototype, "MaxUnlocked", void 0);
exports.SoloPlayerProfile = SoloPlayerProfile;
//# sourceMappingURL=SoloPlayerProfile.js.map