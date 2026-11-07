// Firebase web config. These values are public by design: access is controlled by
// the Firestore security rules and Firebase Authentication, not by hiding this file.
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyCZnc-HxWEso812PgMNY8gNXp-vNvZGaeI',
  authDomain: 'my-portfolio-8aa8a.firebaseapp.com',
  projectId: 'my-portfolio-8aa8a',
  storageBucket: 'my-portfolio-8aa8a.firebasestorage.app',
  messagingSenderId: '652958384152',
  appId: '1:652958384152:web:160fcfd75598abfa97c36d',
  measurementId: 'G-NF9TH9X53J',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
