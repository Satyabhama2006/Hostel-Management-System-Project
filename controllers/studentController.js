const { db } = require("../config/db");

function updateRoomStatus(roomId) {
  if (!roomId) return;
  const room = db.prepare("SELECT capacity, occupied FROM rooms WHERE id = ?").get(roomId);
  if (!room) return;
  const status = room.occupied >= room.capacity ? "Full" : "Available";
  db.prepare("UPDATE rooms SET status = ? WHERE id = ?").run(status, roomId);
}

exports.getStudents = (req, res) => {
  const search = (req.query.search || "").trim();
  let rows;

  if (search) {
    rows = db.prepare(`
      SELECT s.*, r.room_number
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.name LIKE ? OR s.student_id LIKE ? OR s.course LIKE ?
      ORDER BY s.id DESC
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    rows = db.prepare(`
      SELECT s.*, r.room_number
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      ORDER BY s.id DESC
    `).all();
  }

  res.json(rows);
};

exports.getStudent = (req, res) => {
  const student = db.prepare(`
    SELECT s.*, r.room_number
    FROM students s
    LEFT JOIN rooms r ON s.room_id = r.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
};

exports.addStudent = (req, res) => {
  const {
    student_id, name, email, phone, course, year,
    guardian_name, guardian_phone, room_id, admission_date
  } = req.body;

  if (!student_id || !name || !admission_date) {
    return res.status(400).json({ message: "Student ID, name and admission date are required" });
  }

  const insert = db.transaction(() => {
    if (room_id) {
      const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(room_id);
      if (!room) throw new Error("Selected room does not exist");
      if (room.occupied >= room.capacity) throw new Error("Selected room is full");
      db.prepare("UPDATE rooms SET occupied = occupied + 1 WHERE id = ?").run(room_id);
    }

    const result = db.prepare(`
      INSERT INTO students
      (student_id, name, email, phone, course, year, guardian_name, guardian_phone, room_id, admission_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      student_id, name, email || "", phone || "", course || "",
      year || null, guardian_name || "", guardian_phone || "",
      room_id || null, admission_date
    );

    updateRoomStatus(room_id);
    return result.lastInsertRowid;
  });

  try {
    const id = insert();
    res.status(201).json({ message: "Student added successfully", id });
  } catch (error) {
    res.status(400).json({ message: error.message.includes("UNIQUE") ? "Student ID already exists" : error.message });
  }
};

exports.updateStudent = (req, res) => {
  const oldStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!oldStudent) return res.status(404).json({ message: "Student not found" });

  const {
    student_id, name, email, phone, course, year,
    guardian_name, guardian_phone, room_id, admission_date, status
  } = req.body;

  try {
    const transaction = db.transaction(() => {
      const oldRoom = oldStudent.room_id;
      const newRoom = room_id ? Number(room_id) : null;

      if (oldRoom !== newRoom) {
        if (oldRoom) db.prepare("UPDATE rooms SET occupied = MAX(occupied - 1, 0) WHERE id = ?").run(oldRoom);
        if (newRoom) {
          const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(newRoom);
          if (!room) throw new Error("Selected room does not exist");
          if (room.occupied >= room.capacity) throw new Error("Selected room is full");
          db.prepare("UPDATE rooms SET occupied = occupied + 1 WHERE id = ?").run(newRoom);
        }
      }

      db.prepare(`
        UPDATE students SET
        student_id=?, name=?, email=?, phone=?, course=?, year=?,
        guardian_name=?, guardian_phone=?, room_id=?, admission_date=?, status=?
        WHERE id=?
      `).run(
        student_id, name, email || "", phone || "", course || "",
        year || null, guardian_name || "", guardian_phone || "",
        newRoom, admission_date, status || "Active", req.params.id
      );

      updateRoomStatus(oldRoom);
      updateRoomStatus(newRoom);
    });

    transaction();
    res.json({ message: "Student updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message.includes("UNIQUE") ? "Student ID already exists" : error.message });
  }
};

exports.deleteStudent = (req, res) => {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
    if (student.room_id) {
      db.prepare("UPDATE rooms SET occupied = MAX(occupied - 1, 0) WHERE id = ?").run(student.room_id);
      updateRoomStatus(student.room_id);
    }
  });

  transaction();
  res.json({ message: "Student deleted successfully" });
};
