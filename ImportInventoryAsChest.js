var MAXX = 5;       // width
var MAXZ = 250;     // depth (increase direction)
var MAXY = 3;       // height
var EACH_PLAYER_FILE_COUNT = 5;
var NBT_SAVED_PATH = "plugins/ImportInventoryAsChest/saved";
var PLAYER_POS_MAP_OUTPUT = "plugins/ImportInventoryAsChest/player_pos_map.txt"
var ARMOR_START_SLOT = 0
var OFFHAND_START_SLOT = 9


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
                let currentId = z*MAXX*MAXY + (MAXY-1-y)*MAXX + x;      // there are already z layers, MAXY-1-Y rows and x-1 chests before
                if(currentId + 1 <= totalCount)
                {
                    let currentPlayerFiles = filesList.slice(currentId*EACH_PLAYER_FILE_COUNT, currentId*EACH_PLAYER_FILE_COUNT+5);
                    let tempList = currentPlayerFiles[0].split("-");
                    tempList.pop();
                    let currentPlayerName = (tempList.length == 1 ? tempList[0] : tempList.join('-'));

                    logger.info(`Processing player #${currentId}: ${currentPlayerName}`);

                    let mainChestPos = new IntPos(playerPos.x+x*4, playerPos.y+y, playerPos.z+z*3+1, 0);
                    let mainChest2Pos = new IntPos(playerPos.x+x*4+1, playerPos.y+y, playerPos.z+z*3+1, 0);
                    let enderChestPos = new IntPos(playerPos.x+x*4+2, playerPos.y+y, playerPos.z+z*3+1, 0);
                    let signPos = new IntPos(playerPos.x+x*4, playerPos.y+y, playerPos.z+z*3, 0);

                    // create chest
                    logger.info(`Create chest id (${x},${MAXY-1-y},${z})`);
                    mc.runcmd(`setblock ${mainChestPos.x} ${mainChestPos.y} ${mainChestPos.z} chest`);
                    mc.runcmd(`setblock ${mainChest2Pos.x} ${mainChest2Pos.y} ${mainChest2Pos.z} chest`);
                    mc.runcmd(`setblock ${enderChestPos.x} ${enderChestPos.y} ${enderChestPos.z} chest`);
                    mc.runcmd(`setblock ${signPos.x} ${signPos.y} ${signPos.z} birch_wall_sign ["facing_direction"=2]`);
                    File.writeLine(PLAYER_POS_MAP_OUTPUT, `${currentPlayerName}:\t(${x},${MAXY-1-y},${z})`)      // record to file

                    // edit sign
                    let signBlockEntity = mc.getBlock(signPos).getBlockEntity();
                    let signNbt = signBlockEntity.getNbt();
                    signNbt.setString("Text",`\n${currentPlayerName}\n(${x},${MAXY-1-y},${z})`);
                    signBlockEntity.setNbt(signNbt);

                    // import armor to chest
                    logger.info(`Importing armor...`);
                    let mainChest2BlockEntity = mc.getBlock(mainChest2Pos).getBlockEntity();
                    let mainChest2Nbt = mainChest2BlockEntity.getNbt();
                    let nbtFile = NBT_SAVED_PATH + "/" + currentPlayerName + "-Armor.nbt";
                    let itemsList = parseBinaryNbtFromFile(nbtFile).getTag("Armor");
                    let listSize = itemsList.getSize();
                    for(let index = 0; index < listSize; index++)
                    {
                        let itemCompound = itemsList.getTag(index);
                        if(itemCompound.getData("Count") == 0)
                            continue;       // empty slot
                        itemCompound.setByte("Slot", ARMOR_START_SLOT + index);
                        mainChest2Nbt.getTag("Items").addTag(itemCompound);
                    }
                    mainChest2BlockEntity.setNbt(mainChest2Nbt);

                    // import offhand to chest
                    logger.info(`Importing offhand...`);
                    mainChest2Nbt = mainChest2BlockEntity.getNbt();
                    nbtFile = NBT_SAVED_PATH + "/" + currentPlayerName + "-Offhand.nbt";
                    itemsList = parseBinaryNbtFromFile(nbtFile).getTag("Offhand");
                    listSize = itemsList.getSize();
                    for(let index = 0; index < listSize; index++)
                    {
                        let itemCompound = itemsList.getTag(index);
                        if(itemCompound.getData("Count") == 0)
                            continue;       // empty slot
                        itemCompound.setByte("Slot", OFFHAND_START_SLOT + index);
                        mainChest2Nbt.getTag("Items").addTag(itemCompound);
                    }
                    mainChest2BlockEntity.setNbt(mainChest2Nbt);

                    // import inventory to chest
                    logger.info(`Importing inventory...`);
                    let mainChestBlockEntity = mc.getBlock(mainChestPos).getBlockEntity();
                    let mainChestNbt = mainChestBlockEntity.getNbt();
                    nbtFile = NBT_SAVED_PATH + "/" + currentPlayerName + "-Inventory.nbt";
                    itemsList = parseBinaryNbtFromFile(nbtFile).getTag("Inventory");
                    listSize = itemsList.getSize();
                    for(let index = 0; index < listSize; index++)
                    {
                        let itemCompound = itemsList.getTag(index);
                        if(itemCompound.getData("Count") == 0)
                            continue;       // empty slot
                        mainChestNbt.getTag("Items").addTag(itemCompound);
                    }
                    mainChestBlockEntity.setNbt(mainChestNbt);

                    // import enderchest to chest
                    logger.info(`Importing enderchest...`);
                    let enderChestBlockEntity = mc.getBlock(enderChestPos).getBlockEntity();
                    let enderChestNbt = enderChestBlockEntity.getNbt();
                    nbtFile = NBT_SAVED_PATH + "/" + currentPlayerName + "-EndChest.nbt";
                    itemsList = parseBinaryNbtFromFile(nbtFile).getTag("EnderChestInventory");
                    listSize = itemsList.getSize();
                    for(let index = 0; index < listSize; index++)
                    {
                        let itemCompound = itemsList.getTag(index);
                        if(itemCompound.getData("Count") == 0)
                            continue;       // empty slot
                        enderChestNbt.getTag("Items").addTag(itemCompound);
                    }
                    enderChestBlockEntity.setNbt(enderChestNbt);
                }
                else{
                    done = true;
                    break;
                }
            }
        }
    }
    logger.info(`Success. All work finished`);
    logger.info(`Player-Pos map has been exported to ${PLAYER_POS_MAP_OUTPUT}`)
}

function main()
{
    let filesList = File.getFilesList(NBT_SAVED_PATH);
    filesList.removeIf((fileName)=>{ return !fileName.endsWith(".nbt"); });    // Remove non-nbt-data files
    let totalCount = filesList.length / EACH_PLAYER_FILE_COUNT;
    logger.info(`Total ${totalCount} players to import`);

    mc.regPlayerCmd("importinv", "import inventories as chest", (pl, args) => {
        logger.info("Import process started.");
        importInventory(pl.realName, filesList, totalCount);
    });
}

main();