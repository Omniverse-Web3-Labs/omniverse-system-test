const { exec, spawn, execSync } = require("child_process");

module.exports = {
    launch: function(port, chainInfo) {
        execSync('rm -rf ~/.bitcoin/regtest');
        exec('bitcoind -regtest -txindex -rpcuser=a -rpcpassword=b');
    },
}