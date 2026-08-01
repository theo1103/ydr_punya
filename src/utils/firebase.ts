import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(config);

export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' ? config.firestoreDatabaseId : '(default)');

export default app;
