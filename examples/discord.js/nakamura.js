


const Nakamura = require("../../index.js");

const client = new Nakamura.Client("NDczMTIwMTQ0NzgxMjEzNjk2.XtiZgw.O2jmYeffwfBvNg_9KCheQfT4-ho");

client.webhooks = {};

const PREFIX = "!";
client.events.on("MESSAGE_CREATE", async message => {
   if (message.author.bot || !message.guild_id) return;


   if (message.content.startsWith(`${PREFIX}say`)) {
       const _start = Date.now();
       const pinged = message.mentions[0];
       if (!pinged) return client.sendToChannel(message.channel_id, "Please ping a user!");
       let wh = client.webhooks[message.channel_id];
       if (!wh) wh = client.webhooks[message.channel_id] = await client.createWebhook(message.channel_id, {name: "Bot"});
       await client.sendWithWebhook(wh.id, wh.token, {
           content: Nakamura.Util.cleanContent(message.content.replace(`${PREFIX}say`, "")),
           username: pinged.username,
           avatar_url: client.urlUserAvatar(pinged.id, pinged.avatar)
       }).catch(console.log);
       client.sendToChannel(message.channel_id, `Took me ${Date.now() - _start}MS!`)
   }



if (message.content === `${PREFIX}memory`) {
     client.sendToChannel(message.channel_id, `${Math.round(process.memoryUsage().heapUsed / (1024 * 1024))}MB`)
}
});



client.connect();