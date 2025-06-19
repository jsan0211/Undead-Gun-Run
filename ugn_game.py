import pygame
import sys
import math
import random


# Initialize Pygame and sound
pygame.init()
pygame.mixer.init()

# Load gunshot sound (make sure gunshot.wav is in same folder)
gunshot_sound = pygame.mixer.Sound("gunshot.wav")
zombie_hit_sound = pygame.mixer.Sound("zombie_hit.wav")


# Game window
screen = pygame.display.set_mode((1600, 1200))
clock = pygame.time.Clock()

# Player setup
x = 800
y = 600
speed = 5
player_width = 50
player_height = 50

# Bullet setup
bullets = []
bullet_speed = 10
bullet_width = 5
bullet_height = 5

# Zombies setup
zombies = [
    {
    "x": 200,
    "y": 100,
    "speed": random.uniform(0.5, 1.5)
    }
]
zombie_size = 50

zombie_spawn_timer = 0
zombie_spawn_delay = 2000  # spawn every 2000 ms (2 seconds)


# Game loop
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        # Shoot on mouse click
        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_x, mouse_y = pygame.mouse.get_pos()

            # Calculate direction from player to mouse
            dx = mouse_x - (x + player_width // 2)
            dy = mouse_y - (y + player_height // 2)
            distance = math.hypot(dx, dy)
            if distance == 0:
                distance = 1
            dx /= distance
            dy /= distance

            # Create bullet
            bullets.append({
                "x": x + player_width // 2,
                "y": y + player_height // 2,
                "dx": dx,
                "dy": dy
            })

            # Play shooting sound
            gunshot_sound.play()

    # Player movement (WASD)
    keys = pygame.key.get_pressed()
    if keys[pygame.K_a]:
        x -= speed
    if keys[pygame.K_d]:
        x += speed
    if keys[pygame.K_w]:
        y -= speed
    if keys[pygame.K_s]:
        y += speed

    # Move bullets
    for bullet in bullets:
        bullet["x"] += bullet["dx"] * bullet_speed
        bullet["y"] += bullet["dy"] * bullet_speed

    # Remove off-screen bullets
    bullets = [b for b in bullets if 0 < b["x"] < 1600 and 0 < b["y"] < 1200]

    # Move zombies toward player
    for zombie in zombies:
        dx = (x + player_width // 2) - (zombie["x"] + zombie_size // 2)
        dy = (y + player_height // 2) - (zombie["y"] + zombie_size // 2)
        dist = math.hypot(dx, dy)
        if dist != 0:
            dx /= dist
            dy /= dist
        zombie["x"] += dx * zombie["speed"]
        zombie["y"] += dy * zombie["speed"]

    # Build bullet rectangles for collision
    bullet_rects = [pygame.Rect(b["x"], b["y"], bullet_width, bullet_height) for b in bullets]

    # Bullet-zombie collision
    new_zombies = []
    for zombie in zombies:
        zombie_rect = pygame.Rect(zombie["x"], zombie["y"], zombie_size, zombie_size)
        hit = False
        for bullet in bullet_rects:
            if zombie_rect.colliderect(bullet):
                hit = True
                zombie_hit_sound.play()
                break
        if not hit:
            new_zombies.append(zombie)
    zombies = new_zombies

    # === DRAW SECTION ===
    screen.fill((0, 0, 0))  # Clear screen first

    # Draw player
    pygame.draw.rect(screen, (255, 0, 0), (x, y, player_width, player_height))

    # Draw zombies
    for zombie in zombies:
        pygame.draw.rect(screen, (150, 75, 0), (zombie["x"], zombie["y"], zombie_size, zombie_size))

    # Draw bullets
    for bullet in bullets:
        pygame.draw.rect(screen, (255, 255, 0), (bullet["x"], bullet["y"], bullet_width, bullet_height))

    pygame.display.flip()
    clock.tick(60)

    zombie_spawn_timer += clock.get_time()
    if zombie_spawn_timer >= zombie_spawn_delay:
        zombie_spawn_timer = 0
        spawn_x = random.choice([0, 1600])
        spawn_y = random.randint(0, 1200)
        zombies.append({
            "x": spawn_x,
            "y": spawn_y,
            "speed": random.uniform(0.5, 1.5)
        })

