
const Nakamura = require("../index.js");

const bot = new Nakamura.Client("");


bot.on("MESSAGE_CREATE", async (message) => {
    if (message.content === "!ping") {
        const before = Date.now();
        const msg = await bot.sendToChannel(message.channel_id, "Pong!");
        bot.editMessage(msg.channel_id, msg.id, `Pong! This took me ${Date.now() - before} ms!`);
    }

    if (message.content === "!pong") { 
        bot.sendToChannel(message.author.id, "ping!");
    }

});

bot.connect();