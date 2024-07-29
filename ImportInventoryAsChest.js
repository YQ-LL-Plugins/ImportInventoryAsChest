var MAXX = 5;
var MAXZ = 6;
var MAXY = 250;     //堆叠
var EACH_PLAYER_FILE_COUNT = 5;


function importInventory(basePlayerName, filesList, totalCount)
{
    filesList.sort();

    let done = false;
    for(let y=0; y<=MAXY; y++)
    {
        if(done) break;
        for(let z=0; z<=MAXX; z++)
        {
            if(done) break;
            for(let x=0; x<=MAXZ; x++)
            {
                let currentId = y*MAXX*MAXZ + z*MAXX + x;
                if(currentId + 1 <= totalCount)
                {
                    let currentPlayerFiles = filesList.splice(currentId*EACH_PLAYER_FILE_COUNT, currentId*EACH_PLAYER_FILE_COUNT+5);
                    let tempList = currentPlayerFiles[0].split("-");
                    tempList.pop();
                    let currentPlayerName = (tempList.length == 1 ? tempList[0] : tempList.join('-'));

                    logger.info(`Processing player #${currentId} ${currentPlayerName}`);

                    // create chest
                    let mainChestPos = new IntPos(x*3, y, z*2+1, 0);
                    let enderChestPos = new IntPos(x*3+2, y, z*2+1, 0);
                    let signPos = new IntPos(x*3, y, z*2, 0);
                    logger.info(`Create chest id (${x},${y},${z})`);
                    mc.runcmd(`execute as @p[name=${basePlayerName}] run setblock ~+${mainChestPos.x} ~+${mainChestPos.y} ~+${mainChestPos.z} chest`);
                    mc.runcmd(`execute as @p[name=${basePlayerName}] run setblock ~+${mainChestPos.x+1} ~+${mainChestPos.y} ~+${mainChestPos.z} chest`);
                    mc.runcmd(`execute as @p[name=${basePlayerName}] run setblock ~+${enderChestPos.x} ~+${enderChestPos.y} ~+${enderChestPos.z} chest`);
                    mc.runcmd(`execute as @p[name=${basePlayerName}] run setblock ~+${signPos.x} ~+${signPos.y} ~+${signPos.z} birch_wall_sign ["facing_direction"=2]`);
                
                    //TODO: change to 墙面
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
        let totalCount = filesList.length / EACH_PLAYER_FILE_COUNT;
        logger.info(`Total ${totalCount} players to import`);

        importInventory("bot-base", filesList, totalCount);

        // TODO:output player-position map
    });
}

main();