const BlockLegacy = require("./includes/Block.js");
const SubChunkStoragePaletted = require("./includes/SubChunkStoragePaletted.js")
  , fs = require("fs")

var a = SubChunkStoragePaletted.deserialize(fs.readFileSync("./chunk(0,0).dump"))
var c = new BlockLegacy("minecraft:tnt", 0), d = 0
var b = a.getElement(256 + 1)
while (a.setElement(0, c))
  c = new BlockLegacy("minecraft:tnt", d++)
console.log(a.getElement(0))
a.makePruned();
console.log(a.getElement(0))

fs.writeFileSync("./chunk(0,0).dump.1", a.serialize());