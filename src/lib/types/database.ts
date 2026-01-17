// Database types - generated from Supabase schema
// Regenerate with: npx supabase gen types typescript --local

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			catering_requests: {
				Row: {
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
				Insert: Omit<
					Database['public']['Tables']['catering_requests']['Row'],
					'id' | 'admin_notes' | 'status' | 'created_at'
				>;
				Update: Partial<Database['public']['Tables']['catering_requests']['Row']>;
			};
			flavors: {
				Row: {
					id: string;
					name: string;
					active: boolean;
					sort_order: number;
				};
				Insert: Omit<Database['public']['Tables']['flavors']['Row'], 'id'>;
				Update: Partial<Database['public']['Tables']['flavors']['Row']>;
			};
			concoctions: {
				Row: {
					id: string;
					name: string;
					ingredients: string[];
					active: boolean;
					sort_order: number;
				};
				Insert: Omit<Database['public']['Tables']['concoctions']['Row'], 'id'>;
				Update: Partial<Database['public']['Tables']['concoctions']['Row']>;
			};
			loyalty_members: {
				Row: {
					id: string;
					phone: string;
					name: string;
					email: string | null;
					punches: number;
					total_punches: number;
					total_redeemed: number;
					created_at: string;
					last_visit: string;
				};
				Insert: Omit<
					Database['public']['Tables']['loyalty_members']['Row'],
					'id' | 'created_at' | 'last_visit'
				> & {
					last_visit?: string;
				};
				Update: Partial<Database['public']['Tables']['loyalty_members']['Row']>;
			};
			loyalty_history: {
				Row: {
					id: string;
					member_id: string;
					action: 'punch' | 'redeem' | 'adjustment';
					punch_count: number | null;
					note: string | null;
					created_at: string;
				};
				Insert: Omit<Database['public']['Tables']['loyalty_history']['Row'], 'id' | 'created_at'>;
				Update: Partial<Database['public']['Tables']['loyalty_history']['Row']>;
			};
			site_content: {
				Row: {
					id: string;
					key: string;
					value: string;
					description: string;
				};
				Insert: Omit<Database['public']['Tables']['site_content']['Row'], 'id'>;
				Update: Partial<Database['public']['Tables']['site_content']['Row']>;
			};
		};
	};
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];
