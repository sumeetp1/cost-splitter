// Get elements from the HTML
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const paidBySelect = document.getElementById('paid-by');
const transactionList = document.getElementById('transaction-list');
const summaryDiv = document.getElementById('summary');

// Define the names of the people on the trip
const people = ['Person 1', 'Person 2', 'Person 3', 'Person 4'];

// Array to store all transaction objects
let transactions = [];

// Event listener for form submission
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent page from reloading

    // Create a new transaction object from the form inputs
    const newTransaction = {
        description: descriptionInput.value,
        amount: parseFloat(amountInput.value),
        paidBy: paidBySelect.value,
    };

    // Add the new transaction to our array
    transactions.push(newTransaction);

    // Update the UI
    updateUI();

    // Clear the form fields
    form.reset();
});

// Function to update the display
function updateUI() {
    updateTransactionList();
    updateSummary();
}

// Function to show the list of transactions
function updateTransactionList() {
    transactionList.innerHTML = ''; // Clear the current list
    transactions.forEach(tx => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${tx.description} <span>${tx.paidBy} paid ₹${tx.amount.toFixed(2)}</span>
        `;
        transactionList.appendChild(li);
    });
}

// Function to calculate and display who owes whom
function updateSummary() {
    if (transactions.length === 0) {
        summaryDiv.innerHTML = '<p>Add a transaction to see the summary.</p>';
        return;
    }

    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const amountPerPerson = totalSpent / people.length;

    const balances = {};
    people.forEach(person => balances[person] = 0);

    // Calculate how much each person has paid
    transactions.forEach(tx => {
        balances[tx.paidBy] += tx.amount;
    });

    // Calculate the final balance (paid - share)
    people.forEach(person => {
        balances[person] -= amountPerPerson;
    });

    // Separate people who are owed money from those who owe
    const owedTo = [];
    const owes = [];

    for (const person in balances) {
        if (balances[person] > 0) {
            owedTo.push({ name: person, amount: balances[person] });
        } else if (balances[person] < 0) {
            owes.push({ name: person, amount: -balances[person] });
        }
    }

    // Generate the summary text
    let summaryHTML = `
        <p><strong>Total Spent:</strong> ₹${totalSpent.toFixed(2)}</p>
        <p><strong>Share per Person:</strong> ₹${amountPerPerson.toFixed(2)}</p>
        <hr>
        <h4>Who Owes Whom:</h4>
    `;

    // Simple display of balances
    summaryHTML += '<ul>';
    for (const person in balances) {
        if (balances[person] > 0) {
            summaryHTML += `<li>${person} is owed <strong>₹${balances[person].toFixed(2)}</strong></li>`;
        } else if (balances[person] < 0) {
            summaryHTML += `<li>${person} owes <strong>₹${(-balances[person]).toFixed(2)}</strong></li>`;
        }
    }
    summaryHTML += '</ul>';

    summaryDiv.innerHTML = summaryHTML;
}
