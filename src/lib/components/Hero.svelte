<script lang="ts">
	import { businessInfo } from '$lib/data/businessInfo';
</script>

<section class="hero" aria-labelledby="hero-heading">
	<!-- Decorative background elements -->
	<div class="hero-bg">
		<div class="hero-wave hero-wave-1"></div>
		<div class="hero-wave hero-wave-2"></div>
		<div class="hero-palm hero-palm-left" aria-hidden="true">🌴</div>
		<div class="hero-palm hero-palm-right" aria-hidden="true">🌴</div>
	</div>
	
	<div class="hero-content container">
		<h1 id="hero-heading" class="hero-title">
			{businessInfo.name}
		</h1>
		<p class="hero-tagline">
			Tropical vibes & icy delights in Arlington, TX
		</p>
		<p class="hero-flavors">
			<span class="hero-highlight">40+ Flavors</span> • <span class="hero-highlight">56 Signature Concoctions</span>
		</p>
		<div class="hero-hours">
			<span class="hero-hours-icon" aria-hidden="true">🕐</span>
			<span>{businessInfo.hours.display}</span>
		</div>
		<div class="hero-cta">
			<a href="#menu" class="btn btn-secondary">View Menu</a>
			<a href="#catering" class="btn btn-primary">Book Catering</a>
		</div>
		
		<div class="hero-social">
			<a 
				href={businessInfo.social.x.url}
				target="_blank"
				rel="noopener noreferrer"
				class="hero-social-link"
				aria-label="Follow us on X"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
				</svg>
			</a>
			<a 
				href={businessInfo.social.instagram.url}
				target="_blank"
				rel="noopener noreferrer"
				class="hero-social-link"
				aria-label="Follow us on Instagram"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
				</svg>
			</a>
			<a 
				href={businessInfo.social.facebook.url}
				target="_blank"
				rel="noopener noreferrer"
				class="hero-social-link"
				aria-label="Follow us on Facebook"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
					<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
				</svg>
			</a>
		</div>
	</div>
	
	<!-- Scroll indicator -->
	<div class="scroll-indicator" aria-hidden="true">
		<span class="scroll-text">Scroll</span>
		<div class="scroll-arrow"></div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: var(--space-xl) var(--space-md);
		overflow: hidden;
		background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-blue-dark) 100%);
	}
	
	.hero-bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}
	
	.hero-wave {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 150px;
		background-repeat: repeat-x;
		background-size: 1000px 150px;
	}
	
	.hero-wave-1 {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 150'%3E%3Cpath fill='rgba(255,215,0,0.3)' d='M0,50 Q250,100 500,50 T1000,50 V150 H0 Z'/%3E%3C/svg%3E");
		animation: wave 8s linear infinite;
	}
	
	.hero-wave-2 {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 150'%3E%3Cpath fill='rgba(255,255,255,0.2)' d='M0,80 Q250,30 500,80 T1000,80 V150 H0 Z'/%3E%3C/svg%3E");
		animation: wave 6s linear infinite reverse;
	}
	
	@keyframes wave {
		0% { background-position-x: 0; }
		100% { background-position-x: 1000px; }
	}
	
	.hero-palm {
		position: absolute;
		font-size: clamp(3rem, 10vw, 8rem);
		opacity: 0.3;
		filter: blur(1px);
	}
	
	.hero-palm-left {
		top: 10%;
		left: -2%;
		transform: rotate(-15deg);
	}
	
	.hero-palm-right {
		top: 15%;
		right: -2%;
		transform: rotate(15deg) scaleX(-1);
	}
	
	.hero-content {
		position: relative;
		z-index: 1;
		max-width: 800px;
	}
	
	.hero-title {
		font-size: clamp(2.5rem, 8vw, 5rem);
		color: var(--color-white);
		text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
		margin-bottom: var(--space-md);
		animation: fadeInUp 0.6s ease-out;
	}
	
	.hero-tagline {
		font-size: clamp(1.1rem, 3vw, 1.5rem);
		color: var(--color-cream);
		margin-bottom: var(--space-md);
		animation: fadeInUp 0.6s ease-out 0.1s backwards;
	}
	
	.hero-flavors {
		font-size: clamp(1rem, 2.5vw, 1.25rem);
		color: var(--color-white);
		margin-bottom: var(--space-md);
		animation: fadeInUp 0.6s ease-out 0.2s backwards;
	}
	
	.hero-highlight {
		background: var(--color-yellow);
		color: var(--color-gray-900);
		padding: 0.1em 0.4em;
		border-radius: var(--radius-sm);
		font-weight: 700;
	}
	
	.hero-hours {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(4px);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-full);
		color: var(--color-white);
		font-weight: 600;
		margin-bottom: var(--space-lg);
		animation: fadeInUp 0.6s ease-out 0.3s backwards;
	}
	
	.hero-hours-icon {
		font-size: 1.2em;
	}
	
	.hero-cta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		justify-content: center;
		animation: fadeInUp 0.6s ease-out 0.4s backwards;
	}
	
	.hero-cta .btn {
		min-width: 160px;
	}
	
	.hero-social {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
		margin-top: var(--space-lg);
		animation: fadeInUp 0.6s ease-out 0.5s backwards;
	}
	
	.hero-social-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(4px);
		border-radius: var(--radius-full);
		color: var(--color-white);
		transition: all var(--transition-fast);
	}
	
	.hero-social-link:hover {
		background: var(--color-yellow);
		color: var(--color-gray-900);
		transform: translateY(-3px);
	}
	
	.scroll-indicator {
		position: absolute;
		bottom: var(--space-xl);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		color: var(--color-white);
		opacity: 0.7;
		animation: bounce 2s infinite;
	}
	
	.scroll-text {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	
	.scroll-arrow {
		width: 20px;
		height: 20px;
		border-right: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(45deg);
	}
	
	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
		40% { transform: translateX(-50%) translateY(-10px); }
		60% { transform: translateX(-50%) translateY(-5px); }
	}
	
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	@media (min-width: 768px) {
		.hero-palm {
			opacity: 0.4;
		}
		
		.hero-palm-left {
			left: 2%;
		}
		
		.hero-palm-right {
			right: 2%;
		}
	}
</style>
