// Get elements from the HTML
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

// Global state arrays
let people = [];
let transactions = [];

// Event listener for the "Add Person" form
addPersonForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const newPerson = personNameInput.value.trim();
    if (newPerson && !people.includes(newPerson)) {
        people.push(newPerson);
        updatePeopleDisplay();
        updateUI(); // Recalculate everything when a new person is added
    }
    personNameInput.value = '';
});

// Event listener for the transaction form submission
form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Find out who is selected in the checkboxes
    const selectedPeople = [];
    const checkboxes = document.querySelectorAll('#split-between-checkboxes input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        selectedPeople.push(cb.value);
    });

    if (selectedPeople.length === 0) {
        alert("Please select at least one person to split the transaction with.");
        return;
    }
    
    const newTransaction = {
        description: descriptionInput.value,
        amount: parseFloat(amountInput.value),
        paidBy: paidBySelect.value,
        splitBetween: selectedPeople, // Store the people involved
    };

    transactions.push(newTransaction);
    updateUI();
    form.reset();
    // Re-check all checkboxes for the next entry
    document.querySelectorAll('#split-between-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = true);
});

// Main function to update the entire UI
function updateUI() {
    updateTransactionList();
    updateSummary();
}

// Function to update all the places where people's names appear
function updatePeopleDisplay() {
    // Update the list of people
    peopleList.innerHTML = '';
    people.forEach(person => {
        const li = document.createElement('li');
        li.textContent = person;
        peopleList.appendChild(li);
    });

    // Update the "Who Paid?" dropdown
    paidBySelect.innerHTML = '';
    people.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        paidBySelect.appendChild(option);
    });

    // Update the "Split between" checkboxes
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
    transactionList.innerHTML = ''; // Clear the current list
    transactions.forEach(tx => {
        const li = document.createElement('li');
        const splitText = tx.splitBetween.length === people.length ? 'all' : tx.splitBetween.join(', ');
        li.innerHTML = `
            ${tx.description} <span>${tx.paidBy} paid ₹${tx.amount.toFixed(2)} (Split with: ${splitText})</span>
        `;
        transactionList.appendChild(li);
    });
}

// Function to calculate and display who owes whom
function updateSummary() {
    if (transactions.length === 0 || people.length === 0) {
        summaryDiv.innerHTML = '<p>Add people and transactions to see the summary.</p>';
        return;
    }

    const balances = {};
    people.forEach(person => balances[person] = 0);

    // Calculate balances from each transaction
    transactions.forEach(tx => {
        const amountPerPerson = tx.amount / tx.splitBetween.length;
        
        // The person who paid gets credited the full amount
        balances[tx.paidBy] += tx.amount;

        // The people involved in the split get debited their share
        tx.splitBetween.forEach(person => {
            balances[person] -= amountPerPerson;
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

    for (const person in balances) {
        if (balances[person] < -0.01) { // Use a small epsilon for float comparison
            debtors.push({ name: person, amount: -balances[person] });
        } else if (balances[person] > 0.01) {
            creditors.push({ name: person, amount: balances[person] });
        }
    }

    const payments = [];

    while (debtors.length > 0 && creditors.length > 0) {
        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => a.amount - b.amount);

        const debtor = debtors[debtors.length - 1];
        const creditor = creditors[creditors.length - 1];

        const paymentAmount = Math.min(debtor.amount, creditor.amount);

        payments.push({
            from: debtor.name,
            to: creditor.name,
            amount: paymentAmount,
        });

        debtor.amount -= paymentAmount;
        creditor.amount -= paymentAmount;

        if (debtor.amount < 0.01) {
            debtors.pop();
        }

        if (creditor.amount < 0.01) {
            creditors.pop();
        }
    }

    return payments;
}
