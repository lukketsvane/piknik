import { error } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createClient(
		import.meta.env.VITE_SUPABASE_URL || '',
		import.meta.env.VITE_SUPABASE_ANON_KEY || ''
	)

	const { data, error: dbError } = await supabase
		.from('sessions')
		.select('id, code')
		.eq('code', params.code)
		.single()

	if (dbError || !data) {
		error(404, 'Økta finst ikkje')
	}

	return {
		sessionCode: params.code
	}
}
