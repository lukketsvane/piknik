import { json, error } from '@sveltejs/kit'
import { GEMINI_API_KEY } from '$env/static/private'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { RequestHandler } from './$types'

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

export const POST: RequestHandler = async ({ request }) => {
	const { image } = await request.json()

	if (!image) {
		error(400, 'Image is required')
	}

	const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

	const prompt = `Du ser eit bilete av ein matingrediens. Identifiser ingrediensen og estimer mengda.

Svar KUN med gyldig JSON i dette formatet:
{
  "namn": "namn på ingrediensen på norsk",
  "mengde": tal (eit rimeleg estimat),
  "eining": "ein av: g, kg, ml, l, stk, ss, ts, dl, hg",
  "kategori": "ein av: Frukt, Grønsaker, Meieri, Fisk, Bakevarer, Kjøt, Anna"
}

Vel den eininga som er mest naturleg for ingrediensen. Til dømes:
- Eple, banan, egg → stk
- Kjøtdeig, mel, sukker → g eller kg
- Melk, fløte → dl eller l
- Smør → g

Svar BERRE med JSON, ingen annan tekst.`

	try {
		const base64Data = image.replace(/^data:image\/\w+;base64,/, '')

		const result = await model.generateContent([
			prompt,
			{
				inlineData: {
					mimeType: 'image/jpeg',
					data: base64Data
				}
			}
		])

		const responseText = result.response.text()
		const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
		const ingredient = JSON.parse(cleanedText)

		const validEiningar = ['g', 'kg', 'ml', 'l', 'stk', 'ss', 'ts', 'dl', 'hg']
		const validKategoriar = ['Frukt', 'Grønsaker', 'Meieri', 'Fisk', 'Bakevarer', 'Kjøt', 'Anna']

		if (!validEiningar.includes(ingredient.eining)) ingredient.eining = 'stk'
		if (!validKategoriar.includes(ingredient.kategori)) ingredient.kategori = 'Anna'
		if (typeof ingredient.mengde !== 'number' || ingredient.mengde <= 0) ingredient.mengde = 1

		return json(ingredient)
	} catch (err) {
		console.error('Error identifying ingredient:', err)
		error(500, 'Could not identify ingredient')
	}
}
