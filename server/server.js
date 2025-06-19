const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));


// Track players by socket ID
const players = {};

const zombies = [];
const zombieSize = 50;

// Spawn a zombie every 5 seconds
setInterval(() => {
    const zombie = {
        id: Date.now(), // unique ID
        x: Math.random() * 1600,
        y: Math.random() * 1200,
        speed: 0.5 + Math.random(),
    };
    zombies.push(zombie);
    io.emit("spawnZombie", zombie);
}, 5000);


io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    players[socket.id] = {
        x: 800,
        y: 600
    };

    // Send current zombies to new player
    socket.emit("existingZombies", zombies);

    // Handle zombie hit from a player
    socket.on("zombieHit", (id) => {
        const index = zombies.findIndex(z => z.id === id);
        if (index !== -1) {
            zombies.splice(index, 1);
            io.emit("zombieRemoved", id);
        }
    });

    socket.emit("currentPlayers", players);
    socket.broadcast.emit("newPlayer", { id: socket.id, ...players[socket.id] });

    socket.on("playerMove", (pos) => {
        if (players[socket.id]) {
            players[socket.id].x = pos.x;
            players[socket.id].y = pos.y;
            socket.broadcast.emit("playerMoved", { id: socket.id, ...pos });
        }
    });

    socket.on("shootBullet", (bulletData) => {
        socket.broadcast.emit("remoteBullet", {
            id: socket.id,
            ...bulletData
        });
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id];
        io.emit("playerDisconnected", socket.id);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log("Server running on port 3000");
});
