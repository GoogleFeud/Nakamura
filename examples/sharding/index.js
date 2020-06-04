

const Nakamura = require("../../index.js");


(async () => {
    const workers = await Nakamura.ShardingManager("./bot.js", 2, 1); // 2 clients with 1 shard each = 2 shards total

    for (let worker of workers) {
        worker.on("message", data => {
            console.log(data);
    
            if (data.msg === "ready") {
                console.log(`Shard ${data.shard_id} is ready!`);
                // Do something with the data
            }
    
            else if (data.msg === "msg") {
                console.log(`Shard ${data.shard_id} received a message with the content: ${data.msg}`);
            }
    
        });
    }
})();
