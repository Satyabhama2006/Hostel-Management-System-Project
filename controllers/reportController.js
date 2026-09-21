const { db } = require("../config/db");

exports.getSummary = (req, res) => {
  const students = db.prepare("SELECT COUNT(*) AS count FROM students WHERE status='Active'").get().count;
  const rooms = db.prepare("SELECT COUNT(*) AS count FROM rooms").get().count;
  const capacity = db.prepare("SELECT COALESCE(SUM(capacity),0) AS total FROM rooms").get().total;
  const occupied = db.prepare("SELECT COALESCE(SUM(occupied),0) AS total FROM rooms").get().total;
  const revenue = db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='Paid'").get().total;
  const availableBeds = Math.max(capacity - occupied, 0);

  res.json({ students, rooms, capacity, occupied, availableBeds, revenue });
};

exports.getStudentReport = (req, res) => {
  const rows = db.prepare(`
    SELECT s.student_id, s.name, s.course, s.year, r.room_number,
           s.admission_date, s.status
    FROM students s
    LEFT JOIN rooms r ON r.id = s.room_id
    ORDER BY s.id DESC
  `).all();
  res.json(rows);
};

exports.getPaymentReport = (req, res) => {
  const rows = db.prepare(`
    SELECT p.payment_date, s.student_id, s.name,
           p.amount, p.payment_type, p.status, p.transaction_ref
    FROM payments p
    JOIN students s ON s.id = p.student_id
    ORDER BY p.payment_date DESC, p.id DESC
  `).all();
  res.json(rows);
};
