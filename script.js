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
const auth = firebase.auth();

// --- GET HTML ELEMENTS (GLOBAL) ---
const loginContainer = document.getElementById('login-container');
const loginBtn = document.getElementById('login-btn');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

// --- AUTHENTICATION LOGIC ---
auth.onAuthStateChanged(user => {
    if (user) {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userInfo.textContent = `Signed in as ${user.displayName}`;
        initializeAppLogic();
    } else {
        loginContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        userInfo.textContent = '';
    }
});
loginBtn.addEventListener('click', () => { /* ... sign-in logic ... */ });
logoutBtn.addEventListener('click', () => { auth.signOut(); });


// --- APPLICATION LOGIC (WRAPPED IN A FUNCTION) ---
function initializeAppLogic() {
    
    // --- GET HTML ELEMENTS (APP-SPECIFIC) ---
    const createTripForm = document.getElementById('create-trip-form');
    const tripSelector = document.getElementById('trip-selector');
    const deleteTripBtn = document.getElementById('delete-trip-btn');
    // ... all other app-specific element selectors
    const peopleList = document.getElementById('people-list');
    const transactionList = document.getElementById('transaction-list');
    
    // --- GLOBAL STATE ---
    let currentTripId = null;
    let people = []; // Will now be an array of objects: {id, name}
    let transactions = []; // Will now be an array of objects {id, data}
    let unsubscribePeople = null;
    let unsubscribeTransactions = null;
    
    // --- CORE TRIP LOGIC ---
    db.collection('trips').orderBy('createdAt', 'desc').onSnapshot(snapshot => { /* ... unchanged ... */ });
    createTripForm.addEventListener('submit', (e) => { /* ... unchanged ... */ });

    tripSelector.addEventListener('change', () => {
        currentTripId = tripSelector.value;
        if (unsubscribePeople) unsubscribePeople();
        if (unsubscribeTransactions) unsubscribeTransactions();

        if (currentTripId) {
            mainContent.classList.remove('hidden');
            deleteTripBtn.classList.remove('hidden'); // Show the delete button
            // ... rest of the logic
            listenForTripData();
        } else {
            mainContent.classList.add('hidden');
            deleteTripBtn.classList.add('hidden'); // Hide the delete button
        }
    });
    
    function listenForTripData() {
        if (!currentTripId) return;

        // MODIFIED: Store document ID with the data
        const peopleRef = db.collection('trips').doc(currentTripId).collection('people');
        unsubscribePeople = peopleRef.onSnapshot(snapshot => {
            people = [];
            snapshot.forEach(doc => {
                people.push({ id: doc.id, name: doc.data().name });
            });
            updatePeopleDisplay();
            updateUI();
        });

        // MODIFIED: Store document ID with the data
        const transRef = db.collection('trips').doc(currentTripId).collection('transactions');
        unsubscribeTransactions = transRef.onSnapshot(snapshot => {
            transactions = [];
            snapshot.forEach(doc => {
                transactions.push({ id: doc.id, ...doc.data() });
            });
            updateUI();
        });
    }

    // --- DELETE FUNCTIONALITY ---
    
    // 1. Delete a Person
    peopleList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const personId = e.target.dataset.id;
            const personToDelete = people.find(p => p.id === personId);
            
            if (confirm(`Are you sure you want to delete ${personToDelete.name}? This cannot be undone.`)) {
                db.collection('trips').doc(currentTripId).collection('people').doc(personId).delete();
            }
        }
    });
    
    // 2. Delete a Transaction
    transactionList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const transactionId = e.target.dataset.id;
            if (confirm(`Are you sure you want to delete this transaction? This cannot be undone.`)) {
                db.collection('trips').doc(currentTripId).collection('transactions').doc(transactionId).delete();
            }
        }
    });

    // 3. Delete an Entire Trip
    deleteTripBtn.addEventListener('click', async () => {
        if (!currentTripId) return;
        const tripName = tripSelector.options[tripSelector.selectedIndex].text;

        if (confirm(`ARE YOU ABSOLUTELY SURE?\nThis will permanently delete the trip "${tripName}" and all of its members and transactions. This action cannot be undone.`)) {
            // Firestore does not delete sub-collections automatically. We must do it manually.
            const tripRef = db.collection('trips').doc(currentTripId);
            
            // Delete all people in the sub-collection
            const peopleSnapshot = await tripRef.collection('people').get();
            peopleSnapshot.forEach(doc => doc.ref.delete());

            // Delete all transactions in the sub-collection
            const transactionsSnapshot = await tripRef.collection('transactions').get();
            transactionsSnapshot.forEach(doc => doc.ref.delete());

            // Finally, delete the trip document itself
            await tripRef.delete();
            
            // UI is updated automatically by the onSnapshot listener for trips
            alert(`Trip "${tripName}" has been deleted.`);
        }
    });


    // --- UI AND CALCULATION FUNCTIONS ---

    function updatePeopleDisplay() {
        // ...
        // MODIFIED: Add delete button with data-id
        people.forEach(person => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${person.name}</span>
                <button class="delete-btn" data-id="${person.id}">&times;</button>
            `;
            peopleList.appendChild(li);
            // ... rest of the function for dropdowns/checkboxes
        });
    }

    function updateTransactionList() {
        // ...
        // MODIFIED: Add delete button with data-id
        transactions.forEach(tx => {
            const li = document.createElement('li');
            // ...
            li.innerHTML = `
                <span>${tx.description} - ${tx.paidBy} paid ₹${tx.amount.toFixed(2)}</span>
                <button class="delete-btn" data-id="${tx.id}">&times;</button>
            `;
            transactionList.appendChild(li);
        });
    }

    // ... All other functions (addPersonForm, transactionForm, updateSummary, simplifyDebts) remain the same ...
    // Note: for brevity, unchanged functions and parts are omitted. The full script will contain them.
}
