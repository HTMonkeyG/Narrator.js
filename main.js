const { LevelDB } = require('leveldb-zlib')
  , fs = require("fs")
  , pl = require("path")
  , NBT = require('parsenbt-js')
  , QuickLRU = require("lru.min")
  , WorldMeta = require('./includes/WorldMeta.js')
  , Chunk = require('./includes/Chunk.js')
  , { getStructureMeta, buildChunkMeta, getChunkMeta } = require('./includes/ChunkKey.js')
  , { ChunkPos } = require('./includes/Structs.js');

const defaultOpt = {
  /** Create db if missing. */
  createIfMissing: false,
  /** 
   * Create a new chunk when target chunk is not loaded in db. 
   * 
   * Only affects loadChunk()
   */
  forceLoadChunk: false,
  /** 
   * What to do when encountered unloaded chunk in batch
   * operations.
   * 
   * 0: Abort operation.
   * 
   * 1: Ignore unloaded chunk.
   * 
   * 2: Create an empty chunk.
   */
  unloadedChunkHandler: 0,
  /** Limit volume of the fill region. */
  maxFillBlockLimit: 65536,
  /** Max chunk cache size. */
  maxChunkCacheSize: 2048
};

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
    this.options = Object.assign({}, defaultOpt, options);
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

    for (var chunk of this.chunkCache.values())
      await this.writeChunk(chunk)

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
   * Check if the chunk exists in db.
   * @param {ChunkPos} pos 
   * @param {Number} dimension 
   * @returns 
   */
  async chunkExists(pos, dimension) {
    var iter = this.db.getIterator(), testMeta, testData;
    iter.seek(buildChunkMeta({
      pos: pos,
      type: 0,
      dimension: dimension
    }));
    testMeta = getChunkMeta((await iter.next())[1]);
    if (!testMeta || testMeta.pos.x != pos.x || testMeta.pos.z != pos.z)
      return false;
  }

  /**
   * Try to load a chunk from db.
   * @param {ChunkPos} pos 
   * @param {Number} dimension 
   * @returns 
   */
  async loadChunk(pos, dimension) {
    var k = toChunkHash(dimension, pos);
    // Try to get chunk from cache
    if (this.chunkCache.has(k))
      return this.chunkCache.get(k);

    return this.reloadChunk(dimension, pos)
  }

  /**
   * Write a chunk to db.
   * @param {Chunk} chunk 
   * @returns 
   */
  async writeChunk(chunk) {
    if (!chunk || !chunk.serialize)
      return false;
    return await chunk.serialize(this.db)
  }

  /**
   * Delete a chunk of db and memory.
   * 
   * This operation will remove all the data of target chunk
   * and can't be restored.
   * 
   * Deleted chunk should not be used again.
   * @param {ChunkPos} pos 
   * @param {Number} dimension 
   * @returns 
   */
  async deleteChunk(pos, dimension) {
    var k = toChunkHash(dimension, pos);
    if (this.chunkCache.has(k))
      this.chunkCache.delete(k);

    var iter = this.db.getIterator(), testMeta, testData;
    iter.seek(buildChunkMeta({
      pos: pos,
      type: 0,
      dimension: dimension
    }));
    testData = await iter.next();
    testMeta = getChunkMeta(testData[1]);
    if (!testMeta || testMeta.pos.x != pos.x || testMeta.pos.z != pos.z)
      return false;

    // Delete all the keys of target chunk
    for (; testMeta && testMeta.pos.x == pos.x || testMeta.pos.z == pos.z
      ; testData = await iter.next(), testMeta = getChunkMeta(testData[1]))
      this.db.delete(testData[1]);

    return true
  }

  /**
   * Reload chunk from db.
   * @param {ChunkPos} pos 
   * @param {Number} dimension 
   * @returns 
   */
  async reloadChunk(dimension, pos) {
    // Load chunk from db
    var c = await Chunk.deserialize(this.db, pos, dimension);
    if (!c && !this.options.forceLoadChunk)
      return null
    else if (!c && this.options.forceLoadChunk)
      c = Chunk.create();

    this.chunkCache.set(k, c);
    return c
  }

  /**
   * Execute a in-game command.
   * @param {String} command 
   */
  async execute(command) { }

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

  async fill(dimension, pos1, pos2, block) {

  }
}

module.exports = Narrator;