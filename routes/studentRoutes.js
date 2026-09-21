const router = require("express").Router();
const controller = require("../controllers/studentController");

router.get("/", controller.getStudents);
router.get("/:id", controller.getStudent);
router.post("/", controller.addStudent);
router.put("/:id", controller.updateStudent);
router.delete("/:id", controller.deleteStudent);

module.exports = router;
