function userDisplayName(user) {
  if (!user) return "Unknown user";
  const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return user.user_name || user.email || `User #${user.id}`;
}

module.exports = { userDisplayName };
