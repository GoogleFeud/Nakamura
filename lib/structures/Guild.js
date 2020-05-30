

class PartialGuild {
    constructor(data) {
        this.client = data.client;
        this.id = data.id;
        this.partial = true;
    }

    async fetch() {
        const url = `/guilds/${this.id}`;
        const res = await this.client._findRoute(url).queueRequest({
            url: url + "?with_counts=true",
            method: "get"
        });
        return new Guild(res);
    }

    async update(obj) {
       const url = `/guilds/${this.id}`;
       const res = await this.client._findRoute(url).queueRequest({
           url: url,
           method: "patch",
           body: obj,
       });

       return res;
    }

    async delete() {
        const url = `/guilds/${this.id}`;
        return await this.client._findRoute(url).queueRequest({url: url, method: "delete"});
    }

    
    async fetchMember(id) {
        id = id.id || id;
        const url = `/guilds/${this.id}/members/${id}`;
        const res = await this.client._findRoute(url).queueRequest({
            url: url,
            method: "get"
        });
        return res; // Create member object
    }

    async updateMember(id, obj) {
        id = id.id || id;

    }


    static from(client, id) {
        return new PartialGuild({client: client, id: id});
    }

}

class Guild extends PartialGuild {
    constructor(data) {
        super(data);
        this.partial = false;
        this.patch(data);
    }

    patch(data) {
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
        this.members = data.members // Turn into a map of Member objects
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
        this.approxMemberCount = data.approximate_member_count
    }

    toPartial() {
        return new PartialGuild({client: this.client, id: this.id});
    }

}

module.exports = {
    Guild,
    PartialGuild
}