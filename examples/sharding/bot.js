
const Nakamura = require("../../index.js");
const {parentPort} = require("worker_threads");

const client = new Nakamura.Client("yourToken");

client.events.on("READY", (data, shard) => {
    parentPort.postMessage({m: "ready", shard_id: shard.shardId});
});

client.events.on("MESSAGE_CREATE", (message, shard) => {
    parentPort.postMessage({m: "msg", shard_id: shard.shardId, msg: message.content}); // Shard 0 will only receive DMs
    if (message.content === "hi") client.sendToChannel(message.channel_id, "Hello!");
});

client.events.on("debug", console.log)

client.connect();