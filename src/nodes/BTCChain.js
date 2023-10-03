const { exec, spawn, execSync } = require("child_process");
const utils = require("../utils/utils");

module.exports = {
    launch: async function(port, chainInfo) {
        if (process.platform == 'darwin') {
            execSync(
              'rm -rf "/Users/${USER}/Library/Application\ Support/Bitcoin/regtest"'
            );
        } else if (process.platform == 'linux') {
            execSync('rm -rf ~/.bitcoin/regtest');
        }
        exec('bitcoind -regtest -txindex -rpcuser=a -rpcpassword=b');
        await utils.sleep(2);
        // clear old data
        let ret;
        if (process.platform == 'darwin') {
          ret = execSync(
            'rm -rf "/Users/${USER}/Library/Application\ Support/ord/regtest"'
          );
        } else if (process.platform == 'linux') {
          ret = execSync('rm -rf ~/.local/share/ord/regtest');
        }
        console.debug('clear ord', ret.toString());
        // create an account for creating inscriptions
        ret = execSync('ord -r --bitcoin-rpc-pass=b --bitcoin-rpc-user=a wallet create');
        console.debug('create wallet', ret.toString());
        let accountStr = execSync('ord -r --bitcoin-rpc-pass=b --bitcoin-rpc-user=a wallet receive');
        let account = JSON.parse(accountStr.toString()).address;
        console.log('account', account);
        // get some BTC for gas fee
        ret = exec('bitcoin-cli -regtest -rpcuser=a -rpcpassword=b generatetoaddress 101 ' + account);
        await utils.sleep(2);
        setInterval(() => {
            exec('bitcoin-cli -regtest -rpcuser=a -rpcpassword=b generatetoaddress 1 ' + account);
        }, 1000);
    },
}