export function validateBody(schema) {
  return validate("body", schema);
}

export function validateQuery(schema) {
  return validate("query", schema);
}

function validate(source, schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: "Validation failed",
          details: result.error.flatten()
        }
      });
    }

    req.validated = {
      ...(req.validated ?? {}),
      [source]: result.data
    };

    next();
  };
}
