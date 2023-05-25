const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const accounts = require('../utils/accounts');
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
      await api.tx.balances
        .transfer(owner.address, amount)
        .signAndSend(alice, async ({ status, events }) => {
          // console.log(status.isInBlock, status.isFinalized);
          if (status.isInBlock) {
            if (contractType == 'ft') {
              await api.tx.assets
                .createToken(accounts.getOwner()[1], chainInfo.tokenId, null)
                .signAndSend(owner);
            } else {
              await api.tx.uniques
                .createToken(accounts.getOwner()[1], chainInfo.tokenId, null)
                .signAndSend(owner);
            }
          }
        });
    }
    console.log('Substrate waiting for in block');
    await utils.sleep(10);
  }

  async setMembers(contractType) {
    console.log('Substrate set members');
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
    await utils.sleep(12);
  }
}

module.exports = new SubstrateDeployer();
