const BlockLegacy = require("./includes/Block.js");
const SubChunkStoragePaletted = require("./includes/SubChunkStoragePaletted.js")
  , fs = require("fs")

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

fs.writeFileSync("./chunk(0,0).dump.1", a.serialize());