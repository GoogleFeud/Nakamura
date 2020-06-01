
const Nakamura = require("../index.js");

const bot = new Nakamura.Client("NjcyMTU3OTgxNjMwMjY3NDAy.XtOblw.Kae99Uaccx0PKYI2Gwgdqu0Q_Zg");


bot.on("MESSAGE_CREATE", async (message) => {
    if (message.content === "!ping") {
        const before = Date.now();
        const msg = await bot.sendToChannel(message.channel_id, "Pong!");
        bot.editMessage(msg.channel_id, msg.id, `Pong! This took me ${Date.now() - before} ms!`);
    }

    if (message.content === "!pong") { 
        bot.sendToUser(message.author.id, "ping!");
    }
    
});

bot.connect();