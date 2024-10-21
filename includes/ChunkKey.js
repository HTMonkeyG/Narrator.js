function getChunkMeta(buf) {
  if (buf.length < 9) return false;
  var pos = [buf.readInt32LE(0), buf.readInt32LE(4)];
  if (Math.abs(pos[0]) > 1875000 || Math.abs(pos[1]) > 1875000) return false;
  var type, index, dimension = 0;
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