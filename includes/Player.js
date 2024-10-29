const NBT = require("parsenbt-js");

class Player {
  static deserialize(buf) {
    var snbt = NBT.Reader(buf, true, true);
  }
}