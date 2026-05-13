const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const userModel = require("../models/user.model");
const ApiError = require("../utils/ApiError");

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const { token, user } = await authService.login({ identifier, password });

  res.json({
    success: true,
    message: "Login successful",
    data: { token, user },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.sub);
  if (!user) throw ApiError.notFound("User not found");
  res.json({ success: true, data: { user } });
});

module.exports = { login, me };
