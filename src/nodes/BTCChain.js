const { exec, spawn, execSync } = require("child_process");

module.exports = {
    launch: function(port, chainInfo) {
        if (process.platform == 'darwin') {
            execSync(
              'rm -rf "/Users/${USER}/Library/Application\ Support/Bitcoin/regtest"'
            );
        } else if (process.platform == 'linux') {
            execSync('rm -rf ~/.bitcoin/regtest');
        }
        exec('bitcoind -regtest -txindex -rpcuser=a -rpcpassword=b');
    },
}