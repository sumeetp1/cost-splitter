// ⬇️ PASTE YOUR FIREBASE CONFIG OBJECT HERE ⬇️
// Replace this entire object with the one you copied from the Firebase console.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBD2QecoCI9R6-6SHs-K_5vwKQvKriQEH0",
  authDomain: "trip-cost-splitter.firebaseapp.com",
  projectId: "trip-cost-splitter",
  storageBucket: "trip-cost-splitter.firebasestorage.app",
  messagingSenderId: "99530590172",
  appId: "1:99530590172:web:9a085f6256edddfbaf7119",
  measurementId: "G-DMVVZD6DFD"
};


// ⬆️ PASTE YOUR FIREBASE CONFIG OBJECT HERE ⬆️


// --- INITIALIZE FIREBASE AND FIRESTORE ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- GET HTML ELEMENTS ---
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const transactionList = document.getElementById('transaction-list');
const summaryDiv = document.getElementById('summary');
const addPersonForm = document.getElementById('add-person-form');
const personNameInput = document.getElementById('person-name');
const peopleList = document.getElementById('people-list');
const paidBySelect = document.getElementById('paid-by');
const splitBetweenCheckboxes = document.getElementById('split-between-checkboxes');

// --- GLOBAL STATE ARRAYS (will be filled from Firestore) ---
let people = [];
let transactions = [];

// --- REAL-TIME DATA LOADING FROM FIRESTORE ---
// Listen for any changes in the 'people' collection in the database
db.collection('people').onSnapshot(snapshot => {
    people = []; // Clear the local array
    snapshot.forEach(doc => {
        people.push(doc.data().name); // Refill it with data from the database
    });
    updatePeopleDisplay(); // Update the dropdowns and checkboxes
    updateUI(); // Recalculate everything with the new data
});

// Listen for any changes in the 'transactions' collection in the database
db.collection('transactions').onSnapshot(snapshot => {
    transactions = []; // Clear the local array
    snapshot.forEach(doc => {
        transactions.push(doc.data()); // Refill it with data from the database
    });
    updateUI(); // Recalculate everything with the new data
});


// --- SAVING DATA TO FIRESTORE ---
// Event listener for adding a new person
addPersonForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const newPerson = personNameInput.value.trim();
    if (newPerson && !people.includes(newPerson)) {
        // Save the new person to the 'people' collection in Firestore
        db.collection('people').add({ name: newPerson });
    }
    personNameInput.value = '';
});

// Event listener for adding a new transaction
form.addEventListener('submit', function(event) {
    event.preventDefault();
    const selectedPeople = [];
    const checkboxes = document.querySelectorAll('#split-between-checkboxes input[type="checkbox"]:checked');
    checkboxes.forEach(cb => selectedPeople.push(cb.value));

    if (selectedPeople.length === 0) {
        alert("Please select at least one person.");
        return;
    }

    const newTransaction = {
        description: descriptionInput.value,
        amount: parseFloat(amountInput.value),
        paidBy: paidBySelect.value,
        splitBetween: selectedPeople,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Optional: for sorting
    };

    // Save the new transaction to the 'transactions' collection in Firestore
    db.collection('transactions').add(newTransaction);
    form.reset();
    document.querySelectorAll('#split-between-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = true);
});


// --- UI AND CALCULATION FUNCTIONS (These remain mostly the same) ---

// Main function to update the entire UI
function updateUI() {
    updateTransactionList();
    updateSummary();
}

// Function to update all the places where people's names appear
function updatePeopleDisplay() {
    const currentPaidBy = paidBySelect.value; // Save the currently selected person
    
    peopleList.innerHTML = '';
    people.sort().forEach(person => { // Sort names alphabetically
        const li = document.createElement('li');
        li.textContent = person;
        peopleList.appendChild(li);
    });

    paidBySelect.innerHTML = '';
    people.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        paidBySelect.appendChild(option);
    });
    // If the previously selected person still exists, re-select them
    if (people.includes(currentPaidBy)) {
        paidBySelect.value = currentPaidBy;
    }


    splitBetweenCheckboxes.innerHTML = '';
    people.forEach(person => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="cb-${person}" name="split" value="${person}" checked>
            <label for="cb-${person}">${person}</label>
        `;
        splitBetweenCheckboxes.appendChild(checkboxDiv);
    });
}

// Function to show the list of all entered transactions
function updateTransactionList() {
    transactionList.innerHTML = '';
    // Sort transactions by when they were created
    transactions.sort((a, b) => (a.createdAt && b.createdAt) ? a.createdAt.seconds - b.createdAt.seconds : 0);
    transactions.forEach(tx => {
        const li = document.createElement('li');
        const splitText = tx.splitBetween.length === people.length ? 'all' : tx.splitBetween.join(', ');
        li.innerHTML = `
            ${tx.description} <span>${tx.paidBy} paid ₹${tx.amount.toFixed(2)} (Split with: ${splitText})</span>
        `;
        transactionList.appendChild(li);
    });
}

// Function to calculate and display the final summary
function updateSummary() {
    if (people.length === 0) {
        summaryDiv.innerHTML = '<p>Add people to get started.</p>';
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
        if(balances[tx.paidBy] !== undefined) balances[tx.paidBy] += tx.amount;
        tx.splitBetween.forEach(person => {
            if(balances[person] !== undefined) balances[person] -= amountPerPerson;
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

// Function to simplify the debt chains
function simplifyDebts(balances) {
    const debtors = [];
    const creditors = [];

    // Separate people into debtors and creditors
    for (const person in balances) {
        if (balances[person] < -0.01) { // Use a small epsilon for float comparison
            debtors.push({ name: person, amount: -balances[person] });
        } else if (balances[person] > 0.01) {
            creditors.push({ name: person, amount: balances[person] });
        }
    }

    const payments = [];

    // Match the biggest debtor with the biggest creditor until all debts are settled
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
