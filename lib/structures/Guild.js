
const Url = require("url");

const Structures = require("./StructureGenerator.js");

class PartialGuild {
    constructor(client, data) {
        this.client = client;
        this.id = data.id;
        this.partial = true;
        this._baseUrl = `/guilds/${this.id}/`;
    }

     async fetch() {
        return new Guild(await this.client._fetch(this._baseUrl, {
            method: "get"
        }));
    }

    update(obj) {
       return this.client._fetch(this._baseUrl, { method: "patch", body: obj });
    }

    delete() {
        return this.client._fetch(this._baseUrl, {method: "delete"});
    }

    fetchChannels() {
        return this.client._fetch(this._baseUrl, {method: "get"}, "channels");
    }

    createChannel(options) {
        if (!options.name) throw new Error("Invalid name in 'channelCreate' must be a non-empty string!");
        return this.client._fetch(this._baseUrl, {method: "post", body: options}, "channels") // Create channel object
    }

    updateChannelPosition(id, position) {
        id = id.id || id;
        return this.client._fetch(this._baseUrl, {method: "patch", body: [id, position]}, "channels");
    }

    async fetchMember(id) {
        id = id.id || id;
        const d = await this.client._fetch(this._baseUrl, {method: "get"}, `members/${id}`);
        d.guild = this;
        return new (Structures.get(this.client, "Member"))(this.client, d);
    }

    fetchMembers(options = {}) {
        const r = new Url.URLSearchParams();
        if (options.after && typeof options.after === "string") r.append("after", options.after);
        if (options.limit && typeof options.limit === "number") r.append("limit", Math.min(options.limit, 1000));
        return this.client._fetch(this._baseUrl, {method: "get"}, r.toString(), "members"); // TODO: make them members
    }

    updateMember(id, options) {
        id = id.id || id;
        return this.client._fetch(this._baseUrl, {method: "patch", body: options}, `members/${id}`);
    }

    updateNickame(nick) {
        return this.client._fetch(this._baseUrl, {method: "patch", body: {nick: nick}}, "members/@me/nick");
    }

    addRoleToMember(id, roleId) {
        id = id.id || id;
        roleId = roleId.id || roleId;
        return this.client._fetch(this._baseUrl, {method: "put"}, `members/${id}/roles/${roleId}`);
    }

    removeRoleFromMember(id, roleId) {
        id = id.id || id;
        roleId = roleId.id || roleId;
        return this.client._fetch(this._baseUrl, {method: "delete"}, `members/${id}/roles/${roleId}`);
    }

    kick(id) {
        id = id.id || id;
        return this.client._fetch(this._baseUrl, {method: "delete"}, `members/${id}`);
    }

    fetchBans() {
        return this.client._fetch(this._baseUrl, {method: "get"}, "bans");
    }

    fetchBan(id) {
        id = id.id || id;
        return this.client._fetch(this._baseUrl, {method: "get"}, `bans/${id}`);
    } 

     ban(id, options) {
        id = id.id || id;
        const r = new Url.URLSearchParams();
        if (options.deleteMessageDays && typeof options.deleteMessageDays === "number") r.append("delete-message-days", options.deleteMessageDays);
        if (options.reason && typeof options.reason === "string") r.append("reason", options.reason);
        return this.client._fetch(this._baseUrl, {method: "put"}, `bans/${id}${r.toString()}`);
    }

    unban(id) {
        id = id.id || id;
        return this.client._fetch(this._baseUrl, {method: "delete"}, `bans/${id}`);
    }

    fetchRoles() {
        return this.client._fetch(this._baseUrl, {method: "get"}, "roles");
    }

    createRole(options) {
        if (!options.name) throw new Error("Invalid name in 'createRole' must be a non-empty string!");
        return this.client._fetch(this._baseUrl, {method: "post", body: options}, "roles")
    }

    updateRolePosition(id, pos) {
        id = id.id || id;
        return this.client._fetch(this._baseUrl, {method: "patch", body: [id, pos]}, "roles");
    }

    updateRole(id, options) {
        id = id.id || id;
        return this.client._fetch(this._baseUrl, {method: "patch", body: options}, `roles/${id}`);
    }

    deleteRole(id) {
        return this.client._fetch(this._baseUrl, {method: "delete"}, `roles/${id}`);
    }

    // Add methods after "Delete Role"

    static from(client, id) {
        return new PartialGuild({client: client, id: id});
    }

}

class Guild extends PartialGuild {
    constructor(client, data) {
        super(client, data);
        this.partial = false;
        this.name = data.name;
        this._icon = data.icon;
        this._banner = data.banner;
        this.ownerId = data.owner_id; // Make a partial user
        this.permissions = data.permissions; // Turn to a bitfield
        this.region = data.region;
        this.afkChannelId = data.afk_channel_id; // Make a partial channel
        this.afkTimeout = data.afk_timeout;
        this.verificationLevel = data.verification_level;
        this.explicitContentFilter = data.explicit_content_filter;
        this.roles = data.roles; // Make a map full of Role objects
        this.emojis = data.emojis; // Make a map full of Emoji objects
        this.features = data.features;
        this.mfaLevel = data.mfa_level;
        this.applicationId = data.application_id;
        this.widgetChannel = data.widget_channel_id; // Turn to a partial channel
        this.systemChannel = data.system_channel_id; // Turn to a partial channel
        this.systemChannelFlags = data.system_channel_flags;
        this.rulesChannel = data.rules_channel_id; // Turn to a partial channel
        this.joinedAt = data.joined_at; // Maybe turn to date?
        this.large = data.large;
        this.memberCount = data.memberCount;
        this.members = new client.options.storeClass();
        if (data.members) {
            for (let member of data.members) {
                member.guild = this;
                const m = new (Structures.get(client, "Member"))(client, member, Structures);
                this.members.set(member.user.id, m);
                if (m.id === client.user.id) this.you = m;
            }
        }
        this.channels = data.channels // Turn into a map of Channel objects
        this.presences = data.presences; 
        this.maxPresences = data.max_presences;
        this.maxMembers = data.max_members;
        this.vanityUrl = data.vanity_url_code;
        this.description = data.description;
        this.premiumTier= data.premium_tier;
        this.premiumSubscriptionCount = data.premium_subscription_count;
        this.preferredLocale = data.preferred_locale;
        this.publicUpdatesChannel = data.public_updates_channel_id // Turn into a partial channel
        this.maxVideoChannelUsers = data.max_video_channel_users;
    }


    toPartial() {
        return new PartialGuild({client: this.client, id: this.id});
    }

}

module.exports = {
    Guild,
    PartialGuild
}