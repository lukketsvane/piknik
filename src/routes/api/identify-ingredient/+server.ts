import { json, error } from '@sveltejs/kit'
import { OPENAI_API_KEY } from '$env/static/private'
import OpenAI from 'openai'
import type { RequestHandler } from './$types'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

export const POST: RequestHandler = async ({ request }) => {
	const { image } = await request.json()

	if (!image) {
		error(400, 'Image is required')
	}

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
		const base64Data = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`

		const result = await openai.chat.completions.create({
			model: 'gpt-4o',
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: prompt },
						{ type: 'image_url', image_url: { url: base64Data } }
					]
				}
			]
		})

		const responseText = result.choices[0].message.content ?? ''
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
