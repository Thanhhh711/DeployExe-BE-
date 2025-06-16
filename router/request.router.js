const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const {
  createRefundRequest,
  createServiceRequest,
  updateRequest,
  deleteRequest,
  getAllRequest,
  getRequest,
  updateStatusRequest,
} = require("../controller/request.controller");

const router = express.Router();

router.get("/", authenticateToken, getRequest);
router.get("/all", authenticateToken, authorizeRole("admin"), getAllRequest);

router.post("/createRefundRequest", authenticateToken, createRefundRequest);
router.post("/createServiceRequest", authenticateToken, createServiceRequest);

router.put("/update/:id", authenticateToken, authorizeRole("admin"), updateRequest);
router.put("/updateStatus/:id", authenticateToken, authorizeRole("admin"), updateStatusRequest);

router.delete("/delete/:id", authenticateToken, authorizeRole("admin"), deleteRequest);

module.exports = router;
