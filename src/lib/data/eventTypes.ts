// Event types for catering form

export const eventTypes = [
	'Birthday Party',
	'Wedding',
	'Corporate Event',
	'School Event',
	'Church Event',
	'Block Party',
	'Festival',
	'Other'
] as const;

export type EventType = (typeof eventTypes)[number];
