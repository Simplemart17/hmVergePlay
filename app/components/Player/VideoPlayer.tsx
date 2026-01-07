import { useRef, useState, useEffect, useCallback } from "react"
import {
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  // Image,
} from "react-native"
import * as Brightness from "expo-brightness"
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Video, { VideoRef, OnLoadData, OnProgressData } from "react-native-video"

import { colors as themeColors } from "../../theme/colors"
import { Text } from "../Text"

interface VideoPlayerProps {
  source: string
  title?: string
  isLive?: boolean
  onBack?: () => void
  onEnd?: () => void
  onError?: (e: any) => void
  style?: any
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

type AspectRatio = "default" | "16:9" | "16:10" | "4:3" | "fill"

export const VideoPlayer = ({
  source,
  title,
  isLive,
  onBack,
  onEnd,
  onError,
  style,
  isFavorite,
  onToggleFavorite,
}: VideoPlayerProps) => {
  const videoRef = useRef<VideoRef>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("default")
  const [volume, setVolume] = useState(1.0)
  const [brightness, setBrightness] = useState(0.5)
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const insets = useSafeAreaInsets()

  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  // Brightness and Volume state for UI display
  // const [isAdjustingBrightness, setIsAdjustingBrightness] = useState(false)
  // const [isAdjustingVolume, setIsAdjustingVolume] = useState(false)

  const [isAspectRatioMenuVisible, setIsAspectRatioMenuVisible] = useState(false)

  const handleAspectRatioSelect = (ratio: AspectRatio) => {
    setAspectRatio(ratio)
    setIsAspectRatioMenuVisible(false)
  }

  const toggleAspectRatioMenu = () => {
    setIsAspectRatioMenuVisible(!isAspectRatioMenuVisible)
  }

  // Only request brightness permission on mount, no direct call to native modules on mount to avoid overload
  useEffect(() => {
    // Initial brightness
    ;(async () => {
      try {
        const { status } = await Brightness.requestPermissionsAsync()
        if (status === "granted") {
          const currentBrightness = await Brightness.getBrightnessAsync()
          setBrightness(currentBrightness)
        }
      } catch (e) {
        console.log("Error requesting brightness permissions:", e)
      }
    })()
  }, [])

  const handleBrightnessChange = useCallback(
    async (delta: number) => {
      const newBrightness = Math.max(0, Math.min(1, brightness + delta))
      setBrightness(newBrightness)
      // setIsAdjustingBrightness(true)
      try {
        await Brightness.setBrightnessAsync(newBrightness)
      } catch {
        // Ignore brightness setting errors
      }
      // Debounce hiding indicator
      // setTimeout(() => setIsAdjustingBrightness(false), 1000)
    },
    [brightness],
  )

  const handleVolumeChange = useCallback(
    (delta: number) => {
      const newVolume = Math.max(0, Math.min(1, volume + delta))
      setVolume(newVolume)
      // setIsAdjustingVolume(true)
      // Debounce hiding indicator
      // setTimeout(() => setIsAdjustingVolume(false), 1000)
    },
    [volume],
  )

  // Gestures
  const brightnessGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Sensitivity factor, negative because moving up should increase brightness
      handleBrightnessChange(-e.velocityY / 5000)
    })
    .runOnJS(true)

  const volumeGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Sensitivity factor
      handleVolumeChange(-e.velocityY / 5000)
    })
    .runOnJS(true)

  const getResizeMode = (): "contain" | "stretch" | "cover" => {
    if (aspectRatio === "fill") return "cover"
    if (aspectRatio === "default") return "contain"
    return "stretch"
  }

  // To support specific aspect ratios like 16:9 forcing, we might need to adjust the video style dimensions.
  // But video style 'width: 100%, height: 100%' fills the parent.
  // If we want to force 4:3 on a 16:9 screen, we can set width/height.
  const getVideoStyle = () => {
    const { width, height } = Dimensions.get("window")
    if (aspectRatio === "default" || aspectRatio === "fill") {
      return styles.video
    }

    // Calculate desired dimensions based on ratio
    let targetRatio = 16 / 9
    if (aspectRatio === "16:10") targetRatio = 16 / 10
    if (aspectRatio === "4:3") targetRatio = 4 / 3

    let w = width
    let h = width / targetRatio
    if (h > height) {
      h = height
      w = height * targetRatio
    }

    return {
      width: w,
      height: h,
      alignSelf: "center" as const,
    }
  }

  // Effect to clean up animations
  useEffect(() => {
    if (isLoading) {
      const animateDot = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 500,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        )
      }

      const anim1 = animateDot(dot1, 0)
      const anim2 = animateDot(dot2, 200)
      const anim3 = animateDot(dot3, 400)

      anim1.start()
      anim2.start()
      anim3.start()

      return () => {
        anim1.stop()
        anim2.stop()
        anim3.stop()
      }
    } else {
      dot1.setValue(0)
      dot2.setValue(0)
      dot3.setValue(0)
      return undefined
    }
  }, [isLoading, dot1, dot2, dot3])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (showControls && !paused) {
      timeout = setTimeout(() => setShowControls(false), 5000)
    }
    return () => clearTimeout(timeout)
  }, [showControls, paused])

  const toggleControls = () => {
    // If aspect ratio menu is open, close it and don't toggle controls
    if (isAspectRatioMenuVisible) {
      setIsAspectRatioMenuVisible(false)
      return
    }
    setShowControls(!showControls)
  }

  const hideControls = () => {
    if (showControls) {
      setShowControls(false)
    }
  }

  const togglePlayPause = () => {
    setPaused(!paused)
    setShowControls(true)
  }

  const handleLoad = (data: OnLoadData) => {
    setIsLoading(false)
    setVideoSize(data.naturalSize)
    setDuration(data.duration)
  }

  const handleProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime)
  }

  const getProgress = () => {
    if (isLive) return 100
    if (duration > 0) {
      return (currentTime / duration) * 100
    }
    return 0
  }

  return (
    <GestureHandlerRootView style={[styles.container, style]}>
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: source }}
            style={getVideoStyle()}
            onLoadStart={() => setIsLoading(true)}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onEnd={onEnd}
            onError={(e) => {
              setIsLoading(false)
              if (onError) onError(e)
            }}
            resizeMode={getResizeMode()}
            paused={paused}
            bufferConfig={{
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000,
            }}
          />
        </View>
      </TouchableWithoutFeedback>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <GestureDetector gesture={brightnessGesture}>
          <View style={styles.leftGestureArea} />
        </GestureDetector>
        <GestureDetector gesture={volumeGesture}>
          <View style={styles.rightGestureArea} />
        </GestureDetector>
      </View>

      {/* Brightness Indicator */}
      {/* {isAdjustingBrightness && (
        <View style={styles.indicatorContainer}>
          <Ionicons name="sunny" size={24} color="white" />
          <View style={styles.indicatorBar}>
            <View style={[styles.indicatorFill, { height: `${brightness * 100}%` }]} />
          </View>
        </View>
      )} */}

      {/* Volume Indicator */}
      {/* {isAdjustingVolume && (
        <View style={[styles.indicatorContainer, styles.volumeIndicator]}>
          <Ionicons name="volume-high" size={24} color="white" />
          <View style={styles.indicatorBar}>
            <View style={[styles.indicatorFill, { height: `${volume * 100}%` }]} />
          </View>
        </View>
      )} */}

      {isLoading && (
        <View style={styles.loading}>
          <Text text="Connecting ..." style={styles.loadingText} />
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.pulsatingDot, { opacity: dot1 }]} />
            <Animated.View style={[styles.pulsatingDot, { opacity: dot2 }]} />
            <Animated.View style={[styles.pulsatingDot, { opacity: dot3 }]} />
          </View>
        </View>
      )}

      {showControls && (
        <TouchableWithoutFeedback onPress={hideControls}>
          <View
            style={[
              styles.controls,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right,
              },
            ]}
          >
            {/* Top Controls */}
            <View style={styles.topControls}>
              <View style={styles.topLeftControls}>
                {onBack && (
                  <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.topRightControls}>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialCommunityIcons name="view-grid-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onToggleFavorite}
                  disabled={!onToggleFavorite}
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={24}
                    color={isFavorite ? themeColors.palette.angry500 : "white"}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="search" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <MaterialIcons name="subtitles" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="musical-note" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleAspectRatioMenu} style={styles.iconButton}>
                  <MaterialCommunityIcons name="aspect-ratio" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Aspect Ratio Menu */}
            {isAspectRatioMenuVisible && (
              <View
                style={[
                  styles.aspectRatioMenu,
                  Platform.OS === "ios" && styles.aspectRatioMenuCentered,
                ]}
              >
                {(["default", "16:9", "16:10", "4:3", "fill"] as AspectRatio[]).map((ratio) => (
                  <TouchableOpacity
                    key={ratio}
                    onPress={() => handleAspectRatioSelect(ratio)}
                    style={[
                      styles.aspectRatioOption,
                      aspectRatio === ratio && styles.aspectRatioOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.aspectRatioOptionText,
                        aspectRatio === ratio && styles.aspectRatioOptionTextSelected,
                      ]}
                    >
                      {ratio.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Vertical Sliders (Brightness & Volume) */}
            <View style={styles.sideControlsContainer} pointerEvents="none">
              {/* Brightness Slider */}
              <View style={styles.sliderContainer}>
                <Ionicons name="sunny" size={20} color="white" style={styles.sliderIcon} />
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderKnob, { bottom: `${brightness * 100}%` }]} />
                </View>
              </View>

              {/* Volume Slider */}
              <View style={styles.sliderContainer}>
                <Ionicons name="volume-high" size={20} color="white" style={styles.sliderIcon} />
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderKnob, { bottom: `${volume * 100}%` }]} />
                </View>
              </View>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity style={styles.skipButton}>
                <Ionicons name="play-skip-back" size={32} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
                <Ionicons name={paused ? "play" : "pause"} size={48} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton}>
                <Ionicons name="play-skip-forward" size={32} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              <View style={styles.bottomInfoRow}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{title || "Unknown Title"}</Text>
                </View>
                <View style={styles.statusInfo}>
                  {isLive && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                  {videoSize && (
                    <Text style={styles.resolutionText}>
                      {Math.round(videoSize.width)}x{Math.round(videoSize.height)}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${getProgress()}%` }]} />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  aspectRatioMenu: {
    backgroundColor: themeColors.palette.overlay50,
    borderRadius: 8,
    padding: 8,
    position: "absolute",
    right: 20,
    top: 60,
    width: 120,
    zIndex: 101,
  },
  aspectRatioMenuCentered: {
    bottom: undefined,
    left: "50%",
    right: undefined,
    top: "50%",
    transform: [{ translateX: -60 }, { translateY: -100 }],
  },
  aspectRatioOption: {
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  aspectRatioOptionSelected: {
    backgroundColor: themeColors.palette.primary500,
  },
  aspectRatioOptionText: {
    color: themeColors.palette.neutral100,
    fontSize: 14,
    textAlign: "center",
  },
  aspectRatioOptionTextSelected: {
    color: themeColors.palette.neutral100,
    fontWeight: "bold",
  },
  bottomControls: {
    paddingBottom: 10,
    width: "100%",
  },
  bottomInfoRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  centerControls: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 40,
    justifyContent: "center",
  },
  container: {
    backgroundColor: themeColors.palette.neutral900,
    flex: 1,
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: themeColors.palette.overlay50,
    elevation: 1,
    flex: 1,
    justifyContent: "space-between",
    zIndex: 100,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  eventInfo: {
    justifyContent: "flex-end",
  },
  eventTitle: {
    color: themeColors.palette.neutral100,
    fontSize: 16,
    fontWeight: "bold",
  },
  // flagIcon: {
  //   borderRadius: 2,
  //   height: 16,
  //   width: 24,
  // },
  // groupText: {
  //   color: themeColors.palette.neutral300,
  //   fontSize: 12,
  //   marginBottom: 4,
  // },
  iconButton: {
    padding: 8,
  },
  leftGestureArea: {
    bottom: 100,
    elevation: 2,
    left: 0,
    position: "absolute",
    top: 100,
    width: "20%",
    zIndex: 110,
  },
  liveBadge: {
    alignItems: "center",
    backgroundColor: themeColors.palette.angry20,
    borderRadius: 4,
    flexDirection: "row",
    marginRight: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    backgroundColor: themeColors.palette.angry500,
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  liveText: {
    color: themeColors.palette.angry500,
    fontSize: 12,
    fontWeight: "bold",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: themeColors.palette.overlay50,
    justifyContent: "center",
    zIndex: 10,
  },
  loadingText: {
    color: themeColors.palette.neutral100,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  playPauseButton: {
    padding: 10,
  },
  progressBarContainer: {
    backgroundColor: themeColors.palette.glass20,
    borderRadius: 2,
    height: 4,
    width: "100%",
  },
  progressBarFill: {
    backgroundColor: themeColors.palette.primary500,
    borderRadius: 2,
    height: "100%",
  },
  pulsatingDot: {
    backgroundColor: themeColors.palette.primary500,
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  resolutionText: {
    color: themeColors.palette.neutral400,
    fontSize: 12,
  },
  rightGestureArea: {
    bottom: 100,
    elevation: 2,
    position: "absolute",
    right: 0,
    top: 100,
    width: "20%",
    zIndex: 110,
  },
  // scoreboardContainer: {
  //   alignItems: "center",
  //   backgroundColor: themeColors.palette.overlay50,
  //   borderRadius: 8,
  //   flexDirection: "row",
  //   gap: 10,
  //   marginLeft: 10,
  //   paddingHorizontal: 12,
  //   paddingVertical: 6,
  // },
  // scoreboardText: {
  //   color: themeColors.palette.neutral100,
  //   fontSize: 14,
  //   fontWeight: "bold",
  // },
  sideControlsContainer: {
    alignItems: "center",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 40,
    pointerEvents: "none", // Let clicks pass through
    position: "absolute",
    right: 40,
    top: 0,
  },
  skipButton: {
    padding: 10,
  },
  sliderContainer: {
    alignItems: "center",
    height: 200,
    justifyContent: "center",
  },
  sliderIcon: {
    marginBottom: 10,
  },
  sliderKnob: {
    backgroundColor: themeColors.palette.neutral100,
    borderRadius: 6,
    height: 12,
    left: -5, // (2 width - 12 knob) / 2 = -5
    position: "absolute",
    width: 12,
  },
  sliderTrack: {
    backgroundColor: themeColors.palette.neutral400,
    height: "100%",
    position: "relative",
    width: 2,
  },
  statusInfo: {
    alignItems: "center",
    flexDirection: "row",
  },
  topControls: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  topLeftControls: {
    alignItems: "center",
    flexDirection: "row",
  },
  topRightControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  video: {
    height: "100%",
    width: "100%",
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: themeColors.palette.neutral900,
    justifyContent: "center",
  },
})
