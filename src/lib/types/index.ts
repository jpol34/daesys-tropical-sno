// Centralized type definitions for Daesy's Tropical Sno

// ============ DATABASE TYPES ============

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

export type Flavor = {
	id: string;
	name: string;
	active: boolean;
	sort_order: number;
};

export type Concoction = {
	id: string;
	name: string;
	ingredients: string[];
	active: boolean;
	sort_order: number;
};

export type SiteContent = {
	id: string;
	key: string;
	value: string;
	description: string;
};

export type LoyaltyMember = {
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

export type LoyaltyHistory = {
	id: string;
	member_id: string;
	action: 'punch' | 'redeem' | 'adjustment';
	punch_count: number | null;
	note: string | null;
	created_at: string;
	member_name?: string;
};

// ============ UI TYPES ============

export type RequestStatus = CateringRequest['status'];

export type LoyaltyAction = LoyaltyHistory['action'];

export type AdminTab = 'loyalty' | 'requests' | 'flavors' | 'concoctions' | 'specials';

export type LoyaltyView = 'lookup' | 'stats' | 'members';
