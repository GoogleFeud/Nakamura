# Nakamura

lightweight and extensible Discord API wrapper

## Try it

```
npm i GoogleFeud/Nakamura ws erlpack node-fetch form-data eventemitter3
```

## Idea

The idea is that **you** cache everything you need. The library should not do any caching. It will provide you with help methods for easier use. It's somewhat similar to Eris, where every method for interacting with the Discord API is part of the `Client` class.

All of the events are coming straight from the discord gateway. Event list: https://discord.com/developers/docs/topics/gateway#commands-and-events-gateway-events

## Examples

```js
const client = new Client("yourToken");

const prefix = "#";
client.events.on("MESSAGE_CREATE", async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;
    if (message.content === `${prefix}ping`) {
        const bef = Date.now();
        const msg = await client.sendToChannel(message.channel_id, "Ping!");
        client.editMessage(msg.channel_id, msg.id, `Ping! Took me ${Date.now() - bef}ms`);
    }
});
```

## HTTPClient

The `Client` class extends the `HTTPClient` class, which is made specifically for HTTP requests to the Discord API. You can use this class without having a `Client`class. 
**Note:** Some of the API endpoints require a connection to the gateway, so you must have a running bot to send messages for example. You can use this class when you don't have access to any `Client` objects, but still want to interact with the API.

```js
const client = new HTTPClient("yourToken");

client.fetchGuild("someGuildID");
client.sendToChannel("someChannelId", "some message :D");
```

## Util

This lib also features a bunch of utility methods and constants (Permission flags, Message flags, User flags, Mentions regex, splitting messages, generating snowflakes, escaping markdown, and others, [check it out](https://github.com/GoogleFeud/Nakamura/blob/better/lib/Util.js)) that are TOTALLY not copied from `discord.js`. Phuh. (They were).

The library is supposed to be super light, so when you require the main file for this lib, the `Util` file won't be required, so all the Constants and functions won't be loaded into memory. They will be loaded when you first use any of the constants/functions.

```js
const Nakamura = require("./path/to/index/file.js");
console.log(nakamura.Utils.generateSnowflake());
```

## Sharding

This lib supports internal sharding as well as splitting your bot into processes. 

### Internal Sharding

```js
 const client = new Client("yourToken", {shards: 2}); // Spawns 2 shards
``` 

### Process Sharding

```js
 const ShardingManager = require("./index.js").ShardingManager;

ShardingManager("./pathToMainFile.js", 2, 1).then(workers => {  // workers is an array of worker threads. You can communicate with them from this file.
     workers[0].on("message", data) { // Listening for data (THIS LISTENS ONLY FOR THE FIRST CLIENT'S MESSAGES)
     console.log(data); // {m: "Some message name", d: "Some Data Name"}
     workers[0].postMessage({m: "Some other message name", d: "Some Data"}) // Send messages to client
 }
}); // Creates 2 clients with 1 shard each

// Meanwhile, in your ./pathToMainFile.js:

const {parentPort} = require("worker_threads");

parentPort.on("message", data => {
  if (data.m === "Message Name") parentPort.postMessage({m: "Some message name", d: "Some data"});
});

client.events.on("READY", (data, shard) => {
    parentPort.postMessage({m: "READY", d: shard.shardId}); // Send "READY" to the process manager when one of the shards is ready
});
```

### A mix of the two

```js
const ShardingManager = require("./index.js").ShardingManager;

const workers = ShardingManager("./pathToMainFile.js", 2, 3); // Creates 2 clients with 3 shards each, which means there's a total of 6 shards
```