const EventEmitter = require('eventemitter3')
const ws = require('ws')
const erlpack = require('erlpack')
const { GATEWAY_URL, GatewayOpcodes, unrecoverableCloseCodes } = require('../Constants')

class Shard extends EventEmitter {
    constructor(client) {
        super()

        this._seq = null
        this._heartbeatAck = true
        this._sessionId = null
        this._ws = null
        this._heartbeatInterval = null
        this._unavailableGuilds = null
        this._reconnecting = false
        this.client = client
        this.guildCount = 0
    }

    send(o) {
        this._ws.send(erlpack.pack(o))
    }

    debug(m) {
        if (this.client.options.debug) this.emit('debug', m)
    }

    emit(s, m) {
        this.client.emit(s, m)
    }

    connect() {
        this._ws = new ws(`${GATEWAY_URL}?v6&encoding=etf`)

        this._ws.on('open', _ => { this.debug('Connection opened') })
        this._ws.on('message', msg => {
            msg = erlpack.unpack(msg)
            if (msg.s) {
                this._seq = msg.s
                this.debug(`New sequence number: ${this._seq}`)
            }
            switch (msg.op) {
                case GatewayOpcodes.DISPATCH:
                    this.debug(`Dispatch: ${msg.t}`)
                    switch (msg.t) {
                        case 'READY':
                            this.client.user = msg.d.user;
                            this._sessionId = msg.d.session_id
                            this._unavailableGuilds = new Set(msg.d.guilds.map(g => g.id))
                            this.emit('ready')
                            break
                        case 'GUILD_CREATE':
                            this.guildCount++
                            if (this._unavailableGuilds.has(msg.d.id)) {
                                this._unavailableGuilds.delete(msg.d.id);
                                this.emit("loadGuild", msg.d)
                                if (this._unavailableGuilds.size == 0) {
                                    this.emit('loaded')
                                }
                            }
                            else {
                                this.emit('guildJoin', msg.d);
                            }
                            break

                        case 'MESSAGE_CREATE':
                            this.emit('messageCreate', msg.d);
                            break

                        default:
                            break
                    }
                    break

                case GatewayOpcodes.HELLO:
                    this.debug(`Hello receieved, starting to heartbeat at ${msg.d.heartbeat_interval}ms`)
                    this._heartbeatInterval = setInterval(_ => { this.heartbeat() }, msg.d.heartbeat_interval)
                    this._reconnecting ? this.resume() : this.identify()
                    break

                case GatewayOpcodes.HEARTBEAT_ACK:
                    this.debug('Heartbeat acked')
                    this._heartbeatAck = true
                    break

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

        return this //to add Shard object to Client._shards
    }

    heartbeat() {
        if (!this._heartbeatAck) {
            this._ws.close()
        }
        this.debug('Sent heartbeat')
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
        this.debug('Attempting to identify')
        this.send({
            op: GatewayOpcodes.IDENTIFY,
            d: {
                token: `Bot ${this.client.token}`,
                properties: {
                    $os: "linux",
                    $browser: "Nakamura (Testing version)",
                    $device: "Nakamura (Testing version)"
                },
                shard: [0, 1],
                intents: 513
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

module.exports = Shard