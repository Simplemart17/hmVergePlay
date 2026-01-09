import { FC, useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
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

// Type for category items used throughout the screen
type CategoryItem = { category_id: string; category_name: string }

// --- Observer Components for Performance ---

// 1. The Item in the Main List
const CategoryListItem = observer(
  ({
    item,
    count,
    onPress,
    themed,
  }: {
    item: { category_id: string; category_name: string }
    count: number
    onPress: (item: any) => void
    themed: any
  }) => {
    return (
      <TouchableOpacity style={themed($item)} onPress={() => onPress(item)}>
        <Text text={item.category_name} style={themed($itemText)} />
        <Text
          text={item.category_id === "all" ? `${count} Channels` : `${count} Channels`}
          style={themed($itemSubText)}
        />
      </TouchableOpacity>
    )
  },
)

// 2. The Item in the Settings Modal (Toggle)
// This component observes the store and will re-render when hiddenCategoryIds changes
const CategorySettingToggle = observer(
  ({ item, playlistStore, themed }: { item: CategoryItem; playlistStore: any; themed: any }) => {
    // Use the reactive isCategoryHidden helper from the store
    // This ensures MobX properly tracks this dependency
    const isHidden = playlistStore.isCategoryHidden(item.category_id)
    const isVisible = !isHidden

    const handleToggle = () => {
      playlistStore.toggleHiddenCategory(item.category_id)
    }

    return (
      <TouchableOpacity style={themed($modalItem)} onPress={handleToggle}>
        <Text text={item.category_name} style={themed($modalItemText)} />
        <View style={[themed($checkbox), isVisible && themed($checkboxChecked)]}>
          {isVisible && <View style={themed($checkboxInner)} />}
        </View>
      </TouchableOpacity>
    )
  },
)

export const CategoryListScreen: FC<CategoryListScreenProps> = observer(
  function CategoryListScreen({ navigation }) {
    const { channelStore, playlistStore } = useStores()
    const { themed, theme } = useAppTheme()
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false)
    const [totalCount, setTotalCount] = useState(0)

    // --- Data Loading ---
    useEffect(() => {
      if (channelStore.rootStore.authenticationStore.authMethod !== "m3u") {
        if (!channelStore.hasFetchedAllChannels) {
          channelStore.loadContent(channelStore.selectedContentType)
        }
      }
    }, [channelStore, channelStore.selectedContentType])

    // --- Total Count Tracker ---
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
      channelStore.rootStore.m3uStore.channels.length,
      channelStore.selectedContentType,
    ])

    // --- Derived Data ---
    const getAllCategoryName = () => {
      switch (channelStore.selectedContentType) {
        case "live":
          return "All Channels"
        case "vod":
          return "All Movies"
        case "series":
          return "All Series"
        default:
          return "All Channels"
      }
    }

    // Get the reactive hidden category IDs from the store
    // This computed property ensures MobX properly tracks changes
    const hiddenCategoryIds = playlistStore.hiddenCategoryIds

    // Raw list of ALL categories (for the modal) - memoized for performance
    const allCategories = useMemo<CategoryItem[]>(() => {
      const baseCategories: CategoryItem[] =
        channelStore.rootStore.authenticationStore.authMethod === "m3u"
          ? channelStore.rootStore.m3uStore
              .getCategoriesByType(channelStore.selectedContentType)
              .map((c: string) => ({ category_id: c, category_name: c }))
          : channelStore.categories.map((cat) => ({
              category_id: cat.category_id,
              category_name: cat.category_name || cat.category_id,
            }))

      return [{ category_id: "all", category_name: getAllCategoryName() }, ...baseCategories]
    }, [
      channelStore.categories,
      channelStore.rootStore.authenticationStore.authMethod,
      channelStore.rootStore.m3uStore.channels.length,
      channelStore.selectedContentType,
    ])

    // Filtered list (for the main screen) - uses reactive hiddenCategoryIds
    // Memoized to avoid unnecessary recalculations
    const visibleCategories = useMemo<CategoryItem[]>(() => {
      return allCategories.filter((cat) => {
        if (cat.category_id === "all") return true // Always show 'All'
        return !hiddenCategoryIds.includes(cat.category_id)
      })
    }, [allCategories, hiddenCategoryIds])

    // --- Handlers ---
    const handleCategoryPress = useCallback(
      (item: any) => {
        if (channelStore.rootStore.authenticationStore.authMethod === "m3u") {
          navigation.navigate("ChannelList", { category: item.category_id })
        } else {
          channelStore.setCurrentCategory(item.category_id)
          navigation.navigate("ChannelList", {})
        }
      },
      [channelStore, navigation],
    )

    // --- Render Helpers ---
    const renderMainItem = ({ item }: { item: any }) => {
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

      return (
        <CategoryListItem item={item} count={count} onPress={handleCategoryPress} themed={themed} />
      )
    }

    const renderModalItem = ({ item }: { item: any }) => {
      if (item.category_id === "all") return null // Don't show 'All' in toggle list

      return <CategorySettingToggle item={item} playlistStore={playlistStore} themed={themed} />
    }

    const getHeadingText = () => {
      const map = {
        live: "Live TV",
        vod: "Movies",
        series: "Series",
        radio: "Radio",
      }
      const base = map[channelStore.selectedContentType as keyof typeof map] || "Channels"
      return totalCount > 0 ? `${base} (${totalCount})` : base
    }

    return (
      <Screen
        preset="fixed"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top"]}
        backgroundColor={themed(({ colors }) => colors.background)}
      >
        {/* Header */}
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
          <TouchableOpacity
            onPress={() => setIsSettingsModalVisible(true)}
            style={themed($headerIcon)}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        {channelStore.isLoading ? (
          <View style={themed($loadingContainer)}>
            <ActivityIndicator size="large" color={theme.colors.palette.primary500} />
          </View>
        ) : (
          <FlatList
            data={visibleCategories}
            renderItem={renderMainItem}
            keyExtractor={(item) => item.category_id}
            contentContainerStyle={themed($listContent)}
            // extraData forces re-render when hiddenCategoryIds changes
            // This is critical because FlatList uses reference equality optimization
            extraData={hiddenCategoryIds.length}
            // Performance props
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
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

        {/* Settings Modal */}
        {isSettingsModalVisible && (
          <View style={themed($modalOverlay)}>
            <View style={themed($modalContainer)}>
              <View style={themed($modalHeader)}>
                <Text text="Manage Categories" preset="subheading" />
                <TouchableOpacity
                  onPress={() => setIsSettingsModalVisible(false)}
                  style={themed($closeButton)}
                >
                  <Text text="Done" style={{ color: theme.colors.palette.primary500 }} />
                </TouchableOpacity>
              </View>
              <Text text="Uncheck to hide from the list" style={themed($modalSubtext)} />

              <FlatList
                data={allCategories}
                renderItem={renderModalItem}
                keyExtractor={(item) => `toggle_${item.category_id}`}
                contentContainerStyle={themed($modalListContent)}
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
              />
            </View>
          </View>
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

const $headerTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.lg, // Added some spacing
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
  minHeight: 36,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
})

const $headerIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.sm,
  marginLeft: spacing.xs,
  marginTop: spacing.lg, // Added some spacing to align with text
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

const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.8)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "90%",
  maxHeight: "80%",
  backgroundColor: colors.background,
  borderRadius: 16,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.borderLite,
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: "#333",
  paddingBottom: spacing.sm,
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  padding: 8,
})

const $modalSubtext: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginBottom: spacing.md,
})

const $modalListContent: ThemedStyle<ViewStyle> = () => ({
  flexGrow: 1,
})

const $modalItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.borderLite,
})

const $modalItemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  flex: 1,
  paddingRight: 10,
})

const $checkbox: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 24,
  height: 24,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: colors.textDim,
  justifyContent: "center",
  alignItems: "center",
})

const $checkboxChecked: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary500,
})

const $checkboxInner: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 10,
  height: 10,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 2,
})
