# Hostel Management System

A complete full-stack Hostel Management System built using:

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express.js
- Database: SQLite
- DBMS concepts: tables, primary keys, foreign keys, joins, CRUD, aggregation and reporting

## Features

1. Admin login
2. Dashboard with hostel statistics
3. Student management
   - Add student
   - Edit student
   - Delete student
   - Search student
   - Room allocation
4. Room management
   - Add room
   - Edit room
   - Delete empty room
   - Capacity and occupancy tracking
5. Payment management
   - Record hostel/mess/late fee payments
   - Delete payment
   - Transaction reference
6. Reports
   - Student report
   - Payment report
   - Print reports
7. Automatic room occupancy and status updates
8. Responsive frontend

## Database Schema

### users
- id (PK)
- username
- password
- role

### rooms
- id (PK)
- room_number
- capacity
- occupied
- floor
- status

### students
- id (PK)
- student_id
- name
- email
- phone
- course
- year
- guardian_name
- guardian_phone
- room_id (FK -> rooms.id)
- admission_date
- status

### payments
- id (PK)
- student_id (FK -> students.id)
- amount
- payment_date
- payment_type
- status
- transaction_ref

## How to Run

### 1. Install Node.js

Install Node.js LTS if it is not already installed.

### 2. Open terminal in the project folder

```bash
cd hostel-management-system
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
npm start
```

### 5. Open browser

Go to:

http://localhost:5000

### Login

Username: `admin`

Password: `admin123`

The SQLite database is automatically created at:

`database/hostel.db`

## Project Structure

```text
hostel-management-system/
│
├── config/
│   └── db.js
├── controllers/
│   ├── paymentController.js
│   ├── reportController.js
│   ├── roomController.js
│   └── studentController.js
├── database/
│   └── hostel.db              # generated automatically
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       └── login.js
├── routes/
│   ├── authRoutes.js
│   ├── paymentRoutes.js
│   ├── reportRoutes.js
│   ├── roomRoutes.js
│   └── studentRoutes.js
├── views/
│   ├── dashboard.html
│   └── index.html
├── package.json
├── README.md
└── server.js
```

## REST API Endpoints

### Authentication
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`

### Students
- GET `/api/students`
- GET `/api/students/:id`
- POST `/api/students`
- PUT `/api/students/:id`
- DELETE `/api/students/:id`

### Rooms
- GET `/api/rooms`
- POST `/api/rooms`
- PUT `/api/rooms/:id`
- DELETE `/api/rooms/:id`

### Payments
- GET `/api/payments`
- POST `/api/payments`
- DELETE `/api/payments/:id`

### Reports
- GET `/api/reports/summary`
- GET `/api/reports/students`
- GET `/api/reports/payments`

## Interview Explanation

"I developed a Hostel Management System as a full-stack DBMS project. The frontend was built using HTML, CSS and JavaScript, while Node.js and Express.js were used for the backend. SQLite was used as the relational database. The system manages student records, room allocation, payments and reports. I implemented CRUD operations, REST APIs, primary and foreign key relationships, SQL joins and aggregate queries. Room occupancy is automatically updated when a student is allocated, transferred or removed."

## Note

This is a college/interview project. For production use, passwords should be hashed, environment variables should be used for secrets, and authentication/authorization should be strengthened.
