import * as FileSystem from "expo-file-system/legacy"
import { Instance, SnapshotOut, types } from "mobx-state-tree"

export const DownloadItemModel = types
  .model("DownloadItem")
  .props({
    id: types.identifier,
    title: types.string,
    url: types.string,
    localUri: types.maybeNull(types.string),
    downloadProgress: types.optional(types.number, 0),
    status: types.enumeration(["pending", "downloading", "completed", "failed", "paused"]),
    contentType: types.enumeration(["vod", "series"]),
    fileSize: types.maybeNull(types.number),
    thumbnail: types.maybeNull(types.string),
    channel: types.frozen(), // Store the full channel object
    createdAt: types.optional(types.number, () => Date.now()),
  })
  .actions((self) => ({
    setProgress(progress: number) {
      self.downloadProgress = progress
    },
    setStatus(status: "pending" | "downloading" | "completed" | "failed" | "paused") {
      self.status = status
    },
    setLocalUri(uri: string) {
      self.localUri = uri
    },
    setFileSize(size: number) {
      self.fileSize = size
    },
  }))

export const DownloadStoreModel = types
  .model("DownloadStore")
  .props({
    downloads: types.array(DownloadItemModel),
    maxConcurrentDownloads: types.optional(types.number, 3),
  })
  .views((self) => ({
    get activeDownloads() {
      return self.downloads.filter((d) => d.status === "downloading" || d.status === "pending")
    },
    get completedDownloads() {
      return self.downloads.filter((d) => d.status === "completed")
    },
    get failedDownloads() {
      return self.downloads.filter((d) => d.status === "failed")
    },
    isDownloaded(id: string) {
      return self.downloads.some((d) => d.id === id && d.status === "completed")
    },
    getDownload(id: string) {
      return self.downloads.find((d) => d.id === id)
    },
  }))
  .actions((self) => ({
    addDownload(
      id: string,
      title: string,
      url: string,
      contentType: "vod" | "series",
      channel: any,
      thumbnail?: string,
    ) {
      if (self.downloads.find((d) => d.id === id)) {
        console.warn("Download already exists:", id)
        return null
      }

      const download = DownloadItemModel.create({
        id,
        title,
        url,
        status: "pending",
        contentType,
        channel,
        thumbnail,
        localUri: null,
        fileSize: null,
      })

      self.downloads.push(download)
      return download
    },

    removeDownload(id: string) {
      const download = self.downloads.find((d) => d.id === id)
      if (download?.localUri) {
        // Delete local file
        FileSystem.deleteAsync(download.localUri, { idempotent: true }).catch((error) =>
          console.error("Failed to delete file:", error),
        )
      }
      self.downloads = self.downloads.filter((d) => d.id !== id) as any
    },

    async startDownload(id: string) {
      const download = self.downloads.find((d) => d.id === id)
      if (!download) return

      download.setStatus("downloading")

      const fileName = `${id}.mp4`
      const downloadsDir = `${FileSystem.documentDirectory}downloads/`
      const fileUri = `${downloadsDir}${fileName}`

      try {
        // Ensure downloads directory exists
        const dirInfo = await FileSystem.getInfoAsync(downloadsDir)
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(downloadsDir, {
            intermediates: true,
          })
        }

        // Start download
        const downloadResumable = FileSystem.createDownloadResumable(
          download.url,
          fileUri,
          {},
          (downloadProgress) => {
            const progress =
              downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
            download.setProgress(progress)
            if (downloadProgress.totalBytesExpectedToWrite > 0) {
              download.setFileSize(downloadProgress.totalBytesExpectedToWrite)
            }
          },
        )

        const result = await downloadResumable.downloadAsync()
        if (result) {
          download.setLocalUri(result.uri)
          download.setStatus("completed")
          download.setProgress(1)
        }
      } catch (error) {
        console.error("Download failed:", error)
        download.setStatus("failed")
      }
    },

    async pauseDownload(id: string) {
      const download = self.downloads.find((d) => d.id === id)
      if (download && download.status === "downloading") {
        download.setStatus("paused")
      }
    },

    async clearCompleted() {
      for (const download of self.completedDownloads) {
        if (download.localUri) {
          await FileSystem.deleteAsync(download.localUri, { idempotent: true }).catch((error) =>
            console.error("Failed to delete file:", error),
          )
        }
      }
      self.downloads = self.downloads.filter((d) => d.status !== "completed") as any
    },

    async clearFailed() {
      self.downloads = self.downloads.filter((d) => d.status !== "failed") as any
    },
  }))

export interface DownloadStore extends Instance<typeof DownloadStoreModel> {}
export interface DownloadStoreSnapshot extends SnapshotOut<typeof DownloadStoreModel> {}
