const { exec } = require("child_process");

module.exports = {
    launch: function(id) {
        let port = id + 8545;
        exec("npx ganache --miner.blockTime 1 -s 0 -p " + port + " --server.ws");
        return port;
    },
}