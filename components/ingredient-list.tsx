import React from 'react'
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from 'lucide-react'
import { Ingrediens, Kategori } from '../piknik'

interface IngredientListProps {
  ingrediensar: Ingrediens[]
  valgteIngrediensar: Ingrediens[]
  onIngrediensMerking: (ingrediens: Ingrediens) => void
  onRedigerIngrediens: (ingrediens: Ingrediens) => void
  onSlettIngrediens: (ingrediens: Ingrediens) => void
}

const kategoriIkon: Record<Kategori, string> = {
  Frukt: '🍎',
  Grønsaker: '🥕',
  Meieri: '🧀',
  Fisk: '🐟',
  Bakevarer: '🍞',
  Kjøt: '🥩',
  Anna: '🍽️'
}

export function IngredientList({ ingrediensar, valgteIngrediensar, onIngrediensMerking, onRedigerIngrediens, onSlettIngrediens }: IngredientListProps) {
  return (
    <ul className="space-y-2">
      {ingrediensar.map((ingrediens) => {
        const isSelected = valgteIngrediensar.some(i => i.id === ingrediens.id)
        return (
          <li
            key={ingrediens.id}
            className={`flex items-center p-2 rounded-lg shadow cursor-pointer transition-colors duration-200 ${
              isSelected ? 'bg-purple-100 hover:bg-purple-200' : 'bg-white hover:bg-gray-100'
            }`}
            onClick={() => onIngrediensMerking(ingrediens)}
          >
            <div className="flex items-center flex-grow">
              <div className="w-8 h-8 mr-2 rounded-full bg-gray-200 flex items-center justify-center">
                {kategoriIkon[ingrediens.kategori as Kategori] || '🍽️'}
              </div>
              <div className="flex-grow">
                <div className="font-medium text-sm">{ingrediens.namn}</div>
                <div className="text-xs text-gray-500">{ingrediens.mengde} {ingrediens.eining}</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onRedigerIngrediens(ingrediens); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSlettIngrediens(ingrediens); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}