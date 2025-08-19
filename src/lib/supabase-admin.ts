import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 서버 전용 Supabase Admin 클라이언트 (보안 작업 전용)
export const supabaseAdmin = (!supabaseUrl || !serviceRoleKey || serviceRoleKey === '')
  ? null
  : createClient(supabaseUrl, serviceRoleKey);


