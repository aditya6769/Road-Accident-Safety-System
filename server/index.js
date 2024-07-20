// server/index.js
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.static(path.join(__dirname, "..", "img")));

// MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root", // Update with your MySQL username
  password: "", // Update with your MySQL password
  database: "road_accident_db",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    throw err;
  }
  console.log("Connected to MySQL database");
});

// Hash password function
async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

// Routes

// Report accident endpoint
app.post("/api/report-accident", async (req, res) => {
  const {
    location,
    latitude,
    longitude,
    date,
    time,
    severity,
    vehicles,
    accidentType,
  } = req.body;

  const query =
    "INSERT INTO accidents (location, latitude, longitude, date, time, severity, vehicles, accidentType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  try {
    connection.query(query, [
      location,
      latitude,
      longitude,
      date,
      time,
      severity,
      vehicles,
      accidentType,
    ], (err, result) => {
      if (err) {
        console.error("Error inserting accident:", err);
        return res.status(500).json({ error: "Error reporting accident" });
      }
      res.status(200).json({ message: "Accident reported successfully" });
    });
  } catch (err) {
    console.error("Error reporting accident:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch accidents endpoint
app.get("/api/accidents", async (req, res) => {
  const query = "SELECT * FROM accidents";
  try {
    connection.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching accidents:", err);
        return res.status(500).json({ error: "Error fetching accidents" });
      }
      res.status(200).json(results);
    });
  } catch (err) {
    console.error("Error fetching accidents:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Signup route with password hashing
app.post('/api/signup', async (req, res) => {
  const { name, username, email, password, contact, address } = req.body;

  if (!name || !username || !email || !password || !contact || !address) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Check if the username or email already exists
    connection.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length > 0) {
          return res.status(400).json({ error: 'Username or Email already exists.' });
        }

        // Insert new user into the database
        const hashedPassword = await hashPassword(password);

        connection.query(
          'INSERT INTO users (name, username, email, password, contact, address) VALUES (?, ?, ?, ?, ?, ?)',
          [name, username, email, hashedPassword, contact, address],
          (err, results) => {
            if (err) {
              console.error('Error inserting user:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: 'Signup successful!' });
          }
        );
      }
    );
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route with password hashing verification
app.post("/api/login", async (req, res) => {
  const { identifier, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ? OR email = ?";
  try {
    connection.query(query, [identifier, identifier], async (err, results) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length === 1) {
        const user = results[0];
        // Compare provided password with hashed password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          // Fetch user details and send them back
          const userData = {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            contact: user.contact,
            address: user.address,
          };
          res.status(200).json(userData);
        } else {
          res.status(401).json({ error: "Incorrect password" });
        }
      } else {
        res.status(401).json({ error: "User not found" });
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/user/:username", async (req, res) => {
  const username = req.params.username;

  const query = "SELECT * FROM users WHERE username = ?";
  try {
    connection.query(query, [username], (err, results) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (results.length === 0) {
        res.status(404).json({ error: "User not found" });
      } else {
        const user = results[0];
        res.status(200).json(user);
      }
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const PORT = process.env.PORT || 9527;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
