# HeyJuke Mobile App

A mobile app for searching and sending songs to the HeyJuke server

## Install

You will need to have [nodejs](https://nodejs.org) installed, along with the `react-native-cli` package.

When you've done that, `cd` into the project directory and run the following command in a terminal:

```bash
npm install
```

## Setup

You will need to supply credentials for each service in the `credentials` folder.

- Spotify - Setup your app credentials [here](https://developer.spotify.com/dashboard/applications) and enter them into `credentials/Spotify.json`
- Youtube - Setup your youtube credentials in the Google Developer Console and enter them into `credentials/Youtube.json`

## Build and Run

### iOS

The iOS project is located in `ios/HeyJuke.xcodeproj`, which you can open using Xcode. Alternatively, you can just run the following command in a terminal:

```bash
react-native run-ios --variant=release
```

### Android

The Android project is located in `android`, which you can open using Android Studio. Alternatively, you can just run the following command in a terminal:

```bash
react-native run-android --variant=release
```
