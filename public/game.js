const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1600;
canvas.height = 1200;

const worldWidth = 5000;
const worldHeight = 5000;

// Local player
const player = {
    x: worldWidth / 2,
    y: worldHeight / 2,
    width: 50,
    height: 50,
    speed: 5
};

const zombies = [];
const zombieSize = 50;

const bullets = [];
const remoteBullets = [];
const bulletSpeed = 10;
const bulletSize = 5;

const remotePlayers = {};
const keys = {};

// Socket connection
const socket = io();

socket.on("currentPlayers", (players) => {
    for (const id in players) {
        if (id !== socket.id) {
            remotePlayers[id] = players[id];
        }
    }
});

socket.on("newPlayer", (data) => {
    remotePlayers[data.id] = { x: data.x, y: data.y };
});

socket.on("playerMoved", (data) => {
    if (remotePlayers[data.id]) {
        remotePlayers[data.id].x = data.x;
        remotePlayers[data.id].y = data.y;
    }
});

socket.on("playerDisconnected", (id) => {
    delete remotePlayers[id];
});

socket.on("existingZombies", (serverZombies) => {
    zombies.push(...serverZombies);
});

socket.on("spawnZombie", (z) => {
    zombies.push(z);
});

socket.on("zombieRemoved", (id) => {
    const i = zombies.findIndex(z => z.id === id);
    if (i !== -1) zombies.splice(i, 1);
});

socket.on("remoteBullet", (data) => {
    remoteBullets.push({
        x: data.x,
        y: data.y,
        dx: data.dx,
        dy: data.dy
    });
});

socket.on("zombiePositions", (serverZombies) => {
    zombies.length = 0;
    zombies.push(...serverZombies);
});

// Input
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

document.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldMouseX = mouseX - canvas.width / 2 + player.x;
    const worldMouseY = mouseY - canvas.height / 2 + player.y;

    const startX = player.x + player.width / 2;
    const startY = player.y + player.height / 2;

    const dx = worldMouseX - startX;
    const dy = worldMouseY - startY;
    const dist = Math.hypot(dx, dy);
    const normX = dx / dist;
    const normY = dy / dist;

    bullets.push({ x: startX, y: startY, dx: normX, dy: normY });

    socket.emit("shootBullet", {
        x: startX,
        y: startY,
        dx: normX,
        dy: normY
    });
});

function update() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // Constrain player to world bounds
    player.x = Math.max(0, Math.min(player.x, worldWidth - player.width));
    player.y = Math.max(0, Math.min(player.y, worldHeight - player.height));

    for (let bullet of bullets) {
        bullet.x += bullet.dx * bulletSpeed;
        bullet.y += bullet.dy * bulletSpeed;
    }

    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        const zr = { x: z.x, y: z.y, w: zombieSize, h: zombieSize };

        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            const br = { x: b.x, y: b.y, w: bulletSize, h: bulletSize };

            const hit = (
                br.x < zr.x + zr.w &&
                br.x + br.w > zr.x &&
                br.y < zr.y + zr.h &&
                br.y + br.h > zr.y
            );

            if (hit) {
                socket.emit("zombieHit", z.id);
                bullets.splice(j, 1);
                break;
            }
        }
    }

    bullets.forEach((b, i) => {
        if (b.x < 0 || b.x > worldWidth || b.y < 0 || b.y > worldHeight) {
            bullets.splice(i, 1);
        }
    });

    remoteBullets.forEach((b, i) => {
        if (b.x < 0 || b.x > worldWidth || b.y < 0 || b.y > worldHeight) {
            remoteBullets.splice(i, 1);
        }
    });

    socket.emit("playerMove", { x: player.x, y: player.y });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = canvas.width / 2 - player.x;
    const offsetY = canvas.height / 2 - player.y;

    ctx.fillStyle = "red";
    ctx.fillRect(canvas.width / 2, canvas.height / 2, player.width, player.height);

    ctx.fillStyle = "green";
    for (const id in remotePlayers) {
        const p = remotePlayers[id];
        ctx.fillRect(p.x + offsetX, p.y + offsetY, player.width, player.height);
    }

    ctx.fillStyle = "yellow";
    for (const bullet of bullets) {
        ctx.fillRect(bullet.x + offsetX, bullet.y + offsetY, bulletSize, bulletSize);
    }

    ctx.fillStyle = "orange";
    for (const bullet of remoteBullets) {
        ctx.fillRect(bullet.x + offsetX, bullet.y + offsetY, bulletSize, bulletSize);
    }

    ctx.fillStyle = "brown";
    for (let z of zombies) {
        ctx.fillRect(z.x + offsetX, z.y + offsetY, zombieSize, zombieSize);

        // Optional: draw detection radius
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.beginPath();
        ctx.arc(z.x + offsetX + zombieSize / 2, z.y + offsetY + zombieSize / 2, 300, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
