const { execSync } = require("child_process");
const config = require('config');

class EVMChainDeployer {
    constructor() {
        this.contracts = {};
    }

    async deployOmniverse(chainInfo) {
        console.log('deployOmniverse', chainInfo);
        execSync("cd " + config.get('omniverseContractPath') + " && echo -n " + chainInfo.sk + " > .secret");

        let cmd = "cd " + config.get('omniverseContractPath') + " && npm install && npx truffle migrate --network CHAIN" + chainInfo.id;
        execSync(cmd);
    }
}

module.exports = new EVMChainDeployer();