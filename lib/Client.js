const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')
const Http = require('./rest/Http');

/**
 * Options for the client
 * @typedef {Object} ClientOptions
 * @property {?boolean} debug - Enable debug messages (fires the debug event)
 */

/**
 * The main class to interact with
 * @extends {EventEmitter}
 * @property {Map<number, Shard>} _shards - Map object containing Shard objects, mapped by id
 * @property {?object} user - Client User object, see [User documentation]{@link https://discord.com/developers/docs/resources/user#user-object}
 */
class Client extends EventEmitter {
    /**
     * @constructor
     * @param {string} token - Your bot token. IT SHOULD NOT HAVE THE `Bot` PREFIX
     * @param {?ClientOptions} opts - Client options
     */
    constructor(token, options = {debug: true, cacheGuilds: true, cacheRoles: true}) {
        super()
        this.token = token
        this.options = options;
        this._routes = new Map()
        this._shards = new Map()
        this.user = null
    }

    /**
     * Finds (or creates) a route for ratelimiting
     * @private
     * @param {string} route
     * @returns {Http} Found (or created) route
     */
    _findRoute(p) {
        return this._routes.get(p) || (this._routes.set(p, new Http(this)) && this._routes.get(p))
    }

    /**
     * Creates a [Shard]{@link Shard} and connects to the gateway
     */
    connect() {
        this._shards.set(this._shards.size, new Shard(this).connect())
    }

    /**
     * Create a message
     * @async
     * @param {string} channel - id of the channel
     * @param {string} content - Content of the message
     * @returns {Promise<Object>} see [Message documentation]{@link https://discord.com/developers/docs/resources/channel#message-object}
     */
    // TODO: add support for sending more than just plaintext content lmao
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

    /**
     * Sets the statuses of all Shards
     * @param {Object} status - See [Status Update Structure documentation]{@link https://discord.com/developers/docs/topics/gateway#update-status}
     */
    setAllStatus(o) {
        this._shards.forEach(s => s.setStatus(o))
    }
}

module.exports.Client = Client
