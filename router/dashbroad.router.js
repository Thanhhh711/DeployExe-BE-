const express = require("express");
const { getDashbroadController } = require("../controller/dashbroad.controller");
const router = express.Router();

router.get("/dashboard/stats?", getDashbroadController);

module.exports = router;
