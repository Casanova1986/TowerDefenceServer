const env = process.env.NODE_ENV || 'development';
var isWin = (process.platform === "win32");

export enum Environment {
    LOCAL = 0,
    TEST = 1,
    PRODUCTION = 2
}

export interface ConfigInterface {
    env: Environment;
    numCPUs: number;
    port: number;
    CalculateElo: string;
    SquadEndGame: string;
    Log: any;
}

export let Config = <ConfigInterface>{};

export let ConfigLocal = <ConfigInterface>{};
ConfigLocal.env = Environment.LOCAL;
ConfigLocal.numCPUs = require('os').cpus().length;
ConfigLocal.port = 2568;
ConfigLocal.CalculateElo = 'http://localhost:3668/api/pvp_squad_estimate_elo';
ConfigLocal.SquadEndGame = 'http://localhost:3668/api/pvp_squad_endgame';
ConfigLocal.Log = function (message: any) {
    console.log(message);
}

export let ConfigTest = <ConfigInterface>{};
ConfigTest.env = Environment.TEST;
ConfigTest.numCPUs = require('os').cpus().length;

ConfigTest.port = Number(process.env.PORT);
ConfigTest.CalculateElo = 'http://spacetest.rocketstudio.com.vn:3668/api/pvp_squad_estimate_elo';
ConfigTest.SquadEndGame = 'http://spacetest.rocketstudio.com.vn:3668/api/pvp_squad_endgame';
ConfigTest.Log = function (message: any) {
    console.log(message);
}

export let ConfigProduction = <ConfigInterface>{};
ConfigProduction.env = Environment.PRODUCTION;
ConfigProduction.numCPUs = require('os').cpus().length;
ConfigProduction.port = Number(process.env.PORT) + Number(process.env.NODE_APP_INSTANCE);
ConfigProduction.CalculateElo = 'http://10.128.0.24:8888/api/pvp_squad_estimate_elo';
ConfigProduction.SquadEndGame = 'http://10.128.0.24:8888/api/pvp_squad_endgame';
ConfigProduction.Log = function (message: any) {}

if (env === 'development') {
    if (isWin) {
        Config = ConfigLocal;
    } else {
        Config = ConfigTest;
    }
} else {
    Config = ConfigProduction;
}