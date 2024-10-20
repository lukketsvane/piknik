import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Ingrediens, Kategori, Eining } from '../piknik'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const randomIngredients: Ingrediens[] = [
  { namn: 'Eple', mengde: 2, eining: 'stk', kategori: 'Frukt', bilde: '/placeholder.svg?height=40&width=40' },
  { namn: 'Gulrot', mengde: 3, eining: 'stk', kategori: 'Grønsaker', bilde: '/placeholder.svg?height=40&width=40' },
  { namn: 'Melk', mengde: 1, eining: 'l', kategori: 'Meieri', bilde: '/placeholder.svg?height=40&width=40' },
  { namn: 'Laks', mengde: 400, eining: 'g', kategori: 'Fisk', bilde: '/placeholder.svg?height=40&width=40' },
  { namn: 'Brød', mengde: 1, eining: 'stk', kategori: 'Bakevarer', bilde: '/placeholder.svg?height=40&width=40' },
  { namn: 'Kylling', mengde: 500, eining: 'g', kategori: 'Kjøt', bilde: '/placeholder.svg?height=40&width=40' },
  { namn: 'Ost', mengde: 200, eining: 'g', kategori: 'Meieri', bilde: '/placeholder.svg?height=40&width=40' },
  { namn: 'Tomat', mengde: 4, eining: 'stk', kategori: 'Grønsaker', bilde: '/placeholder.svg?height=40&width=40' },
]

export function useIngredients(sessionCode: string, currentUser: { id: string; namn: string; farge: string } | null) {
  const [ingrediensar, setIngrediensar] = useState<Ingrediens[]>([])
  const [valgteIngrediensar, setValgteIngrediensar] = useState<Ingrediens[]>([])
  const [visLeggTilIngrediens, setVisLeggTilIngrediens] = useState(false)
  const [redigeringIngrediens, setRedigeringIngrediens] = useState<Ingrediens | null>(null)

  useEffect(() => {
    const fetchIngredients = async () => {
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

      if (ingredientsData.length === 0) {
        await addRandomIngredients(sessionData.id)
      } else {
        setIngrediensar(ingredientsData.map(mapIngredientFromDB))
      }
    }

    fetchIngredients()

    const channel = supabase.channel(`room:${sessionCode}`)
    channel
      .on('broadcast', { event: 'ingredients_update' }, ({ payload }) => {
        setIngrediensar(payload.ingredients)
      })
      .on('broadcast', { event: 'selected_ingredients_update' }, ({ payload }) => {
        setValgteIngrediensar(payload.selectedIngredients)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [sessionCode])

  const addRandomIngredients = async (sessionId: string) => {
    const shuffled = randomIngredients.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 2)

    const ingredientsToAdd = selected.map(ingredient => ({
      session_id: sessionId,
      name: ingredient.namn,
      amount: ingredient.mengde,
      unit: ingredient.eining,
      category: ingredient.kategori,
      image: ingredient.bilde,
      added_by: currentUser?.id
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
    setIngrediensar(mappedIngredients)

    await supabase.channel(`room:${sessionCode}`).send({
      type: 'broadcast',
      event: 'ingredients_update',
      payload: { ingredients: mappedIngredients }
    })
  }

  const mapIngredientFromDB = (dbIngredient: any): Ingrediens => ({
    id: dbIngredient.id,
    namn: dbIngredient.name,
    mengde: dbIngredient.amount,
    eining: dbIngredient.unit as Eining,
    kategori: dbIngredient.category as Kategori,
    bilde: dbIngredient.image,
    brukar: dbIngredient.added_by ? { id: dbIngredient.added_by, namn: '', farge: '' } : null
  })

  const handterLeggTilIngrediens = async (nyIngrediens: Ingrediens) => {
    if (nyIngrediens.namn && nyIngrediens.mengde > 0 && nyIngrediens.eining && !ingrediensar.some(i => i.namn === nyIngrediens.namn)) {
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
          added_by: currentUser?.id
        })
        .select()
        .single()

      if (ingredientError) {
        console.error('Error adding ingredient:', ingredientError)
        return
      }

      const updatedIngredient = mapIngredientFromDB(ingredientData)
      const updatedIngredients = [...ingrediensar, updatedIngredient]
      setIngrediensar(updatedIngredients)
      setVisLeggTilIngrediens(false)

      await supabase.channel(`room:${sessionCode}`).send({
        type: 'broadcast',
        event: 'ingredients_update',
        payload: { ingredients: updatedIngredients }
      })
    }
  }

  const handterIngrediensMerking = async (ingrediens: Ingrediens) => {
    const updatedSelectedIngredients = valgteIngrediensar.some(i => i.id === ingrediens.id)
      ? valgteIngrediensar.filter(i => i.id !== ingrediens.id)
      : [...valgteIngrediensar, ingrediens]
    
    setValgteIngrediensar(updatedSelectedIngredients)

    await supabase.channel(`room:${sessionCode}`).send({
      type: 'broadcast',
      event: 'selected_ingredients_update',
      payload: { selectedIngredients: updatedSelectedIngredients }
    })
  }

  const handterSlettIngrediens = async (ingrediens: Ingrediens) => {
    if (!ingrediens.id) {
      console.error('Ingredient has no ID')
      return
    }

    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', ingrediens.id)

    if (error) {
      console.error('Error deleting ingredient:', error)
      return
    }

    const updatedIngredients = ingrediensar.filter(i => i.id !== ingrediens.id)
    setIngrediensar(updatedIngredients)
    setValgteIngrediensar(prev => prev.filter(i => i.id !== ingrediens.id))

    await supabase.channel(`room:${sessionCode}`).send({
      type: 'broadcast',
      event: 'ingredients_update',
      payload: { ingredients: updatedIngredients }
    })

    await supabase.channel(`room:${sessionCode}`).send({
      type: 'broadcast',
      event: 'selected_ingredients_update',
      payload: { selectedIngredients: valgteIngrediensar.filter(i => i.id !== ingrediens.id) }
    })
  }

  const handterRedigerIngrediens = (ingrediens: Ingrediens) => {
    setRedigeringIngrediens(ingrediens)
    setVisLeggTilIngrediens(true)
  }

  const handterOppdaterIngrediens = async (oppdatertIngrediens: Ingrediens) => {
    if (oppdatertIngrediens.id) {
      const { error } = await supabase
        .from('ingredients')
        .update({
          name: oppdatertIngrediens.namn,
          amount: oppdatertIngrediens.mengde,
          unit: oppdatertIngrediens.eining,
          category: oppdatertIngrediens.kategori,
          image: oppdatertIngrediens.bilde,
          added_by: currentUser?.id
        })
        .eq('id', oppdatertIngrediens.id)

      if (error) {
        console.error('Error updating ingredient:', error)
        return
      }

      const updatedIngredients = ingrediensar.map(i => 
        i.id === oppdatertIngrediens.id ? { ...oppdatertIngrediens, brukar: currentUser } : i
      )
      setIngrediensar(updatedIngredients)
      setRedigeringIngrediens(null)
      setVisLeggTilIngrediens(false)

      await supabase.channel(`room:${sessionCode}`).send({
        type: 'broadcast',
        event: 'ingredients_update',
        payload: { ingredients: updatedIngredients }
      })

      if (valgteIngrediensar.some(i => i.id === oppdatertIngrediens.id)) {
        const updatedSelectedIngredients = valgteIngrediensar.map(i =>
          i.id === oppdatertIngrediens.id ? { ...oppdatertIngrediens, brukar: currentUser } : i
        )
        setValgteIngrediensar(updatedSelectedIngredients)
        await supabase.channel(`room:${sessionCode}`).send({
          type: 'broadcast',
          event: 'selected_ingredients_update',
          payload: { selectedIngredients: updatedSelectedIngredients }
        })
      }
    }
  }

  return {
    ingrediensar,
    valgteIngrediensar,
    visLeggTilIngrediens,
    setVisLeggTilIngrediens,
    redigeringIngrediens,
    handterLeggTilIngrediens,
    handterIngrediensMerking,
    handterSlettIngrediens,
    handterRedigerIngrediens,
    handterOppdaterIngrediens
  }
}