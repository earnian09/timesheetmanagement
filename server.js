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

const db = mysql.createConnection({
    host: 'profilingdatabase.c70w002qw0l1.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'testing123',
    database: 'profiling',
});
// const db = mysql.createConnection({
//     host: 'profilingdatabase.c70w002qw0l1.us-east-1.rds.amazonaws.com',
//     user: 'admin',
//     password: 'testing123',
//     database: 'profiling',
// });

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


// Read
app.post('/read', (req, res) => {

    const emp_ID = req.body.emp_ID;
    const page = req.body.page;
    // expects_Array means if the request expects many values that will be looped in the front end.
    expects_Array = false;

    var sql = 'SELECT * FROM ';
    // Check which page to display; grabs option from front end then selects respective table
    switch (page) {
        case 'employeeinfo':
            sql += `tbl_info`;
            break;
        case 'certification':
            sql += `tbl_certification`;
            expects_Array = true;
            break;
        case 'dependencies':
            sql += `tbl_dependencies`;
            expects_Array = true;
            break;
        case 'organizations':
            sql += `tbl_org`;
            expects_Array = true;
            break;
        case 'accountingdetails':
            sql += `tbl_accounting_details`;
            break;
        case 'education':
            sql += `tbl_education`;
            break;
        case 'teachingloads':
            sql += `tbl_teaching_loads`;
            expects_Array = true;
            break;
        case 'workexperience':
            sql += `tbl_experience`;
            expects_Array = true;
            break;
        case 'employeedetails':
            sql += `tbl_details`;
            break;
        case 'skills':
            sql += `tbl_skills`;
            expects_Array = true;
            break;
        case 'personalcontact':
            sql += `tbl_personal_contact`;
            break;
        case 'provincialcontact':
            sql += `tbl_provincial_contact`;
            expects_Array = true;
            break;
        case 'emergency':
            sql += `tbl_emergency`;
            break;
        case 'loginDetails':
            sql += `tbl_login`;
            break;
        default:
            console.log('Unknown Error');
    }
    sql += ` WHERE emp_ID = ${emp_ID}`

    db.query(sql, function (error, result) {
        if (error) {
            console.log("Error:", error);
            res.status(500).send("Internal Server Error");
        } else {
            if (expects_Array == false) {
                // if the display only needs one entry
                res.send(result[0]);
            }
            else if (expects_Array == true) {
                // if the display needs multiple entries, loopable
                res.send(result);
            }
        }
    });
});

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

// Update or Add Values
app.put('/update', (req, res) => {
    const updateBody = req.body;

    // Code relevant to commas in sql query
    let keyCount = Object.keys(updateBody).length;
    let currentKeyIndex = 0;

    // updateBody.tbl will declare which table ot edit
    var sql = `
    UPDATE ${updateBody.tbl} SET `
    for (let key in updateBody) {
        // Loop through all items of a given table
        if (updateBody.hasOwnProperty(key)) {
            currentKeyIndex++;
            // Skips the table declaration
            if (key === 'tbl') {
                continue;
            }
            // Skips the emp_ID declaration
            if (key === 'emp_ID') {
                continue;
            }

            const value = updateBody[key];
            sql += `${key} = `

            if (typeof value === 'string') {
                sql += `'${value}'`
            } else if (typeof value === 'number' && Number.isInteger(value)) {
                sql += `${value}`
            }
            else if (!value) {
                sql += `null`
            }
            // Code to check if its the last value, if it is, then no comma
            if (currentKeyIndex < keyCount) {
                sql += ', ';
            }
        }
    }

    sql += ` WHERE emp_ID = ${req.body.emp_ID}`;

    console.log(sql)

    db.query(sql, function (error, result) {
        if (error) {
            console.log("Error:", error);
            if (error.code === 'ER_DUP_ENTRY' && error.errno === 1062) {
                // Handle duplicate entry error
                res.status(400).json({
                    error: "Duplicate entry error occurred",
                    code: error.code,
                    errno: error.errno
                });
            } else {
                // Handle other database errors
                res.status(500).send("Error Updating");
            }
        } else {
            console.log(`Updating of ${updateBody.tbl} Success`);
            res.json({ message: `Updating of ${updateBody.tbl} Success` });

        }
    });

})

// Delete Values
app.put('/delete', (req, res) => {
    const updateBody = req.body;

    // Code relevant to commas in sql query
    let keyCount = Object.keys(updateBody).length;
    let currentKeyIndex = 0;

    // updateBody.tbl will declare which table ot edit
    var sql = `
    UPDATE ${updateBody.tbl} SET `
    for (let key in updateBody) {
        // Loop through all items of a given table
        if (updateBody.hasOwnProperty(key)) {
            currentKeyIndex++;
            // Skips the table declaration
            if (key === 'tbl') {
                continue;
            }
            // Skips the emp_ID declaration
            if (key === 'emp_ID') {
                continue;
            }
            const value = updateBody[key];
            sql += `${key} = NULL`
            // Code to check if its the last value, if it is, then no comma
            if (currentKeyIndex < keyCount) {
                sql += ', ';
            }

        }
    }
    sql += ` WHERE emp_ID = ${req.body.emp_ID}`;
    console.log(sql)

    db.query(sql, function (error, result) {
        if (error) {
            console.log("Error:", error);
            // Handle database errors
            res.status(500).send("Error Deleting");
        } else {
            console.log(`Deleting of ${updateBody.tbl} Success`);
            res.json({ message: `Deleting of ${updateBody.tbl} Success` });

        }
    });

})

app.post('/submit-form', (req, res) => {
    const formData = req.body;
    // Process the form data as needed
    
    const processData = {
        'student_Number': formData[1],
        'full_Nmae': formData[2],
        'hours_EmergencyWard': formData[3],
        'hours_A': formData[4],
        'hours_B': formData[5],
        'field': formData[6],
    }

    console.log(processData);

    res.sendStatus(200); // Send a success response
});


app.listen(port, () => {
    console.log(`Server is running on profilingdatabase.c70w002qw0l1.us-east-1.rds.amazonaws.com:${port}`);
});
