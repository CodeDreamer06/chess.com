const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Simple in-memory store for rooms
// Structure: { roomId: { players: { socketId: color, ... }, /* other room data */ } }
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

    socket.on('join_room', (roomId) => {
      console.log(`User ${socket.id} attempting to join room ${roomId}`);

      const room = rooms[roomId];

      if (!room) {
        // Create room if it doesn't exist
        rooms[roomId] = { players: {} };
        rooms[roomId].players[socket.id] = 'w'; // First player is white
        socket.join(roomId);
        console.log(`User ${socket.id} created and joined room ${roomId} as white.`);
        socket.emit('assign_color', 'w'); // Assign color to player
        socket.emit('room_status', `Waiting for opponent in room ${roomId}...`);

      } else if (Object.keys(room.players).length === 1) {
        // Join room if one player is waiting
        if (room.players[socket.id]) {
           console.log(`User ${socket.id} already in room ${roomId}.`);
           return; // Already in room
        }
        rooms[roomId].players[socket.id] = 'b'; // Second player is black
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId} as black.`);
        socket.emit('assign_color', 'b'); // Assign color to player

        // Notify both players that the game starts
        const opponentId = Object.keys(room.players).find(id => id !== socket.id);
        io.to(roomId).emit('game_start', { 
          roomId: roomId,
          players: room.players, // Send player assignments
          message: 'Opponent found! Game starts.' 
        });
        console.log(`Game starting in room ${roomId}`);

      } else {
        // Room is full
        console.log(`Room ${roomId} is full. User ${socket.id} cannot join.`);
        socket.emit('room_full', `Room ${roomId} is currently full.`);
      }
    });

    socket.on('make_move', ({ roomId, moveData }) => {
      // Validate if the sender is actually in the specified room
      if (!rooms[roomId] || !rooms[roomId].players[socket.id]) {
        console.error(`Error: User ${socket.id} tried to make move in room ${roomId} they are not in.`);
        // Optionally emit an error back to sender
        return; 
      }
      
      console.log(`Move received from ${socket.id} in room ${roomId}:`, moveData);
      // Broadcast the move to the other player(s) in the room
      socket.to(roomId).emit('move_made', moveData);
      console.log(`Move broadcasted to room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('👋 user disconnected:', socket.id);
      // Find which room the user was in and remove them
      for (const roomId in rooms) {
        if (rooms[roomId].players[socket.id]) {
          console.log(`Removing user ${socket.id} from room ${roomId}`);
          delete rooms[roomId].players[socket.id];
          // Notify remaining player
          io.to(roomId).emit('opponent_disconnected', `Opponent (${socket.id}) disconnected.`);
          // If room is now empty, delete it (optional)
          if (Object.keys(rooms[roomId].players).length === 0) {
            console.log(`Room ${roomId} is now empty, deleting.`);
            delete rooms[roomId];
          }
          break; // Assume user can only be in one room
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