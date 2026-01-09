import { FC, memo, useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageStyle,
  TextStyle,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { observer } from "mobx-react-lite"

import { capitalizeFirstLetter } from "@/utils/formatString"

import { Button } from "../../components/Button"
import { PressableIcon } from "../../components/Icon"
import { LoadingIndicator } from "../../components/LoadingIndicator"
import { Screen } from "../../components/Screen"
import { Text } from "../../components/Text"
import { TextField } from "../../components/TextField"
import { useStores } from "../../models/helpers/useStores"
import { AppStackScreenProps } from "../../navigators/navigationTypes"
import { useAppTheme } from "../../theme/context"
import { ThemedStyle } from "../../theme/types"

interface ChannelListScreenProps extends AppStackScreenProps<"ChannelList"> {}

// Optimized List Item Component
const ChannelListItemComponent = observer(
  ({
    item,
    onPress,
    onFavorite,
    onDownload,
    isGrid,
    authMethod,
    showDownload,
    themed,
    theme,
  }: {
    item: any
    onPress: (item: any) => void
    onFavorite: (item: any) => void
    onDownload: (item: any) => void
    isGrid: boolean
    authMethod: string
    showDownload: boolean
    themed: any
    theme: any
  }) => {
    const { favoritesStore, downloadStore } = useStores() // Access stores directly in observer item for reactivity

    const imageUrl = item.stream_icon || item.logo || item.cover
    const name = item.name || item.title
    const rating = item.rating || item.rating_5based ? `★ ${item.rating || item.rating_5based}` : ""

    const isFavorite =
      authMethod === "m3u"
        ? favoritesStore.isM3UFavorite(item.url)
        : favoritesStore.isXtreamFavorite(item.stream_id)

    // Unique ID for download check
    const downloadId =
      item.stream_id?.toString() ||
      item.series_id?.toString() ||
      item.id ||
      item.url ||
      Math.random().toString()

    const isDownloaded = downloadStore.isDownloaded(downloadId)
    const isDownloading = downloadStore.getDownload(downloadId)?.status === "downloading"

    const handlePress = useCallback(() => onPress(item), [item, onPress])
    const handleFavorite = useCallback(() => onFavorite(item), [item, onFavorite])
    const handleDownload = useCallback(() => onDownload(item), [item, onDownload])

    return (
      <TouchableOpacity style={[themed($item), isGrid && themed($gridItem)]} onPress={handlePress}>
        <View style={themed($iconContainer)}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={themed($channelIcon)} resizeMode="cover" />
          ) : (
            <View style={themed($placeholderIcon)}>
              <Text
                text={name?.substring(0, 2).toUpperCase()}
                style={{ color: theme.colors.textDim }}
              />
            </View>
          )}
        </View>

        <View style={themed($infoContainer)}>
          <Text text={name} style={themed($itemText)} numberOfLines={2} />
          {!!rating && <Text text={rating} style={themed($ratingText)} />}
        </View>

        <TouchableOpacity onPress={handleFavorite} style={themed($favoriteIcon)}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            color={isFavorite ? theme.colors.error : theme.colors.textDim}
            size={24}
          />
        </TouchableOpacity>

        {showDownload && (
          <TouchableOpacity onPress={handleDownload} style={themed($favoriteIcon)}>
            <Ionicons
              name={
                isDownloaded
                  ? "checkmark-circle"
                  : isDownloading
                    ? "cloud-download"
                    : "cloud-download-outline"
              }
              color={
                isDownloaded ? theme.colors.palette.secondary500 : theme.colors.palette.primary500
              }
              size={24}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  },
)

const ChannelListItem = memo(ChannelListItemComponent)

export const ChannelListScreen: FC<ChannelListScreenProps> = observer(function ChannelListScreen({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions()

  let numColumns = 1
  if (width >= 1000) {
    numColumns = 3
  } else if (width >= 700) {
    numColumns = 2
  }

  const { channelStore, authenticationStore, favoritesStore, settingsStore, downloadStore } =
    useStores()
  const { themed, theme } = useAppTheme()
  const { category } = route.params || ({} as { category?: string })
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (authenticationStore.authMethod === "m3u") {
      // M3U channels are already loaded
    } else {
      if (channelStore.currentCategory && !channelStore.hasFetchedAllChannels) {
        channelStore.fetchChannels(channelStore.currentCategory.category_id)
      }
    }
  }, [channelStore, authenticationStore.authMethod, channelStore.hasFetchedAllChannels])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (authenticationStore.authMethod === "m3u") {
        await authenticationStore.refreshPlaylist()
      } else if (channelStore.currentCategory) {
        await channelStore.fetchChannels(channelStore.currentCategory.category_id)
      }
    } catch (error) {
      console.error("Failed to refresh channels:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const playChannel = useCallback(
    (channel: any) => {
      setIsLoading(true)
      setTimeout(() => {
        if (authenticationStore.authMethod === "m3u") {
          navigation.navigate("Player", {
            url: channel.url,
            title: channel.name,
            isLive: true,
            channel,
          })
        } else {
          if (channelStore.selectedContentType === "series") {
            // Navigate to Series Details screen
            navigation.navigate("SeriesDetails", { series: channel })
            setIsLoading(false)
            return
          }

          let streamUrl = ""
          const isLive =
            channelStore.selectedContentType === "live" ||
            channelStore.selectedContentType === "radio"

          if (isLive) {
            const extension =
              channelStore.rootStore.settingsStore.streamFormat === "m3u8" ? ".m3u8" : ""
            streamUrl = `${authenticationStore.serverUrl}/${authenticationStore.username}/${authenticationStore.password}/${channel.stream_id}${extension}`
          } else if (channelStore.selectedContentType === "vod") {
            const extension = channel.container_extension || "mp4"
            streamUrl = `${authenticationStore.serverUrl}/movie/${authenticationStore.username}/${authenticationStore.password}/${channel.stream_id}.${extension}`
          }

          navigation.navigate("Player", {
            url: streamUrl,
            title: channel.name || channel.title,
            isLive,
            channel,
          })
        }
        setTimeout(() => setIsLoading(false), 500)
      }, 100)
    },
    [authenticationStore, channelStore, navigation],
  )

  const toggleFavorite = useCallback(
    (channel: any) => {
      if (authenticationStore.authMethod === "m3u") {
        favoritesStore.toggleM3UFavorite(channel)
      } else {
        favoritesStore.toggleXtreamFavorite(channel)
      }
    },
    [authenticationStore.authMethod, favoritesStore],
  )

  const handleDownload = useCallback(
    (channel: any) => {
      const id =
        channel.stream_id?.toString() ||
        channel.series_id?.toString() ||
        channel.id ||
        channel.url ||
        Math.random().toString()

      if (downloadStore.isDownloaded(id)) {
        Alert.alert("Already Downloaded", "This content is already available offline.")
        return
      }

      const streamUrl =
        channel.stream_url ||
        channel.url ||
        (authenticationStore.authMethod === "m3u" ? channel.url : "")

      if (!streamUrl) {
        Alert.alert("Error", "Could not find a valid stream URL for this content.")
        return
      }

      const download = downloadStore.addDownload(
        id,
        channel.name || channel.title,
        streamUrl,
        channelStore.selectedContentType === "series" ? "series" : "vod",
        channel,
        channel.stream_icon || channel.logo || channel.cover,
      )

      if (download) {
        downloadStore.startDownload(download.id)
        Alert.alert("Download Started", "You can track the progress in the Downloads screen.")
      }
    },
    [downloadStore, authenticationStore.authMethod, channelStore.selectedContentType],
  )

  const channels =
    authenticationStore.authMethod === "m3u"
      ? channelStore.rootStore.m3uStore.getChannelsByType(
          channelStore.selectedContentType,
          category === "all" ? undefined : category || "",
        )
      : channelStore.hasFetchedAllChannels
        ? category === "all"
          ? channelStore.channels
          : channelStore.currentCategory
            ? channelStore.getChannelsByCategory(channelStore.currentCategory.category_id)
            : channelStore.channels
        : channelStore.channels

  // Filter adult content
  const adultKeywords = ["xxx", "adult", "18+", "porn", "erotic"]
  const isAdultChannel = (channel: any) => {
    const categoryName = (
      channel.category_name ||
      channel.group ||
      channel.name ||
      ""
    ).toLowerCase()
    return adultKeywords.some((keyword) => categoryName.includes(keyword))
  }

  const channelsWithAdultFilter = settingsStore.showAdultContent
    ? channels
    : channels.filter((c: any) => !isAdultChannel(c))

  const filteredChannels = channelsWithAdultFilter.filter((c: any) => {
    if (!searchQuery) return true
    return (
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const showDownload =
        channelStore.selectedContentType === "vod" || channelStore.selectedContentType === "series"

      return (
        <ChannelListItem
          item={item}
          onPress={playChannel}
          onFavorite={toggleFavorite}
          onDownload={handleDownload}
          isGrid={numColumns > 1}
          authMethod={authenticationStore.authMethod}
          showDownload={showDownload}
          themed={themed}
          theme={theme}
        />
      )
    },
    [
      channelStore.selectedContentType,
      authenticationStore.authMethod,
      numColumns,
      playChannel,
      toggleFavorite,
      handleDownload,
      themed,
      theme,
    ],
  )

  const keyExtractor = useCallback(
    (item: any) =>
      item.stream_id?.toString() ||
      item.series_id?.toString() ||
      item.id ||
      item.url ||
      Math.random().toString(),
    [],
  )

  return (
    <View style={$container}>
      <Screen
        preset="fixed"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top"]}
        backgroundColor={themed(({ colors }) => colors.background)}
      >
        <View style={themed($header)}>
          <Button
            preset="secondary"
            text="Back"
            onPress={() => navigation.goBack()}
            style={themed($backButton)}
          />
          <Text
            text={
              authenticationStore.authMethod === "m3u"
                ? capitalizeFirstLetter(category)
                : channelStore.currentCategory?.category_name || "Channels"
            }
            preset="heading"
            style={themed($heading)}
            numberOfLines={1}
          />
          <PressableIcon
            icon="search"
            size={24}
            color={theme.colors.text}
            onPress={() => setIsSearchVisible(!isSearchVisible)}
            containerStyle={themed($searchIcon)}
          />
        </View>

        {isSearchVisible && (
          <TextField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search channels..."
            containerStyle={themed($searchContainer)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {channelStore.isLoading ? (
          <View style={themed($loadingContainer)}>
            <ActivityIndicator size="large" color={theme.colors.palette.primary500} />
          </View>
        ) : (
          <FlatList
            key={numColumns} // Force re-render grid/list toggle
            data={filteredChannels}
            renderItem={renderItem}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? themed($columnWrapper) : undefined}
            keyExtractor={keyExtractor}
            contentContainerStyle={themed($listContent)}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            // Optimization Props
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            ListEmptyComponent={
              <View style={themed($emptyContainer)}>
                <Ionicons name="film-outline" size={64} color={theme.colors.textDim} />
                <Text text="No channels found" style={themed($emptyText)} />
                <Text
                  text={
                    searchQuery
                      ? "Try adjusting your search"
                      : settingsStore.showAdultContent
                        ? "No channels available in this category"
                        : "No channels available (Adult content filter is enabled)"
                  }
                  style={themed($emptySubtext)}
                />
              </View>
            }
          />
        )}
      </Screen>
      <LoadingIndicator visible={isLoading || channelStore.isLoading} />
    </View>
  )
})

const $container: ViewStyle = {
  flex: 1,
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $loadingContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
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
  flex: 1,
  color: colors.text,
  fontSize: 24,
})

const $searchIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: spacing.sm,
})

const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.lg,
})

const $item: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.surface,
  padding: spacing.md,
  borderRadius: 16,
  marginBottom: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.borderLite,
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: 60,
  height: 60,
  borderRadius: 8,
  backgroundColor: colors.surfaceHighlight,
  overflow: "hidden",
  marginRight: spacing.md,
  justifyContent: "center",
  alignItems: "center",
})

const $channelIcon: ThemedStyle<ImageStyle> = () => ({
  width: "100%",
  height: "100%",
})

const $placeholderIcon: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  height: "100%",
  justifyContent: "center",
  alignItems: "center",
})

const $infoContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
})

const $favoriteIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $itemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "600",
  marginBottom: 4,
})

const $ratingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 12,
  fontWeight: "500",
})

const $gridItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  margin: spacing.xs,
})

const $columnWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
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
