const utils = require("../utils/utils");
const config = require('config');
const { execSync } = require("child_process");
const { ApiPromise, Keyring, WsProvider } = require('@polkadot/api');

module.exports = {
    switchAccount(index) {
        let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -s ' + index;
        execSync(cmd);
    },

    async mint(chainType, chainName, to, token) {
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -s 0';
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -m ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(2);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node nft.js -s 0';
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node nft.js -p uniques -m ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(3);
        }
    },

    async transfer(chainType, chainName, fromIndex, to, token) {
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -s ' + fromIndex;
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -t ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(2);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node nft.js -s ' + fromIndex;
            execSync(cmd);
            cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node nft.js -p uniques -t ' + chainName + ',' + to + ',' + token;
            execSync(cmd);
            await utils.sleep(3);
        }
    },

    async balanceOf(chainType, chainName, account) {
        let ret;
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -ob ' + chainName + ',' + account;
            ret = execSync(cmd);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node nft.js -p uniques -o ' + chainName + ',' + account;
            ret = execSync(cmd);
        }
        return ret;
    },

    async ownerOf(chainType, chainName, tokenId) {
        let ret;
        if (chainType == 'EVM') {
            let cmd = 'cd ' + config.get('submodules.omniverseToolPath') + ' && node register/nft.js -oo ' + chainName + ',' + tokenId;
            ret = execSync(cmd);
        } else if (chainType == 'SUBSTRATE') {
            let cmd = 'cd ' + config.get('submodules.substrateOmniverseToolPath') + ' && node nft.js -n ' + chainName + ',NFT,' + tokenId;
            ret = execSync(cmd);
        }
        return ret;
    },

    async transferSubstrateOriginToken(network, users, porter) {
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
        let address = keyring.addFromSeed(Buffer.from(porter.substr(2), 'hex')).address;
        await api.tx.balances.transfer(address, amount).signAndSend(alice);
        console.log('Substrate waiting for in block');
        await utils.sleep(10);
    }
}