import { FC, useState } from "react"
import {
  FlatList,
  Image,
  ImageStyle,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { observer } from "mobx-react-lite"

import { Button } from "../../components/Button"
import { LoadingIndicator } from "../../components/LoadingIndicator"
import { Screen } from "../../components/Screen"
import { Text } from "../../components/Text"
import { useStores } from "../../models/helpers/useStores"
import { AppStackScreenProps } from "../../navigators/navigationTypes"
import { useAppTheme } from "../../theme/context"
import { ThemedStyle } from "../../theme/types"

interface FavoritesScreenProps extends AppStackScreenProps<"Favorites"> {}

export const FavoritesScreen: FC<FavoritesScreenProps> = observer(function FavoritesScreen({
  navigation,
}) {
  const { favoritesStore, authenticationStore } = useStores()
  const { themed, theme } = useAppTheme()
  const [isLoading, setIsLoading] = useState(false)

  const playChannel = (channel: any) => {
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
        const streamUrl = `${authenticationStore.serverUrl}/${authenticationStore.username}/${authenticationStore.password}/${channel.stream_id}`
        navigation.navigate("Player", {
          url: streamUrl,
          title: channel.name,
          isLive: true, // Favorites are mostly channels? Or VOD?
          // TODO: Handle VOD vs Live in Favorites properly if mixed
          channel,
        })
      }
      setIsLoading(false)
    }, 100)
  }

  const toggleFavorite = (channel: any) => {
    if (authenticationStore.authMethod === "m3u") {
      favoritesStore.toggleM3UFavorite(channel)
    } else {
      favoritesStore.toggleXtreamFavorite(channel)
    }
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={themed($item)} onPress={() => playChannel(item)}>
      {item.stream_icon || item.logo ? (
        <Image
          source={{ uri: item.stream_icon || item.logo }}
          style={themed($channelIcon)}
          resizeMode="contain"
        />
      ) : (
        <View style={themed($placeholderIcon)}>
          <Text
            text={item.name?.substring(0, 2).toUpperCase()}
            style={{ color: theme.colors.textDim }}
          />
        </View>
      )}
      <Text text={item.name} style={themed($itemText)} numberOfLines={1} />

      <TouchableOpacity onPress={() => toggleFavorite(item)} style={themed($favoriteIcon)}>
        <Ionicons name="heart" size={24} color={theme.colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  const data =
    authenticationStore.authMethod === "m3u"
      ? favoritesStore.m3uFavorites
      : favoritesStore.xtreamFavorites

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top"]}
      backgroundColor={themed(({ colors }) => colors.background)}
    >
      <LoadingIndicator visible={isLoading} />
      <View style={themed($header)}>
        <Button
          preset="secondary"
          text="Back"
          onPress={() => navigation.goBack()}
          style={themed($backButton)}
        />
        <Text text="Favorites" preset="heading" style={themed($heading)} />
      </View>

      <FlatList
        data={data.slice()} // mobx array to JS array
        renderItem={renderItem}
        keyExtractor={(item) => item.stream_id?.toString() || item.id || Math.random().toString()}
        contentContainerStyle={themed($listContent)}
        ListEmptyComponent={<Text text="No favorites added yet." style={themed($emptyText)} />}
      />
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
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
  fontSize: 32,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.lg,
})

const $item: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.surface,
  padding: spacing.md,
  borderRadius: 12,
  marginBottom: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.borderLite,
})

const $channelIcon: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: 40,
  height: 40,
  marginRight: spacing.md,
})

const $placeholderIcon: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: 40,
  height: 40,
  marginRight: spacing.md,
  backgroundColor: colors.surfaceHighlight,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
})

const $favoriteIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $itemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "500",
  flex: 1,
})

const $emptyText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  textAlign: "center",
  marginTop: spacing.xl,
  color: colors.textDim,
})
