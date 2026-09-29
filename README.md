# Cross-Platform Personal Finance Management App

React Native (Expo) frontend + Firebase backend. Runs on Android, iOS and Web (desktop via browser/PWA or Electron wrapper).

## Features
- Email/password auth (Firebase Auth), per-user data isolation (Firestore rules)
- Real-time cloud sync across devices (Firestore `onSnapshot`)
- ML expense categorization: on-device Naive Bayes classifier that learns from your own history
- Budgets per category with alerts, monthly insights, spending forecast, savings rate, 50/30/20 suggestions
- Multilingual UI: English, Hindi, Telugu (add more in `frontend/src/i18n/index.js`), currency localization
- Security: TLS in transit, encryption at rest (Firebase), auth-only rules with field validation, no third-party data sharing

## Structure
```
frontend/   Expo React Native app
backend/    Firebase config: firestore.rules, indexes, Cloud Functions
```

## 1. Firebase setup
1. Go to https://console.firebase.google.com -> Add project.
2. Build -> Authentication -> Get started -> enable **Email/Password**.
3. Build -> Firestore Database -> Create database (production mode).
4. Project settings -> Your apps -> Add **Web app** -> copy the config values.
5. `cd frontend && cp .env.example .env` and paste the values.

## 2. Run the frontend
```
cd frontend
npm install
npx expo start          # press a (Android), i (iOS), w (web), or scan QR with Expo Go
```

## 3. Deploy backend
```
npm i -g firebase-tools
firebase login
cd backend
# edit .firebaserc: replace YOUR_FIREBASE_PROJECT_ID
cd functions && npm install && cd ..
firebase deploy --only firestore          # rules + indexes (free Spark plan OK)
firebase deploy --only functions          # optional, needs Blaze plan
```
The app works fully with just Auth + Firestore + rules. Cloud Functions add server-side
categorization fallback and a monthly summary callable.

## Local emulators (optional)
`cd backend && firebase emulators:start`

## Desktop
- Web build: `npx expo export -p web` then host, or install as PWA.
- Electron: wrap the `dist/` output with Electron.

## Firestore data model
```
users/{uid}                       { language, currency }
users/{uid}/transactions/{id}     { title, amount, type: income|expense, category, date, note, createdAt }
users/{uid}/budgets/{category}    { limit }
```

## Ideas for extension (Capstone Phase 2)
Receipt OCR, recurring transactions, CSV export, biometric lock (expo-local-authentication),
TensorFlow.js / Cloud Function based model, push reminders (expo-notifications), charts (victory-native).
