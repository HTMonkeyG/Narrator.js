const { LevelDB } = require('leveldb-zlib')
  , fs = require("fs")
  , NBT = require('parsenbt-js');

class Narrator {
  constructor() {
    this.db = null;
  }

  async open(path, options) {
    this.db = new LevelDB(path, options);
    await this.db.open();
  }

  async close() {
    await db.close()
  }

  async readChunk(pos) {

  }
}