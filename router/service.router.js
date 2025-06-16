const express = require("express");
const {
  getService,
  createService,
  updateService,
  deleteService,
  //   getServiceById,
} = require("../controller/service.controller");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const router = express.Router();

router.route("/").get(getService);
router.post("/create", authenticateToken, authorizeRole("admin"), createService);
router.post("/create", authenticateToken, createService);

router.put("/update/:id", authenticateToken, authorizeRole("admin"), updateService);
router.delete("/delete/:id", authenticateToken, authorizeRole("admin"), deleteService);
// router.route("/:id").get(authenticateToken, getServiceById);

module.exports = router;
