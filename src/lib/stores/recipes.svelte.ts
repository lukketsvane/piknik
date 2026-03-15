import { supabase } from '$lib/supabase'
import type { Oppskrift, Ingrediens } from '$lib/types'
import { ingredientsStore } from './ingredients.svelte'

class RecipesStore {
	oppskrift = $state<Oppskrift | null>(null)
	blandar = $state(false)
	recipeHistory = $state<Oppskrift[]>([])
	sessionRecipes = $state<Oppskrift[]>([])
	error = $state<string | null>(null)

	async fetchSessionRecipes(sessionCode: string) {
		try {
			const { data: sessionData, error: sessionError } = await supabase
				.from('sessions')
				.select('id')
				.eq('code', sessionCode)
				.single()

			if (sessionError) throw new Error(`Session lookup error: ${sessionError.message}`)

			const { data, error } = await supabase
				.from('recipes')
				.select('*')
				.eq('session_id', sessionData.id)
				.order('created_at', { ascending: false })
				.limit(50)

			if (error) throw new Error(`Session recipe fetch error: ${error.message}`)

			this.sessionRecipes = data.map((recipe: any) => ({
				id: recipe.id,
				tittel: recipe.title,
				skildring: recipe.description,
				ingrediensar: recipe.ingredients,
				steg: recipe.steps,
				dato: recipe.created_at,
				sessionCode
			}))
		} catch (error) {
			console.error('Error fetching session recipes:', error)
		}
	}

	async fetchRecipeHistory() {
		try {
			const { data, error } = await supabase
				.from('recipes')
				.select('*, sessions(code)')
				.order('created_at', { ascending: false })
				.limit(50)

			if (error) throw new Error(`Recipe fetch error: ${error.message}`)

			const formattedRecipes: Oppskrift[] = data.map((recipe: any) => ({
				id: recipe.id,
				tittel: recipe.title,
				skildring: recipe.description,
				ingrediensar: recipe.ingredients,
				steg: recipe.steps,
				dato: recipe.created_at,
				sessionCode: recipe.sessions?.code
			}))
			this.recipeHistory = formattedRecipes
		} catch (error) {
			console.error('Error fetching recipe history:', error)
			this.error = 'Kunne ikkje hente oppskrifthistorikk.'
		}
	}

	async generateRecipe(
		sessionCode: string,
		selectedCuisines: string[],
		isChildFriendly: boolean,
		isAdvancedMode: boolean
	) {
		this.blandar = true
		this.error = null

		try {
			// Broadcast blending state
			await supabase.channel(`room:${sessionCode}`).send({
				type: 'broadcast',
				event: 'blending_update',
				payload: { isBlending: true }
			})

			const ingrediensListe = ingredientsStore.valgteIngrediensar
				.map((i) => `${i.mengde} ${i.eining} ${i.namn}`)
				.join(', ')

			const response = await fetch('/api/generate-recipe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ingrediensListe,
					selectedCuisines,
					isChildFriendly,
					isAdvancedMode
				})
			})

			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`)
			}

			const newOppskrift: Oppskrift = await response.json()
			newOppskrift.sessionCode = sessionCode
			this.oppskrift = newOppskrift

			// Save to Supabase
			const { data: sessionData, error: sessionError } = await supabase
				.from('sessions')
				.select('id')
				.eq('code', sessionCode)
				.single()

			if (sessionError) throw new Error(`Session fetch error: ${sessionError.message}`)

			const { data: savedRecipe, error: saveError } = await supabase
				.from('recipes')
				.insert({
					session_id: sessionData.id,
					title: newOppskrift.tittel,
					description: newOppskrift.skildring,
					ingredients: newOppskrift.ingrediensar,
					steps: newOppskrift.steg
				})
				.select()
				.single()

			if (saveError) throw new Error(`Recipe save error: ${saveError.message}`)

			newOppskrift.id = savedRecipe.id
			this.recipeHistory = [newOppskrift, ...this.recipeHistory].slice(0, 50)
			this.sessionRecipes = [newOppskrift, ...this.sessionRecipes].slice(0, 50)

			// Broadcast recipe
			await supabase.channel(`room:${sessionCode}`).send({
				type: 'broadcast',
				event: 'recipe_update',
				payload: { recipe: newOppskrift }
			})
		} catch (error) {
			console.error('Feil ved generering av oppskrift:', error)
			this.error = `Det oppstod ein feil: ${(error as Error).message}`
		} finally {
			this.blandar = false
			await supabase.channel(`room:${sessionCode}`).send({
				type: 'broadcast',
				event: 'blending_update',
				payload: { isBlending: false }
			})
		}
	}

	clearRecipe() {
		this.oppskrift = null
	}
}

export const recipesStore = new RecipesStore()
