import { FC } from "react"
import { Alert, FlatList, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { observer } from "mobx-react-lite"

import { Button } from "../../components/Button"
import { Screen } from "../../components/Screen"
import { Text } from "../../components/Text"
import { useStores } from "../../models/helpers/useStores"
import { AppStackScreenProps } from "../../navigators/navigationTypes"
import { useAppTheme } from "../../theme/context"
import { ThemedStyle } from "../../theme/types"

interface DownloadsScreenProps extends AppStackScreenProps<"Downloads"> {}

export const DownloadsScreen: FC<DownloadsScreenProps> = observer(function DownloadsScreen({
  navigation,
}) {
  const { themed, theme } = useAppTheme()
  const { downloadStore } = useStores()

  const handlePlay = (download: any) => {
    if (download.status === "completed" && download.localUri) {
      navigation.navigate("Player", {
        url: download.localUri,
        title: download.title,
        isLive: false,
        channel: download.channel,
      })
    }
  }

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Download", `Remove "${title}" from downloads?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => downloadStore.removeDownload(id),
      },
    ])
  }

  const renderDownloadItem = ({ item }: { item: any }) => {
    const getStatusIcon = () => {
      switch (item.status) {
        case "completed":
          return "checkmark-circle"
        case "downloading":
          return "download"
        case "failed":
          return "alert-circle"
        case "paused":
          return "pause-circle"
        default:
          return "time"
      }
    }

    const getStatusColor = () => {
      switch (item.status) {
        case "completed":
          return theme.colors.palette.secondary500
        case "downloading":
          return theme.colors.palette.primary500
        case "failed":
          return theme.colors.palette.angry500
        default:
          return theme.colors.textDim
      }
    }

    const formatFileSize = (bytes: number | null) => {
      if (!bytes) return "Unknown size"
      const mb = bytes / (1024 * 1024)
      return `${mb.toFixed(1)} MB`
    }

    return (
      <TouchableOpacity
        style={themed($downloadItem)}
        onPress={() => item.status === "completed" && handlePlay(item)}
        disabled={item.status !== "completed"}
      >
        <View style={themed($downloadItemLeft)}>
          <Ionicons
            name={getStatusIcon()}
            size={32}
            color={getStatusColor()}
            style={themed($statusIcon)}
          />
          <View style={themed($downloadItemInfo)}>
            <Text text={item.title} style={themed($downloadTitle)} numberOfLines={1} />
            <Text
              text={`${item.contentType === "vod" ? "Movie" : "Series"} • ${formatFileSize(item.fileSize)}`}
              style={themed($downloadSubtext)}
            />
            {item.status === "downloading" && (
              <View style={themed($progressBarContainer)}>
                <View
                  style={[
                    themed($progressBarFill),
                    { width: `${(item.downloadProgress * 100).toFixed(0)}%` as any },
                  ]}
                />
              </View>
            )}
          </View>
        </View>

        <View style={themed($downloadItemActions)}>
          {item.status === "downloading" && (
            <Text
              text={`${(item.downloadProgress * 100).toFixed(0)}%`}
              style={themed($progressText)}
            />
          )}
          <TouchableOpacity onPress={() => handleDelete(item.id, item.title)}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.palette.angry500} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={themed($emptyContainer)}>
      <Ionicons name="cloud-download-outline" size={64} color={theme.colors.textDim} />
      <Text text="No Downloads" style={themed($emptyText)} />
      <Text
        text="Downloaded movies and series will appear here for offline viewing"
        style={themed($emptySubtext)}
      />
    </View>
  )

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)}>
      <View style={themed($header)}>
        <Button
          preset="secondary"
          text="Back"
          onPress={() => navigation.goBack()}
          style={themed($backButton)}
        />
        <Text text="Downloads" preset="heading" style={themed($heading)} />
      </View>

      {downloadStore.activeDownloads.length > 0 && (
        <View style={themed($section)}>
          <Text text="Downloading" preset="subheading" style={themed($sectionTitle)} />
          <FlatList
            data={downloadStore.activeDownloads}
            renderItem={renderDownloadItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={themed($section)}>
        <View style={themed($sectionHeader)}>
          <Text text="Completed" preset="subheading" style={themed($sectionTitle)} />
          {downloadStore.completedDownloads.length > 0 && (
            <TouchableOpacity onPress={() => downloadStore.clearCompleted()}>
              <Text text="Clear All" style={themed($clearText)} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={downloadStore.completedDownloads}
          renderItem={renderDownloadItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            downloadStore.completedDownloads.length === 0 ? themed($flex1) : undefined
          }
        />
      </View>

      {downloadStore.failedDownloads.length > 0 && (
        <View style={themed($section)}>
          <View style={themed($sectionHeader)}>
            <Text text="Failed" preset="subheading" style={themed($sectionTitle)} />
            <TouchableOpacity onPress={() => downloadStore.clearFailed()}>
              <Text text="Clear All" style={themed($clearText)} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={downloadStore.failedDownloads}
            renderItem={renderDownloadItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.xl,
  marginBottom: spacing.lg,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
  minHeight: 36,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
})

const $heading: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 24,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  flex: 1,
})

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: 1,
})

const $clearText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  fontSize: 14,
})

const $downloadItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: colors.surface,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.borderLite,
})

const $downloadItemLeft: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
})

const $downloadItemInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $downloadTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "600",
  marginBottom: 4,
})

const $downloadSubtext: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginBottom: 4,
})

const $downloadItemActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
})

const $progressText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  fontSize: 14,
  fontWeight: "600",
})

const $progressBarContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 4,
  backgroundColor: colors.palette.neutral300,
  borderRadius: 2,
  overflow: "hidden",
  marginTop: 4,
})

const $progressBarFill: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: "100%",
  backgroundColor: colors.palette.primary500,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxxl,
  paddingHorizontal: spacing.lg,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 18,
  fontWeight: "600",
  marginTop: spacing.md,
  textAlign: "center",
})

const $emptySubtext: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 14,
  marginTop: spacing.xs,
  textAlign: "center",
})

const $flex1: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $statusIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
})
