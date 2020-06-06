
const ws = require('ws')


let pack;
try {
   erlpack = require("erlpack");
   pack = erlpack;
   pack.type = "etf";
}catch(err) {
console.log("An error occured when trying to load erlpack. Falling back to json");
pack = {
    pack: JSON.stringify,
    unpack: JSON.parse,
    type: "json"
}
}

const { GATEWAY_URL, GatewayOpcodes, unrecoverableCloseCodes } = require('../Constants')

module.exports = class Shard {
    constructor(client, shardId) {
        this._seq = null
        this._heartbeatAck = true
        this._sessionId = null
        this._ws = null
        this._heartbeatInterval = null
        this._unavailableGuilds = null
        this._reconnecting = false
        this.client = client;
        this.shardId = shardId;
    }


    send(o) {
       this._ws.send(pack.pack(o));
    }

    debug(m) {
        if (this.client.options.debug) this.client.events.emit('debug', m)
    }

    connect() {
        return new Promise((resolve) => {
        this._ws = new ws(`${GATEWAY_URL}?v6&encoding=${pack.type}`)
        this._ws.on('open', _ => { this.debug(`Connection opened on shard ${this.shardId}`) })
        this._ws.on('message', msg => {
            msg = pack.unpack(msg);
            if (msg.s) {
                this._seq = msg.s
                this.debug(`New sequence number: ${this._seq} (Shard ${this.shardId})`)
            }
            switch (msg.op) {
                case GatewayOpcodes.DISPATCH:
                    this.debug(`Dispatch: ${msg.t}`)
                    if (msg.t === "READY") {
                        this._sessionId = msg.d.session_id
                        this._unavailableGuilds = new Set(msg.d.guilds.map(g => g.id))
                        this.client.events.emit('READY', msg.d, this);
                        resolve(this);
                        break;
                    }
                    if (msg.t === "GUILD_CREATE" && this._unavailableGuilds.has(msg.d.id)) {
                        this._unavailableGuilds.delete(msg.d.id);
                        this.client.events.emit("GUILD_LOAD", msg.d, this);
                        if (this._unavailableGuilds.size === 0) this.client.events.emit("GUILDS_LOADED", this);
                        break;
                    }
                    this.client.events.emit(msg.t, msg.d, this);
                    break
                case GatewayOpcodes.HELLO:
                    this.debug(`Hello receieved, starting to heartbeat at ${msg.d.heartbeat_interval}ms (Shard ${this.shardId})`)
                    this._reconnecting ? this.resume() : this.identify()
                    this._heartbeatInterval = setInterval(_ => { this.heartbeat() }, msg.d.heartbeat_interval)
                    break

                case GatewayOpcodes.HEARTBEAT_ACK:
                    this.debug(`Heartbeat acked (Shard ${this.shardId})`)
                    this._heartbeatAck = true
                    break

                case GatewayOpcodes.INVALID_SESSION:
                    this.debug(`Shard ${this.shardId} has an invalid session!`);
                    if (!msg.d) return;
                    this.debug(`Attempting to re-identify shard ${this.shardId}`);
                    setTimeout(() => this.identify(), 4000);
                    break;
            
                default: break
            }
        })
        this._ws.on('close', (code, msg) => {
            this.debug(`\nWebsocket closed\ncode: ${code}\nmessage:${msg}\n`)
            if (unrecoverableCloseCodes.includes(code)) {
                console.log(`Unrecoverable error, closing! code: ${code} message: ${msg}`)
                return setTimeout(process.exit, 300)
            }
            clearInterval(this._heartbeatInterval)
            this._reconnecting = true
            this.connect()
        })
        this._ws.on('error', (err) => this.debug(`oops, websocket error: ${err}`))
      });
    }

    heartbeat() {
        if (!this._heartbeatAck) {
            this._ws.close()
        }
        this.debug(`Sent heartbeat (shard ${this.shardId})`)
        this.send({
            op: GatewayOpcodes.HEARTBEAT,
            d: this._seq
        })
        this._heartbeatAck = false
    }

    resume() {
        this.send({
            op: GatewayOpcodes.RESUME,
            d: {
                token: `Bot ${this.client.token}`,
                session_id: this._sessionId,
                seq: this._seq
            }
        })
    }

    identify() {
        this.debug(`Attempting to identify shard ${this.shardId}`);
        const obj = {
            op: GatewayOpcodes.IDENTIFY,
            d: {
                token: `Bot ${this.client.token}`,
                properties: {
                    $os: "linux",
                    $browser: "Nakamura (Testing version)",
                    $device: "Nakamura (Testing version)"
                },
                shard: [this.shardId, this.client.options.totalShards || this.client.options.shards],
            }
        };
        if (Array.isArray(this.client.options.intents)) obj.intents = this.client.options.intents; 
        this.send(obj)
    }

    setPresence(o) {
        this.debug('Changing status')
        o.game = Object.assign({
            name: '',
            type: 0,
            url: null
        }, o.game)
        this.send({
            op: GatewayOpcodes.PRESENCE_UPDATE,
            d: Object.assign({
                since: null,
                status: 'online'
            }, o)
        })
    }
}
