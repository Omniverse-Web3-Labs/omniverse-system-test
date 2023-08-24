const { spawn } = require('child_process');

module.exports = {
  launch: function (port, chainInfo) {
    let platform = process.platform == 'linux' ? 'linux' : 'mac';
    return spawn(
      './bin/artifacts/substrate-contracts-node-' +
        platform +
        '/substrate-contracts-node',
      ['--dev', '--tmp', '--ws-port', port]
    );
  },
};
