
const fetch = require("node-fetch");
const { API_URL } = require('../Constants')

class Http {
    constructor(client) {
        this.client = client;
        this._busy = false
        this._queue = []
    }

    queueRequest(data) {
        return new Promise((resolve, reject) => {
            this._queue.push({ data, resolve, reject })
            this.handle()
        })
    }

    async executeRequest(o) {
        this._busy = true;
        const req = await fetch(API_URL + o.data.url, {
            body: JSON.stringify(o.data.body),
            method: o.data.method,
            headers: {
              'User-Agent': `DiscordBot (https://github.com/GoogleFeud/Nakamura, ${require('../../package.json').version})`,
              'Authorization': `Bot ${this.client.token}`,
              'Content-Type': 'application/json'
            }}).catch(err => o.reject(err));
            if (!req.ok) return o.reject(`API Error`);
            const res = await req.json();
            if (req.headers['x-ratelimit-remaining'] === '0') {
                this._queue.unshift(o)
                //setTimeout(_ => o.resolve(), req.headers['x-ratelimit-reset-after'] * 1000)
                return;
            }
            o.resolve(res)
    }

    handle() {
        if (this._busy || this._queue.length === 0) return
        this.executeRequest(this._queue.shift()).then(() => {
            this._busy = false
            this.handle()
        });
    }
}

module.exports = Http;