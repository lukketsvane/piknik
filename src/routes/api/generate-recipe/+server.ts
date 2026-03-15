import { json, error } from '@sveltejs/kit'
import { GEMINI_API_KEY } from '$env/static/private'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { RequestHandler } from './$types'

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

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
		const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })
		const result = await model.generateContent(prompt)
		const text = result.response.text()

		// Extract JSON from the response (handle markdown code blocks)
		let jsonText = text
		const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
		if (jsonMatch) {
			jsonText = jsonMatch[1].trim()
		}

		const oppskrift = JSON.parse(jsonText)
		return json(oppskrift)
	} catch (e) {
		console.error('Gemini API error:', e)
		error(500, 'Kunne ikkje generere oppskrift')
	}
}
