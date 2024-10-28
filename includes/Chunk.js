const { LevelDB } = require("leveldb-zlib")
  , { getChunkMeta, buildChunkMeta } = require("./ChunkKey.js")
  , SubChunkStoragePaletted = require("./SubChunkStoragePaletted.js")
  , Dimension = require("./Dimension.js");
const BlockLegacy = require("./Block.js");
const { SubChunkBlockPos } = require("./Structs.js");

class Chunk {
  static async deserialize(db, pos, dimension) {
    var d, result = new Chunk(), flag;

    if (typeof dimension != 'number' || dimension < 0)
      throw new Error("Param dimension must be a number >= 0");

    result.dimensionId = dimension;
    d = Dimension[dimension] || Dimension[0];
    if (d) {
      result.minHeight = d.minHeight;
      result.height = d.height;
    }

    result.pos.x = pos.x;
    result.pos.z = pos.z;

    // Deserialize subchunks
    for (var i = result.minHeight >> 4, max = result.height + result.minHeight; i < max >> 4; i++) {
      var m = buildChunkMeta({
        pos: [pos.x, pos.z],
        type: 0x2f,
        index: i,
        dimension: dimension
      }), d = await db.get(m);

      result.subChunk.push(
        d && d.length ? SubChunkStoragePaletted.deserialize(d) :
          new SubChunkStoragePaletted(new BlockLegacy("minecraft:air"))
      );
    }

    return result
  }

  constructor() {
    this.pos = {
      x: 0,
      z: 0
    };
    this.subChunk = [];
    this.blockEntity = [];
    this.entity = [];
    this.dimensionId = 0;
    this.minHeight = 0;
    this.height = 0;
  }

  /**
   * Write chunk into db
   * @param {LevelDB} db 
   */
  async serialize(db) {
    // Serialize subchunk
    for (var i = 0, j = this.minHeight; i < this.subChunk.length; i++, j += 16) {
      await db.put(buildChunkMeta({
        pos: [this.pos.x, this.pos.z],
        type: 0x2f,
        index: j >> 4,
        dimension: this.dimensionId
      }), this.subChunk[i].serialize())
    }
  }

  /**
   * Set a block in chunk
   * @param {*} pos 
   * @param {*} block 
   */
  setBlock(pos, block) {
    if (pos.y >= this.minHeight + this.height || pos.y < this.minHeight)
      return false;

    var i = (pos.y - this.minHeight) >> 4
      , subChunk = this.subChunk[i]
      , subChunkPos = new SubChunkBlockPos(pos.x, (pos.y - this.minHeight) % 16, pos.z);

    if (subChunk.setElement(subChunkPos.toPacked(), block))
      return true;
    else {
      subChunk.makeExpanded();
      if (subChunk.setElement(subChunkPos.toPacked(), block))
        return true;
    }

    return false
  }
}

module.exports = Chunk;