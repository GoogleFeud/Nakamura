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
 * @property {Object} options - the options you gave the constructor
 * @property {EventEmitter} events - The event emitter for the client. 
 * @property {Set} _shardQueue - A set of shards that need to be spawned
 */

class Client extends HttpClient {

        /**
     * @constructor
     * @param {string} token - Your bot token. 
     * @param {Object} options - Client options
     * @param {Boolean} options.debug - Enables the debug event
     * @param {Number} options.shards - Amount of shards to spawn
     * @param {Array<Number>} options.intents - Intents to use 
     * 
     * @example 
     * const bot = new Client("yourBotId", {debug: true});
     * bot.on("READY", (eventData, shard) => console.log(`Shard ${shard.shardId} is ready!`));
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

        /**
        * @event READY
        * @prop {object} data - see [Ready event documentation]{@link https://discord.com/developers/docs/topics/gateway#ready}
          @prop {Shard} shard - The shard that fired the event
        */

        this.events = new EventEmitter();
        this._shards = new Map();
        this._shardQueue = new Set(Array.from({length: this.options.shards || 1}).map((_, i) => new Shard(this, this.options.lastShard + i)));
    }


    /**Connect all shards to the API
     * @method
     * @public
     */
    async connect() {
        const [first] = this._shardQueue;
        await first.connect();
        this._shards.set(first);
        this._shardQueue.delete(first);
        if (this._shardQueue.size) setTimeout(() => this.connect(), 6000);
        else delete this._shardQueue;
    }

    /**Set the presence of all shards
     * @method
     * @public
     * @param {Presence} o - The presence object
     */
    setPresence(o) {
        this._shards.forEach(s => s.setPresence(o))
    }

}

module.exports = Client

/**
 * @typedef Presence
 * @property {?Number} since - unix time (in milliseconds) of when the client went idle, or null if the client is not idle
 * @property {?Activity} game - null, or the user's new activity
 * @property {?String} status - the bot's new status, can be: "online", "dnd", "idle", "invisible", "offline"
 * @property {?Boolean} afk - whether or not the client is afk
 */

 /**
  * @typedef Activity 
  * @property {String} name - the activity's name
  * @property {Number} type - The type of the activity, can be: 0 (Game), 1 (Streaming), 2 (Listening), 3 (Watching)
  * @property {?String} url - Stream url, if activity is of type 1
  * @property {Number} created_at - unix timestamp of when the activity was added to the user's session
  * @property {ActivityEmoji} emoji - the emoji used for a custom status
  */

  /**
   * @typedef ActivityEmoji
   * @property {String} name - The name of the emoji
   * @property {?String} id - The id of the emoji
   * @property {?Boolean} animated - if the emoji is animated
   */
