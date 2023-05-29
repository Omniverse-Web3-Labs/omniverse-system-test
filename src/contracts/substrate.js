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
      await utils.enqueueTask(Queues, api, 'balances', 'transfer', alice, [
        owner.address,
        amount,
      ]);
      if (contractType == 'ft') {
        await utils.enqueueTask(Queues, api, 'assets', 'createToken', alice, [
          accounts.getOwner()[1],
          chainInfo.tokenId,
          null
        ]);
      } else {
        await utils.enqueueTask(Queues, api, 'uniques', 'createToken', alice, [
          accounts.getOwner()[1],
          chainInfo.tokenId,
          null
        ]);
      }
    }
    console.log('Substrate waiting for in block');
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
          await utils.enqueueTask(Queues, api, 'assets', 'setMembers', owner, [
            networkMgr.networks[i].tokenId,
            members
          ]);
        } else {
          await utils.enqueueTask(Queues, api, 'uniques', 'setMembers', owner, [
            networkMgr.networks[i].tokenId,
            members
          ]);
        }
      }
    }
  }
}

module.exports = new SubstrateDeployer();
