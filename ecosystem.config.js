// ecosystem.config.js
const os = require('os');
module.exports = {
    apps: [
         {
            port        : 2568,
            name        : "colyseus-proxy",
            script      : "./node_modules/@colyseus/proxy/bin/proxy",
            instances   : 1, // scale this up if the proxy becomes the bottleneck
            exec_mode   : 'cluster',
            env: {
                PORT: 2568,
                REDIS_URL: "redis://127.0.0.1:6379/0",
                SELF_HOSTNAME: "127.0.0.1"
            }
        },
        {
            port        : 8080,
            name        : "colyseus",
            script      : "out/index.js", // your entrypoint file
            watch       : true,           // optional
            instances   : os.cpus().length,
            exec_mode   : 'fork',         // IMPORTANT: do not use cluster mode.
            env: {
                DEBUG: "colyseus:errors",
                NODE_ENV: "production",
                SELF_HOSTNAME: "127.0.0.1"
            }
        }
    ]
}