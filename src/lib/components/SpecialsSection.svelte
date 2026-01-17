<script lang="ts">
	import { businessInfo } from '$lib/data/businessInfo';
</script>

<section class="specials-section" aria-labelledby="specials-heading">
	<div class="container">
		<h2 id="specials-heading" class="section-title text-center">
			<span class="section-icon" aria-hidden="true">🎁</span>
			Specials & More
		</h2>
		
		<div class="specials-grid">
			<!-- Giveaways & Raffles -->
			<div class="special-card giveaways">
				<div class="special-icon" aria-hidden="true">🎉</div>
				<h3>Giveaways & Raffles</h3>
				<p>Follow us on social media for exclusive giveaways, raffles and seasonal treats throughout the year!</p>
				<div class="social-links">
					<a 
						href={businessInfo.social.instagram} 
						target="_blank" 
						rel="noopener noreferrer"
						class="social-btn instagram"
						aria-label="Follow us on Instagram"
					>
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
						</svg>
						Instagram
					</a>
					<a 
						href={businessInfo.social.facebook} 
						target="_blank" 
						rel="noopener noreferrer"
						class="social-btn facebook"
						aria-label="Follow us on Facebook"
					>
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
						</svg>
						Facebook
					</a>
				</div>
			</div>
			
			<!-- Popsicle Wednesday -->
			<div class="special-card popsicle">
				<div class="special-icon popsicle-icon" aria-hidden="true">
					<svg viewBox="0 0 64 64" width="48" height="48">
						<!-- Popsicle top (red) -->
						<rect x="16" y="4" width="32" height="16" rx="8" fill="#E53935"/>
						<!-- Popsicle middle (yellow) -->
						<rect x="16" y="18" width="32" height="12" fill="#FFD600"/>
						<!-- Popsicle bottom (blue) -->
						<rect x="16" y="28" width="32" height="12" rx="0 0 4 4" fill="#1E88E5"/>
						<!-- Rounded bottom -->
						<path d="M16 36 L16 40 Q16 48 24 48 L40 48 Q48 48 48 40 L48 36 Z" fill="#1E88E5"/>
						<!-- Stick -->
						<rect x="28" y="46" width="8" height="16" rx="2" fill="#D7CCC8"/>
						<!-- Shine highlight -->
						<rect x="20" y="8" width="4" height="32" rx="2" fill="rgba(255,255,255,0.3)"/>
					</svg>
				</div>
				<h3>Popsicle Wednesday</h3>
				<p class="popsicle-cta">Ask about Popsicle Wednesday!</p>
				<p class="popsicle-details">Every Wednesday we feature special popsicle flavors. Stop by or give us a call to see what's available this week!</p>
			</div>
			
			<!-- Loyalty Program -->
			<div class="special-card loyalty">
				<div class="special-icon" aria-hidden="true">🎫</div>
				<h3>Loyalty Program</h3>
				<p class="loyalty-headline">Buy 9, Get 1 FREE!</p>
				<p class="loyalty-details">Any size · Any toppings · Or a popsicle!</p>
				<p class="loyalty-cta">Just give us your phone number at checkout to start earning.</p>
			</div>
		</div>
	</div>
</section>

<style>
	.specials-section {
		background: var(--color-cream);
		padding: var(--space-2xl) 0;
	}
	
	.section-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-xl);
	}
	
	.section-icon {
		font-size: 1.2em;
	}
	
	.text-center {
		text-align: center;
	}
	
	.specials-grid {
		display: grid;
		gap: var(--space-lg);
		max-width: 900px;
		margin: 0 auto;
	}
	
	.special-card {
		background: var(--color-white);
		border-radius: var(--radius-xl);
		padding: var(--space-xl);
		text-align: center;
		box-shadow: var(--shadow-md);
		border: 3px solid transparent;
		transition: transform var(--transition-normal), box-shadow var(--transition-normal);
	}
	
	.special-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}
	
	.special-card.giveaways {
		border-color: var(--color-yellow);
	}
	
	.special-card.popsicle {
		border-color: var(--color-blue-light);
	}
	
	.special-card.loyalty {
		border-color: var(--color-red);
	}
	
	.special-icon {
		font-size: 3rem;
		margin-bottom: var(--space-md);
	}
	
	.special-card h3 {
		font-family: var(--font-heading);
		color: var(--color-blue);
		font-size: clamp(1.25rem, 3vw, 1.5rem);
		margin-bottom: var(--space-sm);
	}
	
	.special-card p {
		color: var(--color-gray-600);
		margin-bottom: var(--space-md);
	}
	
	.special-card p:last-child {
		margin-bottom: 0;
	}
	
	/* Giveaways card */
	.social-links {
		display: flex;
		gap: var(--space-sm);
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.social-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-full);
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none;
		transition: all var(--transition-normal);
	}
	
	.social-btn svg {
		width: 18px;
		height: 18px;
	}
	
	.social-btn.instagram {
		background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
		color: var(--color-white);
	}
	
	.social-btn.instagram:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(225, 48, 108, 0.4);
	}
	
	.social-btn.facebook {
		background: #1877f2;
		color: var(--color-white);
	}
	
	.social-btn.facebook:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(24, 119, 242, 0.4);
	}
	
	/* Popsicle card */
	.popsicle-cta {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-blue) !important;
		background: linear-gradient(90deg, var(--color-cream) 0%, var(--color-yellow-light) 50%, var(--color-cream) 100%);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-full);
		display: inline-block;
	}
	
	.popsicle-details {
		font-size: 0.95rem;
	}
	
	/* Loyalty card */
	.loyalty-headline {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-red) !important;
		margin-bottom: var(--space-xs) !important;
	}
	
	.loyalty-details {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-gray-700) !important;
	}
	
	.loyalty-cta {
		font-size: 0.95rem;
		background: linear-gradient(90deg, var(--color-cream) 0%, rgba(239, 68, 68, 0.1) 50%, var(--color-cream) 100%);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
	}
	
	/* Responsive */
	@media (min-width: 768px) {
		.specials-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.special-card {
			padding: var(--space-2xl);
		}
		
		/* Third card spans full width on tablet */
		.special-card.loyalty {
			grid-column: 1 / -1;
			max-width: 450px;
			margin: 0 auto;
		}
	}
	
	@media (min-width: 1024px) {
		.specials-grid {
			grid-template-columns: repeat(3, 1fr);
			max-width: 1100px;
		}
		
		.special-card.loyalty {
			grid-column: auto;
			max-width: none;
			margin: 0;
		}
	}
</style>
