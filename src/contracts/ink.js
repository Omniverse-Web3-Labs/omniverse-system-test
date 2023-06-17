const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { CodePromise } = require('@polkadot/api-contract');
const config = require('config');
const accounts = require('../utils/accounts');
const utils = require('../utils/utils');
const fs = require('fs');

async function deployContract(tx, keyPair) {
  return new Promise(async (resolve, reject) => {
    let address;
    const unsub = await tx.signAndSend(keyPair, ({ contract, status }) => {
      if (status.isInBlock || status.isFinalized) {
        address = contract.address.toString();
        unsub();
        resolve(address);
      }
    });
  });
}

class InkDeployer {
  constructor() {
    this.tokenInfo = {};
  }

  beforeDeploy(contractType, count) {
    let networks = NetworkMgr.getNetworksByType('INK');
    for (let i in networks) {
      let template = config.get('tokenInfo')[contractType];
      // console.log(template[0])
      this.tokenInfo[networks[i].chainName] = [];
      this.tokenInfo[networks[i].chainName].push({ ...template[0] });
      if (template.length != count) {
        for (let j = 1; j < count; ++j) {
          this.tokenInfo[networks[i].chainName].push({
            name: template[0].name + j,
            symbol: template[0].symbol + j,
          });
        }
      }
    }
  }

  async deployOmniverse(chainInfo, contractType, tokenInfo) {
    let keyring = new Keyring({ type: 'ecdsa' });
    let owner = keyring.addFromSeed(
      Buffer.from(utils.toByteArray(accounts.getOwner()[0]))
    );
    let provider = new WsProvider(chainInfo.ws);
    let api = await ApiPromise.create({
      provider,
      noInitWarn: true,
    });
    // Prepare token
    // To be continued, this should be place in initialization in accounts
    {
      let amount = BigInt('20000000000000000');
      let keyring = new Keyring({ type: 'sr25519' });
      let alice = keyring.addFromUri('//Alice');
      let ret = await utils.enqueueTask(
        Queues,
        api,
        'balances',
        'transfer',
        alice,
        [owner.address, amount]
      );
    }

    // Deploy
    let metadata = JSON.parse(
      fs.readFileSync('./res/ink/omniverse_protocol.contract')
    );
    const code = new CodePromise(api, metadata, metadata.source.wasm);
    // maximum gas to be consumed for the instantiation. if limit is too small the instantiation will fail.
    const gasLimit = api.registry.createType('WeightV2', {
      refTime: '10000000000',
      proofSize: '10000000000',
    });
    // a limit to how much Balance to be used to pay for the storage created by the instantiation
    // if null is passed, unlimited balance can be used
    const storageDepositLimit = null;

    const tx = code.tx.new(
      { gasLimit, storageDepositLimit },
      chainInfo.omniverseChainId,
      accounts.getOwner()[1],
      tokenInfo.name,
      tokenInfo.symbol
    );
    let contractAddress = await deployContract(tx, owner);
    return contractAddress;
  }

  async setMembers(contractType) {
    let keyring = new Keyring({ type: 'ecdsa' });
    let owner = keyring.addFromSeed(
      Buffer.from(utils.toByteArray(accounts.getOwner()[0]))
    );
    for (let i in NetworkMgr.networks) {
      if (NetworkMgr.networks[i].chainType == 'SUBSTRATE') {
        let provider = new WsProvider(NetworkMgr.networks[i].ws);
        let api = await ApiPromise.create({
          provider,
          noInitWarn: true,
        });
        let members = [];
        for (let j in NetworkMgr.networks) {
          let network = NetworkMgr.networks[j];
          if (j != i) {
            if (network.chainType == 'EVM') {
              members.push([network.omniverseChainId, network.omniverseContractAddress]);
            } else if (network.chainType == 'SUBSTRATE') {
              members.push([omniverseChainId, network.tokenId]);
            }
          }
        }
        if (contractType == 'ft') {
          await utils.enqueueTask(Queues, api, 'assets', 'setMembers', owner, [
            NetworkMgr.networks[i].tokenId,
            members,
          ]);
        } else {
          await utils.enqueueTask(Queues, api, 'uniques', 'setMembers', owner, [
            NetworkMgr.networks[i].tokenId,
            members,
          ]);
        }
      }
    }
  }
}

module.exports = new InkDeployer();
