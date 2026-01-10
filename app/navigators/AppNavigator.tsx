/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { observer } from "mobx-react-lite"

import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import Config from "../config"
import { useStores } from "../models/helpers/useStores"
import { CategoryListScreen } from "../screens/ChannelGuide/CategoryListScreen"
import { ChannelListScreen } from "../screens/ChannelGuide/ChannelListScreen"
import { ContentTypeSelectionScreen } from "../screens/ContentTypeSelectionScreen/ContentTypeSelectionScreen"
import { DownloadsScreen } from "../screens/DownloadsScreen"
import { ErrorBoundary } from "../screens/ErrorScreen/ErrorBoundary"
import { FavoritesScreen } from "../screens/FavoritesScreen/FavoritesScreen"
import { LoginScreen } from "../screens/LoginScreen"
import { PlayerScreen } from "../screens/PlayerScreen/PlayerScreen"
import { PlaylistSelectionScreen } from "../screens/PlaylistSelectionScreen"
import { SeriesDetailsScreen } from "../screens/SeriesDetailsScreen"
import { SettingsScreen } from "../screens/SettingsScreen"
import { useAppTheme } from "../theme/context"

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

// ... existing imports

const AppStack = observer(() => {
  const {
    authenticationStore: { isAuthenticated },
    playlistStore: { hasPlaylists },
  } = useStores()

  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      // On Android, initialRouteName might stick if not forced to update?
      // Actually, initialRouteName is only used on first mount.
      // We rely on conditional rendering below to switch screens.
    >
      {isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="ContentTypeSelection" component={ContentTypeSelectionScreen} />
          <Stack.Screen name="CategoryList" component={CategoryListScreen} />
          <Stack.Screen name="ChannelList" component={ChannelListScreen} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
          <Stack.Screen name="Player" component={PlayerScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Downloads" component={DownloadsScreen} />
          <Stack.Screen name="SeriesDetails" component={SeriesDetailsScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          {/* Always mount PlaylistSelection if it exists, navigation logic will handle the rest */}
          {hasPlaylists ? (
            <Stack.Screen name="PlaylistSelection" component={PlaylistSelectionScreen} />
          ) : null}
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Group>
      )}

      {/** 🔥 Your screens go here */}
      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
})

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
