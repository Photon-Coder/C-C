import { initializeApp } from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBGI_6Ks_6_luU4ZEYU1-CGwZ64TUsmr8A",
    authDomain: "react-firebase-chat-app-643b1.firebaseapp.com",
    databaseURL: "https://react-firebase-chat-app-643b1-default-rtdb.firebaseio.com",
    projectId: "react-firebase-chat-app-643b1",
    storageBucket: "react-firebase-chat-app-643b1.appspot.com",
    messagingSenderId: "705677831171",
    appId: "1:705677831171:web:a79a3eefc566c3f130f236",
    measurementId: "G-Y1H6WEJJRS"
};

const app = initializeApp(firebaseConfig);

export default app;