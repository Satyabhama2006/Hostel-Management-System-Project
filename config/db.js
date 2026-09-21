const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "database", "hostel.db");
const db = new Database(dbPath);

function initializeDatabase() {
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL UNIQUE,
      capacity INTEGER NOT NULL CHECK(capacity > 0),
      occupied INTEGER NOT NULL DEFAULT 0 CHECK(occupied >= 0),
      floor INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Available'
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      course TEXT,
      year INTEGER,
      guardian_name TEXT,
      guardian_phone TEXT,
      room_id INTEGER,
      admission_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      payment_date TEXT NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'Hostel Fee',
      status TEXT NOT NULL DEFAULT 'Paid',
      transaction_ref TEXT,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  const admin = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");
  if (!admin) {
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)")
      .run("admin", "admin123", "admin");
  }

  const count = db.prepare("SELECT COUNT(*) AS count FROM rooms").get().count;
  if (count === 0) {
    const insert = db.prepare(
      "INSERT INTO rooms (room_number, capacity, occupied, floor, status) VALUES (?, ?, ?, ?, ?)"
    );
    const seedRooms = [
      ["A-101", 3, 2, 1, "Available"],
      ["A-102", 3, 3, 1, "Full"],
      ["A-103", 2, 1, 1, "Available"],
      ["B-201", 4, 2, 2, "Available"],
      ["B-202", 4, 4, 2, "Full"],
      ["B-203", 2, 0, 2, "Available"],
      ["C-301", 3, 1, 3, "Available"],
      ["C-302", 3, 0, 3, "Available"]
    ];
    const transaction = db.transaction((rooms) => rooms.forEach(r => insert.run(...r)));
    transaction(seedRooms);
  }

  const studentCount = db.prepare("SELECT COUNT(*) AS count FROM students").get().count;
  if (studentCount === 0) {
    const insertStudent = db.prepare(`
      INSERT INTO students
      (student_id, name, email, phone, course, year, guardian_name, guardian_phone, room_id, admission_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStudent.run(
      "STU001", "Rahul Kumar", "rahul@example.com", "9876543210",
      "B.Tech CSE", 3, "Suresh Kumar", "9876500000", 1, "2026-07-01"
    );
    insertStudent.run(
      "STU002", "Priya Singh", "priya@example.com", "9876543211",
      "B.Tech ECE", 2, "Rakesh Singh", "9876500001", 3, "2026-07-03"
    );
    insertStudent.run(
      "STU003", "Aman Verma", "aman@example.com", "9876543212",
      "B.Tech ME", 4, "Rajesh Verma", "9876500002", 4, "2026-07-05"
    );
  }
}

module.exports = { db, initializeDatabase };
