import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { Oppskrift } from './piknik'
import RecipeModal from './recipe-modal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface RecipeHistoryProps {
  isOpen: boolean
  onClose: () => void
  sessionCode: string
}

export default function RecipeHistory({ isOpen, onClose, sessionCode }: RecipeHistoryProps) {
  const [recipes, setRecipes] = useState<Oppskrift[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Oppskrift | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRecipes()
    }
  }, [isOpen, sessionCode])

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('session_code', sessionCode)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching recipes:', error)
    } else {
      setRecipes(data)
    }
  }

  const handleRecipeClick = (recipe: Oppskrift) => {
    setSelectedRecipe(recipe)
  }

  const handleBackToList = () => {
    setSelectedRecipe(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedRecipe ? (
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handleBackToList} className="mr-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {selectedRecipe.tittel}
              </div>
            ) : (
              "Siste 50 oppskrifter"
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          {selectedRecipe ? (
            <RecipeModal oppskrift={selectedRecipe} onClose={handleBackToList} />
          ) : (
            <ul className="space-y-2">
              {recipes.map((recipe) => (
                <li key={recipe.id} className="cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={() => handleRecipeClick(recipe)}>
                  <h3 className="font-semibold">{recipe.tittel}</h3>
                  <p className="text-sm text-gray-500">{new Date(recipe.dato).toLocaleDateString()}</p>
                  <p className="text-sm">{recipe.ingrediensar.map(i => i.namn).join(', ').slice(0, 20)}...</p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}