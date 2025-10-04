const firebaseConfig = {
  apiKey: "AIzaSyBD2QecoCI9R6-6SHs-K_5vwKQvKriQEH0",
  authDomain: "trip-cost-splitter.firebaseapp.com",
  projectId: "trip-cost-splitter",
  storageBucket: "trip-cost-splitter.firebasestorage.app",
  messagingSenderId: "99530590172",
  appId: "1:99530590172:web:9a085f6256edddfbaf7119",
  measurementId: "G-DMVVZD6DFD"
};

// --- INITIALIZE FIREBASE SERVICES ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); // Initialize Firebase Auth

// --- GET HTML ELEMENTS ---
const loginContainer = document.getElementById('login-container');
const loginBtn = document.getElementById('login-btn');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
// ... all your other element selectors from before

// --- AUTHENTICATION LOGIC ---

// Central listener for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userInfo.textContent = `Signed in as ${user.displayName}`;
        
        // Now that the user is logged in, initialize the app logic
        initializeAppLogic();

    } else {
        // User is signed out
        loginContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        userInfo.textContent = '';
    }
});

// Sign-in function
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});

// Sign-out function
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});


// --- APPLICATION LOGIC (WRAPPED IN A FUNCTION) ---
// All your previous code now goes inside this function
function initializeAppLogic() {

    // --- GLOBAL STATE ---
    let currentTripId = null;
    let people = [];
    let transactions = [];
    let unsubscribePeople = null;
    let unsubscribeTransactions = null;

    // --- CORE TRIP LOGIC ---
    // Load trips into dropdown
    db.collection('trips').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        // ... (The rest of your script.js file from before goes here)
        // ... (No changes needed inside this function)
    });

    // ... (All other functions: createTripForm listener, tripSelector listener, listenForTripData, etc.)
    // ... (This code remains the same, just lives inside initializeAppLogic)
}

// NOTE: You need to copy the rest of your app logic (from the previous script.js)
// into the initializeAppLogic function above. For brevity, it is not repeated here.
// Please see the full final code in the next response if you get stuck.
