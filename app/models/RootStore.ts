import { Instance, SnapshotOut, types } from "mobx-state-tree"

import { AuthenticationStoreModel } from "./AuthenticationStore"
import { ChannelStoreModel } from "./ChannelStore"
import { FavoritesStoreModel } from "./FavoritesStore"
import { M3UStoreModel } from "./M3UStore"
import { PlaylistStoreModel } from "./PlaylistStore"
import { SettingsStoreModel } from "./SettingsStore"

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  channelStore: types.optional(ChannelStoreModel, {}),
  m3uStore: types.optional(M3UStoreModel, {}),
  favoritesStore: types.optional(FavoritesStoreModel, {}),
  playlistStore: types.optional(PlaylistStoreModel, {}),
  settingsStore: types.optional(SettingsStoreModel, {}),
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> { }

/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> { }
