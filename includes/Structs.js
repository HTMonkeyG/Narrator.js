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

exports.SubChunkBlockPos = SubChunkBlockPos;
exports.ChunkBlockPos = ChunkBlockPos;