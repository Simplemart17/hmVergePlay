import { onSnapshot, applySnapshot } from "mobx-state-tree"

import { load, save } from "../../utils/storage"
import { RootStore } from "../RootStore"

const ROOT_STATE_STORAGE_KEY = "root-v1"

/**
 * Setup the environment that all the models will be sharing.
 *
 * The environment includes other functions that will be picked from some
 * of the models that get created later. This is how we loosely couple things
 * like events between models.
 */
export async function setupRootStore(rootStore: RootStore) {
  let restoredState: any

  try {
    // load the last known state from AsyncStorage
    restoredState = (await load(ROOT_STATE_STORAGE_KEY)) || {}
    applySnapshot(rootStore, restoredState)
  } catch {
    // if there's any problems loading, then let's at least fallback to an empty state
    // instead of crashing.
  }

  // Migration: Ensure activePlaylistId is set if playlists exist
  // This fixes existing users who had playlists added before the activePlaylistId was being set
  const playlistStore = rootStore.playlistStore
  if (playlistStore.playlists.length > 0 && !playlistStore.activePlaylistId) {
    // Find the appropriate playlist based on current auth method
    const authStore = rootStore.authenticationStore
    let matchingPlaylist = null

    if (authStore.authMethod === "m3u" && authStore.m3uUrl) {
      matchingPlaylist = playlistStore.playlists.find((p) => p.m3uUrl === authStore.m3uUrl)
    } else if (authStore.authMethod === "xtream" && authStore.serverUrl) {
      matchingPlaylist = playlistStore.playlists.find(
        (p) => p.serverUrl === authStore.serverUrl && p.username === authStore.username,
      )
    }

    // If we found a matching playlist, set it as active
    // Otherwise, just use the first playlist
    if (matchingPlaylist) {
      playlistStore.setActivePlaylist(matchingPlaylist.id)
    } else if (playlistStore.playlists.length > 0) {
      playlistStore.setActivePlaylist(playlistStore.playlists[0].id)
    }
  }

  // track changes & save to storage
  onSnapshot(rootStore, (snapshot) => save(ROOT_STATE_STORAGE_KEY, snapshot))

  return rootStore
}
