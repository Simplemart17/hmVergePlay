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
  .views((store) => {
    const getChannelsByType = (type: "live" | "vod" | "series" | "radio", category?: string) => {
      return store.channels.filter((c) => {
        // Filter by category if provided
        if (category && c.group !== category) return false

        const url = c.url.toLowerCase()

        // Inference logic
        const isVOD =
          url.includes("/movie/") ||
          url.endsWith(".mp4") ||
          url.endsWith(".mkv") ||
          url.endsWith(".avi") ||
          url.endsWith(".mov") ||
          url.endsWith(".flv") ||
          url.endsWith(".wmv")

        const isSeries =
          url.includes("/series/") ||
          (url.includes("s") && url.includes("e") && /\bs\d+e\d+\b/i.test(c.name))

        if (type === "vod") {
          return isVOD
        } else if (type === "series") {
          return isSeries
        } else if (type === "live") {
          // Live is anything that is NOT VOD or Series
          // Also check for specific Live extensions if needed, but exclusion is often safer for M3U
          return !isVOD && !isSeries
        } else if (type === "radio") {
          // Difficult to distinguish radio from live audio without metadata
          // Assuming radio might be in "Radio" group or similar, but for now treat as Live or distinct if possible
          // If no specific radio detection, maybe return empty or map to live?
          // Let's assume Live for now unless "radio" is in group name
          return c.group.toLowerCase().includes("radio")
        }
        return true
      })
    }

    return {
      get categories() {
        const groups = new Set(store.channels.map((c) => c.group))
        return Array.from(groups).sort()
      },
      getChannelsByCategory(category: string) {
        return store.channels.filter((c) => c.group === category)
      },
      getChannelsByType,
      getCategoriesByType(type: "live" | "vod" | "series" | "radio") {
        const channels = getChannelsByType(type)
        const groups = new Set(channels.map((c) => c.group))
        return Array.from(groups).sort()
      },
    }
  })

export interface M3UStore extends Instance<typeof M3UStoreModel> {}
export interface M3UStoreSnapshot extends SnapshotOut<typeof M3UStoreModel> {}
