const NBT = require("parsenbt-js")
  , BlockLegacy = require("./Block.js");

class SubChunkStoragePaletted {
  /**
   * @param {Number} a 
   */
  static getMatchedBitLength(a) {
    if (a == 1) return 0;
    else if (a <= 2) return 1;
    else if (a <= 4) return 2;
    else if (a <= 8) return 3;
    else if (a <= 16) return 4;
    else if (a <= 32) return 5;
    else if (a <= 64) return 6;
    else if (a <= 128) return 7;
    else if (a <= 256) return 8;
    else return 16;
  }

  /**
   * Deserialize subchunk from db.
   * @param {Buffer} buf 
   * @returns {SubChunkStoragePaletted}
   */
  static deserialize(buf) {
    var result = new SubChunkStoragePaletted(), dataLength;
    result.version = buf.readUint32LE(0) & 0xFFFFFF;
    // Numerous tests have shown that this byte is bitDepth * 2
    result.bitDepth = buf.readUint8(3) >> 1;
    result.maxPaletteLength = 1 << result.bitDepth;

    dataLength = Math.ceil(4096 / Math.floor(32 / result.bitDepth)) * 4;
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
    var l = SubChunkStoragePaletted.getMatchedBitLength(a.maxPaletteLength + 1), m;
    if (l == 8) {
      m = SubChunkStoragePaletted.makePruned(a);
      if (m.bitDepth < a.bitDepth)
        return m
    }
    return SubChunkStoragePaletted.makeType(a, l);
  }

  /**
   * Remove not referenced element,
   * 
   * And keeps the original object.
   * @param {SubChunkStoragePaletted} a 
   * @returns {SubChunkStoragePaletted}
   */
  static makePruned(a) {
    var elementMask = new Uint8Array(a.maxPaletteLength >> 3 || 1)
      , n = Math.floor(32 / a.bitDepth)
      , o = n * a.bitDepth
      , m = (1 << a.bitDepth) - 1;

    // Get not referenced elements
    for (var i = 0; i < a.data.length; i++)
      for (var j = 0; j < o; j += a.bitDepth) {
        var k = (a.data[i] & (m << j)) >> j;
        elementMask[k >> 3] |= 1 << (k & 7);
      }

    for (var i = 0, j = 0; i < elementMask.byteLength * 8; i++)
      if (elementMask[i >> 3] & (1 << (i & 7)))
        j++;

    return SubChunkStoragePaletted.makeType(
      a,
      SubChunkStoragePaletted.getMatchedBitLength(j),
      elementMask
    );
  }

  /**
   * Convert subchunk to another palette length.
   * @param {SubChunkStoragePaletted} a 
   * @param {Number} bitDepth 
   * @param {Uint16Array} elementMask 
   * @returns {SubChunkStoragePaletted}
   */
  static makeType(a, bitDepth, elementMask) {
    var result = new SubChunkStoragePaletted(), dataLength
      , n1 = Math.floor(32 / a.bitDepth)
      , n2 = Math.floor(32 / bitDepth)
      , o = n1 * a.bitDepth
      , m1 = (1 << a.bitDepth) - 1
      , map = new Uint16Array(1 << a.bitDepth)
      , m2 = (1 << bitDepth) - 1;

    result.bitDepth = bitDepth;
    result.maxPaletteLength = 1 << bitDepth;
    result.version = a.version;
    dataLength = Math.ceil(4096 / Math.floor(32 / result.bitDepth));
    result.data = new Uint32Array(dataLength);
    result.palette = [];

    if (!elementMask)
      result.palette = a.palette.slice(0, result.maxPaletteLength);
    else {
      // Build mappings between pruned and before
      for (var i = 0; i < elementMask.byteLength * 8; i++)
        if (elementMask[i >> 3] & (1 << (i & 7))) {
          result.palette.push(a.palette[i]);
          map[i] = result.palette.length - 1;
        }
    }

    for (var i = 0, offset = 0, shift = 0; i < a.data.length; i++)
      for (var j = 0; j < o; j += a.bitDepth) {
        var k = (a.data[i] & (m1 << j)) >> j;
        elementMask && (k = map[k])
        result.data[offset] |= (k & m1 & m2) << shift * bitDepth;
        shift++;
        if (shift >= n2)
          shift = 0, offset++;
      }

    return result
  }

  /**
   * @param {*} placeholder 
   */
  constructor(placeholder) {
    this.version = 0xFC0109;
    this.data = new Uint32Array(0);
    this.bitDepth = 0;
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
    var n = Math.floor(32 / this.bitDepth)
      , shift = pos % n
      , offset = Math.floor(pos / n)
      , index = this.data[offset] >> shift * this.bitDepth & (1 << this.bitDepth) - 1;
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
      var n = Math.floor(32 / this.bitDepth)
        , shift = pos % n
        , offset = Math.floor(pos / n);
      this.data[offset] &= ~((1 << this.bitDepth) - 1 << shift * this.bitDepth);
      this.data[offset] |= i << shift * this.bitDepth;
      return true
    } else {
      // Not Found
      if (this.palette.length == this.maxPaletteLength)
        // Larger than max value
        return false;
      this.palette.push(element);
      var n = Math.floor(32 / this.bitDepth)
        , shift = pos % n
        , offset = Math.floor(pos / n);
      this.data[offset] &= ~((1 << this.bitDepth) - 1 << shift * this.bitDepth);
      this.data[offset] |= i << shift * this.bitDepth;
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
    a.writeUInt8(this.bitDepth << 1, 3);
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
    this.bitDepth = a.bitDepth;
    this.maxPaletteLength = a.maxPaletteLength;
    this.data = a.data;
    this.palette = a.palette;
    return this
  }

  /**
   * Remove not referenced element.
   * 
   * Directly perform the operation on subchunk.
   * @returns {SubChunkStoragePaletted}
   */
  makeExpanded() {
    var a = SubChunkStoragePaletted.makeExpanded(this);
    this.bitDepth = a.bitDepth;
    this.maxPaletteLength = a.maxPaletteLength;
    this.data = a.data;
    this.palette = a.palette;
    return this
  }
}

module.exports = SubChunkStoragePaletted;