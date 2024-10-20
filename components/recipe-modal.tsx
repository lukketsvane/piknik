import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, X } from 'lucide-react'

interface Ingrediens {
  namn: string
  mengde: number
  eining: string
}

interface Oppskrift {
  tittel: string
  skildring: string
  ingrediensar: Ingrediens[]
  steg: string[]
}

interface RecipeModalProps {
  oppskrift: Oppskrift
  onClose: () => void
  toPDF: () => void
  targetRef: React.RefObject<HTMLDivElement>
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ oppskrift, onClose, toPDF, targetRef }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="w-full max-w-md h-[90vh] flex flex-col bg-white">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="pr-8 truncate">{oppskrift.tittel}</CardTitle>
            <div className="flex space-x-2 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setTimeout(() => toPDF(), 100)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
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
  )
}