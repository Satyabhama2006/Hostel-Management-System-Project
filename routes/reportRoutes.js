const router = require("express").Router();
const controller = require("../controllers/reportController");

router.get("/summary", controller.getSummary);
router.get("/students", controller.getStudentReport);
router.get("/payments", controller.getPaymentReport);

module.exports = router;
