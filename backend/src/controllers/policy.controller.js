const asyncHandler = require("../utils/asyncHandler");
const policyService = require("../services/policy.service");

const list = asyncHandler(async (req, res) => {
  const data = await policyService.listPolicies(req.query);
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await policyService.getPolicy(req.params.id);
  res.json({ success: true, data });
});

const getStatus = asyncHandler(async (req, res) => {
  const data = await policyService.getPolicyStatus(req.params.id);
  res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
  const data = await policyService.createPolicy(req.body);
  res.status(201).json({ success: true, message: "Policy created", data });
});

const update = asyncHandler(async (req, res) => {
  const data = await policyService.updatePolicy(req.params.id, req.body);
  res.json({ success: true, message: "Policy updated", data });
});

const remove = asyncHandler(async (req, res) => {
  const data = await policyService.deletePolicy(req.params.id);
  res.json({ success: true, message: "Policy deleted", data });
});

const resetUser = asyncHandler(async (req, res) => {
  const data = await policyService.resetUserAcknowledgement(
    req.params.id,
    req.body.user_id
  );
  res.json({ success: true, message: "Acknowledgement reset", data });
});

const restrictUser = asyncHandler(async (req, res) => {
  const data = await policyService.restrictUser(req.params.id, req.body.user_id);
  res.json({ success: true, message: "User access removed", data });
});

const assignUser = asyncHandler(async (req, res) => {
  const data = await policyService.assignUser(req.params.id, req.body.user_id);
  res.json({ success: true, message: "User assigned", data });
});

module.exports = {
  list,
  getOne,
  getStatus,
  create,
  update,
  remove,
  resetUser,
  restrictUser,
  assignUser,
};
