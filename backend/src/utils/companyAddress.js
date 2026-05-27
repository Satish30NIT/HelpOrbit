function formatFullAddress(parts) {
  const line = [
    parts.address_line_1,
    parts.city,
    parts.state,
    parts.country,
    parts.pin_code,
  ]
    .map((p) => (p != null ? String(p).trim() : ""))
    .filter(Boolean);
  return line.length ? line.join(", ") : null;
}

module.exports = { formatFullAddress };
