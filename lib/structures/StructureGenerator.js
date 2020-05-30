
const structures = {
    Guild: require("./Guild.js"),
    User: require("./User.js"),
    Member: require("./Member.js"),
    Message: require("./Message.js")
}

module.exports.get = function(client, structureName) {
    if (client.options.partials.includes(structureName)) return structures[structureName][`Partial${structureName}`];
    return structures[structureName][structureName];
}

module.exports.partialFrom = function(name, client, id) {
    return new structures[name][`Partial${name}`](client, {id: id}, module.exports);
}