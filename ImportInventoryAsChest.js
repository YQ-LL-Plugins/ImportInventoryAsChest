var MAXX = 5;       // width
var MAXZ = 250;     // depth
var MAXY = 3;       // height
var EACH_PLAYER_FILE_COUNT = 5;

// Array Helper
Array.prototype.removeIf = function (target) {
	// 需要移除元素的索引集合
    let indexList = [];
    for (let i = 0; i < this.length; i++) {
        if (target(this[i]) === true) {
            indexList.unshift(i);
        }
    }
    // 倒着删
    for (let index of indexList) {
        this.splice(index, 1);
    }
    return indexList.length > 0;
};



function importInventory(basePlayerName, filesList, totalCount)
{
    filesList.sort();

    let done = false;
    for(let z=0; z<MAXZ; z++)
    {
        if(done) break;
        for(let y=MAXY-1; y>=0; y--)
        {
            if(done) break;
            for(let x=0; x<MAXX; x++)
            {
                let currentId = z*MAXX*MAXY + (MAXY-1-y)*MAXX + x;      // 前面已有z层，MAXY-1-Y行，x-1个
                if(currentId + 1 <= totalCount)
                {
                    let currentPlayerFiles = filesList.slice(currentId*EACH_PLAYER_FILE_COUNT, currentId*EACH_PLAYER_FILE_COUNT+5);
                    let tempList = currentPlayerFiles[0].split("-");
                    tempList.pop();
                    let currentPlayerName = (tempList.length == 1 ? tempList[0] : tempList.join('-'));

                    logger.info(`Processing player #${currentId} ${currentPlayerName}`);

                    // create chest
                    let mainChestPos = new IntPos(x*3, y, z*2+1, 0);
                    let enderChestPos = new IntPos(x*3+2, y, z*2+1, 0);
                    let signPos = new IntPos(x*3, y, z*2, 0);
                    logger.info(`Create chest id (${x},${y},${z})`);
                    // mc.runcmd(`execute as @p[name=${basePlayerName}] run setblock ~+${mainChestPos.x} ~+${mainChestPos.y} ~+${mainChestPos.z} chest`);
                    // mc.runcmd(`execute as @p[name=${basePlayerName}] run setblock ~+${mainChestPos.x+1} ~+${mainChestPos.y} ~+${mainChestPos.z} chest`);
                    // mc.runcmd(`execute as @p[name=${basePlayerName}] run setblock ~+${enderChestPos.x} ~+${enderChestPos.y} ~+${enderChestPos.z} chest`);
                    // mc.runcmd(`execute as @p[name=${basePlayerName}] run setblock ~+${signPos.x} ~+${signPos.y} ~+${signPos.z} birch_wall_sign ["facing_direction"=2]`);
                }
                else{
                    done = true;
                    break;
                }
            }
        }
    }
}

function main()
{
    mc.regConsoleCmd("importinv", "import inventories as chest", (args) => {
        logger.info("Import process started.");
        let filesList = File.getFilesList("plugins/ImportInventoryAsChest/saved");
        filesList.removeIf((fileName)=>{ return !fileName.endsWith(".nbt"); });    // 移除非数据文件
        let totalCount = filesList.length / EACH_PLAYER_FILE_COUNT;
        logger.info(`Total ${totalCount} players to import`);

        importInventory("bot-base", filesList, totalCount);

        // TODO:output player-position map
    });
}

main();