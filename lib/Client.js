const EventEmitter = require('eventemitter3')
const Shard = require('./gateway/Shard')
const Constants = require("./Constants");

const HttpClient = require("./rest/HttpClient.js");

const worker_threads = require("worker_threads");

/**
 * The main class to interact with
 * @extends {HttpClient}
 * @property {Map<number, Shard>} _shards - Map object containing Shard objects, mapped by id
 * @property {String} token - The bot's token
 */

class Client extends HttpClient {

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
        Object.assign(this, new EventEmitter());
        this.token = token;
        this.options = Constants.defaultOptions;
        Object.assign(this.options, options);
        if (!worker_threads.isMainThread) {
            this.options.shards = worker_threads.workerData[0];
            this.options.lastShard = worker_threads.workerData[1];
            this.options.totalShards = worker_threads.workerData[2];
        }
        this.events = new EventEmitter();
        this._shards = new Map();
        this._shardQueue = new Set(Array.from({length: this.options.shards || 1}).map((_, i) => new Shard(this, this.options.lastShard + i)));
    }


    async connect() {
        const [first] = this._shardQueue;
        await first.connect();
        this._shards.set(first);
        this._shardQueue.delete(first);
        if (this._shardQueue.size) setTimeout(() => this.connect(), 6000);
        else delete this._shardQueue;
    }

    setPresence(o) {
        this._shards.forEach(s => s.setPresence(o))
    }

}

module.exports = Client

