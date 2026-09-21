const router = require("express").Router();
const controller = require("../controllers/paymentController");

router.get("/", controller.getPayments);
router.post("/", controller.addPayment);
router.delete("/:id", controller.deletePayment);

module.exports = router;
