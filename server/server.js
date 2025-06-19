const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve files from ../public
app.use(express.static("../public"));

io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("A player disconnected:", socket.id);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${server.address().port}`);
});



