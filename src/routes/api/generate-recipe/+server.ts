import { json, error } from '@sveltejs/kit'
import { OPENAI_API_KEY } from '$env/static/private'
import OpenAI from 'openai'
import type { RequestHandler } from './$types'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

export const POST: RequestHandler = async ({ request }) => {
	const { ingrediensListe, selectedCuisines, isChildFriendly, isAdvancedMode } =
		await request.json()

	if (!ingrediensListe) {
		error(400, 'Ingen ingrediensar oppgitt')
	}

	let cuisineInstruction = ''
	if (selectedCuisines && selectedCuisines.length > 0) {
		cuisineInstruction = `Lag oppskrifta i ${selectedCuisines.join(' / ')} stil.`
	}

	let childFriendlyInstruction = ''
	if (isChildFriendly) {
		childFriendlyInstruction =
			'Oppskrifta skal vere barnevennleg og enkel å lage. Unngå sterke krydder og avanserte teknikkar.'
	}

	let advancedInstruction = ''
	if (isAdvancedMode) {
		advancedInstruction =
			'Du kan inkludere vanlege krydder, oljer og tilbehør utover dei oppgitte ingrediensane for å gjere retten betre.'
	} else {
		advancedInstruction = 'Bruk KUN dei oppgitte ingrediensane og ikkje overskrid mengdene.'
	}

	const prompt = `Du er ein kreativ kokk som lagar oppskrifter på norsk.
Lag ein kreativ oppskrift med følgjande ingrediensar: ${ingrediensListe}.
${cuisineInstruction}
${childFriendlyInstruction}
${advancedInstruction}

Svar BERRE med gyldig JSON i dette formatet, utan noko anna tekst:
{
  "tittel": "Oppskrifta sin tittel",
  "skildring": "Kort skildring av retten (1-2 setningar)",
  "ingrediensar": [
    { "namn": "Ingrediensnamn", "mengde": 100, "eining": "g", "kategori": "Anna", "bilde": "", "brukar": null }
  ],
  "steg": [
    "Første steg i framgangsmåten",
    "Andre steg i framgangsmåten"
  ],
  "dato": "${new Date().toISOString()}"
}`

	try {
		const result = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content:
						'Du er ein kreativ kokk som lagar oppskrifter på norsk. Svar alltid med gyldig JSON og ingen annan tekst.'
				},
				{ role: 'user', content: prompt }
			],
			temperature: 0.7
		})

		const text = result.choices[0]?.message?.content ?? ''
		if (!text) {
			error(500, 'Fekk ikkje svar frå modellen')
		}

		let jsonText = text
		const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
		if (jsonMatch) {
			jsonText = jsonMatch[1].trim()
		}

		const oppskrift = JSON.parse(jsonText)
		return json(oppskrift)
	} catch (e) {
		console.error('OpenAI API error:', e)
		error(500, `Kunne ikkje generere oppskrift: ${(e as Error).message}`)
	}
}
