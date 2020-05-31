
const Structures = require("./StructureGenerator.js");

class PartialMember {
    constructor(client, data) {
        this.client = client;
        this.id = data.id || data.user.id;
        this.guild = data.guild;
        this.partial = true;
    }

    async fetch() {
        if (!this.guild) return;
        const d = await this.client._fetch(this.guild._baseUrl, {method: "get"}, `members/${this.id}`);
        d.guild = this.guild;
        return new Member(this.client, d);
    }

    


}

class Member extends PartialMember {
    constructor(client, data) {
        super(client, data.user || data);
        this.partial = false;
        this.guild = data.guild;
        this.deaf = data.deaf;
        this.hoistedRole = data.hoisted_role;
        this.mute = data.mute;
        this.nickname = data.nick;
        this.premiumSince = data.premium_since;
        this.roles = data.roles; // Transform to partial roles
        if (data.user.partial === false) this.user = data.user;
        else this.user = new (Structures.get(client, "User"))(client, data.user);
    }
}

module.exports = {
    PartialMember,
    Member
}