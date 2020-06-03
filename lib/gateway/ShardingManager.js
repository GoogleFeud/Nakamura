

const workerThreads = require("worker_threads");

if (!workerThreads.isMainThread) return;

function createClient(filePath, workerOptions) {
    const w = new workerThreads.Worker(filePath, workerOptions); // shards per client, last shard id, total Shardd
    w.on("erorr", console.log);
    w.on("exit", console.log);
    return w;
}

module.exports = function spawn(filePath, clients = 1, shardsPerClient, workerOptions) {
    const workers = [];
    const totalShards = shardsPerClient * clients;
    for (let i=0; i < clients; i++) {
        const lastShard = i * shardsPerClient
        if (i === 0) workers.push(createClient(filePath, {...workerOptions, workerData: [shardsPerClient, lastShard, totalShards]}));
        else setTimeout(() => workers.push(createClient(filePath, {...workerOptions, workerData: [shardsPerClient, lastShard, totalShards]})), shardsPerClient *8000);
    }
    return workers;
} 

