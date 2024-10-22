class Chunk {
  static async deserialize(db, pos, dimension) {

  }

  static async serialize(db, chunk) {

  }

  constructor() {
    this.pos = {
      x: 0,
      x: 0
    };
    this.subChunk = [];
    this.blockEntity = [];
    this.entity = [];
    this.dimensionId = 0;
    this.minHeight = 0;
    this.height = 0;
  }
}