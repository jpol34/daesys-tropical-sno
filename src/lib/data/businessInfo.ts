// Business information for Daesy's Tropical Sno

export const businessInfo = {
	name: "Daesy's Tropical Sno",
	address: {
		street: '3814 Little Rd',
		city: 'Arlington',
		state: 'TX',
		zip: '76016',
		full: '3814 Little Rd, Arlington, TX 76016'
	},
	phone: '(817) 401-6310',
	phoneHref: 'tel:+18174016310',
	email: 'info@daesyssno.com',
	hours: {
		open: '1:00 PM',
		close: '8:00 PM',
		days: 'Tuesday - Sunday',
		closed: 'Monday',
		display: '1-8pm Tue-Sun • Closed Mon'
	},
	googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=3814+Little+Rd+Arlington+TX+76016',
	googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3356.5!2d-97.15!3d32.73!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDQzJzQ4LjAiTiA5N8KwMDknMDAuMCJX!5e0!3m2!1sen!2sus!4v1234567890',
	social: {
		instagram: {
			handle: '@daesystropicalsno',
			url: 'https://www.instagram.com/daesystropicalsno'
		},
		facebook: {
			url: 'https://www.facebook.com/share/1BpnqGxn1a/'
		}
	}
} as const;
