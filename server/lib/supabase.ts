import { createClient } from '@supabase/supabase-js';
import { isServerConfigured, serverConfig } from '../config';

let client: any = null;

export const getSupabaseAdmin = (): any => {
  if (!isServerConfigured) {
    throw new Error('Supabase 环境变量未配置，请先设置 SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY 和 APP_JWT_SECRET。');
  }

  if (!client) {
    client = createClient(serverConfig.supabaseUrl, serverConfig.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return client;
};
