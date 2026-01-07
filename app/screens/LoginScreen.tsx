import { ComponentType, FC, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  TextStyle,
  TouchableOpacity,
  UIManager,
  View,
  ViewStyle,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { observer } from "mobx-react-lite"

import { Button, ButtonAccessoryProps } from "../components/Button"
import { PressableIcon } from "../components/Icon"
import { LoadingIndicator } from "../components/LoadingIndicator"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { TextField, type TextFieldAccessoryProps } from "../components/TextField"
import { useStores } from "../models/helpers/useStores"
import type { AppStackScreenProps } from "../navigators/navigationTypes"
import { useAppTheme } from "../theme/context"
import type { ThemedStyle } from "../theme/types"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = observer(function LoginScreen(_props) {
  const { navigation } = _props
  const authPasswordInput = useRef<any>(null)
  const authUsernameInput = useRef<any>(null)

  const [serverUrl, setServerUrl] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [m3uUrl, setM3UUrl] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loginMethod, setLoginMethod] = useState<"xtream" | "m3u">("xtream")

  const { authenticationStore, playlistStore } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  async function login() {
    setIsSubmitted(true)

    if (loginMethod === "xtream") {
      if (!serverUrl || !username || !password) return
      await authenticationStore.login(serverUrl, username, password)
    } else {
      if (!m3uUrl) return
      await authenticationStore.loginM3U(m3uUrl)
    }

    // If successful, and we were adding a playlist, we should navigate to ContentTypeSelection
    // But since the navigator watches `isAuthenticated`, it might happen automatically.
    // However, if we came from PlaylistSelectionScreen, we might want to pop back if logic requires.
    // Currently, authenticationStore.login sets isAuthenticated=true immediately.
    // The navigator will switch stack.
  }

  function toggleLoginMethod(method: "xtream" | "m3u") {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setLoginMethod(method)
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={colors.textDim}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        )
      },
    [isAuthPasswordHidden, colors.textDim],
  )

  const LoadingAccessory: ComponentType<ButtonAccessoryProps> = useMemo(
    () =>
      function LoadingAccessory(props: ButtonAccessoryProps) {
        return (
          <ActivityIndicator size="small" color={colors.palette.neutral900} style={props.style} />
        )
      },
    [colors.palette.neutral900],
  )

  return (
    <View style={themed($container)}>
      <LoadingIndicator visible={authenticationStore.isLoading} />
      <LinearGradient
        colors={[colors.palette.neutral900, "#1a1b2e", "#0f0f14"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={themed($gradient)}
      />
      <Screen
        preset="auto"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top", "bottom"]}
        backgroundColor="transparent"
      >
        <View style={themed($logoContainer)}>
          <View style={themed($logoTextRow)}>
            <Text text="HM" preset="heading" style={themed($logoTextPrimary)} />
            <Text text="VERGE" preset="heading" style={themed($logoTextSecondary)} />
          </View>
          <Text text="PLAY" preset="subheading" style={themed($logoSubtitle)} />
        </View>

        <View style={themed($card)}>
          <Text
            testID="login-heading"
            text="Create Playlist"
            preset="heading"
            style={themed($logIn)}
          />
          <Text
            text="Enter your credentials to access live TV and VOD."
            preset="default"
            style={themed($enterDetails)}
          />

          <View style={themed($tabContainer)}>
            <TouchableOpacity
              style={[themed($tab), loginMethod === "xtream" && themed($activeTab)]}
              onPress={() => toggleLoginMethod("xtream")}
            >
              <Text
                text="Xtream Codes"
                style={[themed($tabText), loginMethod === "xtream" && themed($activeTabText)]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[themed($tab), loginMethod === "m3u" && themed($activeTab)]}
              onPress={() => toggleLoginMethod("m3u")}
            >
              <Text
                text="M3U Playlist"
                style={[themed($tabText), loginMethod === "m3u" && themed($activeTabText)]}
              />
            </TouchableOpacity>
          </View>

          {loginMethod === "xtream" ? (
            <View>
              <TextField
                value={serverUrl}
                onChangeText={setServerUrl}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoComplete="url"
                autoCorrect={false}
                keyboardType="url"
                label="Server URL"
                placeholder="http://example.com:8080"
                status={isSubmitted && !serverUrl ? "error" : undefined}
                onSubmitEditing={() => authUsernameInput.current?.focus()}
              />

              <TextField
                ref={authUsernameInput}
                value={username}
                onChangeText={setUsername}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect={false}
                label="Username"
                placeholder="Enter username"
                status={isSubmitted && !username ? "error" : undefined}
                onSubmitEditing={() => authPasswordInput.current?.focus()}
              />

              <TextField
                ref={authPasswordInput}
                value={password}
                onChangeText={setPassword}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                secureTextEntry={isAuthPasswordHidden}
                label="Password"
                placeholder="Enter password"
                status={isSubmitted && !password ? "error" : undefined}
                onSubmitEditing={login}
                RightAccessory={PasswordRightAccessory}
              />
            </View>
          ) : (
            <TextField
              value={m3uUrl}
              onChangeText={setM3UUrl}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoComplete="url"
              autoCorrect={false}
              keyboardType="url"
              label="M3U Playlist URL"
              placeholder="http://example.com/playlist.m3u"
              status={isSubmitted && !m3uUrl ? "error" : undefined}
              onSubmitEditing={login}
            />
          )}

          {authenticationStore.error && (
            <Text text={authenticationStore.error} style={themed($error)} preset="default" />
          )}

          {playlistStore.hasPlaylists && navigation.canGoBack() && (
            <Button
              preset="secondary"
              text="Back to Playlists"
              onPress={() => navigation.goBack()}
              style={themed($backButton)}
            />
          )}

          <Button
            testID="login-button"
            text="Create Playlist"
            style={themed($tapButton)}
            preset="reversed"
            onPress={login}
            disabled={authenticationStore.isLoading}
            RightAccessory={authenticationStore.isLoading ? LoadingAccessory : undefined}
          />
        </View>
      </Screen>
    </View>
  )
})

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $gradient: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
  flexGrow: 1,
  justifyContent: "center",
})

const $logoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.xxl,
})

const $logoTextRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
})

const $logoTextPrimary: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 48,
  color: colors.tint,
})

const $logoTextSecondary: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 48,
  color: colors.text,
})

const $logoSubtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  letterSpacing: 8,
  color: colors.textDim,
  fontSize: 14,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.glass,
  borderRadius: 24,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.borderLite,
})

const $logIn: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $enterDetails: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.lg,
  color: colors.textDim,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $error: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
})

const $tabContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  marginBottom: spacing.xl,
  backgroundColor: colors.backgroundLite,
  borderRadius: 12,
  padding: 4,
})

const $tab: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingVertical: spacing.sm,
  alignItems: "center",
  borderRadius: 8,
})

const $activeTab: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.surfaceHighlight,
})

const $tabText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontWeight: "500",
})

const $activeTabText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "700",
})
