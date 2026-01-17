<script lang="ts">
	import { supabase } from '$lib/supabase';
	
	interface Props {
		onLoginSuccess: () => void;
	}
	
	let { onLoginSuccess }: Props = $props();
	
	// Login form state
	let loginEmail = $state('');
	let loginPassword = $state('');
	let isLoggingIn = $state(false);
	let authError = $state('');
	
	async function handleLogin(e: Event) {
		e.preventDefault();
		isLoggingIn = true;
		authError = '';
		
		const { error } = await supabase.auth.signInWithPassword({
			email: loginEmail,
			password: loginPassword
		});
		
		if (error) {
			authError = error.message;
		} else {
			onLoginSuccess();
		}
		isLoggingIn = false;
	}
</script>

<div class="login-container">
	<div class="login-card">
		<h1 class="login-title">Admin Login</h1>
		<p class="login-subtitle">Daesy's Tropical Sno Dashboard</p>
		
		<form onsubmit={handleLogin} class="login-form">
			{#if authError}
				<div class="auth-error" role="alert">{authError}</div>
			{/if}
			
			<div class="form-group">
				<label for="email" class="form-label">Email</label>
				<input type="email" id="email" class="form-input" bind:value={loginEmail} required autocomplete="email" />
			</div>
			
			<div class="form-group">
				<label for="password" class="form-label">Password</label>
				<input type="password" id="password" class="form-input" bind:value={loginPassword} required autocomplete="current-password" />
			</div>
			
			<button type="submit" class="btn btn-primary login-btn" disabled={isLoggingIn}>
				{#if isLoggingIn}<span class="spinner"></span> Signing in...{:else}Sign In{/if}
			</button>
		</form>
		
		<a href="/" class="back-link">← Back to website</a>
	</div>
</div>

<style>
	.login-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-md);
	}
	
	.login-card {
		background: var(--color-white);
		padding: var(--space-xl);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		width: 100%;
		max-width: 400px;
	}
	
	.login-title {
		font-family: var(--font-heading);
		text-align: center;
		margin-bottom: var(--space-xs);
	}
	
	.login-subtitle {
		text-align: center;
		color: var(--color-gray-600);
		margin-bottom: var(--space-lg);
	}
	
	.login-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	
	.auth-error {
		background: #fef2f2;
		border: 1px solid var(--color-red);
		color: var(--color-red);
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
	}
	
	.login-btn {
		width: 100%;
		margin-top: var(--space-sm);
	}
	
	.back-link {
		display: block;
		text-align: center;
		margin-top: var(--space-lg);
		color: var(--color-gray-600);
		font-size: 0.9rem;
	}
</style>
