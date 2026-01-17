// Svelte action for scroll-triggered animations using Intersection Observer

type InviewOptions = {
	threshold?: number;
	rootMargin?: string;
	once?: boolean;
};

export function inview(node: HTMLElement, options: InviewOptions = {}) {
	const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true } = options;

	let hasTriggered = false;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && (!once || !hasTriggered)) {
					node.classList.add('is-visible');
					hasTriggered = true;

					if (once) {
						observer.unobserve(node);
					}
				} else if (!once && !entry.isIntersecting) {
					node.classList.remove('is-visible');
				}
			});
		},
		{ threshold, rootMargin }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
		update(newOptions: InviewOptions) {
			// Re-observe with new options if needed
			observer.disconnect();
			const newObserver = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							node.classList.add('is-visible');
						}
					});
				},
				{
					threshold: newOptions.threshold ?? threshold,
					rootMargin: newOptions.rootMargin ?? rootMargin
				}
			);
			newObserver.observe(node);
		}
	};
}
