import { FC, useEffect, useState } from "react"
import { Alert, ViewStyle } from "react-native"
import { observer } from "mobx-react-lite"
import Orientation from "react-native-orientation-locker"

import { VideoPlayer } from "../../components/Player/VideoPlayer"
import { Screen } from "../../components/Screen"
import { useStores } from "../../models/helpers/useStores"
import { AppStackScreenProps } from "../../navigators/navigationTypes"
import { colors } from "../../theme/colors"

interface PlayerScreenProps extends AppStackScreenProps<"Player"> {}

export const PlayerScreen: FC<PlayerScreenProps> = observer(function PlayerScreen({
  route,
  navigation,
}) {
  const { url, title, isLive, channel } = route.params
  const { favoritesStore, authenticationStore, settingsStore } = useStores()
  const [hasError, setHasError] = useState(false)
  const [isInvalidUrl, setIsInvalidUrl] = useState(false)

  const isFavorite =
    authenticationStore.authMethod === "m3u"
      ? favoritesStore.isM3UFavorite(channel?.id || url)
      : favoritesStore.isXtreamFavorite(channel?.stream_id)

  const toggleFavorite = () => {
    if (authenticationStore.authMethod === "m3u") {
      favoritesStore.toggleM3UFavorite(channel)
    } else {
      favoritesStore.toggleXtreamFavorite(channel)
    }
  }

  // Validate URL after hooks are called
  useEffect(() => {
    if (!url || typeof url !== "string") {
      setIsInvalidUrl(true)
      Alert.alert("Invalid URL", "The video URL is invalid or missing.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    }
  }, [url, navigation])

  useEffect(() => {
    // Don't lock orientation if URL is invalid
    if (isInvalidUrl) return

    // Improved orientation locking with error handling for Android compatibility
    try {
      Orientation.lockToLandscape()
    } catch (error) {
      // Orientation locking may fail on some Android devices
      console.warn("Failed to lock orientation:", error)
    }

    return () => {
      try {
        // Unlock orientation when leaving the screen
        Orientation.unlockAllOrientations()
        // Then lock to portrait for better UX
        setTimeout(() => {
          try {
            Orientation.lockToPortrait()
          } catch (error) {
            console.warn("Failed to lock to portrait:", error)
          }
        }, 100)
      } catch (error) {
        console.warn("Failed to unlock orientation:", error)
      }
    }
  }, [isInvalidUrl])

  // Don't render video player if URL is invalid
  if (isInvalidUrl) {
    return null
  }

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={$screenContentContainer}
      backgroundColor={colors.palette.neutral900}
      systemBarStyle="light"
    >
      <VideoPlayer
        source={url}
        title={title}
        isLive={isLive}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        initialAspectRatio={settingsStore.aspectRatio as any}
        userAgent={settingsStore.userAgent}
        referrer={settingsStore.referrer}
        onBack={() => navigation.goBack()}
        onError={(e) => {
          console.error("Video playback error:", e)
          if (!hasError) {
            setHasError(true)

            // Provide more specific error messages based on error type
            let errorMessage = "There was an error playing this video. Please try again later."

            if (e?.error?.code) {
              const errorCode = e.error.code
              if (errorCode === "NETWORK_ERROR" || errorCode === "CONNECTION_ERROR") {
                errorMessage = "Network error. Please check your internet connection and try again."
              } else if (errorCode === "FORMAT_ERROR" || errorCode === "DECODER_ERROR") {
                errorMessage = "Video format not supported. Please try a different stream."
              } else if (errorCode === "AUTHORIZATION_ERROR") {
                errorMessage = "Authorization failed. Please check your credentials."
              }
            }

            Alert.alert("Playback Error", errorMessage, [
              {
                text: "Retry",
                onPress: () => {
                  setHasError(false)
                  // Force video reload by navigating away and back
                  // This is a simple retry mechanism
                },
              },
              {
                text: "Go Back",
                style: "cancel",
                onPress: () => navigation.goBack(),
              },
            ])
          }
        }}
      />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
}
