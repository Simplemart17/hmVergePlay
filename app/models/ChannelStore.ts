import { flow, getRoot, Instance, SnapshotOut, types } from "mobx-state-tree"

import { XtreamApi } from "../services/api/xtreamApi"

export type ContentType = "live" | "vod" | "series" | "radio"

export const ChannelModel = types.model("Channel").props({
  num: types.maybe(types.number),
  name: types.maybe(types.string),
  stream_type: types.maybe(types.string),
  stream_id: types.maybe(types.number),
  stream_icon: types.maybe(types.string),
  epg_channel_id: types.maybeNull(types.union(types.string, types.number)),
  added: types.maybe(types.string),
  category_id: types.maybe(types.string),
  custom_sid: types.maybeNull(types.union(types.string, types.number)),
  tv_archive: types.maybe(types.number),
  direct_source: types.maybe(types.string),
  tv_archive_duration: types.maybeNull(types.union(types.string, types.number)),
  // VOD/Series specific fields
  title: types.maybe(types.string), // VOD/Series title
  series_id: types.maybe(types.number),
  container_extension: types.maybe(types.string),
  rating: types.maybeNull(types.union(types.string, types.number)),
  rating_5based: types.maybe(types.number),
  cover: types.maybe(types.string), // Series cover
  plot: types.maybe(types.string),
  cast: types.maybe(types.string),
  director: types.maybe(types.string),
  genre: types.maybe(types.string),
  releaseDate: types.maybe(types.string),
})

export interface Channel extends Instance<typeof ChannelModel> {}
export interface ChannelSnapshot extends SnapshotOut<typeof ChannelModel> {}

export const CategoryModel = types.model("Category").props({
  category_id: types.identifier,
  category_name: types.maybe(types.string),
  parent_id: types.maybe(types.number),
})

export interface Category extends Instance<typeof CategoryModel> {}
export interface CategorySnapshot extends SnapshotOut<typeof CategoryModel> {}

export const ChannelStoreModel = types
  .model("ChannelStore")
  .props({
    categories: types.array(CategoryModel),
    channels: types.array(ChannelModel),
    isLoading: types.optional(types.boolean, false),
    currentCategory: types.maybe(types.reference(CategoryModel)),
    selectedContentType: types.optional(
      types.enumeration<ContentType>(["live", "vod", "series", "radio"]),
      "live",
    ),
    hasFetchedAllChannels: types.optional(types.boolean, false),
  })
  .views((store) => ({
    get rootStore() {
      return getRoot(store) as any
    },
    get categoryCounts() {
      const counts: Record<string, number> = {}
      store.channels.forEach((c) => {
        if (c.category_id) {
          counts[c.category_id] = (counts[c.category_id] || 0) + 1
        }
      })
      return counts
    },
    get totalChannelCount() {
      return store.channels.length
    },
    getChannelsByCategory(categoryId: string) {
      return store.channels.filter((c) => c.category_id === categoryId)
    },
  }))
  .actions((store) => ({
    setCategories(categories: CategorySnapshot[]) {
      store.categories.replace(categories)
    },
    setChannels(channels: ChannelSnapshot[]) {
      store.channels.replace(channels)
    },
    setHasFetchedAllChannels(value: boolean) {
      store.hasFetchedAllChannels = value
    },
    setIsLoading(loading: boolean) {
      store.isLoading = loading
    },
    setCurrentCategory(category: Category) {
      store.currentCategory = category
    },
    setContentType(type: ContentType) {
      store.selectedContentType = type
      store.categories.clear()
      store.channels.clear()
      store.currentCategory = undefined
      store.hasFetchedAllChannels = false
    },
  }))
  .actions((store) => ({
    loadContent: flow(function* (type: ContentType) {
      const rootStore = getRoot(store) as any
      const authStore = rootStore.authenticationStore

      // If we are already on this content type and have data, we might not need to reload?
      // But the user said "irrespective of the auth method, load the data".
      // Let's assume we want to refresh or ensure data is loaded.

      store.selectedContentType = type
      store.categories.clear()
      store.channels.clear()
      store.currentCategory = undefined
      store.hasFetchedAllChannels = false
      store.isLoading = true

      if (!authStore) {
        store.isLoading = false
        return
      }

      if (authStore.authMethod === "m3u") {
        // For M3U, the data is in M3UStore.
        // We don't really need to do anything here because the views in CategoryListScreen
        // access M3UStore directly.
        // BUT, if we want to "load the data in the store", we could copy it over?
        // That seems redundant and memory intensive if we duplicate.
        // However, the prompt says "load the data in the store and filter the record accordingly".
        // Let's stick to the existing pattern for M3U where the views handle the abstraction,
        // OR we can unify it. Given M3UStore is separate, unifying might be complex.
        // Let's focus on the Xtream flow which is what the user seems to be having issues with (async fetching).
        store.isLoading = false
        return
      }

      if (!authStore.serverUrl || !authStore.username || !authStore.password) {
        store.isLoading = false
        return
      }

      try {
        const api = new XtreamApi(authStore.serverUrl)

        // 1. Fetch Categories
        let categoriesResult
        if (type === "live" || type === "radio") {
          categoriesResult = yield api.getLiveCategories(authStore.username, authStore.password)
        } else if (type === "vod") {
          categoriesResult = yield api.getVODCategories(authStore.username, authStore.password)
        } else if (type === "series") {
          categoriesResult = yield api.getSeriesCategories(authStore.username, authStore.password)
        }

        if (categoriesResult && categoriesResult.kind === "ok") {
          store.setCategories(categoriesResult.data)
        }

        // 2. Fetch All Channels/Streams
        let channelsResult
        if (type === "live" || type === "radio") {
          channelsResult = yield api.getLiveStreams(authStore.username, authStore.password)
        } else if (type === "vod") {
          channelsResult = yield api.getVODStreams(authStore.username, authStore.password)
        } else if (type === "series") {
          channelsResult = yield api.getSeries(authStore.username, authStore.password)
        }

        if (channelsResult && channelsResult.kind === "ok") {
          let channels = channelsResult.data

          if (type === "live") {
            channels = channels.filter((c: any) => c.stream_type === "live")
          } else if (type === "vod") {
            channels = channels.filter((c: any) => c.stream_type === "movie")
          } else if (type === "radio") {
            const radioChannels = channels.filter(
              (c: any) => c.stream_type === "radio" || c.stream_type === "radio_streams",
            )
            if (radioChannels.length > 0) {
              channels = radioChannels
            }
          }
          store.setChannels(channels)
          store.setHasFetchedAllChannels(true)
        }
      } catch (e) {
        console.error(e)
      } finally {
        store.isLoading = false
      }
    }),
    fetchCategories: flow(function* () {
      const rootStore = getRoot(store) as any
      const authStore = rootStore.authenticationStore

      if (!authStore || !authStore.serverUrl || !authStore.username || !authStore.password) return

      store.isLoading = true
      try {
        const api = new XtreamApi(authStore.serverUrl)
        let result

        if (store.selectedContentType === "live" || store.selectedContentType === "radio") {
          // Radio usually shares categories with Live, or we could filter if API supported it.
          // For now, we fetch live categories.
          result = yield api.getLiveCategories(authStore.username, authStore.password)
        } else if (store.selectedContentType === "vod") {
          result = yield api.getVODCategories(authStore.username, authStore.password)
        } else if (store.selectedContentType === "series") {
          result = yield api.getSeriesCategories(authStore.username, authStore.password)
        }

        if (result && result.kind === "ok") {
          store.setCategories(result.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        store.isLoading = false
      }
    }),
    fetchChannels: flow(function* (categoryId?: string) {
      const rootStore = getRoot(store) as any
      const authStore = rootStore.authenticationStore

      if (!authStore || !authStore.serverUrl || !authStore.username || !authStore.password) return

      store.isLoading = true
      try {
        const api = new XtreamApi(authStore.serverUrl)
        let result

        if (store.selectedContentType === "live" || store.selectedContentType === "radio") {
          result = yield api.getLiveStreams(authStore.username, authStore.password, categoryId)
        } else if (store.selectedContentType === "vod") {
          result = yield api.getVODStreams(authStore.username, authStore.password, categoryId)
        } else if (store.selectedContentType === "series") {
          result = yield api.getSeries(authStore.username, authStore.password, categoryId)
        }

        if (result && result.kind === "ok") {
          // If Radio is selected, filter for radio streams if possible
          // Note: Xtream often uses stream_type 'live' for both, but sometimes 'radio'.
          // We'll trust the category or filter if stream_type is available.
          let channels = result.data

          if (store.selectedContentType === "live") {
            channels = channels.filter((c: any) => c.stream_type === "live")
          } else if (store.selectedContentType === "vod") {
            channels = channels.filter((c: any) => c.stream_type === "movie")
          } else if (store.selectedContentType === "radio") {
            // Simple filter if stream_type is explicit, otherwise show all in that category
            const radioChannels = channels.filter(
              (c: any) => c.stream_type === "radio" || c.stream_type === "radio_streams",
            )
            if (radioChannels.length > 0) {
              channels = radioChannels
            }
          }
          store.setChannels(channels)
          if (!categoryId) {
            store.setHasFetchedAllChannels(true)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        store.isLoading = false
      }
    }),
  }))

export interface ChannelStore extends Instance<typeof ChannelStoreModel> {}
export interface ChannelStoreSnapshot extends SnapshotOut<typeof ChannelStoreModel> {}
