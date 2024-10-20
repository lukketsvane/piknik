import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface InitialCardProps {
  onJoinSession: (username: string, code: string) => void
  onCreateSession: (username: string) => void
}

export const InitialCard: React.FC<InitialCardProps> = ({ onJoinSession, onCreateSession }) => {
  const [username, setUsername] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [isCreatingSession, setIsCreatingSession] = useState(true)

  return (
    <Card className="w-full max-w-md mx-auto mt-20 bg-white relative">
      <CardHeader className="flex flex-col items-center">
        <Image src="/piknik-maskot.png" alt="PikNik Logo" width={200} height={200} />
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