
const Discord = require("discord.js");

const client = new Discord.Client();

client.webhooks = {};

const PREFIX = "!";

client.on("message", async message => {
   if (message.author.bot || message.channel.type === "dm") return;

   if (message.content.startsWith(`${PREFIX}say`)) {
       const _start = Date.now();
       const pinged = message.mentions.users.first();
       if (!pinged) return message.channel.send("Please ping a user!");
       let wh = client.webhooks[message.channel.id];
       if (!wh) wh = client.webhooks[message.channel.id] = await message.channel.createWebhook("Bot");
       await wh.send(message.cleanContent.replace(`${PREFIX}say`, ""), {
            avatarURL: pinged.avatarURL(),
            username: pinged.username
        });
       message.channel.send(`Took me ${Date.now() - _start}MS!`);
   }

   if (message.content === `${PREFIX}memory`) {
    message.channel.send(`${Math.round(process.memoryUsage().heapUsed / (1024 * 1024))}MB`)
}
});

client.login("NDczMTIwMTQ0NzgxMjEzNjk2.XtiZgw.O2jmYeffwfBvNg_9KCheQfT4-ho")