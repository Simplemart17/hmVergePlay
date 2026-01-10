import { flow, getRoot, Instance, SnapshotOut, types } from "mobx-state-tree"

import { XtreamApi } from "../services/api/xtreamApi"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: types.maybe(types.string),
    username: types.maybe(types.string),
    password: types.maybe(types.string),
    serverUrl: types.maybe(types.string),
    m3uUrl: types.maybe(types.string),
    authMethod: types.optional(types.enumeration(["xtream", "m3u"]), "xtream"),
    isLoading: types.optional(types.boolean, false),
    error: types.maybe(types.string),
  })
  .views((store) => ({
    get isAuthenticated() {
      if (store.authMethod === "m3u") return !!store.m3uUrl
      if (store.authMethod === "xtream")
        return !!store.username && !!store.password && !!store.serverUrl
      return !!store.authToken
    },
    get validationError() {
      if (store.authEmail && store.authEmail.length === 0) return "can't be blank"
      if (store.authEmail && store.authEmail.length < 6) return "must be at least 6 characters"
      if (store.authEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.authEmail))
        return "must be a valid email address"
      return ""
    },
  }))
  .actions((store) => {
    const login = flow(function* (url: string, user: string, pass: string, playlistName?: string) {
      store.isLoading = true
      store.error = undefined

      try {
        const api = new XtreamApi(url)
        const result = yield api.authenticate(user, pass)

        if (result.kind === "ok") {
          store.serverUrl = url
          store.username = user
          store.password = pass
          store.authMethod = "xtream"
          store.authToken = "authenticated" // Placeholder or use actual token if available

          // Add to PlaylistStore
          const rootStore = getRoot(store) as any
          if (rootStore.playlistStore) {
            // Check if playlist already exists
            const existing = rootStore.playlistStore.playlists.find(
              (p: any) => p.serverUrl === url && p.username === user,
            )

            if (!existing) {
              const playlistId = `${Date.now()}`
              rootStore.playlistStore.addPlaylist({
                id: playlistId,
                name: playlistName || `Playlist ${rootStore.playlistStore.playlists.length + 1}`,
                type: "xtream",
                username: user,
                password: pass,
                serverUrl: url,
                createdAt: Date.now(),
              })
              // Set as active playlist
              rootStore.playlistStore.setActivePlaylist(playlistId)
            } else {
              // Set existing playlist as active
              rootStore.playlistStore.setActivePlaylist(existing.id)
            }
          }
        } else {
          store.error = "Authentication failed. Please check your credentials."
        }
      } catch (e) {
        console.error(e)
        store.error = "An unexpected error occurred."
      } finally {
        store.isLoading = false
      }
    })

    const loginM3U = flow(function* (url: string, playlistName?: string) {
      store.isLoading = true
      store.error = undefined

      try {
        const rootStore = getRoot(store) as any
        const m3uStore = rootStore.m3uStore

        yield m3uStore.loadPlaylist(url)

        if (!m3uStore.error) {
          store.m3uUrl = url
          store.authMethod = "m3u"
          store.authToken = "authenticated"

          // Add to PlaylistStore
          if (rootStore.playlistStore) {
            const existing = rootStore.playlistStore.playlists.find((p: any) => p.m3uUrl === url)

            if (!existing) {
              const playlistId = `${Date.now()}`
              rootStore.playlistStore.addPlaylist({
                id: playlistId,
                name: playlistName || `Playlist ${rootStore.playlistStore.playlists.length + 1}`,
                type: "m3u",
                m3uUrl: url,
                createdAt: Date.now(),
              })
              // Set as active playlist
              rootStore.playlistStore.setActivePlaylist(playlistId)
            } else {
              // Set existing playlist as active
              rootStore.playlistStore.setActivePlaylist(existing.id)
            }
          }
        } else {
          store.error = m3uStore.error
        }
      } catch (e) {
        console.error(e)
        store.error = "An unexpected error occurred."
      } finally {
        store.isLoading = false
      }
    })

    return {
      setAuthToken(value?: string) {
        store.authToken = value
      },
      setAuthEmail(value: string) {
        store.authEmail = value.replace(/ /g, "")
      },
      login,
      loginM3U,
      setXtreamCredentials(url: string, user: string, pass: string) {
        // Legacy action kept for compatibility, but login should be preferred
        store.serverUrl = url
        store.username = user
        store.password = pass
        store.authMethod = "xtream"
      },
      logout() {
        // Clear current session
        store.authToken = undefined
        store.authEmail = undefined
        store.username = undefined
        store.password = undefined
        store.serverUrl = undefined
        store.m3uUrl = undefined
        store.authMethod = "xtream"

        const rootStore = getRoot(store) as any
        if (rootStore.m3uStore) {
          rootStore.m3uStore.clearPlaylist()
        }
        // Clear active playlist in PlaylistStore to allow selection
        if (rootStore.playlistStore) {
          rootStore.playlistStore.clearActivePlaylist()
        }
      },
      refreshPlaylist: flow(function* () {
        store.isLoading = true
        try {
          if (store.authMethod === "m3u" && store.m3uUrl) {
            // Use loginM3U logic but don't call it directly to avoid double loading state or losing context
            const rootStore = getRoot(store) as any
            const m3uStore = rootStore.m3uStore
            yield m3uStore.loadPlaylist(store.m3uUrl)
            if (m3uStore.error) {
              store.error = m3uStore.error
            }
          } else if (
            store.authMethod === "xtream" &&
            store.serverUrl &&
            store.username &&
            store.password
          ) {
            // Re-authenticate
            const api = new XtreamApi(store.serverUrl)
            const result = yield api.authenticate(store.username, store.password)
            if (result.kind !== "ok") {
              store.error = "Failed to refresh playlist session."
            }
          }
        } catch (e) {
          console.error("Refresh playlist failed", e)
          store.error = "An error occurred while refreshing."
        } finally {
          store.isLoading = false
        }
      }),
    }
  })

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
