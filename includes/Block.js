const NBT = require("parsenbt-js");

class BlockLegacy {
  static deserialize(snbt) {
    var result = new BlockLegacy(), states = {};
    if (snbt["comp>"])
      snbt = snbt["comp>"];
    else
      return result;

    result.name = snbt["str>name"];
    result.val = snbt["i16>val"];
    result.version = snbt["i32>version"];
    if (snbt["comp>states"])
      for (var s in snbt["comp>states"])
        states[s.replace(/.*>/, "")] = snbt["comp>states"][s];
    result.states = states;
    return result
  }

  static equalTo(a, b) {
    if (a.version != b.version
      || a.name != b.name
      || a.val != b.val
    ) return false;

    for (var s in a.states)
      if (a.states[s] != b.states[s])
        return false;

    return true
  }

  /**
   * @param {String} name - Block ID
   * @param {Number} value - Data value
   */
  constructor(name, value) {
    this.version = 18090528;
    this.name = name;
    this.val = value & 0xF;
    this.states = {};
  }

  nbtify() {
    var states = {};
    for (var s in this.states)
      states["i8>" + s] = this.states[s];
    return {
      "comp>": {
        "str>name": this.name,
        "i16>val": this.val,
        "i32>version": this.version,
        "comp>states": states
      }
    }
  }

  serialize() {
    return Buffer.from(NBT.Writer(this.nbtify(), true))
  }
}

module.exports = BlockLegacy;