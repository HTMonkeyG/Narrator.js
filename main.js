const { LevelDB } = require('leveldb-zlib')
  , fs = require("fs")
  , pl = require("path")
  , NBT = require('parsenbt-js')
  , QuickLRU = require("lru.min")
  , WorldMeta = require('./includes/WorldMeta')
  , Chunk = require('./includes/Chunk.js')
  , { getStructureMeta } = require('./includes/ChunkKey');

function toChunkHash(dimension, pos) {
  return dimension + "$" + pos.x + "//" + pos.z
}

class Narrator {
  constructor(path, options) {
    this.db = null;
    this.isOpen = false;
    this.worldMeta = null;
    this.options = options || { createIfMissing: false };
    this.path = path;
    this.chunkCache = QuickLRU.createLRU({ max: 2048, onEviction: _ => _ });
    this.levelName = "";
    this.structures = new Map();
    this.players = new Map();
  }

  async open() {
    if (this.isOpen)
      return;

    this.db = new LevelDB(pl.join(this.path, "db"), this.options);
    this.worldMeta = WorldMeta.deserialize(fs.readFileSync(pl.join(this.path, "level.dat")));
    this.levelName = fs.readFileSync(pl.join(this.path, "levelname.txt"), 'utf-8');

    await this.db.open();

    for await (var kv of this.db) {
      var meta = getStructureMeta(kv);
      if (meta)
        this.structures.set(meta.namespace + ":" + meta.name, NBT.Reader(kv[1], true, true));
    }

    this.isOpen = true;
  }

  async close() {
    //fs.writeFileSync(pl.join(this.path, "level.dat"), this.worldMeta.serialize());
    //fs.writeFileSync(pl.join(this.path, "levelname.txt"), this.levelName);

    for(var chunk of this.chunkCache.values()) {
      await this.writeChunk(chunk)
    }

    await this.db.close();

    this.db = null;
    this.worldMeta = null;
    this.chunkCache.clear();
    this.levelName = "";
    this.structures = new Map();
    this.players = new Map();
    this.isOpen = false;
  }

  async loadChunk(dimension, pos) {
    var k = toChunkHash(dimension, pos), c;
    if (this.chunkCache.has(k))
      return this.chunkCache.get(k);

    c = await Chunk.deserialize(this.db, pos, dimension);
    this.chunkCache.set(k, c);
    return c
  }

  async writeChunk(chunk) {
    return await chunk.serialize(this.db)
  }

  async execute(command) {

  }
}

module.exports = Narrator;