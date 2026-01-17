<script lang="ts">
	import { eventTypes } from '$lib/data/eventTypes';
	import { supabase } from '$lib/supabase';
	
	// Form state
	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let eventDate = $state('');
	let eventTime = $state('');
	let eventType = $state('');
	let notes = $state('');
	let honeypot = $state(''); // Spam protection - hidden field
	
	// UI state
	let isSubmitting = $state(false);
	let isSubmitted = $state(false);
	let submitError = $state('');
	
	// Validation state
	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});
	
	// Validation functions
	function validateEmail(value: string): string {
		if (!value) return 'Email is required';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
		return '';
	}
	
	function validatePhone(value: string): string {
		if (!value) return 'Phone number is required';
		const digits = value.replace(/\D/g, '');
		if (digits.length < 10) return 'Please enter a valid phone number';
		return '';
	}
	
	function validateRequired(value: string, fieldName: string): string {
		if (!value.trim()) return `${fieldName} is required`;
		return '';
	}
	
	function validateDate(value: string): string {
		if (!value) return 'Event date is required';
		const selected = new Date(value);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (selected < today) return 'Please select a future date';
		return '';
	}
	
	// Validate all fields
	function validateForm(): boolean {
		errors = {
			name: validateRequired(name, 'Name'),
			phone: validatePhone(phone),
			email: validateEmail(email),
			eventDate: validateDate(eventDate),
			eventTime: validateRequired(eventTime, 'Event time'),
			eventType: validateRequired(eventType, 'Event type')
		};
		
		return !Object.values(errors).some(e => e);
	}
	
	// Handle field blur for inline validation
	function handleBlur(field: string) {
		touched[field] = true;
		
		switch(field) {
			case 'name':
				errors.name = validateRequired(name, 'Name');
				break;
			case 'phone':
				errors.phone = validatePhone(phone);
				break;
			case 'email':
				errors.email = validateEmail(email);
				break;
			case 'eventDate':
				errors.eventDate = validateDate(eventDate);
				break;
			case 'eventTime':
				errors.eventTime = validateRequired(eventTime, 'Event time');
				break;
			case 'eventType':
				errors.eventType = validateRequired(eventType, 'Event type');
				break;
		}
	}
	
	// Format phone number as user types
	function formatPhone(value: string): string {
		const digits = value.replace(/\D/g, '');
		if (digits.length <= 3) return digits;
		if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
	}
	
	function handlePhoneInput(e: Event) {
		const target = e.target as HTMLInputElement;
		phone = formatPhone(target.value);
	}
	
	// Submit handler
	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		// Honeypot check - if filled, it's a bot
		if (honeypot) {
			// Silently "succeed" but don't submit
			isSubmitted = true;
			return;
		}
		
		if (!validateForm()) {
			// Mark all fields as touched to show errors
			touched = {
				name: true,
				phone: true,
				email: true,
				eventDate: true,
				eventTime: true,
				eventType: true
			};
			return;
		}
		
		isSubmitting = true;
		submitError = '';
		
		try {
			// Combine date and time
			const eventDateTime = new Date(`${eventDate}T${eventTime}`);
			
			const { error } = await supabase
				.from('catering_requests')
				.insert({
					name: name.trim(),
					phone: phone.trim(),
					email: email.trim().toLowerCase(),
					event_date: eventDateTime.toISOString(),
					event_type: eventType,
					customer_notes: notes.trim() || null
				});
			
			if (error) throw error;
			
			isSubmitted = true;
		} catch (err) {
			console.error('Submission error:', err);
			submitError = 'Something went wrong. Please try again or call us directly.';
		} finally {
			isSubmitting = false;
		}
	}
	
	// Get minimum date (today)
	const today = new Date().toISOString().split('T')[0];
</script>

<section id="catering" class="catering-section" aria-labelledby="catering-heading">
	<div class="container">
		<div class="catering-header">
			<h2 id="catering-heading" class="section-title">Book Us For Your Event</h2>
			<p class="catering-subtitle">
				Birthday parties, weddings, corporate events and more! Fill out the form below and we'll get back to you within 24 hours.
			</p>
			
			<div class="catering-pricing">
				<div class="pricing-highlight">
					<span class="highlight-icon" aria-hidden="true">🚐</span>
					<span><strong>No travel fees</strong> — we come to you!</span>
				</div>
				<div class="pricing-highlight">
					<span class="highlight-icon" aria-hidden="true">🍧</span>
					<span><strong>$3 per snow cone</strong> for events</span>
				</div>
			</div>
		</div>
		
		{#if isSubmitted}
			<div class="success-message" role="alert">
				<div class="success-icon" aria-hidden="true">🎉</div>
				<h3>Request Submitted!</h3>
				<p>Thank you for your interest! We'll review your request and get back to you within 24 hours.</p>
				<button 
					type="button" 
					class="btn btn-secondary"
					onclick={() => {
						isSubmitted = false;
						name = '';
						phone = '';
						email = '';
						eventDate = '';
						eventTime = '';
						eventType = '';
						notes = '';
						touched = {};
						errors = {};
					}}
				>
					Submit Another Request
				</button>
			</div>
		{:else}
			<form 
				class="catering-form"
				onsubmit={handleSubmit}
				novalidate
			>
				<!-- Honeypot field - hidden from humans, bots fill it -->
				<div class="honeypot" aria-hidden="true">
					<label for="website">Website</label>
					<input 
						type="text" 
						id="website" 
						name="website"
						bind:value={honeypot}
						tabindex="-1"
						autocomplete="off"
					/>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="name" class="form-label">
							Your Name <span class="required" aria-hidden="true">*</span>
						</label>
						<input
							type="text"
							id="name"
							name="name"
							class="form-input"
							class:error={touched.name && errors.name}
							bind:value={name}
							onblur={() => handleBlur('name')}
							autocomplete="name"
							required
							aria-required="true"
							aria-invalid={touched.name && !!errors.name}
							aria-describedby={errors.name ? 'name-error' : undefined}
						/>
						{#if touched.name && errors.name}
							<p id="name-error" class="form-error" role="alert">
								<span aria-hidden="true">⚠️</span> {errors.name}
							</p>
						{/if}
					</div>
					
					<div class="form-group">
						<label for="phone" class="form-label">
							Phone Number <span class="required" aria-hidden="true">*</span>
						</label>
						<input
							type="tel"
							id="phone"
							name="phone"
							class="form-input"
							class:error={touched.phone && errors.phone}
							value={phone}
							oninput={handlePhoneInput}
							onblur={() => handleBlur('phone')}
							autocomplete="tel"
							placeholder="(555) 123-4567"
							required
							aria-required="true"
							aria-invalid={touched.phone && !!errors.phone}
							aria-describedby={errors.phone ? 'phone-error' : undefined}
						/>
						{#if touched.phone && errors.phone}
							<p id="phone-error" class="form-error" role="alert">
								<span aria-hidden="true">⚠️</span> {errors.phone}
							</p>
						{/if}
					</div>
				</div>
				
				<div class="form-group">
					<label for="email" class="form-label">
						Email Address <span class="required" aria-hidden="true">*</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						class="form-input"
						class:error={touched.email && errors.email}
						bind:value={email}
						onblur={() => handleBlur('email')}
						autocomplete="email"
						placeholder="you@example.com"
						required
						aria-required="true"
						aria-invalid={touched.email && !!errors.email}
						aria-describedby={errors.email ? 'email-error' : undefined}
					/>
					{#if touched.email && errors.email}
						<p id="email-error" class="form-error" role="alert">
							<span aria-hidden="true">⚠️</span> {errors.email}
						</p>
					{/if}
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label for="event-date" class="form-label">
							Event Date <span class="required" aria-hidden="true">*</span>
						</label>
						<input
							type="date"
							id="event-date"
							name="event-date"
							class="form-input"
							class:error={touched.eventDate && errors.eventDate}
							bind:value={eventDate}
							onblur={() => handleBlur('eventDate')}
							min={today}
							required
							aria-required="true"
							aria-invalid={touched.eventDate && !!errors.eventDate}
							aria-describedby={errors.eventDate ? 'date-error' : undefined}
						/>
						{#if touched.eventDate && errors.eventDate}
							<p id="date-error" class="form-error" role="alert">
								<span aria-hidden="true">⚠️</span> {errors.eventDate}
							</p>
						{/if}
					</div>
					
					<div class="form-group">
						<label for="event-time" class="form-label">
							Event Time <span class="required" aria-hidden="true">*</span>
						</label>
						<input
							type="time"
							id="event-time"
							name="event-time"
							class="form-input"
							class:error={touched.eventTime && errors.eventTime}
							bind:value={eventTime}
							onblur={() => handleBlur('eventTime')}
							required
							aria-required="true"
							aria-invalid={touched.eventTime && !!errors.eventTime}
							aria-describedby={errors.eventTime ? 'time-error' : undefined}
						/>
						{#if touched.eventTime && errors.eventTime}
							<p id="time-error" class="form-error" role="alert">
								<span aria-hidden="true">⚠️</span> {errors.eventTime}
							</p>
						{/if}
					</div>
				</div>
				
				<div class="form-group">
					<label for="event-type" class="form-label">
						Event Type <span class="required" aria-hidden="true">*</span>
					</label>
					<select
						id="event-type"
						name="event-type"
						class="form-select"
						class:error={touched.eventType && errors.eventType}
						bind:value={eventType}
						onblur={() => handleBlur('eventType')}
						required
						aria-required="true"
						aria-invalid={touched.eventType && !!errors.eventType}
						aria-describedby={errors.eventType ? 'type-error' : undefined}
					>
						<option value="">Select event type...</option>
						{#each eventTypes as type}
							<option value={type}>{type}</option>
						{/each}
					</select>
					{#if touched.eventType && errors.eventType}
						<p id="type-error" class="form-error" role="alert">
							<span aria-hidden="true">⚠️</span> {errors.eventType}
						</p>
					{/if}
				</div>
				
				<div class="form-group">
					<label for="notes" class="form-label">
						Additional Details <span class="optional">(optional)</span>
					</label>
					<textarea
						id="notes"
						name="notes"
						class="form-textarea"
						bind:value={notes}
						placeholder="Tell us about your event - expected guests, location, special requests, etc."
						rows="4"
					></textarea>
				</div>
				
				{#if submitError}
					<div class="submit-error" role="alert">
						<span aria-hidden="true">❌</span> {submitError}
					</div>
				{/if}
				
				<button 
					type="submit" 
					class="btn btn-cta submit-btn"
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<span class="spinner" aria-hidden="true"></span>
						Submitting...
					{:else}
						Submit Request
					{/if}
				</button>
			</form>
		{/if}
	</div>
</section>

<style>
	.catering-section {
		background: var(--color-white);
		padding: var(--space-2xl) 0;
	}
	
	.catering-header {
		text-align: center;
		margin-bottom: var(--space-xl);
	}
	
	.section-title {
		margin-bottom: var(--space-sm);
	}
	
	.catering-subtitle {
		color: var(--color-gray-600);
		max-width: 600px;
		margin: 0 auto;
	}
	
	.catering-pricing {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
		align-items: center;
	}
	
	.pricing-highlight {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		background: linear-gradient(135deg, var(--color-yellow) 0%, var(--color-yellow-light) 100%);
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-full);
		font-size: 1rem;
		color: var(--color-gray-900);
		box-shadow: var(--shadow-sm);
	}
	
	.highlight-icon {
		font-size: 1.2em;
	}
	
	@media (min-width: 640px) {
		.catering-pricing {
			flex-direction: row;
			justify-content: center;
		}
	}
	
	.catering-form {
		max-width: 600px;
		margin: 0 auto;
		background: var(--color-gray-100);
		padding: var(--space-lg);
		border-radius: var(--radius-xl);
	}
	
	.form-row {
		display: grid;
		gap: var(--space-md);
	}
	
	.required {
		color: var(--color-red);
	}
	
	.optional {
		color: var(--color-gray-600);
		font-weight: 400;
		font-size: 0.9em;
	}
	
	.submit-btn {
		width: 100%;
		padding: var(--space-md);
		font-size: 1.1rem;
		margin-top: var(--space-md);
	}
	
	.submit-error {
		background: #fef2f2;
		border: 1px solid var(--color-red);
		color: var(--color-red);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		margin-top: var(--space-md);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	
	.success-message {
		max-width: 500px;
		margin: 0 auto;
		text-align: center;
		padding: var(--space-xl);
		background: #f0fdf4;
		border-radius: var(--radius-xl);
		animation: fadeInUp 0.5s ease-out;
	}
	
	.success-icon {
		font-size: 3rem;
		margin-bottom: var(--space-md);
	}
	
	.success-message h3 {
		font-family: var(--font-heading);
		color: #166534;
		margin-bottom: var(--space-sm);
	}
	
	.success-message p {
		color: #166534;
		margin-bottom: var(--space-lg);
	}
	
	@media (min-width: 640px) {
		.form-row {
			grid-template-columns: 1fr 1fr;
		}
		
		.catering-form {
			padding: var(--space-xl);
		}
	}
	
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
