import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBTMRufCWKbfrLBN3WiVDWCjzrpxMhrFmc",
  authDomain: "gezicorn.firebaseapp.com",
  projectId: "gezicorn",
  storageBucket: "gezicorn.firebasestorage.app",
  messagingSenderId: "542127745680",
  appId: "1:542127745680:web:c59e7919eb0e78865c0615"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
