import { Instance, SnapshotOut, types } from "mobx-state-tree"

export const SettingsStoreModel = types
  .model("SettingsStore")
  .props({
    streamFormat: types.optional(types.enumeration(["ts", "m3u8"]), "ts"),
  })
  .actions((self) => ({
    setStreamFormat(format: "ts" | "m3u8") {
      self.streamFormat = format
    },
  }))

export interface SettingsStore extends Instance<typeof SettingsStoreModel> {}
export interface SettingsStoreSnapshot extends SnapshotOut<typeof SettingsStoreModel> {}
