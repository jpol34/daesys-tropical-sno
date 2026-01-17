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

export type CateringRequestInsert = Omit<
	CateringRequest,
	'id' | 'admin_notes' | 'status' | 'created_at'
>;

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

// ============ SERVICE TYPES ============

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> =
	| {
			data: T;
			error: null;
	  }
	| {
			data: null;
			error: {
				message: string;
				code: string;
			};
	  };

/**
 * Pagination parameters
 */
export type PaginationParams = {
	page?: number;
	limit?: number;
	offset?: number;
};

/**
 * Paginated response
 */
export type PaginatedResponse<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
};

// ============ FORM TYPES ============

/**
 * Form field validation state
 */
export type FieldValidation = {
	error: string | null;
	touched: boolean;
	valid: boolean;
};

/**
 * Generic form state
 */
export type FormState<T extends Record<string, unknown>> = {
	values: T;
	errors: Partial<Record<keyof T, string>>;
	touched: Partial<Record<keyof T, boolean>>;
	isSubmitting: boolean;
	isValid: boolean;
};

/**
 * Catering form values
 */
export type CateringFormValues = {
	name: string;
	phone: string;
	email: string;
	eventDate: string;
	eventTime: string;
	eventType: string;
	notes: string;
};

// ============ COMPONENT TYPES ============

/**
 * Common button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'cta' | 'ghost';

/**
 * Common size variants
 */
export type Size = 'sm' | 'md' | 'lg';

/**
 * Toast/notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type Toast = {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
};
