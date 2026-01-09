import { FC, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { observer } from "mobx-react-lite"

import { Button } from "../components/Button"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { useStores } from "../models/helpers/useStores"
import { AppStackScreenProps } from "../navigators/navigationTypes"
import { XtreamApi } from "../services/api/xtreamApi"
import { useAppTheme } from "../theme/context"
import { ThemedStyle } from "../theme/types"

interface SeriesDetailsScreenProps extends AppStackScreenProps<"SeriesDetails"> {}

export const SeriesDetailsScreen: FC<SeriesDetailsScreenProps> = observer(
  function SeriesDetailsScreen({ navigation, route }) {
    const { series } = route.params
    const { authenticationStore } = useStores()
    const { themed, theme } = useAppTheme()
    const [loading, setLoading] = useState(true)
    const [episodes, setEpisodes] = useState<any[]>([])
    const [info, setInfo] = useState<any>(null)

    useEffect(() => {
      async function fetchDetails() {
        if (
          !authenticationStore.serverUrl ||
          !authenticationStore.username ||
          !authenticationStore.password
        )
          return

        const api = new XtreamApi(authenticationStore.serverUrl)
        const result = await api.getSeriesInfo(
          authenticationStore.username,
          authenticationStore.password,
          series.series_id,
        )

        if (result.kind === "ok") {
          // Result usually has { info: {...}, episodes: { "1": [...], "2": [...] } }
          // Flatten episodes or handle seasons
          setInfo(result.data.info)
          // Episodes might be an object keyed by season number
          const epsData = result.data.episodes
          let allEps: any[] = []
          if (Array.isArray(epsData)) {
            allEps = epsData
          } else if (typeof epsData === "object") {
            // Flatten seasons
            Object.keys(epsData).forEach((seasonKey) => {
              const seasonEps = epsData[seasonKey]
              if (Array.isArray(seasonEps)) {
                allEps = allEps.concat(seasonEps)
              }
            })
          }
          setEpisodes(allEps)
        } else {
          Alert.alert("Error", "Failed to load series details")
        }
        setLoading(false)
      }

      fetchDetails()
    }, [series.series_id, authenticationStore])

    const playEpisode = (episode: any) => {
      const extension = episode.container_extension || "mp4"
      const streamUrl = `${authenticationStore.serverUrl}/series/${authenticationStore.username}/${authenticationStore.password}/${episode.id}.${extension}`

      navigation.navigate("Player", {
        url: streamUrl,
        title: `${episode.title} - S${episode.season} E${episode.episode_num}`,
        isLive: false,
        channel: episode, // Pass episode as channel for player context
      })
    }

    const renderEpisode = ({ item }: { item: any }) => {
      return (
        <TouchableOpacity style={themed($episodeItem)} onPress={() => playEpisode(item)}>
          <View style={themed($playIconContainer)}>
            <Ionicons name="play-circle" size={32} color={theme.colors.palette.primary500} />
          </View>
          <View style={themed($episodeTextContainer)}>
            <Text
              text={`S${item.season} E${item.episode_num} - ${item.title}`}
              style={themed($episodeTitle)}
            />
            {item.info && typeof item.info === "object" && (
              <Text text={item.info.duration || ""} style={themed($episodeDuration)} />
            )}
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <Screen
        preset="fixed"
        contentContainerStyle={themed($screenContent)}
        backgroundColor={themed(({ colors }) => colors.background)}
      >
        <View style={themed($header)}>
          <Button
            preset="secondary"
            text="Back"
            onPress={() => navigation.goBack()}
            style={themed($backButton)}
          />
          <Text text="Series Details" preset="heading" style={themed($heading)} />
        </View>

        <View style={themed($infoSection)}>
          <View style={themed($coverContainer)}>
            {series.cover || series.stream_icon ? (
              <Image
                source={{ uri: series.cover || series.stream_icon }}
                style={themed($coverImage)}
                resizeMode="cover"
              />
            ) : (
              <View style={themed($placeholderCover)} />
            )}
          </View>
          <View style={themed($detailsContainer)}>
            <Text text={series.name || series.title} preset="subheading" style={themed($title)} />
            {info && <Text text={info.plot} style={themed($plot)} numberOfLines={4} />}
            {info && <Text text={`Genre: ${info.genre || "N/A"}`} style={themed($meta)} />}
            {info && <Text text={`Release: ${info.releaseDate || "N/A"}`} style={themed($meta)} />}
          </View>
        </View>

        <Text text="Episodes" preset="subheading" style={themed($sectionTitle)} />

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.palette.primary500}
            style={themed($loader)}
          />
        ) : (
          <FlatList
            data={episodes}
            renderItem={renderEpisode}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={themed($listContent)}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </Screen>
    )
  },
)

const $screenContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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
  fontSize: 24,
})

const $infoSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  marginBottom: spacing.lg,
})

const $coverContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 100,
  height: 150,
  borderRadius: 8,
  backgroundColor: colors.surfaceHighlight,
  overflow: "hidden",
})

const $coverImage: ThemedStyle<ImageStyle> = () => ({
  width: "100%",
  height: "100%",
})

const $placeholderCover: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: "100%",
  height: "100%",
  backgroundColor: colors.surfaceHighlight,
})

const $detailsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginLeft: spacing.md,
})

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  marginBottom: 4,
})

const $plot: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginBottom: spacing.sm,
})

const $meta: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontSize: 12,
  marginBottom: 2,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  marginBottom: spacing.md,
})

const $episodeItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.md,
  backgroundColor: colors.surface,
  marginBottom: spacing.sm,
  borderRadius: 8,
})

const $playIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
})

const $episodeTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "bold",
})

const $episodeDuration: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $episodeTextContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $loader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
