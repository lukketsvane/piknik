import { error } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createClient(
		import.meta.env.VITE_SUPABASE_URL || '',
		import.meta.env.VITE_SUPABASE_ANON_KEY || ''
	)

	const { data, error: dbError } = await supabase
		.from('recipes')
		.select('*')
		.eq('id', params.id)
		.single()

	if (dbError || !data) {
		error(404, 'Oppskrifta finst ikkje')
	}

	return {
		recipe: {
			id: data.id,
			tittel: data.title,
			skildring: data.description,
			ingrediensar: data.ingredients,
			steg: data.steps,
			dato: data.created_at
		}
	}
}
