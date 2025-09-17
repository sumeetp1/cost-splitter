body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f7f6;
    color: #333;
    margin: 0;
    padding: 20px;
    display: flex;
    justify-content: center;
}

.container {
    width: 100%;
    max-width: 600px;
    background: #fff;
    padding: 25px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

h1, h2 {
    text-align: center;
    color: #2c3e50;
}

.people-container, .form-container, .summary-container, .transactions-container {
    margin-bottom: 25px;
    border: 1px solid #e0e0e0;
    padding: 20px;
    border-radius: 8px;
}

input, select, button {
    width: 100%;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    box-sizing: border-box; /* Important! */
    font-size: 1em;
}

button {
    background-color: #3498db;
    color: white;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #2980b9;
}

#people-list {
    list-style-type: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

#people-list li {
    background: #e0e0e0;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 0.9em;
}

.split-between-container {
    margin-top: 15px;
}

#split-between-checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
    margin-top: 5px;
}

#split-between-checkboxes div {
    display: flex;
    align-items: center;
}

#split-between-checkboxes input[type="checkbox"] {
    width: auto;
    margin-right: 8px;
}

#transaction-list {
    list-style-type: none;
    padding: 0;
}

#transaction-list li {
    background: #ecf0f1;
    padding: 10px;
    margin-bottom: 5px;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
}

#summary ul {
    list-style-type: none;
    padding: 0;
}

#summary li {
    background-color: #f9f9f9;
    padding: 8px;
    border: 1px solid #eee;
    margin-bottom: 5px;
    border-radius: 4px;
}
