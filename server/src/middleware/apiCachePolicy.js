// Authenticated and operational responses must never enter a shared CDN cache.
const publicReadPaths = [
  /^\/public\/(services|projects)(\/|$)/,
  /^\/products(?:\/(categories|featured|[a-f\d]{24}))?\/?$/i,
  /^\/partners\/public\/?$/,
  /^\/awards\/(categories|nominations)(\/|$)/,
  /^\/(software|iot)(?:\/(categories|[a-f\d]{24}))?\/?$/i
];

const apiCachePolicy = (req, res, next) => {
  const authenticated = Boolean(req.headers.authorization || req.cookies?.accessToken || req.session?.userId);
  const publicRead = req.method === "GET" && !authenticated &&
    publicReadPaths.some(pattern => pattern.test(req.path));
  res.set("Cache-Control", publicRead
    ? "public, max-age=300, stale-while-revalidate=60"
    : "private, no-store");
  res.vary("Cookie");
  res.vary("Authorization");
  next();
};

module.exports = { apiCachePolicy };
