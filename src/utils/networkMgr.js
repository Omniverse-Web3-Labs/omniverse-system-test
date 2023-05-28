const config = require('config');

class NetworkMgr {
    constructor() {
        this.networks = {};
    }

    init() {
        let networks = config.get('networks');
        let index = 1;
        for (let i = 0; i < networks.length; ++i) {
            if (networks[i].count) {
                for (let j = 0; j < networks[i].count; j++) {
                    let cfg = JSON.parse(JSON.stringify(networks[i]));
                    if (!networks[i].chainName) {
                        cfg.omniverseChainId = index;
                        cfg.chainId = 1337;
                        cfg.chainName = 'CHAIN' + index++;
                    }
                    this.networks[cfg.chainName] = cfg;
                }
            }
            else {
                let cfg = JSON.parse(JSON.stringify(networks[i]));
                if (!networks[i].chainName) {
                    cfg.omniverseChainId = index;
                    cfg.chainName = 'CHAIN' + index++;
                }
                this.networks[cfg.chainName] = cfg;
            }
        }
        console.log('networkMgr', this.networks);
    }

    getNetworksByType(chainType) {
        let ret = {};
        for (let i in this.networks) {
            if (this.networks[i].chainType == chainType) {
                ret[i] = this.networks[i];
            }
        }
        return ret;
    }
}

module.exports = new NetworkMgr();