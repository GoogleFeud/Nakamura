const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')
const Http = require('./rest/Http');
const Constants = require("./Constants");
const Url = require("url");

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
        this._routes = new Map()
        this._shards = new Map()
        this._dmChannels = new Map();
    }

    _findRoute(p) {
        return this._routes.get(p) || (this._routes.set(p, new Http(this)) && this._routes.get(p))
    }

    async _fetch(defUrl, data, detailed) {
        data.url = detailed ? defUrl + detailed:defUrl;
        return await this._findRoute(defUrl).queueRequest(data);
    }

        /**
     * Connect to the gateway
     */
    connect() {
        this._shards.set(this._shards.size, new Shard(this).connect())
    }

    /**
     * Get guild data from the API.
     * @async
     * @param {String} guildId - The ID of the guild you want to fetch
     * @returns {Promise<Guild>} see [Guild]{@link https://discord.com/developers/docs/resources/guild#guild-object}
     * 
     * @example
     * bot.fetchGuild("672836069896749067").then(guild => console.log(guild.name));
     */
    fetchGuild(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {
            method: "get"
        });
    }

        /**
     * Update a guild
     * @async
     * @param {String} guildId - The ID of the guild you want to update
     * @param {GuildUpdate} data - The fields to update
     * @returns {Promise<Guild>} see [Guild]{@link https://discord.com/developers/docs/resources/guild#guild-object}
     * 
     * @example
     * bot.updateGuild("672836069896749067", {name: "SomeNewName"}).then(guild => console.log(guild.name));
     */

    updateGuild(guildId, data) {
       return this._fetch(`/guilds/${guildId}/`, { method: "patch", body: data });
    }

    /**
     * Delete a guild. The bot must be the owner of the guild!
     * @async
     * @param {String} guildId - The ID of the guild you want to delete
     * @returns {void}
     * 
     * @example
     * bot.deleteGuild("672836069896749067").then(() => console.log("GUILD DELETED!"));
     */

    deleteGuild(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "delete"});
    }

    /**
     * Get all channels in a guild.
     * @async
     * @param {String} guildId - The ID of the guild
     * @returns {Array<Channel>}
     * 
     * @example
     * bot.fetchGuildChannels("672836069896749067").then((channels) => channels.map(...));
     */
    fetchGuildChannels(guildId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, "channels");
    }

     /**
     * Create a guild channel.
     * @async
     * @param {String} guildId - The ID of the guild
     * @param {ChannelCreateOptions} options
     * @returns {Channel}
     * 
     * @example
     * bot.createGuildChannel("672836069896749067", {name: "Best channel ever"}).then(channel => console.log(channel.id));
     */
    createGuildChannel(guildId, options) {
        if (!options.name) throw new Error("Invalid name in 'channelCreate' must be a non-empty string!");
        return this._fetch(`/guilds/${guildId}/`, {method: "post", body: options}, "channels") 
    }

    /**
     * Update a guild channel's position
     * @async
     * @param {String} guildId - The ID of the guild
     * @param {Number} position - The new position of the channel
     * @returns {void}
     * 
     * @example
     * bot.updateGuildChannelPosition("672836069896749067", "672836069896757067", 5)
     */
    updateGuildChannelPosition(guildId, channelId, position) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: [channelId, position]}, "channels");
    }

        /**
     * Get a guild member
     * @async
     * @param {String} guildId - The ID of the guild
     * @param {String} memberId - The ID of the member to be fetched
     * @returns {Member}
     * 
     * @example
     * bot.fetchGuildMember("672836069896749067", "672836069896749067").then(member => console.log(member.user.username));
     */
    fetchGuildMember(guildId, memberId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, `members/${memberId}`);
    }

            /**
     * Get multiple guild members
     * @async
     * @param {String} guildId - The ID of the guild
     * @param {Object} options
     * @param {String} options.after - the highest user id in the previous page
     * @param {Number} options.limit - The amount of members to fetch. (1 - 1000)
     * @returns {Array<Member>}
     * 
     * @example
     * bot.fetchGuildMembers("672836069896749067").then(members => console.log(members[0]));
     */
    fetchGuildMembers(guildId, options = {}) {
        const r = new Url.URLSearchParams();
        if (options.after && typeof options.after === "string") r.append("after", options.after);
        if (options.limit && typeof options.limit === "number") r.append("limit", Math.min(options.limit, 1000));
        return this._fetch(`/guilds/${guildId}/`, {method: "get"}, r.toString(), "members"); // TODO: make them members
    }

                /**
     * Update a guild member
     * @async
     * @param {String} guildId - The ID of the guild
     * @param {String} memberId - The ID of the member to edit
     * @param {MemberUpdate} options
     * @returns {void}
     * 
     * @example
     * bot.updateGuildMember("672836069896749067", {nick: "Google"});
     */
    updateGuildMember(guildId, memberId, options) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: options}, `members/${memberId}`);
    }

   
                /**
     * Update your nickname in the server
     * @async
     * @param {String} guildId - The ID of the guild
     * @param {String} nick - Your new nickname
     * @returns {void}
     * 
     * @example
     * bot.updateYourNickname("672836069896749067", "Google's Pet");
     */
    updateYourNickame(guildId, nick) {
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: {nick: nick}}, "members/@me/nick");
    }

                    /**
     * Add a role to a guild member
     * @async
     * @param {String} guildId - The ID of the guild
     * @param {String} memberId - The ID of the member
     * @param {String} roleId - The ID of the role
     * @returns {void}
     * 
     * @example
     * bot.addRoleToGuildMember("672836069896749067", "672836069896749067", "672836069896749067");
     */
    addRoleToGuildMember(guildId, memberId, roleId) {
        return this._fetch(`/guilds/${guildId}/`, {method: "put"}, `members/${memberId}/roles/${roleId}`);
    }

                        /**
     * Remove a role from a guild member
     * @async
     * @param {String} guildId - The ID of the guild
     * @param {String} memberId - The ID of the member
     * @param {String} roleId - The ID of the role
     * @returns {void}
     * 
     * @example
     * bot.removeRoleFromGuildMember("672836069896749067", "672836069896749067", "672836069896749067");
     */
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

     banGuildMember(guildId, memberId, options) {
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
        return this._fetch(`/guilds/${guildId}/`, {method: "patch", body: [id, pos]}, "roles");
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

    async sendToUser(userId, options) {
        const res = {};
        if (typeof options === "string") res.content = options;
        else Object.assign(res, options);
        let dmChannel = this._dmChannels.get(userId);
        if (!dmChannel) {
            dmChannel = await this._fetch("/users/@me/channels", {method: "post", body: {recipient_id: userId}});
            dmChannel = dmChannel.id;
            this._dmChannels.set(userId, dmChannel);
        }
        return this._fetch(`/channels/${dmChannel}/`, {method: "post", body: res}, "messages")
    }

    editMessage(channelId, messageId, options) {
        const res = {};
        if (typeof options === "string") res.content = options;
        else Object.assign(res, options);
        return this._fetch(`/channels/${channelId}`, {method: "patch", body: res}, `/messages/${messageId}`);
    }

    setAllStatus(o) {
        this._shards.forEach(s => s.setStatus(o))
    }
}

module.exports.Client = Client

/**
 * A discord guild
 * @typedef {Object} Guild
 * @property {String} name - The name of the guild
 */

 /**
  * Discord guild update options
  * @typedef {Object} GuildUpdate
  * @property {?String} name - The new name of the guild
  * @property {?String} region - The new region of the guild
  * @property {?Number} verification_level - The new verification level of the guild
  * @property {?Number} explicit_content_filter - The new explicit content filter level
  * @property {?String} afk_channel_id - The ID of the new AFK channel
  * @property {?Number} afk_timeout - The new afk timeout in seconds
  * @property {?String} icon - The new icon of the guild. Must be in base64 format, png/jpeg/gif image
  * @property {?String} owner_id - The ID of the new owner for the guild (this bot must be owner)
  * @property {?String} splash - base64 16:9 png/jpeg image for the guild splash
  * @property {?String} banner - base64 16:9 png/jpeg image for the guild banner
  * @property {?String} system_channel_id - The ID of the new system channel
  * @property {?String} rules_channel_id - The ID of the new rules channel
  * @property {?String} public_updates_channel_id - The ID of the new public updates channel
  * @property {?String} preferred_locale - The new preferred locale
  */

/**
 * A discord channel
 * Channel Types:    
 * 0 - Guild Text    
 * 1 - DM    
 * 2 - Guild Voice     
 * 3 - Group DM     
 * 4 - Guild Category     
 * 5 - Guild News     
 * 6 - Guild Store    
 * @typedef {Object} Channel
 * @property {String} id - The ID of the channel
 * @property {Integer} type - The type of the channel. 
 * @property {?String} guild_id - The ID of the guild this channel is in
 * @property {?Integer} position - The position of the channel in the guild
 * @property {?Array<Overwrite>} permission_overwrites - An array of overwrite objects
 * @property {?String} name - The name of the channel
 * @property {?String} topic
 * @property {?Boolean} nsfw - If the channel is marked as not safe for work
 * @property {?String} last_message_id - The ID of the last message sent in this channel
 * @property {?Integer} bitrate - The bitrate (in bits) in the voice channel
 * @property {?Integer} user_limit - The user limit for the voice channel
 * @property {?Integer} rate_limit_per_user - amount of seconds a user has to wait before sending another message (0-21600); bots, as well as users with the permission manage_messages or manage_channel, are unaffected
 * @property {?Array<User>} recipients - The recipients of the DM
 * @property {?String} icon - Icon hash
 * @property {?String} owner_id - ID of the DM creator
 * @property {?String} parent_id - The ID of the category the channel is under
 * @property {?String} last_pin_timestamp - when the last pinned message was pinned
 */

 /**
  * An overwrite object
  * @typedef {Object} Overwrite
  * @property {String} id - The ID of the role/user
  * @property {String} type - Either "role" or "member"
  * @property {Integer} allow
  * @property {Integer} deny
  */

  /**
   * @typedef {Object} ChannelCreateOptions
   * @property {String} name
   * @property {?Integer} type
   * @property {?String} topic
   * @property {?Integer} bitrate
   * @property {?Integer} user_limit
   * @property {?Integer} rate_limit_per_user
   * @property {?Integer} position
   * @property {?Array<Overwrite>} permission_overwrites
   * @property {?String} parent_id
   * @property {?Boolean} nsfw
   */

  /**
   * A user object
   * @typedef {Object} User
   * @property {String} id - The ID of the user
   * @property {String} username - The username of the user
   * @property {String} discriminator - the user's 4-digit discord-tag
   * @property {?String} avatar - Avatar hash
   * @property {?Boolean} bot - If the user is a bot
   * @property {?Boolean} system - whether the user is an Official Discord System user
   * @property {?String} locale - the user's chosen language option
   * @property {?Integer} flags - See [flags]{@link https://discord.com/developers/docs/resources/user#user-object-user-flags}
   */ 

   /**
    * A member object
    * @typedef {Object} Member
    * @property {?User} user - The user this guild member represents
    * @property {?String} nick - The nickname of the member in the guild
    * @property {Array<String>} roles - An array of role IDs
    * @property {String} joined_at - When the user joined the guild
    * @property {String} premium_since - When the user started boosting the server
    * @property {Boolean} deaf - Whether the user is deafened in voice channels
    * @property {Boolean} mute - Whether the user is muted in voice channels
    */

    /**
     * @typedef MemberUpdate
     * @property {?String} nick
     * @property {?Array<String>} roles
     * @property {?Boolean} mute
     * @property {?Boolean} deaf
     * @property {?String} channel_id
     */