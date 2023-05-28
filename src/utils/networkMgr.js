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
                    this.networks[index] = JSON.parse(JSON.stringify(networks[i]));
                    if (!networks[i].chainName) {
                        this.networks[index].chainName = index++;
                    }
                }
            }
            else {
                this.networks[index] = JSON.parse(JSON.stringify(networks[i]));
                if (!networks[i].chainName) {
                    this.networks[index].chainName = index++;
                }
            }
        }
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