const NBT = require("parsenbt-js")
  , BlockLegacy = require("./Block.js");

class SubChunkStoragePaletted {
  /**
   * Deserialize subchunk from db.
   * @param {Buffer} buf 
   * @returns {SubChunkStoragePaletted}
   */
  static deserialize(buf) {
    var result = new SubChunkStoragePaletted(), dataLength;
    result.version = buf.readUint32LE(0) & 0xFFFFFF;
    // Numerous tests have shown that this byte is bitsPerElement * 2
    result.bitsPerElement = buf.readUint8(3) >> 1;
    result.maxPaletteLength = 1 << result.bitsPerElement;

    dataLength = Math.ceil(4096 / Math.floor(32 / result.bitsPerElement)) * 4;
    result.data = new Uint32Array(Uint8Array.from(buf.subarray(4, 4 + dataLength)).buffer);
    result.palette = [];
    var palette = NBT.ReadSerial(Uint8Array.from(buf.subarray(8 + dataLength)).buffer, true);
    for (var p of palette)
      result.palette.push(BlockLegacy.deserialize(p));

    var paletteLength = buf.readUInt32LE(4 + dataLength);
    if (result.palette.length != paletteLength)
      throw new Error("Invalid palette length.");
    return result
  }

  /**
   * Expand subchunk.
   * @param {SubChunkStoragePaletted} a 
   * @returns {SubChunkStoragePaletted}
   */
  static makeExpanded(a) {

  }

  /**
   * Remove not referenced element,
   * 
   * And keeps the original object.
   * @param {SubChunkStoragePaletted} a 
   * @returns {SubChunkStoragePaletted}
   */
  static makePruned(a) {
    var result = new SubChunkStoragePaletted()
      , elementMask = new Uint8Array(a.maxPaletteLength >> 3)
      , n = Math.floor(32 / a.bitsPerElement)
      , o = n * a.bitsPerElement
      , m = (1 << a.bitsPerElement) - 1
      , map = new Uint16Array(1 << a.bitsPerElement);

    result.bitsPerElement = a.bitsPerElement;
    result.version = a.version;
    result.maxPaletteLength = a.maxPaletteLength;
    result.data = new Uint32Array(a.data.length);
    result.palette = [];

    // Get not refernced elements
    for (var i = 0; i < a.data.length; i++)
      for (var j = 0; j < o; j += a.bitsPerElement) {
        var k = (a.data[i] & (m << j)) >> j;
        elementMask[k >> 3] |= 1 << (k & 7);
      }

    // Build mappings between pruned and before
    for (var i = 0; i < elementMask.byteLength * 8; i++)
      if (elementMask[i >> 3] & (1 << (i & 7))) {
        result.palette.push(a.palette[i]);
        map[i] = result.palette.length - 1;
      }

    // Modify palette index
    for (var i = 0; i < a.data.length; i++)
      for (var j = 0; j < o; j += a.bitsPerElement) {
        var k = (a.data[i] & (m << j)) >> j;
        result.data[i] |= (map[k] & m) << j;
      }

    return result
  }

  /**
   * Convert subchunk to another palette length.
   * @param {SubChunkStoragePaletted} a 
   * @returns {SubChunkStoragePaletted}
   */
  static makeType(a, bitsPerElement) {
    var result = new SubChunkStoragePaletted();
    result.palette = [];
    result.bitsPerElement = bitsPerElement;
  }

  /**
   * @param {*} placeholder 
   */
  constructor(placeholder) {
    this.version = 0xFC0109;
    this.data = new Uint32Array(0);
    this.bitsPerElement = 0;
    this.palette = placeholder ? [placeholder] : [new BlockLegacy("minecraft:air")];
    this.maxPaletteLength = 1;
  }

  /**
   * Get an element.
   * 
   * Pos = x << 8 | z << 4 | y
   * @param {Number} pos - Packed pos with XZY format
   * @returns {*}
   */
  getElement(pos) {
    pos &= 0xFFF;
    var n = Math.floor(32 / this.bitsPerElement)
      , shift = pos % n
      , offset = Math.floor(pos / n)
      , index = this.data[offset] >> shift * this.bitsPerElement & (1 << this.bitsPerElement) - 1;
    return this.palette[index]
  }

  /**
   * Set an element.
   * 
   * Pos = x << 8 | z << 4 | y
   * @param {Number} pos - Packed pos with XZY format
   * @param {*} element - Packed pos with XZY format
   * @returns {Boolean} True if successfully set
   */
  setElement(pos, element) {
    // Try to find element in palette
    for (var i = 0; i < this.palette.length; i++)
      if (BlockLegacy.equalTo(this.palette[i], element))
        break;

    if (i < this.palette.length) {
      // Found
      var n = Math.floor(32 / this.bitsPerElement)
        , shift = pos % n
        , offset = Math.floor(pos / n);
      this.data[offset] &= ~((1 << this.bitsPerElement) - 1 << shift * this.bitsPerElement);
      this.data[offset] |= i << shift * this.bitsPerElement;
      return true
    } else {
      // Not Found
      if (this.palette.length == this.maxPaletteLength)
        // Larger than max value
        return false;
      this.palette.push(element);
      var n = Math.floor(32 / this.bitsPerElement)
        , shift = pos % n
        , offset = Math.floor(pos / n);
      this.data[offset] &= ~((1 << this.bitsPerElement) - 1 << shift * this.bitsPerElement);
      this.data[offset] |= i << shift * this.bitsPerElement;
      return true
    }
  }

  /**
   * Serialize a subchunk to buffer.
   * @returns {Buffer}
   */
  serialize() {
    var a = Buffer.alloc(4), b = Buffer.alloc(4), result;
    a.writeUInt32LE(this.version, 0);
    a.writeUInt8(this.bitsPerElement << 1, 3);
    b.writeUInt32LE(this.palette.length);
    result = Buffer.concat([a, Buffer.from(this.data.buffer), b]);
    for (var p of this.palette)
      result = Buffer.concat([result, p.serialize()]);
    return result
  }

  /**
   * Remove not referenced element.
   * 
   * Directly perform the operation on subchunk.
   * @returns {SubChunkStoragePaletted}
   */
  makePruned() {
    var a = SubChunkStoragePaletted.makePruned(this);
    this.data = a.data;
    this.palette = a.palette;
    return this
  }
}

module.exports = SubChunkStoragePaletted;