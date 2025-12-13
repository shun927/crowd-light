const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev/ngrok
        methods: ["GET", "POST"]
    }
});

let connectedClients = 0;

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Identify client type
    socket.on('identify', (type) => { // 'admin' or 'client'
        if (type === 'client') {
            connectedClients++;
            io.emit('client-count', connectedClients);
            console.log(`Client connected. Total: ${connectedClients}`);
        }
    });

    socket.on('disconnect', () => {
        // We don't strictly track if the disconnected socket was a 'client' type easily without storage,
        // but for now let's just decrement if count > 0 or improve logic later.
        // Better: store socket type in socket instance.
        if (socket.data.type === 'client') {
            connectedClients = Math.max(0, connectedClients - 1);
            io.emit('client-count', connectedClients);
            console.log(`Client disconnected. Total: ${connectedClients}`);
        }
        console.log('Disconnected:', socket.id);
    });

    socket.on('register-client', () => {
        socket.data.type = 'client';
        connectedClients++;
        io.emit('client-count', connectedClients);
    });

    socket.on('register-admin', () => {
        socket.data.type = 'admin';
        // Send current count to admin immediately
        socket.emit('client-count', connectedClients);
    });

    // Admin commands
    socket.on('toggle-light', (isOn) => {
        console.log(`Admin toggled light: ${isOn}`);
        // Broadcast to all clients
        io.emit('light-control', isOn);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
