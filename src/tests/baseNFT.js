const utils = require("../utils/utils");
const config = require('config');
const { execSync } = require("child_process");
const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');

module.exports = {
    switchAccount(index) {
        let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -s ' + index;
        execSync(cmd);
    },

    async mint(chainType, chainName, to, token, oTokenId) {
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -s 0';
            execSync(cmd);
            let subCommand = oTokenId ? ' -ti ' + oTokenId : '';
            cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -m ' + chainName + ',' + to + ',' + token + subCommand;
            execSync(cmd);
            await utils.sleep(2);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -s 0';
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -p uniques -m ' + chainName + ',' + oTokenId + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(3);
        }
    },

    async transfer(chainType, chainName, fromIndex, to, token, oTokenId) {
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -s ' + fromIndex;
            execSync(cmd);
            let subCommand = oTokenId ? ' -ti ' + oTokenId : '';
            cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -t ' + chainName + ',' + to + ',' + token + subCommand;
            execSync(cmd);
            await utils.sleep(2);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -s ' + fromIndex;
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -p uniques -t ' + chainName + ',' + oTokenId + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(3);
        }
    },

    async balanceOf(chainType, chainName, account, oTokenId) {
        let ret;
        if (chainType == 'EVM') {
            let subCommand = oTokenId ? ' -ti ' + oTokenId : '';
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -ob ' + chainName + ',' + account + subCommand;
            ret = execSync(cmd);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -p uniques -o ' + chainName + ',' + oTokenId + ',' + account;
            ret = execSync(cmd);
        }
        return ret;
    },

    ownerOf(chainType, chainName, tokenId, oTokenId) {
        let ret;
        if (chainType == 'EVM') {
            let subCommand = oTokenId ? ' -ti ' + oTokenId : '';
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -oo ' + chainName + ',' + tokenId + subCommand;
            try {
                ret = execSync(cmd);
            }
            catch (e) {
                ret = e;
            }
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node index.js -n ' + chainName + ',' + oTokenId + ',' + tokenId;
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
          await utils.enqueueTask(Queues, api, 'balances', 'transfer', alice, [
            address,
            amount,
          ]);
        }
        let address = keyring.addFromSeed(
          Buffer.from(porter.substr(2), 'hex')
        ).address;
        await utils.enqueueTask(Queues, api, 'balances', 'transfer', alice, [
          address,
          amount,
        ]);
    }
}