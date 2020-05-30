

class PartialUser {
    constructor(client, data) {
        this.client = client;
        this.id = data.id;
        this.partial = true;
    }

    async fetch() {
        return new User(await this.client._fetch(`/users/${this.id}`, {method: "get"}));
    }

    async send(options) {
        const res = {};
        if (typeof options === "string") res.content = options;
        else Object.assign(res, options);
        let dmChannel = this.client._dmChannels.get(this.id);
        if (!dmChannel) {
         dmChannel = await this.client._fetch("/users/@me/channels", {method: "post", body: {recipient_id: this.id}});
         dmChannel = dmChannel.id;
         console.log(dmChannel, this.id);
         this.client._dmChannels.set(this.id, dmChannel);
        }
        return this.client._fetch(`/channels/${dmChannel}/`, {method: "post", body: res}, "messages")
    }


}

class User extends PartialUser {
    constructor(client, data) {
        super(client, data);
        this.partial = false;
        this.username = data.username;
        this.discriminator = data.discriminator;
        this._avatar = data.avatar;
        this.bot = Boolean(data.bot);
        this.system = Boolean(data.system);
        this.publicFlags = data.public_flags; // Turn to bitfield
    }

}

module.exports = {
    PartialUser,
    User
}