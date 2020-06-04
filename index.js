module.exports = {
    Client: require('./lib/Client'),
    ShardingManager: require("./lib/gateway/ShardingManager.js"),
    Constants: require('./lib/Constants'),
    HTTPClient: require("./lib/rest/HttpClient")
}

Object.defineProperty(module.exports, "Util", {
    get: () => require("./lib/Util.js")
});