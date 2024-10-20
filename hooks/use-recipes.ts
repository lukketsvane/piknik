import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { Oppskrift, Ingrediens } from '@/components/piknik'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const client = new Anthropic({ apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

export function useRecipes(sessionCode: string, valgteIngrediensar: Ingrediens[]) {
  const [oppskrift, setOppskrift] = useState<Oppskrift | null>(null)
  const [blandar, setBlandar] = useState(false)
  const [recipeHistory, setRecipeHistory] = useState<Oppskrift[]>([])

  const fetchRecipeHistory = useCallback(async () => {
    if (!sessionCode) return

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('session_id', sessionCode)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching recipe history:', error)
    } else {
      const formattedRecipes: Oppskrift[] = data.map((recipe: any) => ({
        id: recipe.id,
        tittel: recipe.title,
        skildring: recipe.description,
        ingrediensar: recipe.ingredients,
        steg: recipe.steps,
        dato: recipe.created_at
      }))
      setRecipeHistory(formattedRecipes)
    }
  }, [sessionCode])

  useEffect(() => {
    fetchRecipeHistory()
  }, [fetchRecipeHistory])

  const genererOppskrift = async () => {
    setBlandar(true)
    await supabase.channel(`room:${sessionCode}`).send({
      type: 'broadcast',
      event: 'blending_update',
      payload: { isBlending: true }
    })

    const ingrediensListe = valgteIngrediensar.map(i => `${i.mengde} ${i.eining} ${i.namn}`).join(', ')
    try {
      const response = await client.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: `
              Lag en kreativ oppskrift på norsk med BARE følgende ingredienser, og ikke bruk mer enn de oppgitte mengdene: ${ingrediensListe}.
              Du kan velge å generere én av tre typer oppskrifter: "Rask", "Familievennlig", eller "Gourmet". Formater svaret slik:
              Tittel: [Oppskriftens tittel]
              Beskrivelse: [Kort beskrivelse av retten]
              Oppskriftstype: [Velg mellom Rask, Familievennlig eller Gourmet]
              Ingredienser:
              - [mengde] [enhet] [ingrediens]
              Fremgangsmåte:
              1. [Første steg]
              2. [Andre steg]
              ...
              Vær kreativ, men bruk BARE de oppgitte ingrediensene og ikke overskrid mengdene. Hvis du ikke bruker hele mengden av en ingrediens, spesifiser det i oppskriften.`.replace(/"/g, '&quot;')
          }
        ]
      })
      
      const content = response.content[0].text
      const lines = content.split('\n')
      const tittel = lines[0].replace('Tittel: ', '').trim()
      const skildring = lines[2].replace('Beskrivelse: ', '').trim()
      const ingrediensarStart = lines.findIndex(line => line.includes('Ingredienser:'))
      const stegStart = lines.findIndex(line => line.includes('Fremgangsmåte:'))
      const ingrediensar = lines.slice(ingrediensarStart + 1, stegStart)
        .filter(line => line.trim().startsWith('-'))
        .map(line => {
          const [mengde, eining, ...namn] = line.replace('-', '').trim().split(' ')
          return { namn: namn.join(' '), mengde: parseFloat(mengde), eining: eining as Eining, kategori: 'Anna', bilde: '/placeholder.svg?height=40&width=40', brukar: null }
        })
      const steg = lines.slice(stegStart + 1)
        .filter(line => /^\d+\./.test(line.trim()))
        
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
      const newOppskrift: Oppskrift = { tittel, skildring, ingrediensar, steg, dato: new Date().toISOString() }
      setOppskrift(newOppskrift)

      // Save the recipe to Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('code', sessionCode)
        .single()

      if (sessionError) {
        console.error('Error finding session:', sessionError)
        return
      }

      const { data: savedRecipe, error: saveRecipeError } = await supabase
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

      if (saveRecipeError) {
        console.error('Error saving recipe:', saveRecipeError)
      } else {
        newOppskrift.id = savedRecipe.id
        setRecipeHistory(prevHistory => [newOppskrift, ...prevHistory].slice(0, 50))
      }

      await supabase.channel(`room:${sessionCode}`).send({
        type: 'broadcast',
        event: 'recipe_update',
        payload: { recipe: newOppskrift }
      })
    } catch (error) {
      console.error('Feil ved generering av oppskrift:', error)
      alert('Det oppstod en feil ved generering av oppskrift. Vennligst prøv igjen.')
    } finally {
      setBlandar(false)
      await supabase.channel(`room:${sessionCode}`).send({
        type: 'broadcast',
        event: 'blending_update',
        payload: { isBlending: false }
      })
    }
  }

  const handterBlanding = () => {
    setBlandar(true)
    genererOppskrift()
  }

  return {
    oppskrift,
    setOppskrift,
    blandar,
    setBlandar,
    handterBlanding,
    recipeHistory,
    fetchRecipeHistory
  }
}