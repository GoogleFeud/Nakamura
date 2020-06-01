# Nakamura
## lightweight and extensible Discord API wrapper

Yes, you are meant to build on top of this to fit your needs

## Idea

The idea is that **you** cache everything you need. The library should not do any caching. It will provide you with help methods for easier use. It's somewhat similar to Eris, where every method for interacting with the Discord API is part of the `Client` class.

All of the events are coming straight from the discord gateway. Event list: https://discord.com/developers/docs/topics/gateway#commands-and-events-gateway-events
Example:

```js
class Message {
    constructor(client, data) {
        this.client = client;
        this.content = data.content;
        this.author = data.author;
        this.channel = data.channel_id;
    }

    reply(content = "") {
        this.client.sendToChannel(this.channel, `${this.author.username}, ${content}`);
    }
}

const client = new Client("yourToken");

client.on("MESSAGE_CREATE", message => {
    message = new Message(message);
    if (message.content === "!test") message.reply("tested!");
});
```

Keeping track of permissions: (And that's just role permissions, without channel permission overwrites, have fun):

```js

class You {
    constructor(data) {
        this.roles = new Set(data.roles);
    }
}
class Role {
    constructor(data) {
        this.permissions = data.permissions;
        this.position = data.position;
    }
}

class Guild {
    constructor(client, data) {
        this.you = new You(data.members.find(m => m.user.id === client.user.id));
        this.rolePerms = new Map();
        for (let role of data.roles) this.rolePerms.set(role.id, new Role(role))
    }
}
const guilds = new Map();

client.on("READY", data => {
    client.user = data.user;
});

client.on("GUILD_LOAD", guild => {
      guilds.set(guild.id, new Guild(client, guild));
});

client.on("GUILD_CREATE", guild => {
    guilds.set(guild.id, new Guild(client, guild));
});

client.on("GUILD_DELETE", guild => {
    guilds.delete(guild.id);
})

client.on("GUILD_MEMBER_UPDATE", member => {
    if (member.user.id === client.user.id) guilds.get(member.guild_id).you = new You(member);
});

client.on("GUILD_ROLE_UPDATE", role => {
    guilds.get(role.guild_id).rolePerms.set(role.role.id, new Role(role.role));
});

client.on("GUILD_ROLE_CREATE", role => {
    guilds.get(role.guild_id).rolePerms.set(role.role.id, new Role(role.role));
});

client.on("GUILD_ROLE_DELETE", role => {
    const guild = guilds.get(role.guild_id);
    guilds.get(role.guild_id).rolePerms.delete(role.role_id);
    if (guild.you.roles.has(role_id)) guild.you.roles.delete(role_id);
});


```