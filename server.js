const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const excel = require('exceljs'); // Import exceljs module for Excel file generation
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cointab_db'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Route to handle adding a user to the database
app.post('/addUser', (req, res) => {
    const { name, email, phone, website, city, company_name, catch_phrase, bs, api_user_id } = req.body;

    // Insert user data into the users table
    const query = `
        INSERT INTO users (name, email, phone, website, city, company_name, catch_phrase, bs, api_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(query, [name, email, phone, website, city, company_name, catch_phrase, bs, api_user_id], (err, results) => {
        if (err) {
            console.error('Error adding user to database:', err);
            res.status(500).json({ error: 'An error occurred while adding user to database' });
            return;
        }
        console.log('User added to database');
        res.status(200).json({ message: 'User added successfully' });
    });
});

// Route to check if a user exists in the database
app.get('/checkUser', (req, res) => {
    const api_user_id = req.query.api_user_id;
    const query = 'SELECT COUNT(*) AS count FROM users WHERE api_user_id = ?';

    connection.query(query, [api_user_id], (err, results) => {
        if (err) {
            console.error('Error checking user existence in database:', err);
            res.status(500).json({ error: 'An error occurred while checking user existence in database' });
            return;
        }

        const exists = results[0].count > 0;
        res.status(200).json({ exists });
    });
});

// Route to handle bulk adding of posts to the database
app.post('/bulkAddPosts', (req, res) => {
    const posts = req.body.posts;
    const values = posts.map(post => [post.userId, post.title, post.body]);

    const insertQuery = 'INSERT INTO user_posts (user_id, title, body) VALUES ?';

    console.log(insertQuery); // Log the query string
    console.log(values); // Log the values being passed to the query

    connection.query(insertQuery, [values], (err, results) => {
        if (err) {
            console.error('Error bulk adding posts to database:', err);
            res.status(500).json({ error: 'An error occurred while adding posts to database' });
            return;
        }

        console.log('Posts added to database');
        res.status(200).json({ message: 'Posts added successfully' });
    });
});

// Route to handle downloading posts in Excel format
app.get('/downloadPostsExcel', async(req, res) => {
    try {
        const userId = req.query.userId;

        // Fetch posts data from the database for the specified userId
        const posts = await fetchPostsForUser(userId);

        // Create a new Excel workbook
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Posts');

        // Add column headers
        worksheet.columns = [
            { header: 'User ID', key: 'userId' },
            { header: 'Title', key: 'title' },
            { header: 'Body', key: 'body' },
        ];

        // Add rows for each post
        posts.forEach(post => {
            worksheet.addRow({ userId: userId, title: post.title, body: post.body });
        });

        // Set response headers for Excel file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=posts.xlsx');

        // Write the workbook to the response stream
        await workbook.xlsx.write(res);

        // End the response
        res.end();
    } catch (error) {
        console.error('Error downloading posts in Excel:', error);
        res.status(500).json({ error: 'An error occurred while downloading posts in Excel' });
    }
});

// Route to check if posts exist in the database for a user
app.post('/checkPostsExist', (req, res) => {
    const posts = req.body.posts;
    const userId = posts[0].userId; // Assuming all posts have the same user ID

    // Construct SQL query to check if any of the posts exist for the user
    const query = 'SELECT COUNT(*) AS count FROM user_posts WHERE user_id = ? AND (title, body) IN (?)';

    // Extract titles and bodies from the posts array
    const postValues = posts.map(post => [post.title, post.body]);

    connection.query(query, [userId, postValues], (err, results) => {
        if (err) {
            console.error('Error checking posts existence in database:', err);
            res.status(500).json({ error: 'An error occurred while checking posts existence in database' });
            return;
        }

        const count = results[0].count;
        const exists = count > 0;
        res.status(200).json({ exists });
    });
});

// Route to handle other requests
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

async function fetchPostsForUser(userId) {
    return new Promise((resolve, reject) => {
        // Query to fetch posts for the specified userId from the database
        const query = 'SELECT title, body FROM user_posts WHERE user_id = ?';

        // Execute the query
        connection.query(query, [userId], (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(results);
        });
    });
}