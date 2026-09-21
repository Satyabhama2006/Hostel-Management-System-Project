const { db } = require("../config/db");

exports.getPayments = (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, s.student_id AS student_code, s.name AS student_name
    FROM payments p
    JOIN students s ON s.id = p.student_id
    ORDER BY p.payment_date DESC, p.id DESC
  `).all();
  res.json(payments);
};

exports.addPayment = (req, res) => {
  const { student_id, amount, payment_date, payment_type, transaction_ref } = req.body;

  if (!student_id || !amount || !payment_date) {
    return res.status(400).json({ message: "Student, amount and payment date are required" });
  }

  const student = db.prepare("SELECT id FROM students WHERE id = ?").get(student_id);
  if (!student) return res.status(400).json({ message: "Student not found" });

  db.prepare(`
    INSERT INTO payments
    (student_id, amount, payment_date, payment_type, status, transaction_ref)
    VALUES (?, ?, ?, ?, 'Paid', ?)
  `).run(
    student_id, Number(amount), payment_date,
    payment_type || "Hostel Fee", transaction_ref || ""
  );

  res.status(201).json({ message: "Payment recorded successfully" });
};

exports.deletePayment = (req, res) => {
  const payment = db.prepare("SELECT id FROM payments WHERE id = ?").get(req.params.id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  db.prepare("DELETE FROM payments WHERE id = ?").run(req.params.id);
  res.json({ message: "Payment deleted successfully" });
};
