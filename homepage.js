import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {getAuth, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import{getFirestore, getDoc, doc} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js"

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCabQTsLrJzXCwaloDR_na0d-wwQlq-5zc",
    authDomain: "login-html-web.firebaseapp.com",
    databaseURL: "https://login-html-web-default-rtdb.firebaseio.com",
    projectId: "login-html-web",
    storageBucket: "login-html-web.appspot.com",
    messagingSenderId: "984673652287",
    appId: "1:984673652287:web:8f5f55d243e85ead66728a"
  };
 
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  const auth=getAuth();
  const db=getFirestore();

  onAuthStateChanged(auth, (user)=>{
    const loggedInUserId=localStorage.getItem('loggedInUserId');
    if(loggedInUserId){
        console.log(user);
        const docRef = doc(db, "users", loggedInUserId);
        getDoc(docRef)
        .then((docSnap)=>{
            if(docSnap.exists()){
                const userData=docSnap.data();
                document.getElementById('loggedUserFName').innerText=userData.firstName;
                document.getElementById('loggedUserEmail').innerText=userData.email;
                document.getElementById('loggedUserLName').innerText=userData.lastName;

            }
            else{
                console.log("no document found matching id")
            }
        })
        .catch((error)=>{
            console.log("Error getting document");
        })
    }
    else{
        console.log("User Id not Found in Local storage")
    }
  })

  const logoutButton=document.getElementById('logout');

  logoutButton.addEventListener('click',()=>{
    localStorage.removeItem('loggedInUserId');
    signOut(auth)
    .then(()=>{
        window.location.href='index.html';
    })
    .catch((error)=>{
        console.error('Error Signing out:', error);
    })
  })
  
  const chatContainer = document.getElementById('chat-container');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const usersList = document.getElementById('users-list');

  // Reference to the chat and users collections
  const chatRef = collection(db, "chat");
  const usersRef = collection(db, "users");

  // Function to send a message
  const sendMessage = async () => {
      const message = messageInput.value;
      if (message.trim()) {
          await addDoc(chatRef, {
              message: message,
              timestamp: serverTimestamp(),
              userId: auth.currentUser.uid
          });
          messageInput.value = '';
      }
  };

  // Listen for form submission
  sendButton.addEventListener('click', sendMessage);

  // Listen for new messages and display them
  const q = query(chatRef, orderBy("timestamp"));
  onSnapshot(q, (snapshot) => {
      chatContainer.innerHTML = '';
      snapshot.forEach((doc) => {
          const data = doc.data();
          const messageElement = document.createElement('div');
          messageElement.textContent = data.message;
          chatContainer.appendChild(messageElement);
      });
      chatContainer.scrollTop = chatContainer.scrollHeight;
  });

  // Listen for live users and display them
  onSnapshot(usersRef, (snapshot) => {
      usersList.innerHTML = '';
      snapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.isOnline) {
              const userElement = document.createElement('div');
              userElement.className = 'user';
              userElement.textContent = userData.displayName;
              usersList.appendChild(userElement);
          }
      });
  });

  // Update user status on login/logout
  onAuthStateChanged(auth, async (user) => {
      if (user) {
          await setDoc(doc(usersRef, user.uid), {
              uid: user.uid,
              displayName: user.displayName || "Anonymous",
              isOnline: true
          });
      } else {
          // Remove the user from the list when logged out
          const userDoc = doc(usersRef, auth.currentUser.uid);
          await updateDoc(userDoc, { isOnline: false });
      }
  });