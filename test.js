const BlockLegacy = require("./includes/Block.js")
  , SubChunkStoragePaletted = require("./includes/SubChunkStoragePaletted.js")
  , fs = require("fs")
  , { LevelDB } = require("leveldb-zlib")
  , { getChunkMeta } = require("./includes/ChunkKey.js");

async function main() {
  var pathToDb = "C:\\Users\\32543\\Desktop\\structTest_Dec\\db";
  const db = new LevelDB(pathToDb, { createIfMissing: false });
  await db.open();
  for await (let a of db) {
    var t = getChunkMeta(a[0])
    if (t.type == 0x2f && t.pos[0] == 0 && t.pos[1] == 0) {
      var chunk = SubChunkStoragePaletted.deserialize(a[1]);
      chunk.setElement(0xFFF, new BlockLegacy("minecraft:obsidian"));
      await db.put(a[0], chunk.serialize());
      break;
    }
  }
  await db.close();
}

main();

/*
var a = SubChunkStoragePaletted.deserialize(fs.readFileSync("./chunk(0,0).dump"))
var c = new BlockLegacy("minecraft:tnt", 0), d = 0
var b = a.getElement(256 + 1)
while (a.setElement(0, c))
  c = new BlockLegacy("minecraft:tnt", d++)
console.log(a.getElement(0));
b = SubChunkStoragePaletted.makeExpanded(a);
console.log(b.getElement(0));
c = SubChunkStoragePaletted.makePruned(b);
console.log(c.getElement(0));

for (var i = 0; i < 4096; i++)
  console.assert(a.getElement(i) == b.getElement(i) && c.getElement(i) == b.getElement(i))

fs.writeFileSync("./chunk(0,0).dump.1", a.serialize());*/