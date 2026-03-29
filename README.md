# SwiftTap Mobile App 📱

Expo/React Native Merchant App für SwiftTap Zahlungen.

## Features

- 📊 **Dashboard** - Tagesumsatz und letzte Zahlungen
- 🔲 **QR Code Generator** - Zahlungen via QR-Code empfangen
- 📶 **Tap to Pay** - NFC kontaktlose Zahlungen (nach Apple Dev Account)
- 📋 **Transaktionen** - Übersicht aller Zahlungen

## Tech Stack

- Expo SDK 52+
- React Native
- expo-router (file-based routing)
- @tanstack/react-query
- react-native-qrcode-svg
- react-native-nfc-manager

## Design

- **Primary:** `#1A2744` (Deep Navy)
- **Accent:** `#00C9B1` (Teal)
- **Font:** System (Inter-ähnlich)
- **Border Radius:** rounded-xl (16px)

## Setup

```bash
# Dependencies installieren
npm install

# Expo Go starten (Development)
npm start

# Android/iOS lokal
npm run android
npm run ios
```

## EAS Build

### Preview Build (APK für Testing)

```bash
# Mit Expo CLI
npx eas-cli build --platform android --profile preview

# Oder mit Token
EXPO_TOKEN=<token> npx eas-cli build --platform android --profile preview --non-interactive
```

### Production Build (App Bundle für Store)

```bash
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

## Environment Variables

| Variable | Beschreibung |
|----------|-------------|
| `EXPO_PUBLIC_SWIFTTAP_API_URL` | SwiftTap API URL (default: https://swifttap-app.vercel.app) |

## API Endpoints

Die App nutzt folgende SwiftTap API Endpoints:

- `POST /api/v1/payment-request` - Neue Zahlung erstellen
- `GET /api/v1/payment-status/:id` - Zahlungsstatus abfragen
- `GET /api/transactions` - Transaktionsliste

## NFC / Tap to Pay

NFC-Funktionalität erfordert:
1. Native Build (kein Expo Go)
2. NFC-fähiges Gerät
3. Für iOS: Apple Developer Account mit NFC Entitlement

Stripe Terminal SDK Integration kommt nach Apple Developer Account Setup.

## Project Structure

```
swifttap-mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab Navigation
│   │   ├── index.tsx        # Dashboard
│   │   ├── qr.tsx           # QR Generator
│   │   └── transactions.tsx # Transaktionsliste
│   ├── pay/
│   │   └── [id].tsx         # Payment Status
│   ├── tap-to-pay.tsx       # NFC Screen
│   └── _layout.tsx          # Root Layout
├── constants/
│   └── Colors.ts            # SwiftTap Farben
├── app.json                 # Expo Config
├── eas.json                 # EAS Build Config
└── package.json
```

## Links

- **SwiftTap Web:** https://swifttap-app.vercel.app
- **Expo:** https://expo.dev/@baerenklee/swifttap

---

Built with ❤️ by FELDWERK
