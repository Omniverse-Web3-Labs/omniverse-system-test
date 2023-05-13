const EVMChain = require('./EVMChain');

class NodesMgr {
    constructor() {
        this.id = 0;
        this.nodesInfo = {};
    }

    /**
     * @method launch Launch nodes for testing
     */
    launch(networks) {
        for (let i = 0; i < networks.length; i++) {
            let port = this.launchChain(networks[i]);
            this.nodesInfo[networks[i].id] = port;
        }
    }

    /**
     * @method launchChain Launch a node of `chainInfo`
     * @param chainInfo Information of the chain to be launched
     * @return Port of the chain
     */
    launchChain(chainInfo) {
        console.log('launchChain', chainInfo);
        let port;
        if (chainInfo.chainType == 'EVM') {
            port = EVMChain.launch(chainInfo.id);
        }
        return port;
    }

    getNodePort(id) {
        return this.nodesInfo[id];
    }
}

module.exports = new NodesMgr();