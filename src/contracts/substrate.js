const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { encodeAddress, blake2AsU8a } = require('@polkadot/util-crypto');
const accounts = require('../utils/accounts');
const eccrypto = require('eccrypto');
const utils = require('../utils/utils');
class SubstrateDeployer {
  constructor() {
    this.contracts = {};
  }

  async deployOmniverse(chainInfo, contractType) {
    console.log('deployOmniverse', chainInfo);
    let keyring = new Keyring({ type: 'ecdsa' });
    let owner = keyring.addFromSeed(
      Buffer.from(utils.toByteArray(accounts.getOwner()[0]))
    );
    let amount = BigInt('20000000000000000');
    let provider = new WsProvider(chainInfo.rpc);
    let api = await ApiPromise.create({
      provider,
      noInitWarn: true,
    });
    {
      let keyring = new Keyring({ type: 'sr25519' });
      let alice = keyring.addFromUri('//Alice');
      let userPublicKey = eccrypto.getPublicCompressed(
        Buffer.from(utils.toByteArray(accounts.getUsers()[0]))
      );
      let user = encodeAddress(blake2AsU8a(userPublicKey));
      await api.tx.balances.transfer(owner.address, amount).signAndSend(alice);
      await api.tx.balances.transfer(user, amount).signAndSend(alice);
    }

    if (contractType == 'ft') {
      await api.tx.assets
        .createToken(accounts.getOwner()[1], chainInfo.tokenId)
        .signAndSend(owner);
    } else {
      await api.tx.uniques
        .createToken(accounts.getOwner()[1], chainInfo.tokenId)
        .signAndSend(owner);
    }
  }

  async afterDeploy(contractType) {
    let keyring = new Keyring({ type: 'ecdsa' });
    let owner = keyring.addFromSeed(
      Buffer.from(utils.toByteArray(accounts.getOwner()[0]))
    );
    for (let i in global.networkMgr.networks) {
      if (networkMgr.networks[i].chainType == 'SUBSTRATE') {
        let provider = new WsProvider(networkMgr.networks[i].rpc);
        let api = await ApiPromise.create({
          provider,
          noInitWarn: true,
        });
        let members = [];
        for (let j in networkMgr.networks) {
          if (j != i) {
            if (networkMgr.networks[j].chainType == 'EVM') {
              members.push([j, networkMgr.networks[j].EVMContract]);
            } else if (networkMgr.networks[j].chainType == 'SUBSTRATE') {
              members.push([j, networkMgr.networks[j].tokenId]);
            }
          }
        }
        if (contractType == 'ft') {
          await api.tx.assets
            .setMembers(networkMgr.networks[i].tokenId, members)
            .signAndSend(owner);
        } else {
          await api.tx.uniques
            .setMembers(networkMgr.networks[i].tokenId, members)
            .signAndSend(owner);
        }
      }
    }
  }
}

module.exports = new SubstrateDeployer();
