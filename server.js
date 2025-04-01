const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Simple in-memory store for rooms
// Structure: { roomId: { players: { socketId: { color: 'w'|'b', userId: string }, ... }, game: chessInstance } }
const rooms = {};

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the last argument to `parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    // Optional: Configure CORS if your client is on a different origin
    // cors: {
    //   origin: "*", // Adjust for your frontend URL in production
    //   methods: ["GET", "POST"]
    // }
  });

  io.on('connection', (socket) => {
    console.log('🔌 a user connected:', socket.id);

    socket.on('join_room', ({ roomId, userId }) => {
      console.log(`User ${socket.id} (userId: ${userId}) attempting to join room ${roomId}`);

      const room = rooms[roomId];

      if (!room) {
        rooms[roomId] = { players: {}, game: null }; // Initialize game state later
        rooms[roomId].players[socket.id] = { color: 'w', userId: userId }; // Store userId
        socket.join(roomId);
        console.log(`User ${userId} created room ${roomId} as white.`);
        socket.emit('assign_color', 'w');
        socket.emit('room_status', `Waiting for opponent in room ${roomId}...`);
      } else if (Object.keys(room.players).length === 1) {
        if (Object.values(room.players).some(p => p.userId === userId)) {
            console.log(`User ${userId} already in room ${roomId}.`);
            // Re-establish connection if needed, maybe send current state
            socket.join(roomId); // Rejoin socket room
            const existingPlayer = Object.entries(room.players).find(([_, p]) => p.userId === userId);
            if (existingPlayer) {
                socket.emit('assign_color', existingPlayer[1].color); 
                 // Send game state if started
                // io.to(socket.id).emit('game_state', { fen: rooms[roomId].game?.fen() }); 
            }
            return; 
        }

        rooms[roomId].players[socket.id] = { color: 'b', userId: userId }; // Store userId
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId} as black.`);
        socket.emit('assign_color', 'b');

        // Initialize and store game instance for the room
        // const { Chess } = require("chess.js"); // Lazy require if needed
        // rooms[roomId].game = new Chess(); 
        
        // Notify players game starts
        io.to(roomId).emit('game_start', { 
          roomId: roomId,
          players: room.players,
          message: 'Opponent found! Game starts.',
          // fen: rooms[roomId].game.fen() // Send initial FEN
        });
        console.log(`Game starting in room ${roomId}`);
      } else {
        console.log(`Room ${roomId} is full.`);
        socket.emit('room_full', `Room ${roomId} is currently full.`);
      }
    });

    socket.on('make_move', ({ roomId, moveData }) => {
      const room = rooms[roomId];
      if (!room || !room.players[socket.id]) {
        console.error(`Error: User ${socket.id} tried to make move in room ${roomId} they are not in.`);
        return;
      }
      
      console.log(`Move received from ${socket.id} in room ${roomId}:`, moveData);
      socket.to(roomId).emit('move_made', moveData);
      console.log(`Move broadcasted to room ${roomId}`);
    });

    socket.on('game_over', async ({ roomId, result }) => {
      const room = rooms[roomId];
      if (!room || !room.players[socket.id]) { 
        console.error(`User ${socket.id} reported game over for room ${roomId} they are not in.`);
        return; 
      }

      console.log(`Game over reported for room ${roomId} by ${socket.id}. Result: ${result}`);

      // Prevent duplicate updates if both players report
      if (room.gameOverReported) {
        console.log(`Game over already processed for room ${roomId}`);
        return;
      }
      room.gameOverReported = true; // Mark as processed

      const playerEntries = Object.values(room.players);
      if (playerEntries.length !== 2) {
        console.error(`Cannot update stats for room ${roomId}: Incorrect number of players (${playerEntries.length})`);
        return;
      }
      
      const whitePlayer = playerEntries.find(p => p.color === 'w');
      const blackPlayer = playerEntries.find(p => p.color === 'b');

      if (!whitePlayer || !blackPlayer) {
         console.error(`Cannot find white or black player in room ${roomId}`);
         return;
      }

      try {
        if (result === '1-0') { // White wins
          await prisma.user.update({ where: { id: whitePlayer.userId }, data: { wins: { increment: 1 } } });
          await prisma.user.update({ where: { id: blackPlayer.userId }, data: { losses: { increment: 1 } } });
          console.log(`Stats updated for room ${roomId}: White Wins`);
        } else if (result === '0-1') { // Black wins
          await prisma.user.update({ where: { id: blackPlayer.userId }, data: { wins: { increment: 1 } } });
          await prisma.user.update({ where: { id: whitePlayer.userId }, data: { losses: { increment: 1 } } });
          console.log(`Stats updated for room ${roomId}: Black Wins`);
        } else if (result === '1/2-1/2') { // Draw
          await prisma.user.update({ where: { id: whitePlayer.userId }, data: { draws: { increment: 1 } } });
          await prisma.user.update({ where: { id: blackPlayer.userId }, data: { draws: { increment: 1 } } });
          console.log(`Stats updated for room ${roomId}: Draw`);
        } else {
          console.log(`Unknown result [${result}] for room ${roomId}. No stats updated.`);
        }
        // Optionally: Clean up room after processing?
        // delete rooms[roomId];
      } catch (error) {
        console.error(`Error updating user stats after game over for room ${roomId}:`, error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('👋 user disconnected:', socket.id);
      let disconnectedPlayerId = null;
      let opponentSocketId = null;
      let winningPlayerId = null;
      let roomIdFound = null;

      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerEntry = Object.entries(room.players).find(([id, _]) => id === socket.id);
        if (playerEntry) {
          roomIdFound = roomId;
          const [socketId, player] = playerEntry;
          disconnectedPlayerId = player.userId;
          console.log(`Removing user ${player.userId} (socket: ${socketId}) from room ${roomId}`);
          delete room.players[socketId];

          const remainingPlayers = Object.entries(room.players);
          if (remainingPlayers.length === 1) {
            opponentSocketId = remainingPlayers[0][0];
            winningPlayerId = remainingPlayers[0][1].userId;
            io.to(roomId).emit('opponent_disconnected', `Opponent (${player.userId}) disconnected. You win!`);
          } 

          if (Object.keys(room.players).length === 0) {
            console.log(`Room ${roomId} is now empty, deleting.`);
            delete rooms[roomId];
          }
          break;
        }
      }

      if (roomIdFound && disconnectedPlayerId && winningPlayerId) {
        try {
          console.log(`Updating stats: Winner=${winningPlayerId}, Loser=${disconnectedPlayerId}`);
          if (prisma) {
            await prisma.user.update({ where: { id: winningPlayerId }, data: { wins: { increment: 1 } } });
            await prisma.user.update({ where: { id: disconnectedPlayerId }, data: { losses: { increment: 1 } } });
            console.log('Stats updated successfully.');
          } else {
            console.error('Prisma client not available for stat update.');
          }
        } catch (error) {
          console.error('Error updating user stats after disconnect:', error);
        }
      }
    });

    // --- TODO: Add Chess Game Logic --- 
    // Example: socket.on('join_room', (roomId) => { ... });
    // Example: socket.on('make_move', (moveData) => { ... });

  });

  httpServer
    .once('error', (err) => {
      console.error('HTTP server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server listening on port ${port}`);
    });
}); 