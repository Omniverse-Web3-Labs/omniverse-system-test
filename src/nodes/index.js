const EVMChain = require('./EVMChain');
const config = require('config');

class NodesMgr {
    constructor() {
        this.id = 0;
        this.nodesInfo = {};
        this.port = 9500;
    }

    init() {
    }

    /**
     * @method launch Launch nodes for testing
     */
    launch() {
        for (let i in global.networkMgr.networks) {
            this.launchChain(global.networkMgr.networks[i]);
            global.networkMgr.networks[i].rpc = 'http://127.0.0.1:' + this.port;
            global.networkMgr.networks[i].port = this.port;
            this.nodesInfo[i] = this.port++;
        }
    }

    /**
     * @method launchChain Launch a node of `chainInfo`
     * @param chainInfo Information of the chain to be launched
     * @return Port of the chain
     */
    launchChain(chainInfo) {
        console.log('launchChain', chainInfo);
        if (chainInfo.chainType == 'EVM') {
            EVMChain.launch(this.port, chainInfo);
        }
    }

    getNodePort(chainName) {
        return this.nodesInfo[chainName];
    }
}

module.exports = new NodesMgr();