import 'dotenv/config';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'APP_JWT_SECRET'] as const;

export const serverConfig = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  appJwtSecret: process.env.APP_JWT_SECRET || '',
};

export const missingServerConfig = required.filter((key) => !process.env[key]);

export const isServerConfigured = missingServerConfig.length === 0;
