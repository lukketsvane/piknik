'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePDF } from 'react-to-pdf'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Download, Plus, Utensils, Trash2, Settings, User, Users, Apple, Carrot, Milk, Fish, Beef, Volume2, VolumeX, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const client = new Anthropic({ apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true })

type Kategori = 'Frukt' | 'Grønsaker' | 'Meieri' | 'Fisk' | 'Bakevarer' | 'Kjøt' | 'Anna'
type Eining = 'dl' | 'g' | 'hg' | 'kg' | 'stk' | 'ss' | 'ts'
type Ingrediens = { id?: string; namn: string; mengde: number; eining: Eining; kategori: Kategori; bilde: string; brukar: { id: string; namn: string; farge: string } | null }
type Oppskrift = { tittel: string; skildring: string; ingrediensar: Ingrediens[]; steg: string[] }

const kategoriar: Kategori[] = ['Frukt', 'Grønsaker', 'Meieri', 'Fisk', 'Bakevarer', 'Kjøt', 'Anna']
const einingar: Eining[] = ['dl', 'g', 'hg', 'kg', 'stk', 'ss', 'ts']
const kategoriIkon = { Frukt: <Apple className="w-4 h-4" />, Grønsaker: <Carrot className="w-4 h-4" />, Meieri: <Milk className="w-4 h-4" />, Fisk: <Fish className="w-4 h-4" />, Bakevarer: <Utensils className="w-4 h-4" />, Kjøt: <Beef className="w-4 h-4" />, Anna: <Utensils className="w-4 h-4" /> }
const userColors = ['#FFD700', '#FFB6C1', '#FF4500', '#9370DB', '#32CD32']

const InitialCard = ({ onJoinSession, onCreateSession }: { onJoinSession: (username: string, code: string) => void, onCreateSession: (username: string) => void }) => {
  const [username, setUsername] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [isCreatingSession, setIsCreatingSession] = useState(true)

  return (
    <Card className="w-full max-w-md mx-auto mt-20 bg-white relative">
      <CardHeader className="flex flex-col items-center">
        <Image src="/logo.png" alt="PikNik Logo" width={200} height={200} />
        <CardTitle className="text-2xl font-bold text-center text-purple-600 mt-4">Velkomen til PikNik!</CardTitle>
        <p className="text-center mt-2">
          <span className="underline decoration-purple-500">Bland</span> ingredienser, 
          <span className="underline decoration-green-500">skap</span> oppskrifter, 
          <span className="underline decoration-blue-500">del</span> med venner!
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="session-mode" checked={isCreatingSession} onCheckedChange={() => setIsCreatingSession(prev => !prev)} />
            <Label htmlFor="session-mode" className="text-lg font-medium text-purple-700">{isCreatingSession ? 'Lag økt' : 'Bli med i økt'}</Label>
          </div>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Skriv inn brukarnamnet ditt" className="mt-1 bg-white" />
          {!isCreatingSession && <Input id="sessionCode" value={sessionCode} onChange={(e) => setSessionCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Skriv inn 4-sifra kode" className="mt-1 bg-white" maxLength={4} />}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => isCreatingSession ? onCreateSession(username) : onJoinSession(username, sessionCode)} 
                disabled={!username || (!isCreatingSession && sessionCode.length !== 4)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white">
          {isCreatingSession ? 'Lag økt' : 'Bli med i økt'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function PikNik({ sessionCode: initialSessionCode }: { sessionCode?: string }) {
  const router = useRouter()
  const [ingrediensar, setIngrediensar] = useState<Ingrediens[]>([])
  const [valgteIngrediensar, setValgteIngrediensar] = useState<Ingrediens[]>([])
  const [nyIngrediens, setNyIngrediens] = useState<Ingrediens>({ namn: "", mengde: 0, eining: "stk", kategori: "Anna", bilde: "/placeholder.svg?height=40&width=40", brukar: null })
  const [blandar, setBlandar] = useState(false)
  const [oppskrift, setOppskrift] = useState<Oppskrift | null>(null)
  const [gjeldandeIngrediens, setGjeldandeIngrediens] = useState("")
  const [visLeggTilIngrediens, setVisLeggTilIngrediens] = useState(false)
  const [redigeringIngrediens, setRedigeringIngrediens] = useState<Ingrediens | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionCode, setSessionCode] = useState(initialSessionCode || '')
  const [showSessionCode, setShowSessionCode] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; namn: string; farge: string } | null>(null)
  const [participants, setParticipants] = useState<{ id: string; namn: string; farge: string }[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)
  const generatingAudioRef = useRef<HTMLAudioElement | null>(null)
  const { toPDF, targetRef } = usePDF({ filename: 'piknik-oppskrift.pdf', page: { margin: 20, format: 'A4', orientation: 'landscape' }, view: { width: 1190, height: 842 } })

  useEffect(() => {
    if (initialSessionCode) {
      setSessionStarted(true)
      setSessionCode(initialSessionCode)
      joinSession(initialSessionCode)
    }
    setupAudio()
  }, [initialSessionCode])

  useEffect(() => {
    if (sessionStarted) {
      const channel = supabase.channel(`room:${sessionCode}`)
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const participants = Object.values(state).flat() as { id: string; namn: string; farge: string }[]
          setParticipants(participants)
        })
        .on('broadcast', { event: 'ingredients_update' }, ({ payload }) => {
          setIngrediensar(payload.ingredients)
        })
        .on('broadcast', { event: 'selected_ingredients_update' }, ({ payload }) => {
          setValgteIngrediensar(payload.selectedIngredients)
        })
        .on('broadcast', { event: 'blending_update' }, ({ payload }) => {
          setBlandar(payload.isBlending)
        })
        .on('broadcast', { event: 'recipe_update' }, ({ payload }) => {
          setOppskrift(payload.recipe)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && currentUser) {
            await channel.track(currentUser)
          }
        })

      return () => {
        channel.unsubscribe()
      }
    }
  }, [sessionStarted, sessionCode, currentUser])

  const setupAudio = () => {
    backgroundAudioRef.current = new Audio('/music/lobby-classic-game.mp3')
    generatingAudioRef.current = new Audio('/music/alt03-answer_010sec.mp3')
    backgroundAudioRef.current.loop = true
    generatingAudioRef.current.loop = true
    return () => {
      backgroundAudioRef.current?.pause()
      generatingAudioRef.current?.pause()
    }
  }

  useEffect(() => {
    const playAudio = async (audio: HTMLAudioElement) => {
      try { await audio.play() } catch (error) { console.error("Error playing audio:", error) }
    }
    if (backgroundAudioRef.current && generatingAudioRef.current) {
      if (isMuted) {
        backgroundAudioRef.current.pause()
        generatingAudioRef.current.pause()
      } else {
        if (sessionStarted && !blandar) {
          generatingAudioRef.current.pause()
          playAudio(backgroundAudioRef.current)
        } else if (blandar) {
          backgroundAudioRef.current.pause()
          playAudio(generatingAudioRef.current)
        }
      }
    }
  }, [isMuted, sessionStarted, blandar])

  const toggleMute = () => setIsMuted(!isMuted)

  const joinSession = async (code: string) => {
    const { data, error } = await supabase
      .rpc('get_session_data', { p_session_code: code })

    if (error) {
      console.error('Error joining session:', error)
      return
    }

    const sessionData = data[0]
    setSessionCode(sessionData.session_code)
    
    const users = data.reduce((acc: any[], curr: any) => {
      if  (curr.user_id && !acc.some((u: any) => u.id === curr.user_id)) {
        acc.push({ id: curr.user_id, namn: curr.user_name, farge: curr.user_color })
      }
      return acc
    }, [])
    setParticipants(users)

    const ingredients = data.reduce((acc: Ingrediens[], curr: any) => {
      if (curr.ingredient_id) {
        acc.push({
          id: curr.ingredient_id,
          namn: curr.ingredient_name,
          mengde: curr.ingredient_amount,
          eining: curr.ingredient_unit as Eining,
          kategori: curr.ingredient_category as Kategori,
          bilde: curr.ingredient_image,
          brukar: users.find((u: any) => u.id === curr.ingredient_added_by)
        })
      }
      return acc
    }, [])
    setIngrediensar(ingredients)

    setSessionStarted(true)
  }

  const handleCreateSession = async (username: string) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const newUser = { namn: username, farge: userColors[0] }

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({ code })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({ session_id: sessionData.id, name: newUser.namn, color: newUser.farge })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return
    }

    setSessionCode(code)
    setCurrentUser({ ...newUser, id: userData.id })
    setParticipants([{ ...newUser, id: userData.id }])
    setSessionStarted(true)
    router.push(`/${code}`)
  }

  const handleJoinSession = async (username: string, code: string) => {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('code', code)
      .single()

    if (sessionError) {
      console.error('Error finding session:', sessionError)
      return
    }

    const newUser = { namn: username, farge: userColors[participants.length % userColors.length] }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({ session_id: sessionData.id, name: newUser.namn, color: newUser.farge })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return
    }

    setCurrentUser({ ...newUser, id: userData.id })
    setSessionStarted(true)
    await joinSession(code)
    router.push(`/${code}`)
  }

  const handterLeggTilIngrediens = async () => {
    if (nyIngrediens.namn && nyIngrediens.mengde > 0 &&   nyIngrediens.eining && !ingrediensar.some(i => i.namn === nyIngrediens.namn)) {
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

      const updatedIngredient = {
        ...nyIngrediens,
        id: ingredientData.id,
        brukar: currentUser
      }

      const updatedIngredients = [...ingrediensar, updatedIngredient]
      setIngrediensar(updatedIngredients)
      setNyIngrediens({ namn: "", mengde: 0, eining: "stk", kategori: "Anna", bilde: "/placeholder.svg?height=40&width=40", brukar: null })
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

  const handterOppdaterIngrediens = async () => {
    if (redigeringIngrediens && redigeringIngrediens.id) {
      const { error } = await supabase
        .from('ingredients')
        .update({
          name: redigeringIngrediens.namn,
          amount: redigeringIngrediens.mengde,
          unit: redigeringIngrediens.eining,
          category: redigeringIngrediens.kategori,
          image: redigeringIngrediens.bilde,
          added_by: currentUser?.id
        })
        .eq('id', redigeringIngrediens.id)

      if (error) {
        console.error('Error updating ingredient:', error)
        return
      }

      const updatedIngredients = ingrediensar.map(i => 
        i.id === redigeringIngrediens.id ? { ...redigeringIngrediens, brukar: currentUser } : i
      )
      setIngrediensar(updatedIngredients)
      setRedigeringIngrediens(null)
      setVisLeggTilIngrediens(false)

      await supabase.channel(`room:${sessionCode}`).send({
        type: 'broadcast',
        event: 'ingredients_update',
        payload: { ingredients: updatedIngredients }
      })

      // Update selected ingredients if the edited ingredient was selected
      if (valgteIngrediensar.some(i => i.id === redigeringIngrediens.id)) {
        const updatedSelectedIngredients = valgteIngrediensar.map(i =>
          i.id === redigeringIngrediens.id ? { ...redigeringIngrediens, brukar: currentUser } : i
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
        messages: [{ role: "user", content: `Lag en kreativ oppskrift på norsk med BARE følgende ingredienser, og ikke bruk mer enn de oppgitte mengdene: ${ingrediensListe}. Formater svaret slik: Tittel: [Oppskriftens tittel] Beskrivelse: [Kort beskrivelse av retten] Ingredienser: - [mengde] [enhet] [ingrediens] Fremgangsmåte: 1. [Første steg] 2. [Andre steg] ... Vær kreativ, men bruk BARE de oppgitte ingrediensene og ikke overskrid mengdene. Hvis du ikke bruker hele mengden av en ingrediens, spesifiser det i oppskriften.`.replace(/"/g, '&quot;') }]
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
      const newOppskrift = { tittel, skildring, ingrediensar, steg }
      setOppskrift(newOppskrift)

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
    let indeks = 0
    const intervallId = setInterval(() => {
      setGjeldandeIngrediens(valgteIngrediensar[indeks].namn)
      indeks = (indeks + 1) % valgteIngrediensar.length
    }, 100)
    setTimeout(() => {
      clearInterval(intervallId)
      genererOppskrift()
    }, 3000)
  }

  if (!sessionStarted) return <InitialCard onJoinSession={handleJoinSession} onCreateSession={handleCreateSession} />

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] bg-white flex flex-col items-center justify-center py-4 md:pt-12">
      <div className="w-full max-w-md mx-auto bg-white rounded-[40px] shadow-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
        <div className="h-6 bg-gray-200 rounded-t-[40px] flex items-center justify-center">
          <div className="w-16 h-4 bg-gray-300 rounded-full"></div>
        </div>
        <div className="px-4 py-6 flex-grow overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setShowSessionCode(true)} className="bg-white hover:bg-white">
                <Users className="w-4 h-4 mr-2" />
                Del økt
              </Button>
              <h1 className="text-3xl font-bold text-purple-600">PikNik!</h1>
            </div>
            <div className="flex space-x-2">
              {participants.map((participant, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: participant.farge }}>
                        {participant.namn.charAt(0).toUpperCase()}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{participant.namn}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-purple-600">Ingrediensar</h2>
              <Button onClick={() => setVisLeggTilIngrediens(true)} variant="outline" className="text-purple-500 border-purple-500 hover:bg-purple-50" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ingrediensar.map((ingrediens) => (
                <div key={ingrediens.id} className="flex items-center space-x-2">
                  <Checkbox id={ingrediens.id} checked={valgteIngrediensar.some(i => i.id === ingrediens.id)} onCheckedChange={() => handterIngrediensMerking(ingrediens)} className="sr-only" />
                  <label htmlFor={ingrediens.id} className={`flex items-center w-full p-2 rounded-lg shadow-sm transition-colors duration-200 ease-in-out cursor-pointer ${valgteIngrediensar.some(i => i.id === ingrediens.id) ? 'bg-purple-100 border-purple-500' : 'bg-white border-gray-200'} border relative`}>
                    {ingrediens.brukar && (
                      <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full flex items-center justify-center text-white text-[10px]`} style={{ backgroundColor: ingrediens.brukar.farge }}>
                        {ingrediens.brukar.namn.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="w-8 h-8 mr-2 rounded-full bg-gray-200 flex items-center justify-center">
                      {kategoriIkon[ingrediens.kategori]}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-sm">{ingrediens.namn}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        {ingrediens.mengde} {ingrediens.eining}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handterRedigerIngrediens(ingrediens)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handterSlettIngrediens(ingrediens)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white">
            <div className="w-full max-w-md mx-auto">
              <Button onClick={handterBlanding} disabled={valgteIngrediensar.length < 2 || blandar} className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                {blandar ? "Blandar..." : "Bland!"}
              </Button>
            </div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded-b-[40px] flex items-center justify-center">
          <div className="w-32 h-4 bg-gray-300 rounded-full"></div>
        </div>
      </div>
      {blandar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-32 h-32 flex items-center justify-center">
            <div className="text-center animate-bounce">
              {gjeldandeIngrediens}
            </div>
          </div>
        </div>
      )}
      <Dialog open={visLeggTilIngrediens} onOpenChange={setVisLeggTilIngrediens}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{redigeringIngrediens ? 'Rediger ingrediens' : 'Legg til ny ingrediens'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input id="namn" placeholder="Ingrediensnamn" value={redigeringIngrediens ? redigeringIngrediens.namn : nyIngrediens.namn} onChange={(e) => redigeringIngrediens ? setRedigeringIngrediens({...redigeringIngrediens, namn: e.target.value}) : setNyIngrediens({...nyIngrediens, namn: e.target.value})} className="col-span-4" />
            <Select value={redigeringIngrediens ? redigeringIngrediens.kategori : nyIngrediens.kategori} onValueChange={(value: Kategori) => redigeringIngrediens ? setRedigeringIngrediens({...redigeringIngrediens, kategori: value}) : setNyIngrediens({...nyIngrediens, kategori: value})}>
              <SelectTrigger className="col-span-4">
                <SelectValue placeholder="Vel kategori" />
              </SelectTrigger>
              <SelectContent>
                {kategoriar.map((kategori) => (
                  <SelectItem key={kategori} value={kategori}>
                    <div className="flex items-center">
                      {kategoriIkon[kategori]}
                      <span className="ml-2">{kategori}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input id="mengde" type="number" placeholder="Mengde" value={redigeringIngrediens ? redigeringIngrediens.mengde : nyIngrediens.mengde || ""} onChange={(e) => { const value = parseFloat(e.target.value); redigeringIngrediens ? setRedigeringIngrediens({...redigeringIngrediens, mengde: value}) : setNyIngrediens({...nyIngrediens, mengde: value}) }} className="col-span-2" />
            <Select value={redigeringIngrediens ? redigeringIngrediens.eining : nyIngrediens.eining} onValueChange={(value: Eining) => redigeringIngrediens ? setRedigeringIngrediens({...redigeringIngrediens, eining: value}) : setNyIngrediens({...nyIngrediens, eining: value})}>
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Vel eining" />
              </SelectTrigger>
              <SelectContent>
                {einingar.map((eining) => (
                  <SelectItem key={eining} value={eining}>{eining}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={redigeringIngrediens ? handterOppdaterIngrediens : handterLeggTilIngrediens} className="w-full bg-purple-500 hover:bg-purple-600 text-white">
            {redigeringIngrediens ? 'Oppdater ingrediens' : 'Legg til ingrediens'}
          </Button>
        </DialogContent>
      </Dialog>
      {oppskrift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md h-[90vh] flex flex-col bg-white">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="pr-8 truncate">{oppskrift.tittel}</CardTitle>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setTimeout(() => toPDF(), 100)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setOppskrift(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="flex-grow">
              <CardContent ref={targetRef} className="p-6 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">{oppskrift.tittel}</h2>
                <p className="mb-6">{oppskrift.skildring}</p>
                <h3 className="text-xl font-semibold mb-2">Ingrediensar</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediens</TableHead>
                      <TableHead>Mengde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oppskrift.ingrediensar.map((ing, index) => (
                      <TableRow key={index}>
                        <TableCell>{ing.namn}</TableCell>
                        <TableCell>{ing.mengde} {ing.eining}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <h3 className="text-xl font-semibold mt-6 mb-2">Framgangsmåte</h3>
                <ol className="list-decimal list-inside">
                  {oppskrift.steg.map((steg, index) => (
                    <li key={index} className="mb-2">{steg}</li>
                  ))}
                </ol>
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      )}
      <div className="fixed bottom-4 left-4 z-50 flex space-x-2">
        <Button variant="outline" size="icon" onClick={toggleMute}>
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={() => setShowInfo(true)}>
          <Info className="h-4 w-4" />
        </Button>
      </div>
      <Dialog open={showSessionCode} onOpenChange={setShowSessionCode}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Del økt</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-2xl font-bold">{sessionCode}</p>
            <p className="text-center mt-2">Del denne koden med andre for å bli med i økta di.</p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Om PikNik</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>PikNik er en interaktiv matlagingsapp der brukere kan samarbeide i sanntid for å lage kreative oppskrifter basert på ingrediensene de har.</p>
            <h3 className="font-semibold mt-4 mb-2">Slik bruker du PikNik:</h3>
            <ol className="list-decimal list-inside">
              <li>Legg til ingredienser du har tilgjengelig</li>
              <li>Velg ingrediensene du vil bruke i oppskriften</li>
              <li>Trykk på "Bland!" for å generere en unik oppskrift</li>
              <li>Del oppskriften med vennene dine eller last den ned</li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}