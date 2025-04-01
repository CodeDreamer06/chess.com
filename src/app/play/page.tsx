'use client'

import dynamic from 'next/dynamic'
import { useGameStore } from '@/store/useGameStore'
import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from "next-auth/react"
import { useRouter } from 'next/navigation'

// Dynamically import ChessBoard as it likely uses browser APIs (like react-dnd)
const ChessBoard = dynamic(() => import('@/components/chess/ChessBoard'), {
  ssr: false,
})

let socketInstance: Socket | null = null; // Renamed to avoid conflict

export default function PlayPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { history, reset, applyOpponentMove } = useGameStore()
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('Connecting...');
  const [isGameStarted, setIsGameStarted] = useState(false);

  const handleJoinRoom = useCallback(() => {
    if (inputRoomId.trim() && socketInstance && session?.user?.id) {
      console.log(`Attempting to join room: ${inputRoomId} as user: ${session.user.id}`)
      socketInstance.emit('join_room', { roomId: inputRoomId.trim(), userId: session.user.id });
      setGameStatus(`Joining room ${inputRoomId}...`);
    }
  }, [inputRoomId, session]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/play");
    }
  }, [sessionStatus, router]);

  // Socket initialization and event listeners
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      socketInstance = io(window.location.origin, { path: "/socket.io" });

      socketInstance.on('connect', () => {
        console.log('🔌 Connected:', socketInstance?.id);
        setIsConnected(true);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('👋 Disconnected:', reason);
        setIsConnected(false);
        setGameStatus('Disconnected. Please refresh.');
        setPlayerColor(null);
        setIsGameStarted(false);
        setRoomId('');
      });

      socketInstance.on('connect_error', (err) => {
          console.error('Connection error:', err);
          setIsConnected(false);
          setGameStatus('Connection failed. Please refresh.');
      });

      socketInstance.on('assign_color', (color: 'w' | 'b') => {
        console.log(`Assigned color: ${color}`);
        setPlayerColor(color);
        setRoomId(inputRoomId.trim()); // Room joined successfully
        setGameStatus(color === 'w' ? 'Waiting for opponent... (You are White)' : 'Joined as Black. Waiting for game to start...');
      });

      socketInstance.on('room_status', (message: string) => {
          console.log('Room Status:', message);
          setGameStatus(message);
      });

      socketInstance.on('game_start', (data: { roomId: string, players: Record<string, 'w' | 'b'>, message: string }) => {
          console.log('Game Start:', data);
          setGameStatus(data.message);
          setIsGameStarted(true);
          setPlayerColor(data.players[socketInstance?.id || ''] || null);
          reset(); 
      });

      socketInstance.on('room_full', (message: string) => {
          console.log('Room Full:', message);
          setGameStatus(message + " Try a different Room ID.");
      });

      socketInstance.on('opponent_disconnected', (message: string) => {
          console.log('Opponent Disconnected:', message);
          setGameStatus(message + " Game over.");
          setIsGameStarted(false);
      });

      // --- Move Listener --- 
      socketInstance.on('move_made', (moveData: { from: string, to: string, fen: string }) => {
          console.log('Move received from server:', moveData);
          // Apply the move using the FEN string for synchronization
          applyOpponentMove(moveData.fen);
      });

      // Set initial game status after potential connection
      setGameStatus('Enter a Room ID to join or create a game.')

      return () => {
        if(socketInstance) {
          console.log("Disconnecting socket...")
          socketInstance.disconnect();
          socketInstance = null;
          setIsConnected(false);
        }
      };
    }
  }, [sessionStatus, inputRoomId, reset, applyOpponentMove]); 

  if (sessionStatus === "loading") {
    return <p>Loading session...</p>;
  }

  return (
    <div className="container mx-auto flex min-h-full flex-col items-center px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Play Chess Online</h1>
      <p className="mb-2 text-sm">
        Status: {isConnected ? <span className="text-green-500">Connected</span> : <span className="text-red-500">Disconnected</span>}
        {playerColor && <span className="ml-4">Playing as: {playerColor === 'w' ? 'White' : 'Black'}</span>}
        {roomId && <span className="ml-4">Room: {roomId}</span>}
      </p>
      <p className="mb-4 text-lg font-medium text-gray-700 dark:text-gray-300">{gameStatus}</p>
      
      {sessionStatus === "authenticated" && !isGameStarted && (
        <div className="mb-4 flex items-center gap-2">
          <input 
            type="text" 
            value={inputRoomId} 
            onChange={(e) => setInputRoomId(e.target.value)} 
            placeholder="Enter Room ID"
            className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            disabled={!isConnected || !!roomId}
          />
          <button 
            onClick={handleJoinRoom} 
            disabled={!inputRoomId.trim() || !isConnected || !!roomId || !session?.user?.id}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Join / Create Room
          </button>
        </div>
      )}

      {sessionStatus === "authenticated" && (isGameStarted || roomId) && (
        <div className="flex w-full max-w-4xl flex-row justify-center gap-8">
          {/* Chess Board */} 
          <div className="w-auto">
             {/* Pass socket and roomId as props */} 
            <ChessBoard 
              socket={socketInstance} 
              roomId={roomId} 
              playerColor={playerColor}
            /> 
          </div>

          {/* Game Info Panel */} 
          <div className="flex w-64 flex-col">
            {/* Move History */} 
            <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-200">Move History</h2>
            <div className="mb-4 h-[600px] flex-grow overflow-y-auto rounded border border-gray-300 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
              <ol className="list-decimal list-inside space-y-1">
                {history.map((move, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    {index % 2 === 0 && `${Math.floor(index / 2) + 1}. `}
                    {move}
                  </li>
                ))}
              </ol>
            </div>
            
            {/* Reset Button (Local Reset) */} 
            <button 
              onClick={reset} 
              className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
            >
              Reset Local Board
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 