const { db } = require("../config/db");

function status(capacity, occupied) {
  return occupied >= capacity ? "Full" : "Available";
}

exports.getRooms = (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*, COUNT(s.id) AS student_count
    FROM rooms r
    LEFT JOIN students s ON s.room_id = r.id
    GROUP BY r.id
    ORDER BY r.floor, r.room_number
  `).all();
  res.json(rooms);
};

exports.addRoom = (req, res) => {
  const { room_number, capacity, floor } = req.body;
  if (!room_number || !capacity || !floor) {
    return res.status(400).json({ message: "Room number, capacity and floor are required" });
  }

  try {
    db.prepare(`
      INSERT INTO rooms (room_number, capacity, occupied, floor, status)
      VALUES (?, ?, 0, ?, 'Available')
    `).run(room_number, Number(capacity), Number(floor));
    res.status(201).json({ message: "Room added successfully" });
  } catch (e) {
    res.status(400).json({ message: e.message.includes("UNIQUE") ? "Room number already exists" : e.message });
  }
};

exports.updateRoom = (req, res) => {
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  const { room_number, capacity, floor } = req.body;
  const occupied = room.occupied;

  if (Number(capacity) < occupied) {
    return res.status(400).json({ message: `Capacity cannot be less than current occupancy (${occupied})` });
  }

  try {
    db.prepare(`
      UPDATE rooms SET room_number=?, capacity=?, floor=?, status=?
      WHERE id=?
    `).run(room_number, Number(capacity), Number(floor), status(Number(capacity), occupied), req.params.id);

    res.json({ message: "Room updated successfully" });
  } catch (e) {
    res.status(400).json({ message: e.message.includes("UNIQUE") ? "Room number already exists" : e.message });
  }
};

exports.deleteRoom = (req, res) => {
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  if (room.occupied > 0) return res.status(400).json({ message: "Cannot delete an occupied room" });

  db.prepare("DELETE FROM rooms WHERE id = ?").run(req.params.id);
  res.json({ message: "Room deleted successfully" });
};
