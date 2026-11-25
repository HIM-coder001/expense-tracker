import jwt from "jsonwebtoken";

/**
 * Verifies the access token and attaches { id, iat, exp } to req.user.
 * Does NOT hit the database — the signed JWT is the source of truth.
 * Use getUserInfo controller when you need the full user document.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({
      status: "error",
      code: "NO_TOKEN",
      message: "Not authorized — no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    const code =
      error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID";

    return res.status(401).json({
      status: "error",
      code,
      message: "Not authorized — token verification failed",
    });
  }
};

export default protect;
