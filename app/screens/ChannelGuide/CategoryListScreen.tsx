import { FC, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { observer } from "mobx-react-lite"

import { Button } from "../../components/Button"
import { EmptyState } from "../../components/EmptyState"
import { Screen } from "../../components/Screen"
import { Text } from "../../components/Text"
import { useStores } from "../../models/helpers/useStores"
import { AppStackScreenProps } from "../../navigators/navigationTypes"
import { useAppTheme } from "../../theme/context"
import { ThemedStyle } from "../../theme/types"

interface CategoryListScreenProps extends AppStackScreenProps<"CategoryList"> {}

export const CategoryListScreen: FC<CategoryListScreenProps> = observer(
  function CategoryListScreen({ navigation }) {
    const { channelStore } = useStores()
    const { themed, theme } = useAppTheme()
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
      if (channelStore.rootStore.authenticationStore.authMethod === "m3u") {
        // Categories are already derived in M3UStore, no need to fetch
      } else {
        // Data is already loaded by ContentTypeSelectionScreen or we are re-entering
        // If we are here, we assume data is fresh enough or loaded.
        // If we want to force refresh on mount, we could check channelStore.hasFetchedAllChannels
        if (!channelStore.hasFetchedAllChannels) {
          channelStore.loadContent(channelStore.selectedContentType)
        }
      }
    }, [
      channelStore,
      channelStore.rootStore.authenticationStore.authMethod,
      channelStore.hasFetchedAllChannels,
      channelStore.selectedContentType,
    ])

    useEffect(() => {
      if (channelStore.rootStore.authenticationStore.authMethod === "m3u") {
        setTotalCount(
          channelStore.rootStore.m3uStore.getChannelsByType(channelStore.selectedContentType)
            .length,
        )
      } else {
        setTotalCount(channelStore.totalChannelCount)
      }
    }, [
      channelStore.totalChannelCount,
      channelStore.rootStore.m3uStore.channels.length, // Keep as dependency for updates
      channelStore.rootStore.authenticationStore.authMethod,
      channelStore.selectedContentType,
    ])

    const getAllCategoryName = () => {
      switch (channelStore.selectedContentType) {
        case "live":
        case "radio":
          return "All Channels"
        case "vod":
          return "All Movies"
        case "series":
          return "All Series"
        default:
          return "All Channels"
      }
    }

    const getCountLabel = (count: number) => {
      switch (channelStore.selectedContentType) {
        case "live":
        case "radio":
          return `${count} Channels`
        case "vod":
          return `${count} Movies`
        case "series":
          return `${count} Series`
        default:
          return `${count} Channels`
      }
    }

    const categories = [
      { category_id: "all", category_name: getAllCategoryName() },
      ...(channelStore.rootStore.authenticationStore.authMethod === "m3u"
        ? channelStore.rootStore.m3uStore
            .getCategoriesByType(channelStore.selectedContentType)
            .map((c: string) => ({
              category_id: c,
              category_name: c,
            }))
        : channelStore.categories),
    ]

    const getHeadingText = () => {
      const baseText = (() => {
        switch (channelStore.selectedContentType) {
          case "live":
            return "Live TV"
          case "vod":
            return "Movies"
          case "series":
            return "Series"
          case "radio":
            return "Radio"
          default:
            return "Channels"
        }
      })()

      return totalCount > 0 ? `${baseText} (${totalCount})` : baseText
    }

    const renderItem = ({ item }: { item: any }) => {
      let count = 0
      if (item.category_id === "all") {
        count = totalCount
      } else {
        count =
          channelStore.rootStore.authenticationStore.authMethod === "m3u"
            ? channelStore.rootStore.m3uStore.getChannelsByType(
                channelStore.selectedContentType,
                item.category_id,
              ).length
            : channelStore.categoryCounts[item.category_id] || 0
      }

      const countLabel = item.category_id === "all" ? getCountLabel(count) : `${count} Channels`

      return (
        <TouchableOpacity
          style={themed($item)}
          onPress={() => {
            if (channelStore.rootStore.authenticationStore.authMethod === "m3u") {
              navigation.navigate("ChannelList", { category: item.category_id })
            } else {
              channelStore.setCurrentCategory(item)
              navigation.navigate("ChannelList", {})
            }
          }}
        >
          <Text text={item.category_name} style={themed($itemText)} />
          <Text text={countLabel} style={themed($itemSubText)} />
        </TouchableOpacity>
      )
    }

    return (
      <Screen
        preset="fixed"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top"]}
        backgroundColor={themed(({ colors }) => colors.background)}
      >
        <View style={themed($header)}>
          <View style={themed($headerTextContainer)}>
            <Button
              preset="secondary"
              text="Back"
              onPress={() => navigation.goBack()}
              style={themed($backButton)}
            />
            <View>
              <Text text={getHeadingText()} preset="heading" style={themed($heading)} />
              <Text text="Select Category" preset="default" style={themed($subHeading)} />
            </View>
          </View>
          <Button
            preset="secondary"
            text="Favs"
            onPress={() => navigation.navigate("Favorites")}
            style={themed($headerButton)}
          />
        </View>

        {channelStore.isLoading ? (
          <View style={themed($loadingContainer)}>
            <ActivityIndicator size="large" color={theme.colors.palette.primary500} />
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.category_id)}
            contentContainerStyle={themed($listContent)}
            numColumns={1}
            ListEmptyComponent={
              <EmptyState
                preset="generic"
                style={themed($emptyState)}
                heading="No Categories Found"
                content={`We couldn't find any ${getHeadingText()} categories.`}
                button={undefined}
              />
            }
          />
        )}
      </Screen>
    )
  },
)

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $loadingContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
})

const $heading: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 32,
  lineHeight: 38,
})

const $subHeading: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 14,
  marginBottom: spacing.xs,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.xl,
  marginBottom: spacing.lg,
})

const $headerTextContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
  minHeight: 36,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
})

const $headerButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minHeight: 36,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  marginLeft: spacing.xs,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.lg,
})

const $item: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.surface,
  padding: spacing.md,
  borderRadius: 12,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.borderLite,
})

const $itemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "600",
})

const $itemSubText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginTop: 2,
})
