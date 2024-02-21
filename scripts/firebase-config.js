 // Initialize Firebase
 const firebaseConfig = {
    apiKey: "AIzaSyDq_YboGfPcxHuqjj38WhTFmwdHhINYnQA",
    authDomain: "etechleap.firebaseapp.com",
    databaseURL: "https://etechleap-default-rtdb.firebaseio.com",
    projectId: "etechleap",
    storageBucket: "etechleap.appspot.com",
    messagingSenderId: "805570885698",
    appId: "1:805570885698:web:57eed9c795604f634055db",
    measurementId: "G-V0BDZ0PEE7"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }