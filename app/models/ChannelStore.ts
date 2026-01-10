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
      // Memoize category counts computation to avoid recalculating on every access
      // This is especially important for large datasets
      const counts: Record<string, number> = {}
      const channelsLength = store.channels.length

      // Use a simple loop for better performance than forEach
      for (let i = 0; i < channelsLength; i++) {
        const c = store.channels[i]
        if (c.category_id) {
          counts[c.category_id] = (counts[c.category_id] || 0) + 1
        }
      }
      return counts
    },
    get totalChannelCount() {
      return store.channels.length
    },
    getChannelsByCategory(categoryId: string) {
      // Return a filtered array - consider caching if this is called frequently
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
    setCurrentCategory(categoryId: string) {
      const category = store.categories.find((c) => c.category_id === categoryId)
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
        // Validate server URL before creating API instance
        if (!authStore.serverUrl) {
          console.error("Server URL is missing")
          store.isLoading = false
          return
        }

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

        // Log category fetch result for debugging
        if (categoriesResult && categoriesResult.kind !== "ok") {
          console.error(`Failed to fetch ${type} categories:`, categoriesResult)
        }

        if (categoriesResult && categoriesResult.kind === "ok") {
          const validCategories = (categoriesResult.data || []).map((c: any) => ({
            ...c,
            category_id: String(c.category_id),
            category_name: c.category_name || String(c.category_id),
          }))
          store.setCategories(validCategories)
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

        // Log channels fetch result for debugging
        if (channelsResult && channelsResult.kind !== "ok") {
          console.error(`Failed to fetch ${type} channels:`, channelsResult)
        }

        if (channelsResult && channelsResult.kind === "ok") {
          // Ensure channelsResult.data is an array
          let channels = Array.isArray(channelsResult.data) ? channelsResult.data : []

          // Normalize data in batches to avoid blocking the main thread
          // Process in chunks to allow UI updates between batches
          const BATCH_SIZE = 1000
          const normalizedChannels: any[] = []

          if (channels.length > 0) {
            for (let i = 0; i < channels.length; i += BATCH_SIZE) {
              const batch = channels.slice(i, i + BATCH_SIZE)
              const normalizedBatch = batch.map((c: any) => ({
                ...c,
                // Ensure category_id is a string
                category_id: c.category_id ? String(c.category_id) : undefined,
                // Ensure IDs are numbers
                stream_id: c.stream_id ? Number(c.stream_id) : undefined,
                series_id: c.series_id ? Number(c.series_id) : undefined,
                num: c.num ? Number(c.num) : undefined,
                // Ensure rating is valid
                rating: c.rating === "" ? null : c.rating,
              }))
              normalizedChannels.push(...normalizedBatch)

              // Yield control every batch to prevent UI freezing
              if (i + BATCH_SIZE < channels.length) {
                yield Promise.resolve()
              }
            }

            channels = normalizedChannels

            if (type === "live") {
              // Filter out explicit radio streams from Live view
              channels = channels.filter(
                (c: any) => c.stream_type !== "radio" && c.stream_type !== "radio_streams",
              )
            } else if (type === "radio") {
              // Prefer explicit radio streams, but fallback if none found (e.g. they might be marked live)
              const radioChannels = channels.filter(
                (c: any) => c.stream_type === "radio" || c.stream_type === "radio_streams",
              )
              if (radioChannels.length > 0) {
                channels = radioChannels
              }
            }
            // For VOD and Series, pass through all results from the API without filtering
          }

          store.setChannels(channels)
          store.setHasFetchedAllChannels(true)
        } else {
          // Handle error case - set empty array to clear previous data
          store.setChannels([])
          console.error("Failed to load content:", channelsResult)
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
          const validCategories = (result.data || []).map((c: any) => ({
            ...c,
            category_id: String(c.category_id),
            category_name: c.category_name || String(c.category_id),
          }))
          store.setCategories(validCategories)
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

      if (!authStore || !authStore.serverUrl || !authStore.username || !authStore.password) {
        console.error("Missing authentication credentials for fetchChannels")
        store.isLoading = false
        return
      }

      store.isLoading = true
      try {
        // Validate server URL before creating API instance
        if (!authStore.serverUrl || typeof authStore.serverUrl !== "string") {
          console.error("Invalid server URL:", authStore.serverUrl)
          store.isLoading = false
          return
        }

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
          // Ensure result.data is an array
          let channels = Array.isArray(result.data) ? result.data : []

          // Normalize data in batches to avoid blocking the main thread
          const BATCH_SIZE = 1000
          const normalizedChannels: any[] = []

          if (channels.length > 0) {
            for (let i = 0; i < channels.length; i += BATCH_SIZE) {
              const batch = channels.slice(i, i + BATCH_SIZE)
              const normalizedBatch = batch.map((c: any) => ({
                ...c,
                // Preserve original category_id if it exists, only use categoryId as fallback when fetching specific category
                category_id: c.category_id
                  ? String(c.category_id)
                  : categoryId
                    ? String(categoryId)
                    : undefined,
                stream_id: c.stream_id ? Number(c.stream_id) : undefined,
                series_id: c.series_id ? Number(c.series_id) : undefined,
                num: c.num ? Number(c.num) : undefined,
                rating: c.rating === "" ? null : c.rating,
              }))
              normalizedChannels.push(...normalizedBatch)

              // Yield control every batch to prevent UI freezing
              if (i + BATCH_SIZE < channels.length) {
                yield Promise.resolve()
              }
            }

            channels = normalizedChannels

            if (store.selectedContentType === "live") {
              channels = channels.filter(
                (c: any) => c.stream_type !== "radio" && c.stream_type !== "radio_streams",
              )
            } else if (store.selectedContentType === "radio") {
              const radioChannels = channels.filter(
                (c: any) => c.stream_type === "radio" || c.stream_type === "radio_streams",
              )
              if (radioChannels.length > 0) {
                channels = radioChannels
              }
            }
            // For VOD and Series, pass through all results without filtering
          }

          store.setChannels(channels)
          if (!categoryId) {
            store.setHasFetchedAllChannels(true)
          }
        } else {
          // Handle error case - set empty array to clear previous data
          store.setChannels([])
          console.error("Failed to fetch channels:", result)
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
