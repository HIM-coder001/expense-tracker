/**
 * Zod validation middleware factory.
 * Usage: router.post("/add", protect, validate(schema), controller)
 *
 * Pass source="query" to validate req.query instead of req.body.
 * Strips unknown fields (Zod strips by default with .object()).
 *
 * NOTE: Express 5 makes req.query a read-only getter, so we cannot assign
 * back to it. When source is "query", parsed data is placed on
 * req.validatedQuery instead. Controllers must read from req.validatedQuery
 * for query-validated endpoints.
 */
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    // Zod v3 uses .issues; .errors is an alias but may not exist in all builds
    const issues = result.error?.issues ?? result.error?.errors ?? [];
    const details = issues.map((e) => ({
      field: e.path.join(".") || "root",
      message: e.message,
    }));

    return res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details,
    });
  }

  if (source === "query") {
    // req.query is read-only in Express 5 — store on a dedicated property
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  next();
};
