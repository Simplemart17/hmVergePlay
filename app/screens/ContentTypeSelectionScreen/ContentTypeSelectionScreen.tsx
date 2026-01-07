import { FC, useState } from "react"
import {
  Alert,
  BackHandler,
  Platform,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { observer } from "mobx-react-lite"

import { LoadingIndicator } from "../../components/LoadingIndicator"
import { Screen } from "../../components/Screen"
import { Text } from "../../components/Text"
import { ContentType } from "../../models/ChannelStore"
import { useStores } from "../../models/helpers/useStores"
import { AppStackScreenProps } from "../../navigators/navigationTypes"
import { useAppTheme } from "../../theme/context"
import { ThemedStyle } from "../../theme/types"

interface ContentTypeSelectionScreenProps extends AppStackScreenProps<"ContentTypeSelection"> { }

export const ContentTypeSelectionScreen: FC<ContentTypeSelectionScreenProps> = observer(
  function ContentTypeSelectionScreen({ navigation }) {
    const { channelStore, authenticationStore } = useStores()
    const { themed, theme } = useAppTheme()
    const [isLoading, setIsLoading] = useState(false)

    const handleSelectContent = async (type: ContentType) => {
      setIsLoading(true)
      // Delay to ensure the loading indicator is rendered
      await new Promise((resolve) => setTimeout(resolve, 100))
      await channelStore.loadContent(type)
      setIsLoading(false)
      navigation.navigate("CategoryList")
    }

    const handleSwitchPlaylist = () => {
      setIsLoading(true)
      setTimeout(() => {
        authenticationStore.logout()
        // No need to set isLoading(false) as we are unmounting/navigating
      }, 500)
    }

    const handleRefresh = async () => {
      setIsLoading(true)
      await authenticationStore.refreshPlaylist()
      setIsLoading(false)
      Alert.alert("Success", "Playlist refreshed successfully.")
    }

    const handleExit = () => {
      Alert.alert(
        "Exit Application",
        "Are you sure you want to exit?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Exit",
            style: "destructive",
            onPress: () => {
              if (Platform.OS === "ios") {
                // iOS doesn't support programmatic exit in the same way as Android.
                // The recommended approach is to suspend, but we can't do that easily.
                // But strictly "closing" the app is against Apple HIG.
                // For iOS, we can show an alert saying "Please press the Home button to exit."
                Alert.alert("Exit", "Please press the Home button to close the application.")
              } else {
                BackHandler.exitApp()
              }
            },
          },
        ],
        { cancelable: true },
      )
    }

    const ContentCard = ({
      title,
      icon,
      type,
      color,
      style,
      onPress,
    }: {
      title: string
      icon: keyof typeof Ionicons.glyphMap
      type?: ContentType
      color: string
      style?: ViewStyle
      onPress?: () => void
    }) => (
      <TouchableOpacity
        style={[themed($card), style]}
        onPress={onPress || (() => type && handleSelectContent(type))}
      >
        <View style={[themed($iconContainer), { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={40} color={color} />
        </View>
        <Text text={title} preset="heading" style={themed($cardTitle)} />
        <Text text={type ? "Browse Collection" : "Tap to open"} style={themed($cardSubtitle)} />
      </TouchableOpacity>
    )

    const ActionButton = ({
      text,
      icon,
      onPress,
      color,
    }: {
      text: string
      icon: keyof typeof Ionicons.glyphMap
      onPress: () => void
      color?: string
    }) => (
      <TouchableOpacity style={themed($actionButton)} onPress={onPress}>
        <Ionicons
          name={icon}
          size={24}
          color={color || theme.colors.text}
          style={themed($actionIcon)}
        />
        <Text text={text} style={themed($actionButtonText)} />
      </TouchableOpacity>
    )

    return (
      <View style={$container}>
        <Screen
          preset="scroll"
          contentContainerStyle={themed($screenContentContainer)}
          safeAreaEdges={["top"]}
          backgroundColor={themed(({ colors }) => colors.background)}
        >
          <View style={themed($header)}>
            <View style={themed($headerTextContainer)}>
              <Text text="Welcome" preset="heading" style={themed($heading)} />
              <Text text="Select your entertainment" preset="default" style={themed($subHeading)} />
            </View>
          </View>

          <View style={themed($mainLayout)}>
            {/* Left Column: Tiles */}
            <View style={themed($tilesContainer)}>
              <View style={themed($tilesRow)}>
                <ContentCard
                  title="Live TV"
                  icon="tv-outline"
                  type="live"
                  color={theme.colors.palette.primary500}
                  style={themed($tileItemRight)}
                />
                <ContentCard
                  title="Movies"
                  icon="film-outline"
                  type="vod"
                  color={theme.colors.palette.secondary500}
                  style={themed($tileItem)}
                />
              </View>
              <View style={[themed($tilesRow), themed($topMargin)]}>
                <ContentCard
                  title="Series"
                  icon="albums-outline"
                  type="series"
                  color={theme.colors.palette.secondary300}
                  style={themed($tileItemRight)}
                />
                <ContentCard
                  title="Settings"
                  icon="settings-outline"
                  color={theme.colors.palette.neutral500}
                  onPress={() => navigation.navigate("Settings")}
                  style={themed($tileItem)}
                />
              </View>
            </View>

            {/* Right Column: Actions */}
            <View style={themed($actionsContainer)}>
              <ActionButton
                text="Switch Playlist"
                icon="swap-horizontal-outline"
                onPress={handleSwitchPlaylist}
                color={theme.colors.palette.primary500}
              />
              <ActionButton
                text="Refresh"
                icon="refresh-outline"
                onPress={handleRefresh}
                color={theme.colors.palette.primary300}
              />
              <ActionButton
                text="Exit"
                icon="log-out-outline"
                onPress={handleExit}
                color={theme.colors.error}
              />
            </View>
          </View>
        </Screen>
        <LoadingIndicator visible={isLoading || channelStore.isLoading} />
      </View>
    )
  },
)

const $container: ViewStyle = {
  flex: 1,
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.xl,
  marginBottom: spacing.lg,
})

const $headerTextContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $heading: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 32,
  lineHeight: 38,
})

const $subHeading: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 16,
  marginTop: spacing.xs,
})

const $mainLayout: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  flex: 1,
})

const $tilesContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 3,
  marginRight: 24,
})

const $tilesRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
})

const $actionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "flex-start",
  paddingTop: spacing.xs,
  gap: spacing.md,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.surface,
  borderRadius: 24,
  padding: spacing.xl,
  borderWidth: 1,
  borderColor: colors.borderLite,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 180,
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 72,
  height: 72,
  borderRadius: 36,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $cardTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 20,
  marginBottom: 4,
  textAlign: "center",
})

const $cardSubtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  textAlign: "center",
})

const $tileItemRight: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginRight: spacing.md,
})

const $tileItem: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $topMargin: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $actionIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.xs,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.surface,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.borderLite,
})

const $actionButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  fontWeight: "500",
})
