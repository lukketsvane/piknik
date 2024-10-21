import { Ingrediens, Kategori, Eining } from '@/components/piknik'

const ingredientNames = [
  'Tomat', 'Løk', 'Gulrot', 'Potet', 'Brokkoli', 'Kylling', 'Laks', 'Egg', 'Ost', 'Melk',
  'Brød', 'Pasta', 'Ris', 'Bønner', 'Linser', 'Spinat', 'Paprika', 'Agurk', 'Salat', 'Eple'
]

const categories: Kategori[] = ['Frukt', 'Grønsaker', 'Meieri', 'Fisk', 'Bakevarer', 'Kjøt', 'Anna']
const units: Eining[] = ['dl', 'g', 'hg', 'kg', 'stk', 'ss', 'ts']

export function generateRandomIngredients(count: number): Ingrediens[] {
  const ingredients: Ingrediens[] = []

  for (let i = 0; i < count; i++) {
    const randomName = ingredientNames[Math.floor(Math.random() * ingredientNames.length)]
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    const randomUnit = units[Math.floor(Math.random() * units.length)]
    const randomAmount = Math.floor(Math.random() * 10) + 1 // Random amount between 1 and 10

    ingredients.push({
      namn: randomName,
      mengde: randomAmount,
      eining: randomUnit,
      kategori: randomCategory,
      bilde: `/placeholder.svg?height=40&width=40`,
      brukar: null
    })
  }

  return ingredients
}