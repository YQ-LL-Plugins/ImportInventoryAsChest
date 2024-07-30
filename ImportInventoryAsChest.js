var MAXX = 5;       // width
var MAXZ = 250;     // depth
var MAXY = 3;       // height
var EACH_PLAYER_FILE_COUNT = 5;
var NBT_SAVED_PATH = "plugins/ImportInventoryAsChest/saved";

// Array Helper
Array.prototype.removeIf = function (target) {
	// Set of indexes of elements need to be removed
    let indexList = [];
    for (let i = 0; i < this.length; i++) {
        if (target(this[i]) === true) {
            indexList.unshift(i);
        }
    }
    // delete elements backwards
    for (let index of indexList) {
        this.splice(index, 1);
    }
    return indexList.length > 0;
};

function parseBinaryNbtFromFile(filePath)
{
    let f = new File(filePath, File.ReadMode, true);
    let inventoryNbt = NBT.parseBinaryNBT(f.readAllSync());
    f.close();
    return inventoryNbt;
}

function importInventory(basePlayerName, filesList, totalCount)
{
    filesList.sort();
    let pl = mc.getPlayer(basePlayerName);
    let playerPos = pl.feetPos;

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

                    logger.info(`Processing player #${currentId}: ${currentPlayerName}`);

                    let mainChestPos = new IntPos(playerPos.x+x*4, playerPos.y+y, playerPos.z+z*3+1, 0);
                    let enderChestPos = new IntPos(playerPos.x+x*4+2, playerPos.y+y, playerPos.z+z*3+1, 0);
                    let signPos = new IntPos(playerPos.x+x*4, playerPos.y+y, playerPos.z+z*3, 0);

                    // create chest
                    logger.info(`Create chest id (${x},${MAXY-1-y},${z})`);
                    mc.runcmd(`setblock ${mainChestPos.x} ${mainChestPos.y} ${mainChestPos.z} chest`);
                    mc.runcmd(`setblock ${mainChestPos.x+1} ${mainChestPos.y} ${mainChestPos.z} chest`);
                    mc.runcmd(`setblock ${enderChestPos.x} ${enderChestPos.y} ${enderChestPos.z} chest`);
                    mc.runcmd(`setblock ${signPos.x} ${signPos.y} ${signPos.z} birch_wall_sign ["facing_direction"=2]`);
                    
                    // edit sign
                    let signBlockEntity = mc.getBlock(signPos).getBlockEntity();
                    let signNbt = signBlockEntity.getNbt();
                    signNbt.setString("Text",`\n${currentPlayerName}\n(${x},${MAXY-1-y},${z})`);
                    signBlockEntity.setNbt(signNbt);

                    // import inventory to chest
                    logger.info(`Importing inventory...`);
                    let chestBlockEntity = mc.getBlock(mainChestPos).getBlockEntity();
                    let chestNbt = chestBlockEntity.getNbt();
                    let nbtFile = NBT_SAVED_PATH + "/" + currentPlayerName + "-Inventory.nbt";
                    let itemsList = parseBinaryNbtFromFile(nbtFile).getTag("Inventory");
                    let listSize = itemsList.getSize();
                    for(let index = 0; index < listSize; index++)
                    {
                        let itemCompound = itemsList.getTag(index);
                        if(itemCompound.getData("Count") == 0)
                            continue;       // empty slot
                        chestNbt.getTag("Items").addTag(itemCompound);
                    }
                    chestBlockEntity.setNbt(chestNbt);
                }
                else{
                    done = true;
                    break;
                }
            }
        }
    }
    logger.info(`Success. All work finished`);
}

function main()
{
    let filesList = File.getFilesList(NBT_SAVED_PATH);
    filesList.removeIf((fileName)=>{ return !fileName.endsWith(".nbt"); });    // Remove non-nbt-data files
    let totalCount = filesList.length / EACH_PLAYER_FILE_COUNT;
    logger.info(`Total ${totalCount} players to import`);

    mc.regConsoleCmd("importinv", "import inventories as chest", (args) => {
        logger.info("Import process started.");
        importInventory("bot-base", filesList, totalCount);
    });

    mc.regPlayerCmd("importinv", "import inventories as chest", (pl, args) => {
        logger.info("Import process started.");
        // importInventory(pl.realName, filesList, totalCount);
        importInventory("bot-base", filesList, totalCount);
    });

    // TODO:output player-position map
}

main();