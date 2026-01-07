import { flow, Instance, SnapshotOut, types } from "mobx-state-tree"

import { parseM3U } from "../utils/m3u/parser"

export const M3UChannelModel = types.model("M3UChannel").props({
  id: types.identifier,
  name: types.string,
  group: types.string,
  url: types.string,
  logo: types.maybe(types.string),
  tvgId: types.maybe(types.string),
  tvgName: types.maybe(types.string),
})

export const M3UStoreModel = types
  .model("M3UStore")
  .props({
    channels: types.array(M3UChannelModel),
    isLoading: types.optional(types.boolean, false),
    error: types.maybe(types.string),
  })
  .actions((store) => ({
    loadPlaylist: flow(function* (url: string) {
      store.isLoading = true
      store.error = undefined

      try {
        const response = yield fetch(url)
        const text = yield response.text()
        const channels = parseM3U(text)

        store.channels.replace(channels as any)
      } catch (e) {
        store.error = "Failed to load playlist"
        console.error(e)
      } finally {
        store.isLoading = false
      }
    }),
    clearPlaylist() {
      store.channels.clear()
    },
  }))
  .views((store) => ({
    get categories() {
      const groups = new Set(store.channels.map((c) => c.group))
      return Array.from(groups).sort()
    },
    getChannelsByCategory(category: string) {
      return store.channels.filter((c) => c.group === category)
    },
  }))

export interface M3UStore extends Instance<typeof M3UStoreModel> {}
export interface M3UStoreSnapshot extends SnapshotOut<typeof M3UStoreModel> {}
