function toArrayBuffer(buf) {
  return Uint8Array.from(buf).buffer;
}

exports.toArrayBuffer = toArrayBuffer;