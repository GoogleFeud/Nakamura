

const Nakamura = require("../index.js");

const bot = new Nakamura.Client("");

bot.use((event, data, next) => { // Logger, which logs every event before it gets emitted
    console.log(event);
    next();
});

class Message {
    constructor(data, client) {
        this.client = client;
        this.id = data.id;
        this.channel_id = data.channel_id;
        this.author = data.author;
        this.content = data.content;
}

    react(emoji) {
        this.client.react(this.channel_id, this.id, emoji);
    }

}
bot.use((event, data, next, client) => { // Middleware which adds a user to the cooldowns list
    if (event === "MESSAGE_CREATE") next(new Message(data, client));
    next();
});


bot.events.on("MESSAGE_CREATE", async (message) => {
    
    if (message.content === "!test") message.react("🤡");

});

bot.connect();