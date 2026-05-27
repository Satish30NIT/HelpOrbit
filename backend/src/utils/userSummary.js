const { userDisplayName } = require("./userDisplayName");

function summarizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    user_name: user.user_name,
    email: user.email,
    first_name: user.first_name,
    middle_name: user.middle_name,
    last_name: user.last_name,
    display_name: userDisplayName(user),
    phone: user.phone,
    role_id: user.role_id,
    role_name: user.role_name,
    is_active: user.is_active,
    companies: (user.companies || []).map((c) => ({ id: c.id, title: c.title })),
  };
}

module.exports = { summarizeUser };
