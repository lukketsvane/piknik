const prefixes = [
	'Kokk', 'Baker', 'Gryte', 'Smak', 'Krydder',
	'Suppe', 'Kjøken', 'Deig', 'Steke', 'Kok',
	'Snacks', 'Salat', 'Sous', 'Panne', 'Bolle'
]

const suffixes = [
	'Bjørn', 'Rev', 'Ulv', 'Ull', 'Brum',
	'Tull', 'Mus', 'Lansen', 'Fansen', 'Kvansen',
	'Bansen', 'Boss', 'Storm', 'Lyn', 'Blitz'
]

export function generateUsername(): string {
	const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
	const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
	return `${prefix}${suffix}`
}
