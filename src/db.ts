import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import {
  getFirestore,
  Timestamp,
  FieldValue,
  Filter,
} from "firebase-admin/firestore";

const credentials = JSON.parse(process.env.FIREBASE_PRIVATE_KEY!);
console.log(credentials);
initializeApp({
  credential: cert(credentials),
});

export const db = getFirestore();
