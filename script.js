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

// --- GET HTML ELEMENTS (GLOBAL) ---
const loginContainer = document.getElementById('login-container');
const loginBtn = document.getElementById('login-btn');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

// --- AUTHENTICATION LOGIC ---

// Central listener for authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userInfo.textContent = `Signed in as ${user.displayName}`;
        
        // Now that the user is logged in, initialize all the app's functionality
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
// This function contains ALL the logic for the main app.
// It is only called AFTER a user successfully logs in.
function initializeAppLogic() {
    
    // --- GET HTML ELEMENTS (APP-SPECIFIC) ---
    const createTripForm = document.getElementById('create-trip-form');
    const tripNameInput = document.getElementById('trip-name');
    const tripSelector = document.getElementById('trip-selector');
    const mainContent = document.getElementById('main-content');
    const currentTripTitle = document.getElementById('current-trip-title');
    const addPersonForm = document.getElementById('add-person-form');
    const personNameInput = document.getElementById('person-name');
    const transactionForm = document.getElementById('transaction-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const transactionList = document.getElementById('transaction-list');
    const summaryDiv = document.getElementById('summary');
    const peopleList = document.getElementById('people-list');
    const paidBySelect = document.getElementById('paid-by');
    const splitBetweenCheckboxes = document.getElementById('split-between-checkboxes');

    // --- GLOBAL STATE ---
    let currentTripId = null;
    let people = [];
    let transactions = [];
    let unsubscribePeople = null;
    let unsubscribeTransactions = null;
    
    // --- CORE TRIP LOGIC ---
    db.collection('trips').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        const selectedValue = tripSelector.value;
        tripSelector.innerHTML = '<option value="">-- Choose a Trip --</option>'; // Reset
        snapshot.forEach(doc => {
            const trip = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = trip.name;
            tripSelector.appendChild(option);
        });
        tripSelector.value = selectedValue; // Re-select the trip if it still exists
    });

    createTripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tripName = tripNameInput.value.trim();
        if (tripName) {
            // This is the simpler version without memberUIDs
            db.collection('trips').add({
                name: tripName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            tripNameInput.value = '';
        }
    });

    tripSelector.addEventListener('change', () => {
        currentTripId = tripSelector.value;
        if (unsubscribePeople) unsubscribePeople();
        if (unsubscribeTransactions) unsubscribeTransactions();

        if (currentTripId) {
            mainContent.classList.remove('hidden');
            const selectedTripName = tripSelector.options[tripSelector.selectedIndex].text;
            currentTripTitle.textContent = `Managing Trip: ${selectedTripName}`;
            listenForTripData();
        } else {
            mainContent.classList.add('hidden');
        }
    });
    
    function listenForTripData() {
        if (!currentTripId) return;

        const peopleRef = db.collection('trips').doc(currentTripId).collection('people');
        unsubscribePeople = peopleRef.onSnapshot(snapshot => {
            people = [];
            snapshot.forEach(doc => people.push(doc.data().name));
            updatePeopleDisplay();
            updateUI();
        });

        const transRef = db.collection('trips').doc(currentTripId).collection('transactions');
        unsubscribeTransactions = transRef.onSnapshot(snapshot => {
            transactions = [];
            snapshot.forEach(doc => transactions.push(doc.data()));
            updateUI();
        });
    }

    addPersonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPerson = personNameInput.value.trim();
        if (newPerson && !people.includes(newPerson) && currentTripId) {
            db.collection('trips').doc(currentTripId).collection('people').add({ name: newPerson });
        }
        personNameInput.value = '';
    });

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentTripId) return;
        const selectedPeople = Array.from(document.querySelectorAll('#split-between-checkboxes input:checked')).map(cb => cb.value);

        if (selectedPeople.length === 0) {
            alert("Please select at least one person.");
            return;
        }

        const newTransaction = {
            description: descriptionInput.value,
            amount: parseFloat(amountInput.value),
            paidBy: paidBySelect.value,
            splitBetween: selectedPeople,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('trips').doc(currentTripId).collection('transactions').add(newTransaction);
        transactionForm.reset();
        document.querySelectorAll('#split-between-checkboxes input').forEach(cb => cb.checked = true);
    });

    // --- UI AND CALCULATION FUNCTIONS ---
    function updateUI() {
        updateTransactionList();
        updateSummary();
    }

    function updatePeopleDisplay() {
        people.sort();
        peopleList.innerHTML = '';
        paidBySelect.innerHTML = '';
        splitBetweenCheckboxes.innerHTML = '';

        people.forEach(person => {
            const li = document.createElement('li');
            li.textContent = person;
            peopleList.appendChild(li);
            const option = document.createElement('option');
            option.value = person;
            option.textContent = person;
            paidBySelect.appendChild(option);
            const checkboxDiv = document.createElement('div');
            checkboxDiv.innerHTML = `<input type="checkbox" id="cb-${person}" name="split" value="${person}" checked><label for="cb-${person}">${person}</label>`;
            splitBetweenCheckboxes.appendChild(checkboxDiv);
        });
    }

    function updateTransactionList() {
        transactionList.innerHTML = '';
        transactions.sort((a, b) => (a.createdAt && b.createdAt) ? a.createdAt.seconds - b.createdAt.seconds : 0);
        transactions.forEach(tx => {
            const li = document.createElement('li');
            const splitText = tx.splitBetween.length === people.length ? 'everyone' : tx.splitBetween.join(', ');
            li.innerHTML = `${tx.description} <span>${tx.paidBy} paid ₹${tx.amount.toFixed(2)} (Split with: ${splitText})</span>`;
            transactionList.appendChild(li);
        });
    }

    function updateSummary() {
        if (people.length === 0) {
            summaryDiv.innerHTML = '<p>Add people to this trip to get started.</p>';
            return;
        }
        if (transactions.length === 0) {
            summaryDiv.innerHTML = '<p>Add a transaction to see the summary.</p>';
            return;
        }

        const balances = {};
        people.forEach(person => balances[person] = 0);

        transactions.forEach(tx => {
            const amountPerPerson = tx.amount / tx.splitBetween.length;
            if (balances[tx.paidBy] !== undefined) balances[tx.paidBy] += tx.amount;
            tx.splitBetween.forEach(person => {
                if (balances[person] !== undefined) balances[person] -= amountPerPerson;
            });
        });

        const simplifiedDebts = simplifyDebts(balances);
        let summaryHTML = '<h4>Settled Payments:</h4>';
        if (simplifiedDebts.length === 0) {
            summaryHTML += '<p>Everyone is settled up!</p>';
        } else {
            summaryHTML += '<ul>';
            simplifiedDebts.forEach(debt => {
                summaryHTML += `<li><strong>${debt.from}</strong> pays <strong>${debt.to}</strong> ₹${debt.amount.toFixed(2)}</li>`;
            });
            summaryHTML += '</ul>';
        }
        summaryDiv.innerHTML = summaryHTML;
    }

    function simplifyDebts(balances) {
        const debtors = [];
        const creditors = [];
        for (const person in balances) {
            if (balances[person] < -0.01) debtors.push({ name: person, amount: -balances[person] });
            else if (balances[person] > 0.01) creditors.push({ name: person, amount: balances[person] });
        }
        const payments = [];
        while (debtors.length > 0 && creditors.length > 0) {
            debtors.sort((a, b) => a.amount - b.amount);
            creditors.sort((a, b) => a.amount - b.amount);
            const debtor = debtors[debtors.length - 1];
            const creditor = creditors[creditors.length - 1];
            const paymentAmount = Math.min(debtor.amount, creditor.amount);
            payments.push({ from: debtor.name, to: creditor.name, amount: paymentAmount });
            debtor.amount -= paymentAmount;
            creditor.amount -= paymentAmount;
            if (debtor.amount < 0.01) debtors.pop();
            if (creditor.amount < 0.01) creditors.pop();
        }
        return payments;
    }
}
