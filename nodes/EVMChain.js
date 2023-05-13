const { exec } = require("child_process");

module.exports = {
    launch: function(id) {
        let port = id + 8545;
        exec("npx ganache -s 0 -p " + port + " --server.ws");
        return port;
    },
}