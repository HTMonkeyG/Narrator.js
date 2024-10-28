const NBT = require("parsenbt-js")
  , { toArrayBuffer } = require("./Utils.js");

function createDefault() {
  var e = Object.getPrototypeOf(NBT.create());
  return {
    __proto__: e,
    "comp>": {
      __proto__: e,
      "str>BiomeOverride": "",
      "i8>CenterMapsToOrigin": 0,
      "i8>ConfirmedPlatformLockedContent": 0,
      "i32>Difficulty": 1,
      "str>FlatWorldLayers": "{\"biome_id\":1,\"block_layers\":[{\"block_name\":\"minecraft:bedrock\",\"count\":1},{\"block_name\":\"minecraft:dirt\",\"count\":2},{\"block_name\":\"minecraft:grass\",\"count\":1}],\"encoding_version\":6,\"structure_options\":null,\"world_version\":\"version.post_1_18\"}\n",
      "i8>ForceGameType": 0,
      "i32>GameType": 1,
      "i32>Generator": 2,
      "str>InventoryVersion": "1.20.10",
      "i8>LANBroadcast": 1,
      "i8>LANBroadcastIntent": 1,
      "i64>LastPlayed": 0n,
      "str>LevelName": "",
      "i32>LimitedWorldOriginX": 0,
      "i32>LimitedWorldOriginY": 0,
      "i32>LimitedWorldOriginZ": 0,
      "list>MinimumCompatibleClientVersion": [
        "i32",
        1,
        20,
        10,
        0,
        0
      ],
      "i8>MultiplayerGame": 1,
      "i8>MultiplayerGameIntent": 1,
      "i32>NetherScale": 8,
      "i32>NetworkVersion": 594,
      "i32>Platform": 2,
      "i32>PlatformBroadcastIntent": 3,
      "i64>RandomSeed": 0n,
      "i8>SpawnV1Villagers": 0,
      "i32>SpawnX": 0,
      "i32>SpawnY": 32767,
      "i32>SpawnZ": 0,
      "i32>StorageVersion": 10,
      "i64>Time": 0n,
      "i32>WorldVersion": 1,
      "i32>XBLBroadcastIntent": 3,
      "comp>abilities": {
        __proto__: e,
        "i8>attackmobs": 0,
        "i8>attackplayers": 0,
        "i8>build": 1,
        "i8>doorsandswitches": 0,
        "f32>flySpeed": 0.05000000074505806,
        "i8>flying": 0,
        "i8>instabuild": 0,
        "i8>invulnerable": 0,
        "i8>lightning": 0,
        "i8>mayfly": 0,
        "i8>mine": 1,
        "i8>op": 0,
        "i8>opencontainers": 0,
        "i8>teleport": 0,
        "f32>walkSpeed": 0.10000000149011612
      },
      "i8>bonusChestEnabled": 0,
      "i8>bonusChestSpawned": 0,
      "i8>cheatsEnabled": 0,
      "i8>commandblockoutput": 1,
      "i8>commandblocksenabled": 1,
      "i8>commandsEnabled": 1,
      "i64>currentTick": 0n,
      "i32>daylightCycle": 0,
      "i8>dodaylightcycle": 1,
      "i8>doentitydrops": 1,
      "i8>dofiretick": 1,
      "i8>doimmediaterespawn": 0,
      "i8>doinsomnia": 1,
      "i8>domobloot": 1,
      "i8>domobspawning": 1,
      "i8>dotiledrops": 1,
      "i8>doweathercycle": 1,
      "i8>drowningdamage": 1,
      "i32>eduOffer": 0,
      "i8>educationFeaturesEnabled": 0,
      "comp>experiments": {
        __proto__: e,
        "i8>experiments_ever_used": 0,
        "i8>saved_with_toggled_experiments": 0
      },
      "i8>falldamage": 1,
      "i8>firedamage": 1,
      "i8>freezedamage": 1,
      "i32>functioncommandlimit": 10000,
      "i8>hasBeenLoadedInCreative": 1,
      "i8>hasLockedBehaviorPack": 0,
      "i8>hasLockedResourcePack": 0,
      "i8>immutableWorld": 0,
      "i8>isCreatedInEditor": 0,
      "i8>isExportedFromEditor": 0,
      "i8>isFromLockedTemplate": 0,
      "i8>isFromWorldTemplate": 0,
      "i8>isRandomSeedAllowed": 0,
      "i8>isSingleUseWorld": 0,
      "i8>isWorldTemplateOptionLocked": 0,
      "i8>keepinventory": 0,
      "list>lastOpenedWithVersion": [
        "i32",
        1,
        20,
        11,
        0,
        0
      ],
      "f32>lightningLevel": 0,
      "i32>lightningTime": 0,
      "i32>limitedWorldDepth": 16,
      "i32>limitedWorldWidth": 16,
      "i32>maxcommandchainlength": 65535,
      "i8>mobgriefing": 1,
      "i8>naturalregeneration": 1,
      "i8>neteaseEncryptFlag": 0,
      "list>neteaseStrongholdSelectedChunks": [
        "null"
      ],
      "i32>permissionsLevel": 0,
      "i32>playerPermissionsLevel": 1,
      "str>prid": "",
      "i8>pvp": 1,
      "f32>rainLevel": 1,
      "i32>rainTime": 0,
      "i32>randomtickspeed": 1,
      "i8>requiresCopiedPackRemovalCheck": 0,
      "i8>respawnblocksexplode": 1,
      "i8>sendcommandfeedback": 1,
      "i32>serverChunkTickRange": 4,
      "i8>showbordereffect": 1,
      "i8>showcoordinates": 0,
      "i8>showdeathmessages": 1,
      "i8>showtags": 1,
      "i8>spawnMobs": 0,
      "i32>spawnradius": 5,
      "i8>startWithMapEnabled": 0,
      "i8>texturePacksRequired": 0,
      "i8>tntexplodes": 1,
      "i8>useMsaGamertagsOnly": 0,
      "i64>worldStartCount": 0n,
      "comp>world_policies": { __proto__: e }
    }
  }
}

class WorldMeta {
  static deserialize(buf) {
    var snbt = NBT.Reader(toArrayBuffer(buf), true, true)
      , result = new WorldMeta();
    result.snbt = snbt

    return result
  }

  constructor() {
    this.snbt = createDefault();
  }

  getMeta(key) {
    return this.snbt.get("comp", "").get(void 0, key)
  }

  setMeta(key, value) {
    return this.snbt.get("comp", "").set(void 0, key, value)
  }

  serialize() {
    var buf = Buffer.from(new Uint8Array(NBT.Writer(this.snbt, true, true)))
      , header = Buffer.alloc(8);
    header.writeUInt32LE(10, 0);
    header.writeUInt32LE(buf.byteLength, 4);
    return Buffer.concat([header, buf]);
  }
}

module.exports = WorldMeta;