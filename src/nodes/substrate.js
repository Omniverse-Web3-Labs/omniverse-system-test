const { spawn } = require("child_process");

module.exports = {
  launch: function(port, chainInfo) {
    return spawn('./bin/node-template', ['--dev', '--tmp', '--ws-port', port]);
  },
}