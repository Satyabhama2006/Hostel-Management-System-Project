const router = require("express").Router();
const controller = require("../controllers/roomController");

router.get("/", controller.getRooms);
router.post("/", controller.addRoom);
router.put("/:id", controller.updateRoom);
router.delete("/:id", controller.deleteRoom);

module.exports = router;
