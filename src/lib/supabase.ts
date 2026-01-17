import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export type CateringRequest = {
	id: string;
	name: string;
	phone: string;
	email: string;
	event_date: string;
	event_type: string;
	customer_notes: string | null;
	admin_notes: string | null;
	status: 'new' | 'contacted' | 'confirmed' | 'completed';
	created_at: string;
};

export type CateringRequestInsert = Omit<CateringRequest, 'id' | 'admin_notes' | 'status' | 'created_at'>;
