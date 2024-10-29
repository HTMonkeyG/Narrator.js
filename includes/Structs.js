class SubChunkBlockPos {
  static fromPacked(packedPos) {
    packedPos &= 0xFFF;
    return new SubChunkBlockPos(packedPos >> 8, packedPos & 0xF, packedPos >> 4 & 0xF)
  }

  constructor(x, y, z) {
    this.x = x & 0xF;
    this.y = y & 0xF;
    this.z = z & 0xF;
  }

  toPacked() {
    return this.x << 8 | this.z << 4 | this.y
  }
}

class ChunkPos {
  static fromBlockPos(blockPos) {
    return new ChunkPos(blockPos.x >> 4, blockPos.z >> 4)
  }

  static copy(chunkPos) {
    return new ChunkPos(chunkPos.x, chunkPos.z)
  }

  constructor(x, z) {
    this.x = x;
    this.z = z
  }

  isWithinBounds(a2, a3) {
    if (this.x >= a2.x && this.x <= a3.x)
      if (this.z >= a2.z && this.z <= a3.z)
        return true

    return false;
  }

  toString() {
    return `[ChunkPos ${this.x}, ${this.z}]`
  }
}

class ChunkBlockPos {
  constructor(x, y, z) {
    this.x = x & 0xF;
    this.y = y | 0;
    this.z = z & 0xF;
  }

  toPos() {
    return new BlockPos(this.x, this.y, this.z)
  }

  toString() {
    return `[ChunkBlockPos ${this.x}, ${this.y}, ${this.z}]`
  }
}

class BlockPos {
  static fromChunkBlockPos(chunkPos, chunkBlockPos, yBias) {
    return new BlockPos(
      chunkBlockPos.x + 16 * chunkPos.x,
      yBias + chunkBlockPos.y,
      chunkBlockPos.z + 16 * chunkPos.z
    )
  }

  static copy(blockPos) {
    return new BlockPos(blockPos.x, blockPos.y, blockPos.z)
  }

  constructor(x, y, z) {
    this.x = x | 0;
    this.y = y | 0;
    this.z = z | 0;
  }

  relative(direction, offset) {
    var result = BlockPos.copy(this);
    switch (direction) {
      case 0:
        result.y -= offset;
        break;
      case 1:
        result.y += offset;
        break;
      case 2:
        result.z -= offset;
        break;
      case 3:
        result.z += offset;
        break;
      case 4:
        result.x -= offset;
        break;
      case 5:
        result.x += offset;
        break;
    }
    return result;
  }
}

exports.SubChunkBlockPos = SubChunkBlockPos;
exports.ChunkBlockPos = ChunkBlockPos;
exports.ChunkPos = ChunkPos;
exports.BlockPos = BlockPos;