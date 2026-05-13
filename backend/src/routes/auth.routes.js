const express = require("express");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");
const { loginSchema } = require("../validators/auth.validator");
const { login, me } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, me);

module.exports = router;
