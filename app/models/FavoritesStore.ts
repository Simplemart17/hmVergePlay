import { Instance, SnapshotOut, types } from "mobx-state-tree"

import { ChannelModel } from "./ChannelStore"
import { M3UChannelModel } from "./M3UStore"

export const FavoritesStoreModel = types
  .model("FavoritesStore")
  .props({
    xtreamFavorites: types.array(types.safeReference(ChannelModel)),
    m3uFavorites: types.array(types.safeReference(M3UChannelModel)),
  })
  .actions((store) => ({
    toggleXtreamFavorite(channel: any) {
      const index = store.xtreamFavorites.findIndex((c) => c && c.stream_id === channel.stream_id)
      if (index > -1) {
        store.xtreamFavorites.splice(index, 1)
      } else {
        store.xtreamFavorites.push(channel)
      }
    },
    toggleM3UFavorite(channel: any) {
      const index = store.m3uFavorites.findIndex((c) => c && c.id === channel.id)
      if (index > -1) {
        store.m3uFavorites.splice(index, 1)
      } else {
        store.m3uFavorites.push(channel)
      }
    },
    isXtreamFavorite(streamId: number) {
      return store.xtreamFavorites.some((c) => c && c.stream_id === streamId)
    },
    isM3UFavorite(id: string) {
      return store.m3uFavorites.some((c) => c && c.id === id)
    },
  }))

export interface FavoritesStore extends Instance<typeof FavoritesStoreModel> {}
export interface FavoritesStoreSnapshot extends SnapshotOut<typeof FavoritesStoreModel> {}
