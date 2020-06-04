

const workerThreads = require("worker_threads");

if (!workerThreads.isMainThread) return;

function createClient(filePath, workerOptions) {
    const w = new workerThreads.Worker(filePath, workerOptions); // shards per client, last shard id, total Shardd
    return w;
}

module.exports = function spawn(filePath, clients = 1, shardsPerClient, workerOptions) {
    return new Promise(resolve => {
    const workers = [];
    const totalShards = shardsPerClient * clients;
    for (let i=0; i < clients; i++) {
        if (i === 0) workers.push(createClient(filePath, {...workerOptions, workerData: [shardsPerClient, i * shardsPerClient, totalShards]}));
        else setTimeout(() => {
            workers.push(createClient(filePath, {...workerOptions, workerData: [shardsPerClient, i * shardsPerClient, totalShards]}))
            if (workers.length === clients) resolve(workers);
        }, shardsPerClient *6000);
        if (workers.length === clients) resolve(workers);
    }
    return workers;
    });
} 

