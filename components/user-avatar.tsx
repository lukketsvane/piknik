import React from 'react'

interface UserAvatarProps {
  name: string
  color: string
}

export function UserAvatar({ name, color }: UserAvatarProps) {
  return (
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
      style={{ backgroundColor: color }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}