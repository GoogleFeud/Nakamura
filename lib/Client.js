const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')
const Http = require('./rest/Http');
const Constants = require("./Constants");

class Client extends EventEmitter {
    constructor(token, options = {}) {
        super()
        this.token = token
        this.options = Constants.defaultOptions;
        Object.assign(this.options, options);
        this._routes = new Map()
        this._shards = new Map()
        this.user = null;
        this._dmChannels = new Map();
    }

    _findRoute(p) {
        return this._routes.get(p) || (this._routes.set(p, new Http(this)) && this._routes.get(p))
    }

    async _fetch(defUrl, data, detailed) {
        data.url = detailed ? defUrl + detailed:defUrl;
        return await this._findRoute(defUrl).queueRequest(data);
    }

    connect() {
        this._shards.set(this._shards.size, new Shard(this).connect())
    }

     fetchGuild(guildId) {
        return this.client._fetch(`/guilds/${this.id}/`, {
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

    async createMessage(channel, content) {
        let data
        if (typeof content === 'string')
            data = { content: content }
        else
            data = content
        const path = `/channels/${channel}/messages`
        const route = this._findRoute(path)
        return route.queueRequest({
            url: path,
            method: 'post',
            body: data,
        });
    }

    setAllStatus(o) {
        this._shards.forEach(s => s.setStatus(o))
    }
}

module.exports.Client = Client
