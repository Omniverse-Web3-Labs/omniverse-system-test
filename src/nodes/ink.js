const { spawn } = require("child_process");

module.exports = {
  launch: function(port, chainInfo) {
    return spawn('./bin/substrate-contracts-node', ['--dev', '--tmp', '--ws-port', port]);
  },
}