const fetch = require("node-fetch");
const { API_URL } = require('../Constants')


class Http {
    constructor(client) {
        this.client = client;
        this._busy = false;
        this._queue = [];
    }

    queueRequest(data) {
        if (this._busy) {
            this._queue.push(data);
            return this.executeRequest()
        }
        return new Promise((resolve, reject) => {
            this._queue.push({ data, resolve, reject })
            this.handle()
        });
    }

    run() {
        if (this._queue.length === 0) return Promise.resolve()
    }

    async executeRequest(o) {
        this._busy = true;
        const headers = {
            'User-Agent': `DiscordBot (https://github.com/GoogleFeud/Nakamura`,
            'Authorization': `Bot ${this.client.token}`,
            "content-type": 'application/json',
        }
        if (o.data.body) {
        if (!o.data.body.append) o.data.body = JSON.stringify(o.data.body);
        else Object.assign(headers, o.data.body.getHeaders());
        }
        return new Promise(async resolve => {
        const req = await fetch(API_URL + o.data.url, {
            body: o.data.body,
            method: o.data.method,
            headers
        });
            let res = {};
            if (req.status === 429) {
                o.reject(new Error(res.message));
                if (req.retry_after) setTimeout(() => this.executeRequest(o), req.retry_after);
            }
            else if (!req.ok) return o.reject(new Error(req.statusText));
            if (req.status !== 204) res = await req.json();
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