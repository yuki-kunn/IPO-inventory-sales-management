import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { browser } from '$app/environment';

// Firebase設定（環境変数から読み込み）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebaseアプリの初期化（ブラウザ環境でのみ）
let app: any;
let db: any;

if (browser) {
  console.log('[Firebase] 初期化開始...');
  console.log('[Firebase] Config:', {
    projectId: firebaseConfig.projectId,
    apiKeySet: !!firebaseConfig.apiKey,
    authDomainSet: !!firebaseConfig.authDomain,
  });

  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('[Firebase] 初期化成功');
  } catch (error) {
    console.error('[Firebase] 初期化エラー:', error);
  }
}

export { db };
