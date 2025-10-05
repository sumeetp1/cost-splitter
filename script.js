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
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
});
logoutBtn.addEventListener('click', () => { auth.signOut(); });


// --- APPLICATION LOGIC (WRAPPED IN A FUNCTION) ---
function initializeAppLogic() {
    
    // --- GET HTML ELEMENTS (APP-SPECIFIC) ---
    const createTripForm = document.getElementById('create-trip-form');
    const tripNameInput = document.getElementById('trip-name');
    const tripSelector = document.getElementById('trip-selector');
    const deleteTripBtn = document.getElementById('delete-trip-btn');
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
        tripSelector.innerHTML = '<option value="">-- Choose a Trip --</option>';
        snapshot.forEach(doc => {
            const trip = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = trip.name;
            tripSelector.appendChild(option);
        });
        tripSelector.value = selectedValue;
    });

    createTripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tripName = tripNameInput.value.trim();
        if (tripName) {
            db.collection('trips').add({ name: tripName, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            tripNameInput.value = '';
        }
    });

    tripSelector.addEventListener('change', () => {
        currentTripId = tripSelector.value;
        if (unsubscribePeople) unsubscribePeople();
        if (unsubscribeTransactions) unsubscribeTransactions();

        if (currentTripId) {
            mainContent.classList.remove('hidden');
            deleteTripBtn.classList.remove('hidden');
            const selectedTripName = tripSelector.options[tripSelector.selectedIndex].text;
            currentTripTitle.textContent = `Managing Trip: ${selectedTripName}`;
            listenForTripData();
        } else {
            mainContent.classList.add('hidden');
            deleteTripBtn.classList.add('hidden');
        }
    });
    
    function listenForTripData() {
        if (!currentTripId) return;

        const peopleRef = db.collection('trips').doc(currentTripId).collection('people');
        unsubscribePeople = peopleRef.onSnapshot(snapshot => {
            people = [];
            snapshot.forEach(doc => people.push({ id: doc.id, name: doc.data().name }));
            updatePeopleDisplay();
            updateUI();
        });

        const transRef = db.collection('trips').doc(currentTripId).collection('transactions');
        unsubscribeTransactions = transRef.onSnapshot(snapshot => {
            transactions = [];
            snapshot.forEach(doc => transactions.push({ id: doc.id, ...doc.data() }));
            updateUI();
        });
    }

    addPersonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPersonName = personNameInput.value.trim();
        const personExists = people.some(p => p.name.toLowerCase() === newPersonName.toLowerCase());
        if (newPersonName && !personExists && currentTripId) {
            db.collection('trips').doc(currentTripId).collection('people').add({ name: newPersonName });
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

    // --- DELETE FUNCTIONALITY ---
    peopleList.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
            const personId = e.target.closest('.delete-btn').dataset.id;
            const personToDelete = people.find(p => p.id === personId);
            if (confirm(`Are you sure you want to delete ${personToDelete.name}? This cannot be undone.`)) {
                db.collection('trips').doc(currentTripId).collection('people').doc(personId).delete();
            }
        }
    });
    
    transactionList.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
            const transactionId = e.target.closest('.delete-btn').dataset.id;
            if (confirm(`Are you sure you want to delete this transaction? This cannot be undone.`)) {
                db.collection('trips').doc(currentTripId).collection('transactions').doc(transactionId).delete();
            }
        }
    });

    deleteTripBtn.addEventListener('click', async () => {
        if (!currentTripId) return;
        const tripName = tripSelector.options[tripSelector.selectedIndex].text;

        if (confirm(`ARE YOU ABSOLUTELY SURE?\nThis will permanently delete the trip "${tripName}" and all of its members and transactions. This action cannot be undone.`)) {
            const tripRef = db.collection('trips').doc(currentTripId);
            
            const peopleSnapshot = await tripRef.collection('people').get();
            peopleSnapshot.forEach(doc => doc.ref.delete());

            const transactionsSnapshot = await tripRef.collection('transactions').get();
            transactionsSnapshot.forEach(doc => doc.ref.delete());

            await tripRef.delete();
            alert(`Trip "${tripName}" has been deleted.`);
        }
    });

    // --- UI AND CALCULATION FUNCTIONS ---
    function updateUI() {
        updateTransactionList();
        updateSummary();
    }

    // THIS FUNCTION IS NOW FULLY CORRECTED
    function updatePeopleDisplay() {
        people.sort((a, b) => a.name.localeCompare(b.name));
        peopleList.innerHTML = '';
        paidBySelect.innerHTML = '';
        splitBetweenCheckboxes.innerHTML = '';

        people.forEach(person => {
            // Update list of people with delete button
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${person.name}</span>
                <button class="delete-btn" data-id="${person.id}">&times;</button>
            `;
            peopleList.appendChild(li);

            // CORRECTED: Update 'paid by' dropdown
            const option = document.createElement('option');
            option.value = person.name; // Use person.name
            option.textContent = person.name; // Use person.name
            paidBySelect.appendChild(option);

            // CORRECTED: Update 'split between' checkboxes
            const checkboxDiv = document.createElement('div');
            checkboxDiv.innerHTML = `<input type="checkbox" id="cb-${person.name}" name="split" value="${person.name}" checked><label for="cb-${person.name}">${person.name}</label>`;
            splitBetweenCheckboxes.appendChild(checkboxDiv);
        });
    }

    function updateTransactionList() {
        transactionList.innerHTML = '';
        transactions.sort((a, b) => (a.createdAt && b.createdAt) ? a.createdAt.seconds - b.createdAt.seconds : 0);
        transactions.forEach(tx => {
            const li = document.createElement('li');
            const splitText = tx.splitBetween.length === people.length ? 'everyone' : tx.splitBetween.join(', ');
            li.innerHTML = `
                <span>${tx.description} - ${tx.paidBy} paid ₹${tx.amount.toFixed(2)} (Split with: ${splitText})</span>
                <button class="delete-btn" data-id="${tx.id}">&times;</button>
            `;
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
        const peopleNames = people.map(p => p.name);
        peopleNames.forEach(name => balances[name] = 0);

        transactions.forEach(tx => {
            const amountPerPerson = tx.amount / tx.splitBetween.length;
            if (balances[tx.paidBy] !== undefined) balances[tx.paidBy] += tx.amount;
            tx.splitBetween.forEach(personName => {
                if (balances[personName] !== undefined) balances[personName] -= amountPerPerson;
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
