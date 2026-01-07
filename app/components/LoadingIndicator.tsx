import { useEffect, useRef } from "react"
import { ActivityIndicator, Animated, StyleSheet, View } from "react-native"

import { colors } from "../theme/colors"

interface LoadingIndicatorProps {
  visible: boolean
}

export const LoadingIndicator = ({ visible }: LoadingIndicatorProps) => {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [visible, opacity])

  if (!visible) return null

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.palette.primary500} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: colors.palette.overlay80,
    justifyContent: "center",
    zIndex: 9999,
  },
  content: {
    backgroundColor: colors.palette.neutral800,
    borderRadius: 16,
    elevation: 5,
    padding: 24,
    shadowColor: colors.palette.neutral900,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
})
