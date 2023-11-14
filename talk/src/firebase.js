import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBGI_6Ks_6_luU4ZEYU1-CGwZ64TUsmr8A",
    authDomain: "react-firebase-chat-app-643b1.firebaseapp.com",
    databaseURL: "https://react-firebase-chat-app-643b1-default-rtdb.firebaseio.com",
    projectId: "react-firebase-chat-app-643b1",
    storageBucket: "react-firebase-chat-app-643b1.appspot.com",
    messagingSenderId: "705677831171",
    appId: "1:705677831171:web:eaa3d3bfd65209e830f236",
    measurementId: "G-Y1H6WEJJRS"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 필요한 모듈 가져오기
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// 이제 'auth', 'database', 'storage'를 사용하여 각각의 작업을 수행할 수 있습니다.

export { app, auth, database, storage };