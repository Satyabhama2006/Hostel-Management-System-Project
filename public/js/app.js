let students = [];
let rooms = [];
let payments = [];

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      window.location.href = "/";
      return;
    }
  } catch {
    window.location.href = "/";
    return;
  }

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.dataset.section));
  });

  $("logoutBtn").addEventListener("click", logout);
  $("studentForm").addEventListener("submit", saveStudent);
  $("roomForm").addEventListener("submit", saveRoom);
  $("paymentForm").addEventListener("submit", savePayment);

  $("admissionDate").value = today();
  $("paymentDate").value = today();

  await refreshAll();
});

function today() {
  return new Date().toISOString().split("T")[0];
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {"Content-Type": "application/json", ...(options.headers || {})},
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadStudents(), loadRooms(), loadPayments(), loadReports()]);
}

async function loadDashboard() {
  const summary = await api("/api/reports/summary");
  $("statStudents").textContent = summary.students;
  $("statRooms").textContent = summary.rooms;
  $("statOccupied").textContent = summary.occupied;
  $("statAvailable").textContent = summary.availableBeds;
  $("statRevenue").textContent = money(summary.revenue);

  const data = await api("/api/rooms");
  $("roomOverview").innerHTML = data.slice(0, 8).map(r => `
    <div class="room-mini">
      <strong>${escapeHtml(r.room_number)}</strong>
      <span>${r.occupied}/${r.capacity} occupied</span>
      <span class="badge ${r.status === "Full" ? "danger" : "success"}">${r.status}</span>
    </div>
  `).join("");
}

async function loadStudents() {
  const search = encodeURIComponent($("studentSearch")?.value || "");
  students = await api(`/api/students?search=${search}`);

  $("studentsTable").innerHTML = students.map(s => `
    <tr>
      <td><b>${escapeHtml(s.student_id)}</b></td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.course || "-")}</td>
      <td>${s.year || "-"}</td>
      <td>${escapeHtml(s.room_number || "Not Allocated")}</td>
      <td>${escapeHtml(s.phone || "-")}</td>
      <td><span class="badge ${s.status === "Active" ? "success" : "warning"}">${escapeHtml(s.status)}</span></td>
      <td>
        <button class="action-btn edit" onclick="editStudent(${s.id})">Edit</button>
        <button class="action-btn delete" onclick="deleteStudent(${s.id})">Delete</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="8" class="muted">No students found.</td></tr>`;

  populateStudentSelects();
}

async function loadRooms() {
  rooms = await api("/api/rooms");

  $("roomsTable").innerHTML = rooms.map(r => `
    <tr>
      <td><b>${escapeHtml(r.room_number)}</b></td>
      <td>${r.floor}</td>
      <td>${r.capacity}</td>
      <td>${r.occupied}</td>
      <td>${Math.max(r.capacity - r.occupied, 0)}</td>
      <td><span class="badge ${r.status === "Full" ? "danger" : "success"}">${r.status}</span></td>
      <td>
        <button class="action-btn edit" onclick="editRoom(${r.id})">Edit</button>
        <button class="action-btn delete" onclick="deleteRoom(${r.id})">Delete</button>
      </td>
    </tr>
  `).join("");
  populateRoomSelect();
}

async function loadPayments() {
  payments = await api("/api/payments");

  $("paymentsTable").innerHTML = payments.map(p => `
    <tr>
      <td>${p.payment_date}</td>
      <td><b>${escapeHtml(p.student_code)}</b></td>
      <td>${escapeHtml(p.student_name)}</td>
      <td><b>${money(p.amount)}</b></td>
      <td>${escapeHtml(p.payment_type)}</td>
      <td>${escapeHtml(p.transaction_ref || "-")}</td>
      <td><button class="action-btn delete" onclick="deletePayment(${p.id})">Delete</button></td>
    </tr>
  `).join("") || `<tr><td colspan="7" class="muted">No payments recorded.</td></tr>`;
}

async function loadReports() {
  const summary = await api("/api/reports/summary");
  $("reportCapacity").textContent = summary.capacity;
  $("reportOccupied").textContent = summary.occupied;
  $("reportAvailable").textContent = summary.availableBeds;
  $("reportRevenue").textContent = money(summary.revenue);

  const data = await api("/api/reports/students");
  $("reportStudentsTable").innerHTML = data.map(s => `
    <tr>
      <td>${escapeHtml(s.student_id)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.course || "-")}</td>
      <td>${s.year || "-"}</td>
      <td>${escapeHtml(s.room_number || "Not Allocated")}</td>
      <td>${s.admission_date}</td>
      <td>${escapeHtml(s.status)}</td>
    </tr>
  `).join("");
}

function showSection(section) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  $(section).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.section === section));

  const titles = {
    dashboard: ["Dashboard", "Overview of hostel operations"],
    students: ["Students", "Manage student records and room allocation"],
    rooms: ["Rooms", "Manage hostel rooms and capacity"],
    payments: ["Payments", "Track hostel fee collections"],
    reports: ["Reports", "View and print hostel reports"]
  };

  $("pageTitle").textContent = titles[section][0];
  $("pageSubtitle").textContent = titles[section][1];
}

function openStudentModal(student = null) {
  populateRoomSelect();
  $("studentForm").reset();
  $("studentDbId").value = "";
  $("studentModalTitle").textContent = "Add Student";
  $("admissionDate").value = today();
  $("studentStatus").value = "Active";
  $("studentRoom").value = "";

  if (student) {
    $("studentModalTitle").textContent = "Edit Student";
    $("studentDbId").value = student.id;
    $("studentId").value = student.student_id;
    $("studentName").value = student.name;
    $("studentEmail").value = student.email || "";
    $("studentPhone").value = student.phone || "";
    $("studentCourse").value = student.course || "";
    $("studentYear").value = student.year || "";
    $("guardianName").value = student.guardian_name || "";
    $("guardianPhone").value = student.guardian_phone || "";
    $("studentRoom").value = student.room_id || "";
    $("admissionDate").value = student.admission_date;
    $("studentStatus").value = student.status || "Active";
  }

  $("studentModal").classList.add("show");
}

async function saveStudent(e) {
  e.preventDefault();

  const id = $("studentDbId").value;
  const body = {
    student_id: $("studentId").value.trim(),
    name: $("studentName").value.trim(),
    email: $("studentEmail").value.trim(),
    phone: $("studentPhone").value.trim(),
    course: $("studentCourse").value.trim(),
    year: $("studentYear").value || null,
    guardian_name: $("guardianName").value.trim(),
    guardian_phone: $("guardianPhone").value.trim(),
    room_id: $("studentRoom").value || null,
    admission_date: $("admissionDate").value,
    status: $("studentStatus").value
  };

  try {
    await api(id ? `/api/students/${id}` : "/api/students", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body)
    });
    closeModal("studentModal");
    showToast(id ? "Student updated" : "Student added");
    await refreshAll();
  } catch (e) {
    showToast(e.message);
  }
}

function editStudent(id) {
  const student = students.find(s => s.id === id);
  if (student) openStudentModal(student);
}

async function deleteStudent(id) {
  if (!confirm("Delete this student record? Associated payment records will also be deleted.")) return;
  try {
    await api(`/api/students/${id}`, {method: "DELETE"});
    showToast("Student deleted");
    await refreshAll();
  } catch (e) { showToast(e.message); }
}

function openRoomModal(room = null) {
  $("roomForm").reset();
  $("roomDbId").value = "";
  $("roomModalTitle").textContent = "Add Room";

  if (room) {
    $("roomModalTitle").textContent = "Edit Room";
    $("roomDbId").value = room.id;
    $("roomNumber").value = room.room_number;
    $("roomCapacity").value = room.capacity;
    $("roomFloor").value = room.floor;
  }
  $("roomModal").classList.add("show");
}

async function saveRoom(e) {
  e.preventDefault();
  const id = $("roomDbId").value;
  const body = {
    room_number: $("roomNumber").value.trim(),
    capacity: $("roomCapacity").value,
    floor: $("roomFloor").value
  };

  try {
    await api(id ? `/api/rooms/${id}` : "/api/rooms", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body)
    });
    closeModal("roomModal");
    showToast(id ? "Room updated" : "Room added");
    await refreshAll();
  } catch (e) { showToast(e.message); }
}

function editRoom(id) {
  const room = rooms.find(r => r.id === id);
  if (room) openRoomModal(room);
}

async function deleteRoom(id) {
  if (!confirm("Delete this room?")) return;
  try {
    await api(`/api/rooms/${id}`, {method: "DELETE"});
    showToast("Room deleted");
    await refreshAll();
  } catch (e) { showToast(e.message); }
}

function openPaymentModal() {
  populateStudentSelects();
  $("paymentForm").reset();
  $("paymentDate").value = today();
  $("paymentModal").classList.add("show");
}

async function savePayment(e) {
  e.preventDefault();
  try {
    await api("/api/payments", {
      method: "POST",
      body: JSON.stringify({
        student_id: $("paymentStudent").value,
        amount: $("paymentAmount").value,
        payment_date: $("paymentDate").value,
        payment_type: $("paymentType").value,
        transaction_ref: $("transactionRef").value.trim()
      })
    });
    closeModal("paymentModal");
    showToast("Payment recorded");
    await refreshAll();
  } catch (e) { showToast(e.message); }
}

async function deletePayment(id) {
  if (!confirm("Delete this payment record?")) return;
  try {
    await api(`/api/payments/${id}`, {method: "DELETE"});
    showToast("Payment deleted");
    await refreshAll();
  } catch (e) { showToast(e.message); }
}

function populateRoomSelect() {
  const current = $("studentRoom").value;
  $("studentRoom").innerHTML = `<option value="">Not Allocated</option>` +
    rooms.filter(r => r.status !== "Full" || String(r.id) === String(current))
      .map(r => `<option value="${r.id}">${escapeHtml(r.room_number)} — ${r.occupied}/${r.capacity}</option>`).join("");
  $("studentRoom").value = current;
}

function populateStudentSelects() {
  if (!$("paymentStudent")) return;
  $("paymentStudent").innerHTML = `<option value="">Select student</option>` +
    students.filter(s => s.status === "Active").map(s =>
      `<option value="${s.id}">${escapeHtml(s.student_id)} — ${escapeHtml(s.name)}</option>`
    ).join("");
}

function closeModal(id) {
  $(id).classList.remove("show");
}

async function logout() {
  await api("/api/auth/logout", {method: "POST"});
  window.location.href = "/";
}

function showToast(message) {
  $("toast").innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  setTimeout(() => $("toast").innerHTML = "", 2500);
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {maximumFractionDigits: 2});
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function printReport(type) {
  if (type === "payment") {
    const rows = payments.map(p => `
      <tr><td>${p.payment_date}</td><td>${p.student_code}</td><td>${p.student_name}</td>
      <td>${money(p.amount)}</td><td>${p.payment_type}</td><td>${p.transaction_ref || "-"}</td></tr>
    `).join("");

    openPrintWindow("Payment Report", `
      <table><thead><tr><th>Date</th><th>Student ID</th><th>Name</th><th>Amount</th><th>Type</th><th>Reference</th></tr></thead>
      <tbody>${rows}</tbody></table>
    `);
  } else {
    const rows = students.map(s => `
      <tr><td>${s.student_id}</td><td>${s.name}</td><td>${s.course || "-"}</td>
      <td>${s.year || "-"}</td><td>${s.room_number || "Not Allocated"}</td><td>${s.admission_date}</td><td>${s.status}</td></tr>
    `).join("");

    openPrintWindow("Student Report", `
      <table><thead><tr><th>Student ID</th><th>Name</th><th>Course</th><th>Year</th><th>Room</th><th>Admission</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
    `);
  }
}

function openPrintWindow(title, content) {
  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>${title}</title>
    <style>body{font-family:Arial;padding:30px}h1{text-align:center}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}</style>
    </head><body><h1>${title}</h1>${content}<script>window.print();<\/script></body></html>
  `);
  w.document.close();
}

window.addEventListener("click", e => {
  if (e.target.classList.contains("modal")) e.target.classList.remove("show");
});
