import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator,getFirestore } from 'firebase/firestore';
import { env } from '$env/dynamic/public';

// Firebase設定（環境変数から読み込み）
const firebaseConfig = {
	apiKey: env.PUBLIC_FIREBASE_API_KEY,
	authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: env.PUBLIC_FIREBASE_APP_ID
};

// Firebaseアプリの初期化
// To avoid initializing multiple times in dev environments with HMR,
// we check if an app is already initialized.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
