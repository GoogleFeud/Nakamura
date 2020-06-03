
const ws = require('ws')
//const erlpack = require('erlpack')
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
       // this._ws.send(erlpack.pack(o))
       this._ws.send(JSON.stringify(o));
    }

    debug(m) {
        if (this.client.options.debug) this.client.emit('debug', m)
    }

    connect() {
        return new Promise((resolve) => {
        this._ws = new ws(`${GATEWAY_URL}?v6&encoding=json`)
        this._ws.on('open', _ => { this.debug(`Connection opened on shard ${this.shardId}`) })
        this._ws.on('message', msg => {
            //msg = erlpack.unpack(msg)
            msg = JSON.parse(msg);    
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
                        this.client.emit('READY', msg.d, this);
                        resolve(this);
                        break;
                    }
                    if (msg.t === "GUILD_CREATE" && this._unavailableGuilds.has(msg.d.id)) {
                        this._unavailableGuilds.delete(msg.d.id);
                        this.client.emit("GUILD_LOAD", msg.d, this);
                        if (this._unavailableGuilds.size === 0) this.client.emit("GUILDS_LOADED");
                        break;
                    }
                    this.client.emit(msg.t, msg.d, this);
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
        this.debug(`Attempting to identify shard ${this.shardId} (Shards: ${[this.shardId, this.client.options.totalShards || this.client.options.shards]})`);
        this.send({
            op: GatewayOpcodes.IDENTIFY,
            d: {
                token: `Bot ${this.client.token}`,
                properties: {
                    $os: "linux",
                    $browser: "Nakamura (Testing version)",
                    $device: "Nakamura (Testing version)"
                },
                shard: [this.shardId, this.client.options.totalShards || this.client.options.shards]
            }
        })
    }

    setStatus(o) {
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
                status: 'online',
                afk: 'false' // what even is this for? /shrug
            }, o)
        })
    }
}
