const { exec } = require("child_process");

module.exports = {
    launch: function(port, chainInfo) {
        exec("npx ganache --miner.blockTime 1 -s 0 -p " + port);
    },
}