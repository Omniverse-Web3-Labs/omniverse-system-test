const EVMChain = require('./EVMChain');

class ContractsMgr {
    constructor() {

    }

    async deploy(networks) {
        for (let i = 0; i < networks.length; i++) {
            if (networks[i].chainType == 'EVM') {
                await EVMChain.deployOmniverse(networks[i]);
            }
        }
    }
}

module.exports = new ContractsMgr();