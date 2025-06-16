const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const { getAllCustomController, createCustomController } = require("../controller/custom.controller");
const { upload } = require("../middleware/multer");

const router = express.Router();

router.get("/all", authenticateToken, authorizeRole("admin"), getAllCustomController);

router.post("/create", authenticateToken, upload.single("customPicture"), createCustomController);

module.exports = router;
