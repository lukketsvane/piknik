import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Kategori, Eining, Ingrediens } from './piknik'

interface AddIngredientDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddIngredient: (ingredient: Omit<Ingrediens, 'id' | 'brukar'>) => void
}

export function AddIngredientDialog({ isOpen, onClose, onAddIngredient }: AddIngredientDialogProps) {
  const [namn, setNamn] = useState('')
  const [mengde, setMengde] = useState('')
  const [eining, setEining] = useState<Eining>('stk')
  const [kategori, setKategori] = useState<Kategori>('Anna')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddIngredient({
      namn,
      mengde: parseFloat(mengde),
      eining,
      kategori,
      bilde: '/placeholder.svg?height=40&width=40'
    })
    onClose()
    resetForm()
  }

  const resetForm = () => {
    setNamn('')
    setMengde('')
    setEining('stk')
    setKategori('Anna')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Legg til ingrediens</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Ingrediensnavn"
            value={namn}
            onChange={(e) => setNamn(e.target.value)}
            required
          />
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Mengde"
              value={mengde}
              onChange={(e) => setMengde(e.target.value)}
              required
              className="w-1/2"
            />
            <Select value={eining} onValueChange={(value: Eining) => setEining(value)}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Velg enhet" />
              </SelectTrigger>
              <SelectContent>
                {['dl', 'g', 'hg', 'kg', 'stk', 'ss', 'ts'].map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={kategori} onValueChange={(value: Kategori) => setKategori(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Velg kategori" />
            </SelectTrigger>
            <SelectContent>
              {['Frukt', 'Grønsaker', 'Meieri', 'Fisk', 'Bakevarer', 'Kjøt', 'Anna'].map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit">Legg til</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}