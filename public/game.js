const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const socket = io();  // Connects to the current server automatically

socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);
});


// Canvas dimensions
canvas.width = 1600;
canvas.height = 1200;

// Player setup
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    speed: 5
};

// Bullet setup
const bullets = [];
const bulletSpeed = 10;
const bulletSize = 5;

// Zombie setup
const zombies = [
    { x: 100, y: 100, speed: 1 },
    { x: 1500, y: 1000, speed: 1 }
];

const zombieSize = 50;


// Keyboard input
const keys = {};

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

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

    bullets.push({
        x: startX,
        y: startY,
        dx: normX,
        dy: normY
    });
});


// Game loop
function update() {
    // Player movement
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // Bullet movement
    for (let bullet of bullets) {
        bullet.x += bullet.dx * bulletSpeed;
        bullet.y += bullet.dy * bulletSpeed;
    }

    // Move zombies toward player
    for (let zombie of zombies) {
        const dx = (player.x + player.width / 2) - (zombie.x + zombieSize / 2);
        const dy = (player.y + player.height / 2) - (zombie.y + zombieSize / 2);
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            zombie.x += (dx / dist) * zombie.speed;
            zombie.y += (dy / dist) * zombie.speed;
        }
    }

    // Remove bullets that go off screen
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    ctx.fillStyle = "yellow";
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bulletSize, bulletSize);
    }

    // Draw zombies
    ctx.fillStyle = "brown";
    for (let zombie of zombies) {
        ctx.fillRect(zombie.x, zombie.y, zombieSize, zombieSize);
    }
}


function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
