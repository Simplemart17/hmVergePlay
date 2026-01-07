import { FC, useState } from "react"
import { Alert, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Observer } from "mobx-react-lite"

import { LoadingIndicator } from "../components/LoadingIndicator"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { Playlist, useStores } from "../models"
import { AppStackScreenProps } from "../navigators/navigationTypes"
import { colors } from "../theme/colors"
import { spacing } from "../theme/spacing"

interface PlaylistSelectionScreenProps extends AppStackScreenProps<"PlaylistSelection"> {}

export const PlaylistSelectionScreen: FC<PlaylistSelectionScreenProps> = ({ navigation }) => {
  const { playlistStore, authenticationStore } = useStores()
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectPlaylist = async (playlist: Playlist) => {
    setIsLoading(true)
    // Authenticate with selected playlist
    if (playlist.type === "xtream") {
      if (playlist.serverUrl && playlist.username && playlist.password) {
        authenticationStore.setXtreamCredentials(
          playlist.serverUrl,
          playlist.username,
          playlist.password,
        )
        // Trigger login flow or just navigate if we assume credentials are correct
        // For now, let's assume valid credentials and just set them, but ideally we re-auth
        await authenticationStore.login(playlist.serverUrl, playlist.username, playlist.password)
      }
    } else if (playlist.type === "m3u") {
      if (playlist.m3uUrl) {
        await authenticationStore.loginM3U(playlist.m3uUrl)
      }
    }
    setIsLoading(false)
  }

  const handlePlaylistLongPress = (playlist: Playlist) => {
    Alert.alert(playlist.name, "Manage Playlist", [
      {
        text: "Edit",
        onPress: () => {
          Alert.alert("Edit", "To edit, please remove and re-add the playlist.")
        },
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          playlistStore.removePlaylist(playlist.id)
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ])
  }

  const handleAddPlaylist = () => {
    navigation.navigate("Login")
  }

  return (
    <View style={$container}>
      <LoadingIndicator visible={isLoading} />
      <LinearGradient
        colors={[colors.palette.neutral900, "#1a1b2e", "#0f0f14"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={$gradient}
      />
      <Screen
        preset="scroll"
        contentContainerStyle={$screenContentContainer}
        backgroundColor="transparent"
      >
        <View style={$logoContainer}>
          <View style={$logoTextRow}>
            <Text text="HM" preset="heading" style={$logoTextPrimary} />
            <Text text="VERGE" preset="heading" style={$logoTextSecondary} />
          </View>
          <Text text="PLAY" preset="subheading" style={$logoSubtitle} />
        </View>

        <Text text="Select Playlist" preset="heading" style={$title} />

        <View style={$playlistContainer}>
          <Observer>
            {() => (
              <>
                {playlistStore.playlists.map((playlist) => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={$playlistButton}
                    onPress={() => handleSelectPlaylist(playlist)}
                    onLongPress={() => handlePlaylistLongPress(playlist)}
                  >
                    <View style={$innerCircle}>
                      <Text text={playlist.name} style={$playlistText} />
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </Observer>

          <TouchableOpacity style={$playlistButton} onPress={handleAddPlaylist}>
            <View style={$innerCircle}>
              <Text text="Add Playlist" style={$playlistText} />
            </View>
          </TouchableOpacity>
        </View>
      </Screen>
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
}

const $gradient: ViewStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
}

const $logoContainer: ViewStyle = {
  alignItems: "center",
  marginBottom: spacing.xxl,
}

const $logoTextRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
}

const $logoTextPrimary: TextStyle = {
  fontSize: 48,
  color: colors.tint,
}

const $logoTextSecondary: TextStyle = {
  fontSize: 48,
  color: colors.text,
}

const $logoSubtitle: TextStyle = {
  letterSpacing: 8,
  color: colors.textDim,
  fontSize: 14,
}

const $title: TextStyle = {
  marginBottom: spacing.xxl,
  color: colors.text,
  fontSize: 32,
}

const $playlistContainer: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: spacing.xl,
}

const $playlistButton: ViewStyle = {
  width: 150,
  height: 150,
  borderRadius: 75,
  borderWidth: 2,
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.glass10,
  alignItems: "center",
  justifyContent: "center",
  padding: 4, // Space between double lines
}

const $innerCircle: ViewStyle = {
  width: "100%",
  height: "100%",
  borderRadius: 75,
  borderWidth: 1,
  borderColor: colors.palette.secondary500,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.overlay20,
}

const $playlistText: TextStyle = {
  color: colors.text,
  fontSize: 18,
  textAlign: "center",
  fontWeight: "bold",
}
