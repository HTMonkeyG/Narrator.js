const { ChunkPos } = require("./Structs.js");

function getChunkMeta(buf) {
  var pos, type, index, dimension = 0
  if (buf.length < 9 || buf.length > 14)
    return false;
  pos = new ChunkPos(buf.readInt32LE(0), buf.readInt32LE(4));
  if (Math.abs(pos.x) > 1875000 || Math.abs(pos.z) > 1875000)
    return false;
  if (buf.length == 9)
    type = buf.readUInt8(8);
  if (buf.length == 10)
    type = buf.readUInt8(8), index = buf.readUInt8(9);
  if (buf.length == 13)
    dimension = buf.readUInt32LE(8), type = buf.readUInt8(12);
  if (buf.length == 14)
    dimension = buf.readUInt32LE(8), type = buf.readUInt8(12), index = buf.readUInt8(13);
  return { pos: pos, type: type, index: index, dimension: dimension }
}

function buildChunkMeta(meta) {
  var result = Buffer.alloc(14), offset = 0;
  result.writeInt32LE(meta.pos.x, (offset += 4) - 4);
  result.writeInt32LE(meta.pos.z, (offset += 4) - 4);
  if (meta.dimension)
    result.writeUInt32LE(meta.dimension, (offset += 4) - 4);
  result.writeUInt8(meta.type, (offset += 1) - 1);
  if (typeof meta.index != 'undefined')
    result.writeInt8(meta.index, (offset += 1) - 1);

  return result.subarray(0, offset);
}

function getStructureMeta(buf) {
  // structuretemplate_ prefix
  if (buf.length < 18) return false;
  var name = buf.toString();
  if (name.substring(0, 18) !== "structuretemplate_") return false;
  // Normal structure key won't have multiple colons
  var r = name.substring(18).split(":");
  if (r.length > 2) return false;
  return {
    namespace: r[0],
    name: r[1]
  }
}

exports.getChunkMeta = getChunkMeta;
exports.getStructureMeta = getStructureMeta;
exports.buildChunkMeta = buildChunkMeta;