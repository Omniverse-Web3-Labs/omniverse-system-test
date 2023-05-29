const { spawn } = require("child_process");

module.exports = {
    launch: function(port, chainInfo) {
        return spawn('npx', ['ganache', '--miner.blockTime', 1, '-s', 0, '-p', port]);
    },
}