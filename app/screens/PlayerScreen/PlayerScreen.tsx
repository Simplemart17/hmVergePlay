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

  useEffect(() => {
    Orientation.lockToLandscape()
    return () => {
      Orientation.lockToPortrait()
    }
  }, [])

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
          console.error(e)
          if (!hasError) {
            setHasError(true)
            Alert.alert(
              "Playback Error",
              "There was an error playing this video. Please try again later.",
              [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ],
            )
          }
        }}
      />
    </Screen>
  )
})

const $screenContentContainer: ViewStyle = {
  flex: 1,
}
