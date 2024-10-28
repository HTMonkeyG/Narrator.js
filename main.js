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
  /**
   * @param {*} path - Path to archive
   * @param {*} options - Initial options
   */
  constructor(path, options) {
    this.db = null;
    this.isOpen = false;
    this.worldMeta = null;
    this.path = path;
    this.options = options || {
      createIfMissing: false,
      forceLoadChunk: false,
      maxFillBlockLimit: 65536,
      maxChunkCacheSize: 2048
    };
    this.chunkCache = QuickLRU.createLRU({
      max: this.options.maxChunkCacheSize,
      onEviction: (function (a, b) {
        this.writeChunk(b)
      }).bind(this)
    });
    this.levelName = "";
    this.structures = new Map();
    this.players = new Map();
  }

  /**
   * Open the MCBE archive.
   */
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

  /**
   * Write the MCBE archive, and clear cached data.
   */
  async close() {
    fs.writeFileSync(pl.join(this.path, "level.dat"), this.worldMeta.serialize());
    fs.writeFileSync(pl.join(this.path, "levelname.txt"), this.levelName);

    for (var chunk of this.chunkCache.values()) {
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

  /**
   * Try to load a chunk from db
   * @param {*} dimension 
   * @param {*} pos 
   * @returns 
   */
  async loadChunk(dimension, pos) {
    var k = toChunkHash(dimension, pos), c;
    if (this.chunkCache.has(k))
      return this.chunkCache.get(k);

    c = await Chunk.deserialize(this.db, pos, dimension);
    if (!c && !this.options.forceLoadChunk)
      return null
    else if (!c && this.options.forceLoadChunk)
      c = Chunk.create();

    this.chunkCache.set(k, c);
    return c
  }

  /**
   * Write a chunk to db.
   * @param {Chunk} chunk 
   * @returns 
   */
  async writeChunk(chunk) {
    return await chunk.serialize(this.db)
  }

  /**
   * Delete a chunk of db and memory.
   * 
   * This operation will remove all the data of target chunk
   * and can't be restored.
   * @param {*} dimension 
   * @param {*} pos 
   * @returns 
   */
  async deleteChunk(dimension, pos) {
    var k = toChunkHash(dimension, pos);
    if (this.chunkCache.has(k))
      this.chunkCache.delete(k);
  }

  async execute(command) {

  }

  async setContext() {

  }

  /**
   * Place a block in world
   * @param {Number} dimension
   * @param {*} pos 
   * @param {*} block 
   */
  async setBlock(dimension, pos, block) {

  }
}

module.exports = Narrator;