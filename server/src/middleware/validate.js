const { z } = require('zod');

function formatIssue(issue) {
  return {
    field: issue.path.join('.'),
    message: issue.message,
  };
}

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map(formatIssue),
      });
    }
    req.body = result.data;
    return next();
  };
}

const uuidParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map(formatIssue),
      });
    }
    req.params = result.data;
    return next();
  };
}

module.exports = {
  validateBody,
  validateParams,
  uuidParamSchema,
};
