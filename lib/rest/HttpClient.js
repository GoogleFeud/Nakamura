
const Url = require("url");
const Http = require("./Http.js");
const fetch = require("node-fetch");
const Constants = require("../Constants.js");
const FormData = require("form-data");

module.exports = class HTTPClient {
    constructor(token) {
        this.token = token;
        this._routes = {};
    }

    _findRoute(p) {
        return this._routes[p] || (this._routes[p] = new Http(this))
    }

    async _fetch(defUrl, data, detailed) {
        data.url = detailed ? defUrl + detailed:defUrl;
        return await this._findRoute(defUrl).queueRequest(data);
    }

    fetchGuild(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {
            method: "get"
        });
    }

    updateGuild(guildId, data) {
       return this._fetch(`/guilds/${guildId}/`, { method: "patch", body: data });
    }

    deleteGuild(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "delete"});
    }

    leaveGuild(guildId) {
        return this._fetch(`/users/@me/guilds/${guildId}`, {method: "delete"})
    }

    fetchGuildInvites(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, "invites");
    }

    fetchGuildChannels(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, "channels");
    }

    createGuildChannel(guildId, options) {
        if (!options.name) throw new Error("Invalid name in 'channelCreate' must be a non-empty string!");
        return this._fetch(`/guilds/${guildId}/`, {method: "post", body: options}, "channels") 
    }

    updateGuildChannelPosition(guildId, channelId, position) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: [channelId, position]}, "channels");
    }

    updateGuildChannel(channelId, update) {
        return this._fetch(`/channels/${channelId}/`, {method: "patch", body: update});
    }

    updateGuildChannelPermission(channelId, overwriteId, obj) {
        return this._fetch(`/channels/${channelId}/`, {method: "put", body: obj}, `permissions/${overwriteId}`)
    }

    deleteGuildChannelPermission(channelId, overwriteId, obj) {
        return this._fetch(`/channels/${channelId}/`, {method: "delete"}, `permissions/${overwriteId}`)
    }

    deleteGuildChannel(channelId) {
        return this._fetch(`/channels/${channelId}/`, {method: "delete"});
    }

    fetchGuildChannelInvites(channelId) {
        return this._fetch(`/channels/${channelId}/`, {method: "get"}, "invites");
    }

    createGuildChannelInvite(channelId, options = {}) {
        return this._fetch(`/channels/${channelId}/`, {method: "post", body: options || {}}, "invites");
    }

    /*Generally shouldn't be used*/
    type(channelId) {
        return this._fetch(`/channels/${channelId}`, {method: "post"}, "typing")
    }

    fetchMessages(channelId, options = {}) {
        const url = new URLSearchParams();
        if (options.around && typeof options.around === "string") url.append("around", options.around);
        if (options.before && typeof options.before === "string") url.append("before", options.before);
        if (options.after && typeof options.after === "string") url.append("after", options.after);
        if (options.limit && typeof options.limit === "number") url.append("limit", Math.min(100, options.limit));
        return this._fetch(`/channels/${channelId}/`, {method: "get"}, `messages${url}`);
    }

    fetchMessage(channelId, messageId) {
        return this._fetch(`/channels/${channelId}/`, {method: "get"},`messages/${messageId}`)
    }

    fetchPinnedMessages(channelId) {
        return this._fetch(`/channels/${channelId}/`, {method: "get"}, "pins");
    }

    pinMessage(channelId, messageId) {
        return this._fetch(`/channels/${channelId}/`, {method: "put"}, `pins/${messageId}`);
    }

    unpinMessage(channelId, messageId) {
        return this._fetch(`/channels/${channelId}/`, {method: "delete"}, `pins/${messageId}`);
    }

    sendToChannel(channelId, options) {
        let data = {};
        let contentType = "application/json";
        if (typeof options === "string") data.content = options;
        else {
        if (options.content && typeof options.content === "string") data.content = options.content;
        if (options.embed) data.embed = options.embed;
        if (options.tts && typeof options.tts === "boolean") data.tts = options.tts;
        if (options.allowed_mentions) data.allowed_mentions = options.allowed_mentions;
        if (options.file) {
            const d = new FormData();
            d.append("payload_json", JSON.stringify(data));
            d.append("file", options.file);
            data = d;
            contentType = "multipart/form-data";
        }
        }
        return this._fetch(`/channels/${channelId}/`, {method: "post", body: data, contentType, contentDisposition: `attachment; filename="${options.filename || "file.txt"}"`}, "messages")
    }

    editMessage(channelId, messageId, options) {
        const res = {};
        if (typeof options === "string") res.content = options;
        else Object.assign(res, options);
        return this._fetch(`/channels/${channelId}`, {method: "patch", body: res}, `/messages/${messageId}`);
    }

    deleteMessage(channelId, messageId) {
        return this._fetch(`/channels/${channelId}/`, {method: "delete"}, `messages/${messageId}`);
    }

    bulkDeleteMessages(channelId, arrayOfMessageIDs) {
         return this._fetch(`/channels/${channelId}/`, {method: "post", body: {messages: arrayOfMessageIDs || []}}, "/messages/bulk-delete");
    }

    react(channelId, messageId, emoji) {
        return this._fetch(`/channels/${channelId}/`, {method: "put"}, `messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`);
    }

    unreact(channelId, messageId, emoji) {
        return this._fetch(`/channels/${channelId}/`, {method: "delete"}, `messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`);
    }

    deleteReaction(channelId, messageId, emoji, userId) {
        return this._fetch(`/channels/${channelId}/`, {method: "delete"}, `messages/${messageId}/reactions/${encodeURIComponent(emoji)}/${userId}`);
    }

    fetchReactions(channelId, messageId, emoji) {
        return this._fetch(`/channels/${channelId}/`, {method: "get"}, `messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    }

    deleteAllReactions(channelId, messageId) {
        return this._fetch(`/channels/${channelId}/`, {method: "delete"}, `messages/${messageId}/reactions`);
    }

    deleteAllReactionsForEmoji(channelId, messageId, emojiId) {
        return this._fetch(`/channels/${channelId}/`, {method: "delete"}, `messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    }

    fetchGuildMember(guildId, memberId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, `members/${memberId}`);
    }

    fetchGuildMembers(guildId, options = {}) {
        const r = new Url.URLSearchParams();
        if (options.after && typeof options.after === "string") r.append("after", options.after);
        if (options.limit && typeof options.limit === "number") r.append("limit", Math.min(options.limit, 1000));
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, r.toString(), "members"); // TODO: make them members
    }

    updateGuildMember(guildId, memberId, options) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: options}, `members/${memberId}`);
    }

    updateYourNickame(guildId, nick) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: {nick: nick}}, "members/@me/nick");
    }

    addRoleToGuildMember(guildId, memberId, roleId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "put"}, `members/${memberId}/roles/${roleId}`);
    }

    removeRoleFromGuildMember(guildId, memberId, roleId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "delete"}, `members/${memberId}/roles/${roleId}`);
    }

    kickGuildMember(guildId, memberId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "delete"}, `members/${memberId}`);
    }

    fetchBans(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, "bans");
    }

    fetchBan(guildId, memberId) {
        id = id.id || id;
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, `bans/${memberId}`);
    } 

    banGuildMember(guildId, memberId, options = {}) {
        const r = new Url.URLSearchParams();
        if (options.deleteMessageDays && typeof options.deleteMessageDays === "number") r.append("delete-message-days", options.deleteMessageDays);
        if (options.reason && typeof options.reason === "string") r.append("reason", options.reason);
        return this._fetch(`/guilds/${guildId}/`, {method: "put"}, `bans/${memberId}${r.toString()}`);
    }

    unbanGuildMember(guildId, memberId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "delete"}, `bans/${memberId}`);
    }

    fetchRoles(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, "roles");
    }

    createRole(guildId, options) {
        if (!options.name) throw new Error("Invalid name in 'createRole' must be a non-empty string!");
        return this._fetch(`/guilds/${guildId}/`, {method: "post", body: options}, "roles")
    }

    updateRolePosition(guildId, roleId, pos) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: [roleId, pos]}, "roles");
    }

    updateRole(guildId, roleId, options) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: options}, `roles/${roleId}`);
    }

    deleteRole(guildId, roleId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "delete"}, `roles/${roleId}`);
    }

    fetchGuildEmojis(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, "emojis");
    }

    fetchGuildEmoji(guildId, emojiId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, `emojis/${emojiId}`)
    }

    createGuildEmoji(guildId, data) {
        return this._fetch(`/guilds/${guildId}/`, {method: "post", body: data}, "emojis")
    }

    updateGuildEmoji(guildId, emojiId, data) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: data}, `emojis/${emojiId}`)
    }

    deleteGuildEmoji(guildId, emojiId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "delete"}, `emojis/${emojiId}`)
    }

    _fetchImage(endpoint, options = {}) {
        return fetch(this._makeURL(endpoint, options)).then(res => res.blob());
    }

    imageEmoji(emojiId, options) {
        return this._fetchImage(`emojis/${emojiId}`, options);
    }

    imageGuildIcon(guildId, guildIconHash, options) {
        return this._fetchImage(`icons/${guildId}/${guildIconHash}`, options);
    }

    imageGuildSplash(guildId, guildSplashHash, options) {
        return this._fetchImage(`splashes/${guildId}/${guildSplashHash}`, options);
    }

    imageGuildDiscoverySplash(guildId, guildSplashHash, options) {
        return this._fetchImage(`discovery-splashes/${guildId}/${guildSplashHash}`, options);
    }

    imageGuildBanner(guildId, guildBannerHash, options) {
        return this._fetchImage(`banners/${guildId}/${guildBannerHash}`, options);
    }

    imageDefaultUserAvatar(userDiscriminator, options) {
        return this._fetchImage(`embed/avatars/${userDiscriminator % 5}`, options);
    }

    imageUserAvatar(userId, userAvatarHash, options) {
        return this._fetchImage(`avatars/${userId}/${userAvatarHash}`, options);
    }

    _makeURL(endpoint, options = {}) {
        return `${Constants.IMG_URL}${endpoint}.${options.format || "png"}${options.size ? `?size=${options.size}`:""}`;
    }

    urlEmoji(emojiId, options) {
        return this._makeURL(`emojis/${emojiId}`, options);
    }

    urlGuildIcon(guildId, guildIconHash, options) {
        return this._makeURL(`icons/${guildId}/${guildIconHash}`, options);
    }

    urlGuildSplash(guildId, guildSplashHash, options) {
        return this._makeURL(`splashes/${guildId}/${guildSplashHash}`, options);
    }

    urlGuildDiscoverySplash(guildId, guildSplashHash, options) {
        return this._makeURL(`discovery-splashes/${guildId}/${guildSplashHash}`, options);
    }

    urlGuildBanner(guildId, guildBannerHash, options) {
        return this._makeURL(`banners/${guildId}/${guildBannerHash}`, options);
    }

    urlDefaultUserAvatar(userDiscriminator, options) {
        return this._makeURL(`embed/avatars/${userDiscriminator % 5}`, options);
    }

    urlUserAvatar(userId, userAvatarHash, options) {
        return this._makeURL(`avatars/${userId}/${userAvatarHash}`, options);
    }

}