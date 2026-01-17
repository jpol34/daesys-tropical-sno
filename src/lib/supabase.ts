import { createClient } from '@supabase/supabase-js';
import { env } from '$lib/config/env';

export const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);

// Re-export types for backwards compatibility
export type { CateringRequest, CateringRequestInsert } from '$lib/types';
