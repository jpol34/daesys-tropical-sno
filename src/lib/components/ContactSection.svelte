<script lang="ts">
	import { businessInfo } from '$lib/data/businessInfo';
</script>

<section id="contact" class="contact-section" aria-labelledby="contact-heading">
	<div class="container">
		<h2 id="contact-heading" class="section-title">Come On By</h2>
		
		<div class="contact-grid">
			<div class="contact-info">
				<div class="contact-card">
					<div class="contact-item">
						<span class="contact-icon" aria-hidden="true">📍</span>
						<div class="contact-details">
							<h3>Address</h3>
							<a 
								href={businessInfo.googleMapsUrl} 
								target="_blank" 
								rel="noopener noreferrer"
								class="contact-link"
							>
								{businessInfo.address.street}<br />
								{businessInfo.address.city}, {businessInfo.address.state} {businessInfo.address.zip}
							</a>
						</div>
					</div>
					
					<div class="contact-item">
						<span class="contact-icon" aria-hidden="true">📞</span>
						<div class="contact-details">
							<h3>Phone</h3>
							<a href={businessInfo.phoneHref} class="contact-link contact-phone">
								{businessInfo.phone}
							</a>
						</div>
					</div>
					
					<div class="contact-item">
						<span class="contact-icon" aria-hidden="true">✉️</span>
						<div class="contact-details">
							<h3>Email</h3>
							<a href="mailto:{businessInfo.email}" class="contact-link">
								{businessInfo.email}
							</a>
						</div>
					</div>
					
					<div class="contact-item">
						<span class="contact-icon" aria-hidden="true">🕐</span>
						<div class="contact-details">
							<h3>Hours</h3>
							<p class="contact-hours">
								<strong>{businessInfo.hours.days}</strong><br />
								{businessInfo.hours.open} - {businessInfo.hours.close}
							</p>
							<p class="contact-closed">Closed {businessInfo.hours.closed}</p>
						</div>
					</div>
					
					<div class="contact-item">
						<span class="contact-icon" aria-hidden="true">🌴</span>
						<div class="contact-details">
							<h3>Follow Us</h3>
							<div class="social-links">
								<a 
									href={businessInfo.social.instagram.url}
									target="_blank"
									rel="noopener noreferrer"
									class="social-link social-instagram"
									aria-label="Follow us on Instagram"
								>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
									</svg>
									{businessInfo.social.instagram.handle}
								</a>
								<a 
									href={businessInfo.social.facebook.url}
									target="_blank"
									rel="noopener noreferrer"
									class="social-link social-facebook"
									aria-label="Follow us on Facebook"
								>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
										<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
									</svg>
									Facebook
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="contact-map">
				<iframe
					title="Daesy's Tropical Sno location on Google Maps"
					src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3356.8!2d-97.155!3d32.735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864e7d3a7f9b7b7b%3A0x0!2s3814%20Little%20Rd%2C%20Arlington%2C%20TX%2076016!5e0!3m2!1sen!2sus!4v1704000000000!5m2!1sen!2sus"
					width="100%"
					height="300"
					style="border:0; border-radius: var(--radius-lg);"
					allowfullscreen
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				></iframe>
			</div>
		</div>
		
		<footer class="site-footer">
			<p>© {new Date().getFullYear()} Daesy's Tropical Sno · <a href="/privacy">Privacy Policy</a></p>
		</footer>
	</div>
</section>

<style>
	.contact-section {
		background: var(--color-cream);
		padding: var(--space-2xl) 0 var(--space-3xl);
	}
	
	.section-title {
		text-align: center;
		margin-bottom: var(--space-xl);
	}
	
	.contact-grid {
		display: grid;
		gap: var(--space-xl);
	}
	
	.contact-card {
		background: var(--color-white);
		border-radius: var(--radius-xl);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	
	.contact-item {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
	}
	
	.contact-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-yellow);
		border-radius: var(--radius-md);
	}
	
	.contact-details h3 {
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-gray-600);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-xs);
	}
	
	.contact-link {
		color: var(--color-gray-800);
		line-height: 1.4;
		display: inline-block;
	}
	
	.contact-link:hover,
	.contact-link:focus {
		color: var(--color-blue);
	}
	
	.contact-phone {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-blue);
	}
	
	.contact-hours {
		color: var(--color-gray-800);
		margin: 0;
		line-height: 1.4;
	}
	
	.contact-closed {
		color: var(--color-red);
		font-weight: 600;
		margin: var(--space-xs) 0 0;
		font-size: 0.9rem;
	}
	
	.contact-map {
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: var(--shadow-md);
		min-height: 300px;
	}
	
	.contact-map iframe {
		display: block;
	}
	
	/* Social links */
	.social-links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
	
	.social-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-full);
		font-weight: 600;
		font-size: 0.9rem;
		transition: all var(--transition-fast);
	}
	
	.social-instagram {
		background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
		color: white;
	}
	
	.social-instagram:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		color: white;
	}
	
	.social-facebook {
		background: #1877f2;
		color: white;
	}
	
	.social-facebook:hover {
		background: #166fe5;
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		color: white;
	}
	
	/* Footer */
	.site-footer {
		margin-top: var(--space-2xl);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--color-gray-200);
		text-align: center;
	}
	
	.site-footer p {
		color: var(--color-gray-500);
		font-size: 0.9rem;
		margin: 0;
	}
	
	.site-footer a {
		color: var(--color-gray-500);
		text-decoration: underline;
	}
	
	.site-footer a:hover {
		color: var(--color-blue);
	}
	
	@media (min-width: 768px) {
		.contact-grid {
			grid-template-columns: 1fr 1fr;
			align-items: stretch;
		}
		
		.contact-card {
			height: 100%;
		}
		
		.contact-map {
			height: 100%;
		}
		
		.contact-map iframe {
			height: 100%;
		}
	}
</style>
