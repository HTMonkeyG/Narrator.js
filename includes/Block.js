const NBT = require("parsenbt-js")
  , BlockState = require("./BlockState.js");

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
      for (var s of NBT.keys(snbt["comp>states"]))
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
    this.setValue(value || 0);
  }

  setState(key, value) {
    var support;
    if (BlockState[this.name] && typeof BlockState[this.name].support_value[key] != "undefined") {
      support = BlockState[this.name].support_value[key];
      if (support.indexOf(value) != -1) {
        this.states[key] = value;
        return true
      }
    }
    return false
  }

  setValue(val) {
    var v = "0b" + val.toString(2);
    if (BlockState[this.name])
      if (BlockState[this.name][v]) {
        this.val = 0;
        for (var s in BlockState[this.name][v])
          this.states[s] = BlockState[this.name][v][s];
      } else
        for (var s in BlockState[this.name].default)
          this.states[s] = BlockState[this.name].default[s];
    else
      this.val = val
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