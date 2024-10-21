import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Oppskrift } from './piknik'
import { ArrowLeft, ChevronRight } from 'lucide-react'

interface RecipeHistoryProps {
  isOpen: boolean
  onClose: () => void
  recipes: Oppskrift[]
  onSelectRecipe: (recipe: Oppskrift) => void
}

export default function RecipeHistory({ isOpen, onClose, recipes, onSelectRecipe }: RecipeHistoryProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Oppskrift | null>(null)

  useEffect(() => {
    console.log('RecipeHistory rendered with recipes:', recipes)
  }, [recipes])

  const handleSelectRecipe = (recipe: Oppskrift) => {
    setSelectedRecipe(recipe)
  }

  const handleReturn = () => {
    setSelectedRecipe(null)
  }

  const handleUseRecipe = () => {
    if (selectedRecipe) {
      onSelectRecipe(selectedRecipe)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedRecipe ? (
              <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={handleReturn} className="mr-2 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedRecipe.tittel}
              </div>
            ) : (
              'Oppskrifthistorikk'
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          {selectedRecipe ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                {new Date(selectedRecipe.dato).toLocaleString('no-NO', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
              <p className="text-sm text-gray-700 mb-4">{selectedRecipe.skildring}</p>
              <h4 className="font-semibold mb-2">Ingredienser:</h4>
              <ul className="list-disc list-inside mb-4">
                {selectedRecipe.ingrediensar.map((ingrediens, index) => (
                  <li key={index} className="text-sm">
                    {ingrediens.mengde} {ingrediens.eining} {ingrediens.namn}
                  </li>
                ))}
              </ul>
              <h4 className="font-semibold mb-2">Fremgangsmåte:</h4>
              <ol className="list-decimal list-inside mb-4">
                {selectedRecipe.steg.map((steg, index) => (
                  <li key={index} className="text-sm mb-2">{steg}</li>
                ))}
              </ol>
              <Button onClick={handleUseRecipe} className="w-full">Bruk denne oppskriften</Button>
            </div>
          ) : recipes.length === 0 ? (
            <p className="text-center text-gray-500">Ingen oppskrifter ennå.</p>
          ) : (
            recipes.map((recipe, index) => (
              <div 
                key={recipe.id || index} 
                className="mb-2 p-2 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center"
                onClick={() => handleSelectRecipe(recipe)}
              >
                <div>
                  <h3 className="font-semibold text-sm mb-1">{recipe.tittel}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(recipe.dato).toLocaleString('no-NO', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}