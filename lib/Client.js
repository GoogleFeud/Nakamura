const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')
const Http = require('./rest/Http');
const Constants = require("./Constants");
const Url = require("url");

const worker_threads = require("worker_threads");

/**
 * The main class to interact with
 * @extends {EventEmitter}
 * @property {Map<number, Shard>} _shards - Map object containing Shard objects, mapped by id
 * @property {String} token - The bot's token
 */

class Client extends EventEmitter {

        /**
     * @constructor
     * @param {string} token - Your bot token. IT SHOULD NOT HAVE THE `Bot` PREFIX
     * @param {Object} options - Client options
     * @param {Boolean} options.debug - Enables the debug event
     * @param {Number} options.shards - Amount of shards to spawn
     * 
     * @example 
     * const bot = new Client("yourBotId", {debug: true});
     * bot.on("SOME_EVENT", eventData => {});
     * bot.on("debug", console.log)
     */
    constructor(token, options = {}) {
        super()
        this.token = token;
        this.options = Constants.defaultOptions;
        Object.assign(this.options, options);
        if (!worker_threads.isMainThread) {
            this.options.shards = worker_threads.workerData[0];
            this.options.lastShard = worker_threads.workerData[1];
            this.options.totalShards = worker_threads.workerData[2];
        }
        this._routes = new Map()
        this._shards = new Map()
        this._shardQueue = new Set(Array.from({length: this.options.shards || 1}).map((_, i) => new Shard(this, this.options.lastShard + i)));
    }

    _findRoute(p) {
        return this._routes.get(p) || (this._routes.set(p, new Http(this)) && this._routes.get(p))
    }

    async _fetch(defUrl, data, detailed) {
        data.url = detailed ? defUrl + detailed:defUrl;
        return await this._findRoute(defUrl).queueRequest(data);
    }

    async connect() {
        const [first] = this._shardQueue;
        await first.connect();
        this._shards.set(first);
        this._shardQueue.delete(first);
        if (this._shardQueue.size) setTimeout(() => this.connect(), 6000);
        else delete this._shardQueue;
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

    sendToChannel(channelId, content) {
        let data
        if (typeof content === 'string')
            data = { content: content }
        else
            data = content
        const path = `/channels/${channelId}/messages`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'post',
            body: data,
        });
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

    setPresence(o) {
        this._shards.forEach(s => s.setPresence(o))
    }

}

module.exports.Client = Client

