"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlayerProfile = void 0;
const schema_1 = require("@colyseus/schema");
class BasePlayerProfile extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.IsReady = false;
        this.IsConnected = false;
    }
}
__decorate([
    schema_1.type("string")
], BasePlayerProfile.prototype, "RocketId", void 0);
__decorate([
    schema_1.type("string")
], BasePlayerProfile.prototype, "SessionId", void 0);
__decorate([
    schema_1.type("string")
], BasePlayerProfile.prototype, "DisplayName", void 0);
__decorate([
    schema_1.type("string")
], BasePlayerProfile.prototype, "CountryCode", void 0);
__decorate([
    schema_1.type("string")
], BasePlayerProfile.prototype, "AvatarUrl", void 0);
__decorate([
    schema_1.type("boolean")
], BasePlayerProfile.prototype, "IsReady", void 0);
__decorate([
    schema_1.type("boolean")
], BasePlayerProfile.prototype, "IsConnected", void 0);
exports.BasePlayerProfile = BasePlayerProfile;
//# sourceMappingURL=BasePlayerProfile.js.map