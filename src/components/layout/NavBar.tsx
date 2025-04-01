'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function NavBar() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          ChessClone
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/play" className="hover:text-gray-300">
            Play
          </Link>
          {/* Add other links like Puzzles, Leaderboard here */} 
          
          {status === 'loading' && (
            <span className="text-sm">Loading...</span>
          )}
          {status === 'authenticated' && session?.user && (
            <>
              {/* Profile Link */} 
              <Link href={`/profile/${session.user.id}`} className="flex items-center space-x-2 hover:text-gray-300">
                {session.user.image && (
                  <Image 
                    src={session.user.image} 
                    alt="User avatar" 
                    width={24} 
                    height={24} 
                    className="rounded-full"
                  />
                )}
                <span>{session.user.name || session.user.email}</span>
              </Link>
              <button onClick={() => signOut()} className="rounded bg-red-600 px-3 py-1 text-sm hover:bg-red-700">
                Sign Out
              </button>
            </>
          )}
          {status === 'unauthenticated' && (
            <button onClick={() => signIn()} className="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-700">
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  )
} 