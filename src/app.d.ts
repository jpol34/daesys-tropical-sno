// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		/**
		 * Custom error shape for error pages
		 */
		interface Error {
			message: string;
			code?: string;
			status?: number;
		}

		/**
		 * Server-side request locals
		 * Available in hooks and server load functions
		 */
		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
			session: Session | null;
		}

		/**
		 * Common page data shape
		 */
		interface PageData {
			user?: User | null;
		}

		/**
		 * Page state for shallow routing
		 */
		interface PageState {
			scrollY?: number;
		}

		/**
		 * Platform-specific context (Vercel)
		 */
		interface Platform {
			env?: {
				[key: string]: string;
			};
		}
	}
}

export {};
