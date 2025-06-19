# Undead Gun Run

Undead Gun Run is a browser-based top-down zombie shooter built with HTML5 Canvas and JavaScript. It features WASD movement, mouse shooting, and basic zombie AI. Originally created with Pygame, it now runs in the browser with a Node.js and Socket.IO server for future multiplayer support.

## Features

- WASD movement
- Mouse-click shooting
- Zombies chase player
- Bullet collision
- LAN-ready multiplayer backend

## How to Run

1. Start the server:

```bash
cd server
node server.js
```

2. Open the game in your browser:
http://localhost:3000

PROJECT STRUCTURE
public/   → Frontend game code
server/   → Node.js + Socket.IO server
legacy/   → Original Python Pygame version
