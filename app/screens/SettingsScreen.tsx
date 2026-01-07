import { FC } from "react"
import { Alert, TextStyle, View, ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { observer } from "mobx-react-lite"

import { Button } from "../components/Button"
import { ListItem } from "../components/ListItem"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { useStores } from "../models/helpers/useStores"
import { AppStackScreenProps } from "../navigators/navigationTypes"
import { useAppTheme } from "../theme/context"
import { ThemedStyle } from "../theme/types"

interface SettingsScreenProps extends AppStackScreenProps<"Settings"> {}

export const SettingsScreen: FC<SettingsScreenProps> = observer(function SettingsScreen({
  navigation,
}) {
  const { themed, theme } = useAppTheme()
  const { settingsStore } = useStores()

  const handleStreamFormatPress = () => {
    Alert.alert("Select Live Stream Format", "Choose the format for live TV streams.", [
      {
        text: "MPEGTS (.ts)",
        onPress: () => settingsStore.setStreamFormat("ts"),
        style: settingsStore.streamFormat === "ts" ? "default" : "default",
      },
      {
        text: "HLS (.m3u8)",
        onPress: () => settingsStore.setStreamFormat("m3u8"),
        style: settingsStore.streamFormat === "m3u8" ? "default" : "default",
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ])
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($screenContentContainer)}
      backgroundColor={themed(({ colors }) => colors.background)}
      safeAreaEdges={["top"]}
    >
      <View style={themed($header)}>
        <Button
          preset="secondary"
          text="Back"
          onPress={() => navigation.goBack()}
          style={themed($backButton)}
        />
        <Text text="Settings" preset="heading" style={themed($heading)} />
      </View>

      <View style={themed($section)}>
        <Text text="General" preset="subheading" style={themed($sectionTitle)} />
        <View style={themed($connectedCard)}>
          <ListItem
            text="Live Stream Format"
            height={60}
            LeftComponent={
              <View style={themed($iconContainer)}>
                <Ionicons
                  name="videocam-outline"
                  size={24}
                  color={theme.colors.palette.primary500}
                />
              </View>
            }
            RightComponent={
              <View style={themed($valueContainer)}>
                <Text
                  text={settingsStore.streamFormat === "ts" ? "MPEGTS (.ts)" : "HLS (.m3u8)"}
                  style={themed($valueText)}
                />
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textDim} />
              </View>
            }
            onPress={handleStreamFormatPress}
            style={themed($listItem)}
          />
        </View>
      </View>

      <View style={themed($section)}>
        <Text text="About" preset="subheading" style={themed($sectionTitle)} />
        <View style={themed($connectedCard)}>
          <ListItem
            text="Version"
            height={60}
            LeftComponent={
              <View style={themed($iconContainer)}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={theme.colors.palette.secondary500}
                />
              </View>
            }
            RightComponent={<Text text="1.0.0" style={themed($valueText)} />}
            style={themed($listItemNoBorder)}
          />
        </View>
      </View>
    </Screen>
  )
})

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
  marginTop: spacing.xl,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.sm,
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: 1,
})

const $connectedCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: 16,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: colors.borderLite,
})

const $listItem: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.borderLite,
  paddingHorizontal: 16,
})

const $listItemNoBorder: ThemedStyle<ViewStyle> = () => ({
  borderBottomWidth: 0,
  paddingHorizontal: 16,
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
  width: 32,
  alignItems: "center",
})

const $valueContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $valueText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 14,
})
