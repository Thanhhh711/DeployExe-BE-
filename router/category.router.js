const express = require("express");
const {
  getAllCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getOneCategory,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  getAllCategoryController,
  getOneCategoryController,
  enableCategoryController,
} = require("../controller/category.controller");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const categoryValidator = require("../middleware/RequestMiddleware/categories.middleware");

const router = express.Router();

router.route("/").get(getAllCategoryController);
router.route("/:id").get(authenticateToken, getOneCategoryController);

router.post("/create", authenticateToken, authorizeRole("admin"), categoryValidator, createCategoryController);
router.put("/update/:id", authenticateToken, authorizeRole("admin"), categoryValidator, updateCategoryController);
// Xáo đây
router.patch("/disable/:id", authenticateToken, authorizeRole("admin"), deleteCategoryController);
router.patch("/enable/:id", authenticateToken, authorizeRole("admin"), enableCategoryController);
module.exports = router;
