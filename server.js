const express = require('express');
const bodyParser = require('body-parser');

const app = express(); // Runs the server
const port = 3000;
const mysql = require('mysql'); // Connects to the database
app.use(bodyParser.json());

// Security
const cors = require('cors');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

// Google Forms
const axios = require('axios');

// Google Sheets
const { google } = require('googleapis');
const fs = require('fs');

// Load credentials from the JSON file
const credentials = require('./timesheetapi-420507-0894b1efa9f1.json');


// Configure authentication
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Create Google Sheets API client
const sheets = google.sheets({ version: 'v4', auth });

// MySQL DB Connection
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'timesheetmanagement',
// });
const db = mysql.createConnection({
    host: 'profilingdatabase.c70w002qw0l1.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'testing123',
    database: 'profiling',
});

function handleDisconnect() {
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL database:', err);
            setTimeout(handleDisconnect, 2000); // Retry connection after 2 seconds
        } else {
            console.log('Connected to MySQL database');
        }
    });

    db.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Reconnecting to the database...');
            handleDisconnect(); // Reconnect if connection is lost
        } else {
            throw err;
        }
    });
}
handleDisconnect();

app.post('/login', (req, res) => {
    res.set('Access-Control-Allow-Origin');

    const username = req.body.username;
    const password = req.body.password;

    console.log(username);
    console.log(password);

    var sql = `SELECT * FROM accounts WHERE username = '${username}' AND password = '${password}'`;

    db.query(sql, function (error, result) {
        if (error) {
            console.log("Error:", error);
            res.status(500).send("Error - Something went wrong");
        } else {
            console.log(result);
            if (result.length > 0) {
                res.json({ authenticated: true });
            }
            else {
                res.json({ authenticated: false });
            }
        }
    });
});

app.post('/submit-form', (req, res) => {
    const formData = req.body;
    // Process the form data as needed

    res.sendStatus(200); // Send a success response
});

app.post('/submit-to-google-forms', (req, res) => {
    const formData = req.body;
    // Process the form data as needed

    const googleformsData = {
        'student_Number': formData.student_Number,
        'full_Name': formData.full_Name,
        'field': formData.field,
        'hours': formData.hours,
    }

    console.log(googleformsData);

    try {
        let response = submitToGoogleForm(googleformsData);
        if (response = "Success") {
            res.json({ success: true }); // Send a success response
        }
        else {
            res.json({ success: false }); // Send an error response
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).send('Error submitting form data');
    }

});

async function submitToGoogleForm(data) {
    try {
        const response = await axios.post('https://script.google.com/macros/s/AKfycbw9sMkrh_OdHEk10y3U8XPqCdNUkA0q94IZshoyVTA9gOqHvZ7OSDpNdDLApN-acPyijQ/exec', data);
        console.log('Response from Google Apps Script (Forms):', response.data);
        return response.data;
    } catch (error) {
        console.error('Error submitting form:', error);
        return "Error";
    }
}

// Google Sheets
async function getSpreadsheetData() {
    try {
        const spreadsheetId = '12hZm17uQB6FpHpe2KTIrmczSKtENXibfU6DLTa-rN48';
        const range = 'Sheet1!A2:E'; // Specify the range you want to retrieve data from
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        if (response && response.data && response.data.values) {
            const rows = response.data.values;
            const dataArray = []; // Array to store the data

            rows.forEach(row => {
                if (row && row.length) {
                    // Check if the row is not empty
                    // Here you can add additional checks if needed, e.g., check specific columns
                    dataArray.push(row);
                }
            });

            if (dataArray.length > 0) {
                // Log dataArray to see the retrieved data
                return dataArray; // Return the dataArray
            } else {
                console.log('No non-empty rows found.');
                return []; // Return an empty array if no non-empty rows found
            }
        } else {
            console.log('No data found.');
            return []; // Return an empty array if no data found
        }
    } catch (err) {
        console.error('The API returned an error:', err);
        return []; // Return an empty array if an error occurs
    }
}


app.get('/get-googlesheets', async (req, res) => {

    try {
        const dataArray = await getSpreadsheetData();
        res.send(dataArray); // Send the data back to the client
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('An error occurred');
    }

});

// Submit to G Calendar
app.post('/submit-to-google-calendar', (req, res) => {
    const formData = req.body;
    // Process the form data as needed

    const googleCalendarData = {
        'student_Number': formData.student_Number,
        'full_Name': formData.full_Name,
        'date': formData.date,
        'description': formData.description,
    }

    try {
        let response = submitToGoogleCalendar(googleCalendarData);
        if (response = "Success") {
            res.json({ success: true }); // Send a success response
        }
        else {
            res.json({ success: false }); // Send an error response
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).send('Error submitting form data');
    }
});

async function submitToGoogleCalendar(data) {
    try {
        const response = await axios.post('https://script.google.com/macros/s/AKfycbx-pewAk41r2lwTnlnw1GN9lKU3qD1DAcyIt1PUEVWvQSWZ1V4KFdOldyZNkvNCq6eiRA/exec', data);
        console.log('Response from Google Apps Script (Calendar):', response.data);
        return response.data;
    } catch (error) {
        console.error('Error submitting form:', error);
        return "Error";
    }
}

// Retrieve from G Calendar
app.post('/retrieve-from-google-calendar', async (req, res) => {
    const formData = req.body;
    // Process the form data as needed

    try {
        let response = await fetchTasksByTitle(formData.student_Number);
        console.log(response);
        res.json(JSON.stringify(response)); // Send a success response

    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).send('Error submitting form data');
    }
});

// Function to fetch tasks by title using axios.post()
async function fetchTasksByTitle(title) {
    try {
        const response = await axios.post('https://script.google.com/macros/s/AKfycbw8WfpsFFcxozWnzn2bOI9SXyDUJsilDOMaYQ3Aair1tmMI36buHxojiAOdDr-4xlQH0Q/exec', title);
        const tasks = response.data;
        return tasks;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return null;
    }
}

app.listen(port, () => {
    console.log(`Server is running on profilingdatabase.c70w002qw0l1.us-east-1.rds.amazonaws.com:${port}`);
});
