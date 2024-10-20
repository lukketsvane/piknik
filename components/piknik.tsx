'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Users, Volume2, VolumeX, Info, Trophy, Plus, LogOut, Share2 } from 'lucide-react'
import { InitialCard } from './initial-card'
import { IngredientList } from './ingredient-list'
import { RecipeModal } from './recipe-modal'
import { RecipeHistory } from './recipe-history'
import { AddIngredientDialog } from './add-ingredient-dialog'
import { UserAvatar } from './user-avatar'
import { useSession } from '@/hooks/use-session'
import { useIngredients } from '@/hooks/use-ingredients'
import { useRecipes } from '@/hooks/use-recipes'
import { useAudio } from '@/hooks/use-audio'
import { QRCodeSVG } from 'qrcode.react'

export type Eining = 'g' | 'kg' | 'ml' | 'l' | 'stk' | 'ss' | 'ts'

export type Kategori = 'Frukt' | 'Grønsaker' | 'Meieri' | 'Fisk' | 'Bakevarer' | 'Kjøt' | 'Anna'

export interface Ingrediens {
  id?: string
  namn: string
  mengde: number
  eining: Eining
  kategori: Kategori
  bilde: string
  brukar: { id: string; namn: string; farge: string } | null
}

export interface Oppskrift {
  id?: string
  tittel: string
  skildring: string
  ingrediensar: Ingrediens[]
  steg: string[]
  dato: string
  sessionCode?: string
}

const cuisineOptions = [
  'Norsk', 'Italiensk', 'Fransk', 'Spansk', 'Gresk', 'Tyrkisk', 'Indisk', 
  'Kinesisk', 'Japansk', 'Thai', 'Vietnamesisk', 'Meksikansk', 'Amerikansk'
]

export default function Piknik({ sessionCode: initialSessionCode }: { sessionCode?: string }) {
  const router = useRouter()
  const [showSessionCode, setShowSessionCode] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showRecipeHistory, setShowRecipeHistory] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [username, setUsername] = useState('')
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [isChildFriendly, setIsChildFriendly] = useState(false)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  const {
    sessionStarted,
    sessionCode,
    currentUser,
    participants,
    handleCreateSession,
    handleJoinSession,
    handleStopSession
  } = useSession(initialSessionCode)

  const {
    ingrediensar,
    valgteIngrediensar,
    handterIngrediensMerking,
    handterLeggTilIngrediens,
    handterRedigerIngrediens,
    handterSlettIngrediens,
    visLeggTilIngrediens,
    setVisLeggTilIngrediens,
    redigeringIngrediens
  } = useIngredients(sessionCode, currentUser)

  const {
    oppskrift,
    setOppskrift,
    blandar,
    setBlandar,
    handterBlanding,
    recipeHistory,
    fetchRecipeHistory
  } = useRecipes(sessionCode, valgteIngrediensar, selectedCuisines, isChildFriendly, isAdvancedMode)

  const { isMuted, toggleMute } = useAudio(sessionStarted, blandar)

  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialSessionCode && !sessionStarted) {
      setShowJoinDialog(true)
    }
  }, [initialSessionCode, sessionStarted])

  useEffect(() => {
    if (sessionStarted && sessionCode) {
      router.push(`/${sessionCode}`)
      fetchRecipeHistory()
    }
  }, [sessionStarted, sessionCode, router, fetchRecipeHistory])

  useEffect(() => {
    console.log('Current recipe history:', recipeHistory)
  }, [recipeHistory])

  const handleJoinWithUsername = async () => {
    if (initialSessionCode && username) {
      await handleJoinSession(username, initialSessionCode)
      setShowJoinDialog(false)
    }
  }

  const handleQuitSession = async () => {
    await handleStopSession()
    router.push('/')
    setShowSessionCode(false)
  }

  const handleCuisineChange = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    )
  }

  if (!sessionStarted) {
    if (showJoinDialog) {
      return (
        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bli med i økta</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Skriv inn brukernavnet ditt"
                className="w-full p-2 border rounded"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleJoinWithUsername} disabled={!username} className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                Bli med
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    }
    return <InitialCard onJoinSession={handleJoinSession} onCreateSession={handleCreateSession} />
  }

  const shareUrl = `https://piknik.iverfinne.no/${sessionCode}`

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
                <Share2 className="w-4 h-4 mr-2" />
                Del økt
              </Button>
              <h1 className="text-3xl font-bold text-purple-600">PikNik!</h1>
            </div>
            <div className="flex space-x-2">
              {participants.map((participant) => (
                <UserAvatar key={participant.id} name={participant.namn} color={participant.farge} />
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-purple-600">Ingrediensar</h2>
            <Button onClick={() => setVisLeggTilIngrediens(true)} variant="outline" className="text-purple-500 border-purple-500  hover:bg-purple-50" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <IngredientList
            ingrediensar={ingrediensar}
            valgteIngrediensar={valgteIngrediensar}
            onIngrediensMerking={handterIngrediensMerking}
            onRedigerIngrediens={handterRedigerIngrediens}
            onSlettIngrediens={handterSlettIngrediens}
          />
        </div>
        <div className="h-6 bg-gray-200 rounded-b-[40px] flex items-center justify-center">
          <div className="w-32 h-4 bg-gray-300 rounded-full"></div>
        </div>
      </div>
      <div className="fixed bottom-4 left-0 right-0 p-4 bg-white">
        <div className="w-full max-w-md mx-auto">
          <Button onClick={handterBlanding} disabled={valgteIngrediensar.length < 2 || blandar} className="w-full bg-purple-500 hover:bg-purple-600 text-white">
            {blandar ? "Blandar..." : "Bland!"}
          </Button>
        </div>
      </div>
      {blandar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-64 h-64 flex items-center justify-center">
            <Image src="/running.gif" alt="Loading" width={200} height={200} />
          </div>
        </div>
      )}
      {oppskrift && (
        <RecipeModal oppskrift={oppskrift} onClose={() => setOppskrift(null)} toPDF={() => {}} targetRef={targetRef} />
      )}
      <div className="fixed bottom-4 left-4 z-50 flex space-x-2">
        <Button variant="outline" size="icon" onClick={toggleMute}>
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={() => setShowInfo(true)}>
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setShowRecipeHistory(true)}>
          <Trophy className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleQuitSession}>
          <LogOut className="h-4 w-4" />
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
            <div className="mt-4 flex justify-center">
              <QRCodeSVG value={shareUrl} size={200} />
            </div>
            <p className="text-center mt-4">
              <a href={shareUrl} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                {shareUrl}
              </a>
            </p>
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Velg kjøkken:</h3>
              <div className="grid grid-cols-2 gap-2">
                {cuisineOptions.map((cuisine) => (
                  <div key={cuisine} className="flex items-center">
                    <Checkbox
                      id={`cuisine-${cuisine}`}
                      checked={selectedCuisines.includes(cuisine)}
                      onCheckedChange={() => handleCuisineChange(cuisine)}
                    />
                    <Label htmlFor={`cuisine-${cuisine}`} className="ml-2">
                      {cuisine}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Label htmlFor="child-friendly" className="text-sm font-medium">
                Barnevennlig oppskrift
              </Label>
              <Switch
                id="child-friendly"
                checked={isChildFriendly}
                onCheckedChange={setIsChildFriendly}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Label htmlFor="advanced-mode" className="text-sm font-medium">
                Avansert modus (inkluderer krydder)
              </Label>
              <Switch
                id="advanced-mode"
                checked={isAdvancedMode}
                onCheckedChange={setIsAdvancedMode}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleQuitSession} variant="destructive">
              Avslutt økt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Om PikNik</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>PikNik er en interaktiv matlagingsapp der brukere kan samarbeide i sanntid for å lage kreative oppskrifter basert på ingrediensene de  har.</p>
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
      <RecipeHistory
        isOpen={showRecipeHistory}
        onClose={() => setShowRecipeHistory(false)}
        recipes={recipeHistory}
        onSelectRecipe={(recipe) => setOppskrift(recipe)}
      />
      <AddIngredientDialog
        isOpen={visLeggTilIngrediens}
        onClose={() => setVisLeggTilIngrediens(false)}
        onAddIngredient={handterLeggTilIngrediens}
        ingrediensToEdit={redigeringIngrediens}
        onUpdateIngredient={handterRedigerIngrediens}
      />
    </div>
  )
}