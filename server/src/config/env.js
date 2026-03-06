const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'CORS_ORIGIN'];

function missingRequiredEnv(env = process.env) {
  return REQUIRED_ENV_VARS.filter((key) => !String(env[key] || '').trim());
}

function validateProductionEnv(env = process.env) {
  const isProduction = String(env.NODE_ENV || '').toLowerCase() === 'production';
  if (!isProduction) return [];
  return missingRequiredEnv(env);
}

module.exports = {
  REQUIRED_ENV_VARS,
  missingRequiredEnv,
  validateProductionEnv,
};
