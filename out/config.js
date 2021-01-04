"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigProduction = exports.ConfigTest = exports.ConfigLocal = exports.Config = exports.Environment = void 0;
const env = process.env.NODE_ENV || 'development';
var isWin = (process.platform === "win32");
var Environment;
(function (Environment) {
    Environment[Environment["LOCAL"] = 0] = "LOCAL";
    Environment[Environment["TEST"] = 1] = "TEST";
    Environment[Environment["PRODUCTION"] = 2] = "PRODUCTION";
})(Environment = exports.Environment || (exports.Environment = {}));
exports.Config = {};
exports.ConfigLocal = {};
exports.ConfigLocal.env = Environment.LOCAL;
exports.ConfigLocal.numCPUs = require('os').cpus().length;
exports.ConfigLocal.port = 2568;
exports.ConfigLocal.CalculateElo = 'http://localhost:3668/api/pvp_squad_estimate_elo';
exports.ConfigLocal.SquadEndGame = 'http://localhost:3668/api/pvp_squad_endgame';
exports.ConfigLocal.Log = function (message) {
    console.log(message);
};
exports.ConfigTest = {};
exports.ConfigTest.env = Environment.TEST;
exports.ConfigTest.numCPUs = require('os').cpus().length;
exports.ConfigTest.port = Number(process.env.PORT);
exports.ConfigTest.CalculateElo = 'http://spacetest.rocketstudio.com.vn:3668/api/pvp_squad_estimate_elo';
exports.ConfigTest.SquadEndGame = 'http://spacetest.rocketstudio.com.vn:3668/api/pvp_squad_endgame';
exports.ConfigTest.Log = function (message) {
    console.log(message);
};
exports.ConfigProduction = {};
exports.ConfigProduction.env = Environment.PRODUCTION;
exports.ConfigProduction.numCPUs = require('os').cpus().length;
exports.ConfigProduction.port = Number(process.env.PORT) + Number(process.env.NODE_APP_INSTANCE);
exports.ConfigProduction.CalculateElo = 'http://10.128.0.24:8888/api/pvp_squad_estimate_elo';
exports.ConfigProduction.SquadEndGame = 'http://10.128.0.24:8888/api/pvp_squad_endgame';
exports.ConfigProduction.Log = function (message) { };
if (env === 'development') {
    if (isWin) {
        exports.Config = exports.ConfigLocal;
    }
    else {
        exports.Config = exports.ConfigTest;
    }
}
else {
    exports.Config = exports.ConfigProduction;
}
//# sourceMappingURL=config.js.map