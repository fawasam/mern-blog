import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBtxNrgxMsIzp1FrINW1CNbly77uwOuBrQ",
  authDomain: "blog-app-2de5c.firebaseapp.com",
  projectId: "blog-app-2de5c",
  storageBucket: "blog-app-2de5c.appspot.com",
  messagingSenderId: "976805389506",
  appId: "1:976805389506:web:9c112d8b49969719d1875b",
};

const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();
const auth = getAuth();

export const authWithGoogle = async () => {
  let user = null;
  await signInWithPopup(auth, provider)
    .then((result) => {
      user = result.user;
    })
    .catch((err) => {
      console.log(err);
    });
  return user;
};
