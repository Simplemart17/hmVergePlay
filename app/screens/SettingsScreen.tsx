import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { observer } from "mobx-react-lite"

import { Button } from "../components/Button"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { AppStackScreenProps } from "../navigators/navigationTypes"
import { useAppTheme } from "../theme/context"
import { ThemedStyle } from "../theme/types"

interface SettingsScreenProps extends AppStackScreenProps<"Settings"> {}

export const SettingsScreen: FC<SettingsScreenProps> = observer(function SettingsScreen({
  navigation,
}) {
  const { themed } = useAppTheme()

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

      <View style={themed($content)}>
        <Text text="Settings Placeholder" />
        <Text text="Version 1.0.0" style={$versionText} />
      </View>
    </Screen>
  )
})

const $versionText: TextStyle = {
  marginTop: 20,
  opacity: 0.5,
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

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
