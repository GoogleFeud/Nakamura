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
        return new Promise(async resolve => {
        const req = await fetch(API_URL + o.data.url, {
            body: JSON.stringify(o.data.body),
            method: o.data.method,
            headers: {
              'User-Agent': `DiscordBot (https://github.com/GoogleFeud/Nakamura, ${require('../../package.json').version})`,
              'Authorization': `Bot ${this.client.token}`,
              'Content-Type': 'application/json'
            }}).catch(err => o.reject(err));
            let res = {};
            if (req.status === 429) {
                o.reject(new Error(res.message));
                if (req.retry_after) setTimeout(() => this.executeRequest(o), req.retry_after);
            }
            else if (!req.ok) return o.reject(new Error(req.statusText));
            if (req.status !== 204) res = await req.json();
            if (res.message && res.code) o.reject(new Error(res.message));
            if (req.headers.get('x-ratelimit-remaining') === "0") {
                setTimeout(_ => resolve(), req.headers.get('X-rateLimit-reset-after') * 1000);
            } 
            o.resolve(res)
            resolve();
        });
    }

    handle() {
        if (this._busy || this._queue.length === 0) return;
        this.executeRequest(this._queue.shift()).then(() => {
            this._busy = false;
            this.handle()
        });
    }
}

module.exports = Http;