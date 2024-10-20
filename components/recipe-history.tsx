import React, { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Oppskrift } from './piknik'

interface RecipeHistoryProps {
  isOpen: boolean
  onClose: () => void
  recipes: Oppskrift[]
  onSelectRecipe: (recipe: Oppskrift) => void
}

export default function RecipeHistory({ isOpen, onClose, recipes, onSelectRecipe }: RecipeHistoryProps) {
  useEffect(() => {
    console.log('RecipeHistory rendered with recipes:', recipes)
  }, [recipes])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Oppskrifthistorikk</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          {recipes.length === 0 ? (
            <p className="text-center text-gray-500">Ingen oppskrifter ennå.</p>
          ) : (
            recipes.map((recipe, index) => (
              <div key={recipe.id || index} className="mb-4 p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg mb-1">{recipe.tittel}</h3>
                <p className="text-sm text-gray-500 mb-2">{new Date(recipe.dato).toLocaleString('no-NO', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</p>
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{recipe.skildring}</p>
                <Button 
                  onClick={() => onSelectRecipe(recipe)} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Vis oppskrift
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}