import { FC, useEffect, useState } from "react"
import {
  ActivityIndicator,
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

export const ChannelListScreen: FC<ChannelListScreenProps> = observer(function ChannelListScreen({
  navigation,
  route,
}) {
  const { width } = useWindowDimensions()

  let numColumns = 1
  if (width >= 1000) {
    numColumns = 3 // Landscape Tablet / Desktop
  } else if (width >= 700) {
    numColumns = 2 // Portrait Tablet
  }

  const { channelStore, authenticationStore, favoritesStore } = useStores()
  const { themed, theme } = useAppTheme()
  const { category } = route.params || ({} as { category?: string })
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (authenticationStore.authMethod === "m3u") {
      // M3U channels are already loaded
    } else {
      if (channelStore.currentCategory && !channelStore.hasFetchedAllChannels) {
        channelStore.fetchChannels(channelStore.currentCategory.category_id)
      }
    }
  }, [channelStore, authenticationStore.authMethod, channelStore.hasFetchedAllChannels])

  const playChannel = (channel: any) => {
    setIsLoading(true)
    // Small delay to allow the loading indicator to show before navigating (which might freeze JS thread)
    setTimeout(() => {
      if (authenticationStore.authMethod === "m3u") {
        navigation.navigate("Player", {
          url: channel.url,
          title: channel.name,
          isLive: true, // Assuming M3U channels are live usually
          channel,
        })
      } else {
        if (channelStore.selectedContentType === "series") {
          // TODO: Implement Series Details / Episode List
          console.warn("Series playback not yet implemented")
          setIsLoading(false)
          return
        }

        let streamUrl = ""
        const isLive =
          channelStore.selectedContentType === "live" ||
          channelStore.selectedContentType === "radio"

        if (isLive) {
          streamUrl = `${authenticationStore.serverUrl}/${authenticationStore.username}/${authenticationStore.password}/${channel.stream_id}`
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
      // Reset loading state after navigation (when coming back, it shouldn't be loading)
      setTimeout(() => setIsLoading(false), 500)
    }, 100)
  }

  const channels =
    authenticationStore.authMethod === "m3u"
      ? channelStore.rootStore.m3uStore.getChannelsByCategory(category || "")
      : channelStore.hasFetchedAllChannels && channelStore.currentCategory
        ? channelStore.getChannelsByCategory(channelStore.currentCategory.category_id)
        : channelStore.channels

  const filteredChannels = channels.filter(
    (c: any) =>
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())), // Handle VOD/Series title
  )

  const toggleFavorite = (channel: any) => {
    if (authenticationStore.authMethod === "m3u") {
      favoritesStore.toggleM3UFavorite(channel)
    } else {
      favoritesStore.toggleXtreamFavorite(channel)
    }
  }

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.stream_icon || item.logo || item.cover // Handle cover for Series
    const name = item.name || item.title // Handle title for VOD/Series
    const rating = item.rating || item.rating_5based ? `★ ${item.rating || item.rating_5based}` : ""

    const isGrid = numColumns > 1

    return (
      <TouchableOpacity
        style={[themed($item), isGrid && themed($gridItem)]}
        onPress={() => playChannel(item)}
      >
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

        <TouchableOpacity onPress={() => toggleFavorite(item)} style={themed($favoriteIcon)}>
          <Ionicons
            name={
              (
                authenticationStore.authMethod === "m3u"
                  ? favoritesStore.isM3UFavorite(item.url)
                  : favoritesStore.isXtreamFavorite(item.stream_id)
              )
                ? "heart"
                : "heart-outline"
            }
            color={
              (
                authenticationStore.authMethod === "m3u"
                  ? favoritesStore.isM3UFavorite(item.url)
                  : favoritesStore.isXtreamFavorite(item.stream_id)
              )
                ? theme.colors.error
                : theme.colors.textDim
            }
            size={24}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

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
                ? category
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
            key={numColumns} // Force re-render when columns change
            data={filteredChannels}
            renderItem={renderItem}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? themed($columnWrapper) : undefined}
            keyExtractor={(item) =>
              item.stream_id?.toString() ||
              item.series_id?.toString() ||
              item.id ||
              Math.random().toString()
            }
            contentContainerStyle={themed($listContent)}
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
