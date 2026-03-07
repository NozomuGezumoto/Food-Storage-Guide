# EAS Build & Deployment Guide

This document describes how to build and deploy the Food Storage Guide app using [Expo Application Services (EAS)](https://docs.expo.dev/eas/).

## Prerequisites

- [Expo account](https://expo.dev/signup)
- [EAS CLI](https://docs.expo.dev/build/setup/#install-eas-cli) installed globally:
  ```bash
  npm install -g eas-cli
  ```
- Logged in to EAS:
  ```bash
  eas login
  ```

## Project Setup

1. **Link the project to EAS** (first time only):
   ```bash
   eas build:configure
   ```
   This creates or updates `eas.json`.

2. **Configure app identifiers** (if not already set):
   - **iOS**: `com.nozomusp.food-storage-guide` (in `app.json`)
   - **Android**: Set `package` in `app.json` under `android` if needed

## Build Profiles

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| **development** | Local dev with dev tools, for testing on device | Internal |
| **preview** | Production-like build for internal testing (TestFlight, internal track) | Internal |
| **production** | Store-ready build for App Store / Play Store release | Store |

## Building

### iOS

```bash
# Development build (for testing with dev tools)
eas build --platform ios --profile development

# Preview build (TestFlight for internal testers)
eas build --platform ios --profile preview

# Production build (App Store submission)
eas build --platform ios --profile production
```

### Android

```bash
# Development build
eas build --platform android --profile development

# Preview build (internal testing)
eas build --platform android --profile preview

# Production build (Play Store)
eas build --platform android --profile production
```

### Both platforms

```bash
eas build --platform all --profile preview
```

## Submitting to Stores

After a build completes, submit it to the store:

```bash
# Submit the latest build
eas submit --platform ios --profile production --latest
eas submit --platform android --profile production --latest

# Or specify a build ID
eas submit --platform ios --profile production --id <build-id>
```

**First-time submission** may require additional setup:
- **iOS**: Apple Developer account, App Store Connect app record, credentials
- **Android**: Google Play Console app, service account or manual upload

## Development Build vs Expo Go

| | Expo Go | Development Build |
|--|---------|-------------------|
| **Swipeable** | May fail (RNGestureHandlerModule) when resuming from background | Works reliably |
| **Notifications** | Unreliable when app is backgrounded | Reliable |
| **Setup** | Install Expo Go app | Run `eas build --profile development` |

**Recommendation**: Use a development build for real-device testing. Expo Go is suitable for quick UI checks only.

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view <build-id>

# Cancel a build
eas build:cancel <build-id>

# Configure project (creates eas.json)
eas build:configure

# Update credentials
eas credentials
```

## Environment Variables

To pass environment variables into builds, add them to `eas.json` under the profile's `env` key:

```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.example.com"
      }
    }
  }
}
```

For secrets, use [EAS Secrets](https://docs.expo.dev/build-reference/variables/#using-secrets):
```bash
eas secret:create --name SECRET_NAME --value "secret-value"
```

## Troubleshooting

### "RNGestureHandlerModule could not be found"
- **Cause**: Expo Go may not fully support `react-native-gesture-handler` in all scenarios.
- **Fix**: Use a development build (`eas build --profile development` or `npx expo run:ios`).

### Build fails with "Incompatible with Expo Go"
- **Cause**: Project uses SDK or native modules not included in the current Expo Go.
- **Fix**: Use EAS Build to create a standalone app.

### Notifications not arriving
- **Cause**: Expo Go throttles background execution.
- **Fix**: Use a development build for reliable notification testing.
