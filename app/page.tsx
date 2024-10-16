import React from 'react'
import Matmix from '@/components/matmix'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-[40px] shadow-lg overflow-hidden">
          <div className="h-6 bg-gray-200 rounded-t-[40px] flex items-center justify-center">
            <div className="w-16 h-4 bg-gray-300 rounded-full"></div>
          </div>
          <div className="p-4">
            <Matmix />
          </div>
          <div className="h-6 bg-gray-200 rounded-b-[40px] flex items-center justify-center">
            <div className="w-32 h-4 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </main>
  )
}