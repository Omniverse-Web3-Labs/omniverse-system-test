const utils = require("../utils/utils");
const config = require('config');
const { execSync } = require("child_process");
const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');

module.exports = {
    switchAccount(index) {
        let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -s ' + index;
        execSync(cmd);
    },

    async mint(chainType, chainName, to, token) {
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -s 0';
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -m ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(2);
        }
    },

    async transfer(chainType, chainName, fromIndex, to, token) {
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -s ' + fromIndex;
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -t ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(2);
        }
    },

    async balanceOf(chainType, chainName, account) {
        let ret;
        if (chainType == 'EVM') {
            cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -ob ' + chainName + ',' + account;
            ret = execSync(cmd);
        }
        return ret;
    },

    async transferSubstrateOriginToken(network, users) {
        let provider = new WsProvider(network.rpc);
        let api = await ApiPromise.create({
            provider,
            noInitWarn: true,
        });
        let amount = BigInt('1000000000000000');
        let keyring = new Keyring({ type: 'sr25519' });
        let alice = keyring.addFromUri('//Alice');
        for (let user of users) {
            let address = utils.toSubstrateAddress(user);
            await api.tx.balances.transfer(address, amount).signAndSend(alice);
            console.log('Substrate waiting for in block');
            await utils.sleep(10);
        }
        
    }
}