# HMVerge Play

HMVerge Play is a premium, high-performance IPTV application built with React Native and Expo. Designed for a seamless entertainment experience, it provides a powerful and intuitive interface for streaming Live TV, Movies, and Series from multiple providers.

## 🚀 Features

-   **Dual Source Support**: Support for both **Xtream Codes API** and **M3U Playlists**.
-   **Multi-Playlist Management**: Add, manage, and switch between multiple IPTV service providers effortlessly.
-   **Live TV & EPG**: A full-featured Electronic Program Guide (EPG) to browse schedules and view current programming.
-   **VOD & Series**: Dedicated sections for Movies and Television Series with organized categories.
-   **Favorites**: One-tap access to your most-watched channels and content.
-   **Premium Video Player**: High-performance playback with support for gestures, brightness/volume controls, and orientation locking.
-   **Modern UI/UX**: A sleek, dark-themed interface utilizing glassmorphism, smooth animations, and a responsive layout.
-   **Persistent Storage**: Fast local caching of your playlists and settings using MMKV.

## 🛠️ Technology Stack

-   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
-   **State Management**: [MobX State Tree (MST)](https://github.com/mobxjs/mobx-state-tree)
-   **Navigation**: [React Navigation](https://reactnavigation.org/)
-   **Styling**: Custom theme system based on [Ignite](https://github.com/infinitered/ignite)
-   **Video**: [react-native-video](https://github.com/react-native-video/react-native-video)
-   **Storage**: [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)

## 📦 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v20 or newer)
-   [Yarn](https://yarnpkg.com/)
-   [Expo Go](https://expo.dev/client) app on your mobile device (for development) or an Android/iOS emulator.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd hmVergePlay
    ```

2.  **Install dependencies**:
    ```bash
    yarn install
    ```

3.  **Start the development server**:
    ```bash
    yarn start
    ```

4.  **Run on a device/emulator**:
    -   Press `a` for Android
    -   Press `i` for iOS
    -   Or scan the QR code with the Expo Go app.

## 📱 Build Instructions

The project uses [Expo Application Services (EAS)](https://expo.dev/eas) for builds.

### Development Builds
To create a development build for your local device or simulator:
```bash
yarn build:ios:sim      # iOS Simulator
yarn build:android:sim  # Android Emulator
```

### Production Builds
To generate production-ready binaries:
```bash
yarn build:ios:prod
yarn build:android:prod
```

## 📂 Project Structure

-   `app/components`: Reusable UI components.
-   `app/models`: State management models and stores (MobX State Tree).
-   `app/navigators`: Application navigation and routing configuration.
-   `app/screens`: Primary application screens (Login, Playlist Selection, Player, etc.).
-   `app/services`: API services for fetching IPTV data.
-   `app/theme`: Design tokens, colors, and typography.
-   `assets/`: Images, icons, and fonts.

---

Built with ❤️ by Martins Aloba.
