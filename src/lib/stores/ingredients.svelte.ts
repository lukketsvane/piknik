import { supabase } from '$lib/supabase'
import type { Ingrediens, Eining, Kategori } from '$lib/types'
import { randomIngredients } from '$lib/data/random-ingredients'
import { sessionStore } from './session.svelte'

function mapIngredientFromDB(dbIngredient: any): Ingrediens {
	return {
		id: dbIngredient.id,
		namn: dbIngredient.name,
		mengde: dbIngredient.amount,
		eining: dbIngredient.unit as Eining,
		kategori: dbIngredient.category as Kategori,
		bilde: dbIngredient.image,
		brukar: dbIngredient.added_by ? { id: dbIngredient.added_by, namn: '', farge: '' } : null
	}
}

class IngredientsStore {
	ingrediensar = $state<Ingrediens[]>([])
	valgteIngrediensar = $state<Ingrediens[]>([])
	visLeggTilIngrediens = $state(false)
	redigeringIngrediens = $state<Ingrediens | null>(null)

	private channel: ReturnType<typeof supabase.channel> | null = null

	async init(sessionCode: string) {
		// Fetch existing ingredients
		const { data: sessionData, error: sessionError } = await supabase
			.from('sessions')
			.select('id')
			.eq('code', sessionCode)
			.single()

		if (sessionError) {
			console.error('Error finding session:', sessionError)
			return
		}

		const { data: ingredientsData, error: ingredientsError } = await supabase
			.from('ingredients')
			.select('*')
			.eq('session_id', sessionData.id)

		if (ingredientsError) {
			console.error('Error fetching ingredients:', ingredientsError)
			return
		}

		this.ingrediensar = ingredientsData.map(mapIngredientFromDB)

		// Subscribe to broadcast
		this.channel = supabase.channel(`ingredients:${sessionCode}`)
		this.channel
			.on('broadcast', { event: 'ingredients_update' }, ({ payload }) => {
				this.ingrediensar = payload.ingredients
			})
			.on('broadcast', { event: 'selected_ingredients_update' }, ({ payload }) => {
				this.valgteIngrediensar = payload.selectedIngredients
			})
			.subscribe()
	}

	private async addRandomIngredients(sessionId: string, sessionCode: string) {
		const randomCount = Math.floor(Math.random() * 4) + 2
		const shuffled = [...randomIngredients].sort(() => 0.5 - Math.random())
		const selected = shuffled.slice(0, randomCount)

		const ingredientsToAdd = selected.map((ingredient) => ({
			session_id: sessionId,
			name: ingredient.namn,
			amount: ingredient.mengde,
			unit: ingredient.eining,
			category: ingredient.kategori,
			image: ingredient.bilde,
			added_by: sessionStore.currentUser?.id
		}))

		const { data: addedIngredients, error } = await supabase
			.from('ingredients')
			.insert(ingredientsToAdd)
			.select()

		if (error) {
			console.error('Error adding random ingredients:', error)
			return
		}

		const mappedIngredients = addedIngredients.map(mapIngredientFromDB)
		this.ingrediensar = mappedIngredients

		await this.broadcastIngredients(sessionCode, mappedIngredients)
	}

	async addIngredient(nyIngrediens: Ingrediens, sessionCode: string) {
		if (
			!nyIngrediens.namn ||
			nyIngrediens.mengde <= 0 ||
			!nyIngrediens.eining ||
			this.ingrediensar.some((i) => i.namn === nyIngrediens.namn)
		) {
			return
		}

		const { data: sessionData, error: sessionError } = await supabase
			.from('sessions')
			.select('id')
			.eq('code', sessionCode)
			.single()

		if (sessionError) {
			console.error('Error finding session:', sessionError)
			return
		}

		const { data: ingredientData, error: ingredientError } = await supabase
			.from('ingredients')
			.insert({
				session_id: sessionData.id,
				name: nyIngrediens.namn,
				amount: nyIngrediens.mengde,
				unit: nyIngrediens.eining,
				category: nyIngrediens.kategori,
				image: nyIngrediens.bilde,
				added_by: sessionStore.currentUser?.id
			})
			.select()
			.single()

		if (ingredientError) {
			console.error('Error adding ingredient:', ingredientError)
			return
		}

		const updatedIngredient = mapIngredientFromDB(ingredientData)
		const updatedIngredients = [...this.ingrediensar, updatedIngredient]
		this.ingrediensar = updatedIngredients
		this.visLeggTilIngrediens = false

		await this.broadcastIngredients(sessionCode, updatedIngredients)
	}

	async toggleSelection(ingrediens: Ingrediens, sessionCode: string) {
		const updatedSelectedIngredients = this.valgteIngrediensar.some((i) => i.id === ingrediens.id)
			? this.valgteIngrediensar.filter((i) => i.id !== ingrediens.id)
			: [...this.valgteIngrediensar, ingrediens]

		this.valgteIngrediensar = updatedSelectedIngredients

		await supabase.channel(`ingredients:${sessionCode}`).send({
			type: 'broadcast',
			event: 'selected_ingredients_update',
			payload: { selectedIngredients: updatedSelectedIngredients }
		})
	}

	async deleteIngredient(ingrediens: Ingrediens, sessionCode: string) {
		if (!ingrediens.id) return

		const { error } = await supabase.from('ingredients').delete().eq('id', ingrediens.id)

		if (error) {
			console.error('Error deleting ingredient:', error)
			return
		}

		const updatedIngredients = this.ingrediensar.filter((i) => i.id !== ingrediens.id)
		this.ingrediensar = updatedIngredients
		this.valgteIngrediensar = this.valgteIngrediensar.filter((i) => i.id !== ingrediens.id)

		await this.broadcastIngredients(sessionCode, updatedIngredients)
		await supabase.channel(`ingredients:${sessionCode}`).send({
			type: 'broadcast',
			event: 'selected_ingredients_update',
			payload: {
				selectedIngredients: this.valgteIngrediensar.filter((i) => i.id !== ingrediens.id)
			}
		})
	}

	startEdit(ingrediens: Ingrediens) {
		this.redigeringIngrediens = ingrediens
		this.visLeggTilIngrediens = true
	}

	async updateIngredient(oppdatertIngrediens: Ingrediens, sessionCode: string) {
		if (!oppdatertIngrediens.id) return

		const { error } = await supabase
			.from('ingredients')
			.update({
				name: oppdatertIngrediens.namn,
				amount: oppdatertIngrediens.mengde,
				unit: oppdatertIngrediens.eining,
				category: oppdatertIngrediens.kategori,
				image: oppdatertIngrediens.bilde,
				added_by: sessionStore.currentUser?.id
			})
			.eq('id', oppdatertIngrediens.id)

		if (error) {
			console.error('Error updating ingredient:', error)
			return
		}

		const updatedIngredients = this.ingrediensar.map((i) =>
			i.id === oppdatertIngrediens.id
				? { ...oppdatertIngrediens, brukar: sessionStore.currentUser }
				: i
		)
		this.ingrediensar = updatedIngredients
		this.redigeringIngrediens = null
		this.visLeggTilIngrediens = false

		await this.broadcastIngredients(sessionCode, updatedIngredients)

		if (this.valgteIngrediensar.some((i) => i.id === oppdatertIngrediens.id)) {
			const updatedSelected = this.valgteIngrediensar.map((i) =>
				i.id === oppdatertIngrediens.id
					? { ...oppdatertIngrediens, brukar: sessionStore.currentUser }
					: i
			)
			this.valgteIngrediensar = updatedSelected
			await supabase.channel(`ingredients:${sessionCode}`).send({
				type: 'broadcast',
				event: 'selected_ingredients_update',
				payload: { selectedIngredients: updatedSelected }
			})
		}
	}

	private async broadcastIngredients(sessionCode: string, ingredients: Ingrediens[]) {
		await supabase.channel(`ingredients:${sessionCode}`).send({
			type: 'broadcast',
			event: 'ingredients_update',
			payload: { ingredients }
		})
	}

	cleanup() {
		if (this.channel) {
			this.channel.unsubscribe()
			this.channel = null
		}
		this.ingrediensar = []
		this.valgteIngrediensar = []
		this.visLeggTilIngrediens = false
		this.redigeringIngrediens = null
	}
}

export const ingredientsStore = new IngredientsStore()
