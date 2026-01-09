import { FC, useCallback, useEffect, useState } from "react"
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
    const [error, setError] = useState<string | null>(null)
    const [episodes, setEpisodes] = useState<any[]>([])
    const [info, setInfo] = useState<any>(null)
    const [retryCount, setRetryCount] = useState(0)

    const fetchDetails = useCallback(async () => {
      if (
        !authenticationStore.serverUrl ||
        !authenticationStore.username ||
        !authenticationStore.password
      ) {
        setError("Authentication credentials are missing")
        setLoading(false)
        return
      }

      // Validate series_id
      if (!series?.series_id) {
        setError("Invalid series information")
        setLoading(false)
        return
      }

      try {
        setError(null)
        const api = new XtreamApi(authenticationStore.serverUrl)
        const result = await api.getSeriesInfo(
          authenticationStore.username,
          authenticationStore.password,
          Number(series.series_id),
        )

        if (result.kind === "ok") {
          // Result usually has { info: {...}, episodes: { "1": [...], "2": [...] } }
          // Flatten episodes or handle seasons
          setInfo(result.data?.info || null)

          // Episodes might be an object keyed by season number or an array
          const epsData = result.data?.episodes
          let allEps: any[] = []

          if (Array.isArray(epsData)) {
            allEps = epsData
          } else if (epsData && typeof epsData === "object") {
            // Flatten seasons - sort by season number for better UX
            const seasonKeys = Object.keys(epsData).sort((a, b) => {
              const numA = parseInt(a, 10) || 0
              const numB = parseInt(b, 10) || 0
              return numA - numB
            })

            seasonKeys.forEach((seasonKey) => {
              const seasonEps = epsData[seasonKey]
              if (Array.isArray(seasonEps)) {
                // Sort episodes within season by episode number
                const sortedEps = seasonEps.sort((a, b) => {
                  const epNumA = a.episode_num || 0
                  const epNumB = b.episode_num || 0
                  return epNumA - epNumB
                })
                allEps = allEps.concat(sortedEps)
              }
            })
          }

          setEpisodes(allEps)
          setRetryCount(0) // Reset retry count on success
        } else {
          // Retry logic for transient errors
          if (retryCount < 2 && (result.kind === "timeout" || result.kind === "unknown")) {
            setRetryCount((prev) => prev + 1)
            setTimeout(() => fetchDetails(), 1000 * (retryCount + 1)) // Exponential backoff
            return
          }

          const errorMessage =
            result.kind === "timeout"
              ? "Request timed out. Please check your connection."
              : result.kind === "unauthorized"
                ? "Authentication failed. Please check your credentials."
                : "Failed to load series details. Please try again."
          setError(errorMessage)
        }
      } catch (e: any) {
        console.error("Error fetching series details:", e)
        setError(e?.message || "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }, [
      authenticationStore.serverUrl,
      authenticationStore.username,
      authenticationStore.password,
      series?.series_id,
      retryCount,
    ])

    useEffect(() => {
      fetchDetails()
    }, [fetchDetails])

    const playEpisode = useCallback(
      (episode: any) => {
        if (!episode?.id) {
          Alert.alert("Error", "Invalid episode information")
          return
        }

        const extension = episode.container_extension || "mp4"
        const streamUrl = `${authenticationStore.serverUrl}/series/${authenticationStore.username}/${authenticationStore.password}/${episode.id}.${extension}`

        navigation.navigate("Player", {
          url: streamUrl,
          title: `${episode.title || "Episode"} - S${episode.season || "?"} E${episode.episode_num || "?"}`,
          isLive: false,
          channel: episode, // Pass episode as channel for player context
        })
      },
      [
        authenticationStore.serverUrl,
        authenticationStore.username,
        authenticationStore.password,
        navigation,
      ],
    )

    const renderEpisode = useCallback(
      ({ item }: { item: any }) => {
        const episodeTitle = item.title || "Untitled Episode"
        const season = item.season || "?"
        const episodeNum = item.episode_num || "?"
        const duration = item.info?.duration || item.duration || ""

        return (
          <TouchableOpacity style={themed($episodeItem)} onPress={() => playEpisode(item)}>
            <View style={themed($playIconContainer)}>
              <Ionicons name="play-circle" size={32} color={theme.colors.palette.primary500} />
            </View>
            <View style={themed($episodeTextContainer)}>
              <Text
                text={`S${season} E${episodeNum} - ${episodeTitle}`}
                style={themed($episodeTitle)}
              />
              {duration && <Text text={duration} style={themed($episodeDuration)} />}
            </View>
          </TouchableOpacity>
        )
      },
      [playEpisode, themed, theme],
    )

    const keyExtractor = useCallback(
      (item: any, index: number) => item.id?.toString() || `episode-${index}`,
      [],
    )

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
                onError={() => {
                  // Image failed to load, will show placeholder
                }}
              />
            ) : (
              <View style={themed($placeholderCover)}>
                <Ionicons name="film-outline" size={48} color={theme.colors.textDim} />
              </View>
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
        ) : error ? (
          <View style={themed($errorContainer)}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text text={error} style={themed($errorText)} />
            <Button
              preset="default"
              text="Retry"
              onPress={() => {
                setRetryCount(0)
                setLoading(true)
                fetchDetails()
              }}
              style={themed($retryButton)}
            />
          </View>
        ) : episodes.length === 0 ? (
          <View style={themed($emptyContainer)}>
            <Ionicons name="film-outline" size={48} color={theme.colors.textDim} />
            <Text text="No episodes available" style={themed($emptyText)} />
          </View>
        ) : (
          <FlatList
            data={episodes}
            renderItem={renderEpisode}
            keyExtractor={keyExtractor}
            contentContainerStyle={themed($listContent)}
            initialNumToRender={15}
            maxToRenderPerBatch={15}
            windowSize={10}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
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

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  fontSize: 16,
  textAlign: "center",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $retryButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  minWidth: 120,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 16,
  textAlign: "center",
  marginTop: spacing.md,
})
