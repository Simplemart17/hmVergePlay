import { Instance, SnapshotOut, types } from "mobx-state-tree"

export const SettingsStoreModel = types
  .model("SettingsStore")
  .props({
    streamFormat: types.optional(types.enumeration(["ts", "m3u8"]), "ts"),
    aspectRatio: types.optional(
      types.enumeration(["default", "16:9", "16:10", "4:3", "fill"]),
      "default",
    ),
    epgTimeshift: types.optional(types.number, 0),
    showAdultContent: types.optional(types.boolean, false),
    autoplay: types.optional(types.boolean, true),
    userAgent: types.optional(types.string, ""),
    referrer: types.optional(types.string, ""),
  })
  .actions((self) => ({
    setStreamFormat(format: "ts" | "m3u8") {
      self.streamFormat = format
    },
    setAspectRatio(ratio: "default" | "16:9" | "16:10" | "4:3" | "fill") {
      self.aspectRatio = ratio
    },
    setEpgTimeshift(shift: number) {
      self.epgTimeshift = shift
    },
    setShowAdultContent(show: boolean) {
      self.showAdultContent = show
    },
    setAutoplay(value: boolean) {
      self.autoplay = value
    },
    setUserAgent(value: string) {
      self.userAgent = value
    },
    setReferrer(value: string) {
      self.referrer = value
    },
  }))

export interface SettingsStore extends Instance<typeof SettingsStoreModel> {}
export interface SettingsStoreSnapshot extends SnapshotOut<typeof SettingsStoreModel> {}
