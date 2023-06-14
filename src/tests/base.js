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
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -s 0';
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -m ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(3);
        } else if (chainType == 'INK') {
            let cmd = 'cd ' + config.get('submodules.inkOmniverseToolPath') + ' && node index.js -s 0';
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.inkOmniverseToolPath') + ' && node index.js -m ' + chainName + ',' + to + ',' + token;
            let ret = execSync(cmd);
            console.log('ret111', ret.toString());
            await utils.sleep(3);
        }
    },

    async transfer(chainType, chainName, fromIndex, to, token) {
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -s ' + fromIndex;
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -t ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(2);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -s ' + fromIndex;
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -t ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(3);
        } else if (chainType == 'INK') {
            let cmd = 'cd ' + config.get('submodules.inkOmniverseToolPath') + ' && node index.js -s ' + fromIndex;
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.inkOmniverseToolPath') + ' && node index.js -t ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(3);
        }
    },

    async balanceOf(chainType, chainName, account) {
        let ret;
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/index.js -ob ' + chainName + ',' + account;
            ret = execSync(cmd);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -o ' + chainName + ',' + account;
            ret = execSync(cmd);
        } else if (chainType == 'INK') {
            let cmd = 'cd ' + config.get('submodules.inkOmniverseToolPath') + ' && node index.js -o ' + chainName + ',' + account;
            ret = execSync(cmd);
        }
        return ret;
    },

    async transferSubstrateNativeToken(network, users, porter) {
        let provider = new WsProvider(network.ws);
        let api = await ApiPromise.create({
            provider,
            noInitWarn: true,
        });
        let amount = BigInt('1000000000000000');
        let keyring = new Keyring({ type: 'sr25519' });
        let alice = keyring.addFromUri('//Alice');
        for (let user of users) {
            let address = utils.toSubstrateAddress(user);
            await utils.enqueueTask(
              Queues,
              api,
              'balances',
              'transfer',
              alice,
              [address, amount]
            );
        }
        let address = keyring.addFromSeed(Buffer.from(porter.substr(2), 'hex')).address;
        await utils.enqueueTask(
            Queues,
            api,
            'balances',
            'transfer',
            alice,
            [address, amount]
          );
    }
}