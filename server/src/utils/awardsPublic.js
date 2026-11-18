const PUBLIC_STATUSES = ["approved", "finalist", "winner"];
const PUBLIC_FIELDS = "nomineeName nomineePhoto nomineeTitle nomineeCompany nomineeCountry category nominationReason achievements impactDescription status votes slug featured displayOrder createdAt updatedAt";
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function publicNominationQuery(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const filter = { status: { $in: PUBLIC_STATUSES } };
  if (PUBLIC_STATUSES.includes(query.status)) filter.status = query.status;
  if (query.category) {
    if (!/^[a-f\d]{24}$/i.test(query.category)) {
      const error = new Error("Invalid award category");
      error.statusCode = 400;
      throw error;
    }
    filter.category = query.category;
  }
  if (query.country) filter.nomineeCountry = new RegExp(escapeRegex(query.country), "i");
  if (query.search) {
    const expression = new RegExp(escapeRegex(query.search), "i");
    filter.$or = ["nomineeName", "nomineeTitle", "nomineeCompany", "nominationReason"]
      .map(field => ({ [field]: expression }));
  }
  const sortBy = ["votes", "createdAt", "nomineeName"].includes(query.sortBy) ? query.sortBy : "votes";
  const sort = { [sortBy]: query.sortOrder === "asc" ? 1 : -1 };
  if (sortBy !== "createdAt") sort.createdAt = -1;
  return { filter, sort, page, limit };
}

module.exports = { PUBLIC_STATUSES, PUBLIC_FIELDS, publicNominationQuery };
