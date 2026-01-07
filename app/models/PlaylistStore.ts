import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"

export const PlaylistModel = types.model("Playlist").props({
  id: types.identifier,
  name: types.string,
  type: types.enumeration(["xtream", "m3u"]),
  // Xtream specific
  username: types.maybe(types.string),
  password: types.maybe(types.string),
  serverUrl: types.maybe(types.string),
  // M3U specific
  m3uUrl: types.maybe(types.string),
  createdAt: types.number,
})

export interface Playlist extends Instance<typeof PlaylistModel> {}
export interface PlaylistSnapshotOut extends SnapshotOut<typeof PlaylistModel> {}
export interface PlaylistSnapshotIn extends SnapshotIn<typeof PlaylistModel> {}

export const PlaylistStoreModel = types
  .model("PlaylistStore")
  .props({
    playlists: types.array(PlaylistModel),
    activePlaylistId: types.maybe(types.string),
  })
  .views((self) => ({
    get activePlaylist(): Playlist | undefined {
      return self.playlists.find((p) => p.id === self.activePlaylistId)
    },
    get hasPlaylists(): boolean {
      return self.playlists.length > 0
    },
  }))
  .actions((self) => ({
    addPlaylist(playlist: PlaylistSnapshotIn) {
      self.playlists.push(playlist)
    },
    updatePlaylist(id: string, updates: Partial<PlaylistSnapshotIn>) {
      const playlist = self.playlists.find((p) => p.id === id)
      if (playlist) {
        Object.assign(playlist, updates)
      }
    },
    removePlaylist(id: string) {
      const index = self.playlists.findIndex((p) => p.id === id)
      if (index > -1) {
        if (self.activePlaylistId === id) {
          self.activePlaylistId = undefined
        }
        self.playlists.splice(index, 1)
      }
    },
    setActivePlaylist(id: string) {
      self.activePlaylistId = id
    },
    clearActivePlaylist() {
      self.activePlaylistId = undefined
    },
  }))

export interface PlaylistStore extends Instance<typeof PlaylistStoreModel> {}
export interface PlaylistStoreSnapshot extends SnapshotOut<typeof PlaylistStoreModel> {}
