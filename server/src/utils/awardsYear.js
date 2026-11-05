const getAwardsYear = (brandName = process.env.AWARDS_BRAND_NAME) => {
  const configuredYear = String(process.env.AWARDS_YEAR || "").trim();
  if (/^\d{4}$/.test(configuredYear)) return configuredYear;

  const brandYear = String(brandName || "").match(/\b20\d{2}\b/)?.[0];
  return brandYear || String(new Date().getFullYear());
};

module.exports = getAwardsYear;
