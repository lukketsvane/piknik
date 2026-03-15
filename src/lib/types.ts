export type Eining = 'g' | 'kg' | 'ml' | 'l' | 'stk' | 'ss' | 'ts' | 'dl' | 'hg'

export type Kategori = 'Frukt' | 'Grønsaker' | 'Meieri' | 'Fisk' | 'Bakevarer' | 'Kjøt' | 'Anna'

export interface Ingrediens {
	id?: string
	namn: string
	mengde: number
	eining: Eining
	kategori: Kategori
	bilde: string
	brukar: { id: string; namn: string; farge: string } | null
}

export interface Oppskrift {
	id?: string
	tittel: string
	skildring: string
	ingrediensar: Ingrediens[]
	steg: string[]
	dato: string
	sessionCode?: string
}

export type User = {
	id: string
	namn: string
	farge: string
}
