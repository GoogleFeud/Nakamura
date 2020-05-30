
const Structures = require("./StructureGenerator.js");

class Message {
    constructor(client, data) {
        this.guild = Structures.partialFrom("Guild", client, data.guild_id);
        this.attachments = [];
        this.author = new (Structures.get(client, "User"))(client, data.author);
        if (data.member) this.member = new (Structures.get(client, "Member"))(client, {guild: this.guild, user: this.author, ...data.member});
        this.content = data.content;
        this.embeds = data.embeds;
        this.flags = data.flags;
        this.pinned = data.pinned;
        this.tts = data.tts;
        // Add mentions, channel
    }
}

module.exports = {Message}