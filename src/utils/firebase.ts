import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(config);

export const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
  ? initializeFirestore(app, {}, config.firestoreDatabaseId)
  : getFirestore(app);

export default app;
