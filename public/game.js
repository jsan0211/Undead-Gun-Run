const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1600;
canvas.height = 1200;

// Local player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
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

// Input
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

document.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const startX = player.x + player.width / 2;
    const startY = player.y + player.height / 2;

    const dx = mouseX - startX;
    const dy = mouseY - startY;
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

    for (let zombie of zombies) {
        const dx = (player.x + player.width / 2) - (zombie.x + zombieSize / 2);
        const dy = (player.y + player.height / 2) - (zombie.y + zombieSize / 2);
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            zombie.x += (dx / dist) * zombie.speed;
            zombie.y += (dy / dist) * zombie.speed;
        }
    }

    bullets.forEach((b, i) => {
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    });

    remoteBullets.forEach((b, i) => {
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            remoteBullets.splice(i, 1);
        }
    });

    socket.emit("playerMove", { x: player.x, y: player.y });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Local player
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Remote players
    ctx.fillStyle = "green";
    for (const id in remotePlayers) {
        const p = remotePlayers[id];
        ctx.fillRect(p.x, p.y, player.width, player.height);
    }

    // Local bullets
    ctx.fillStyle = "yellow";
    for (const bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bulletSize, bulletSize);
    }

    // Remote bullets
    ctx.fillStyle = "orange";
    for (const bullet of remoteBullets) {
        ctx.fillRect(bullet.x, bullet.y, bulletSize, bulletSize);
    }

    ctx.fillStyle = "brown";
    for (let z of zombies) {
        ctx.fillRect(z.x, z.y, zombieSize, zombieSize);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
