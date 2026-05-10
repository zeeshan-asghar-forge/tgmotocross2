const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let currentLevelIndex = 0;
let worldX = 100;
let worldY = 100;
let velX = 0;
let velY = 0;
let rotation = 0;
let cameraX = 0;
let cameraY = 0;

// Constants from maps.js (loaded via global window)
const TILE_SIZE = window.TILE_SIZE || 32;
const trackSizes = window.trackSizes || [[600, 3000]];
const tileMaps = window.tileMaps || [[]];
const F9Fe = window.F9Fe || [];

// Input
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function getLevelMap() {
    return tileMaps[currentLevelIndex];
}

function getLevelSize() {
    const size = trackSizes[currentLevelIndex];
    // trackSizes is [height, width] in pixels
    return { height: size[0], width: size[1] };
}

/**
 * Returns the ground Y at a specific world X.
 * If no ground is found, returns a very large value.
 */
function getGroundHeight(x, y) {
    const map = getLevelMap();
    if (!map) return 10000;

    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);

    // Check current tile and neighbors if needed, but usually we just care about the column
    // and vertical segments.
    // To be thorough, we can check multiple vertical tiles in that column.
    
    let groundY = 10000;

    // Check all tiles in this column for the closest ground below 'y'
    for (let row = 0; row < map.length; row++) {
        const tileID = map[row][tx];
        if (tileID === undefined) continue;
        
        const segments = F9Fe[tileID];
        if (!segments || segments.length === 0) continue;

        const tileWorldX = tx * TILE_SIZE;
        const tileWorldY = row * TILE_SIZE;
        const relX = x - tileWorldX;

        for (let i = 0; i < segments.length; i += 5) {
            const x1 = segments[i];
            const y1 = segments[i+1];
            const x2 = segments[i+2];
            const y2 = segments[i+3];

            // Check if relX is within segment X bounds
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);

            if (relX >= minX && relX <= maxX) {
                // Interpolate Y
                let segmentY;
                if (maxX === minX) {
                    segmentY = Math.min(y1, y2);
                } else {
                    const t = (relX - x1) / (x2 - x1);
                    segmentY = y1 + t * (y2 - y1);
                }
                
                const worldSegmentY = tileWorldY + segmentY;
                // If this is below our current Y and closer than previous found ground
                if (worldSegmentY >= y - 10 && worldSegmentY < groundY) {
                    groundY = worldSegmentY;
                }
            }
        }
    }

    return groundY;
}

function update(dt) {
    // Gravity
    velY += 0.4;

    // Movement
    if (keys['ArrowRight']) velX += 0.5;
    if (keys['ArrowLeft']) velX -= 0.5;
    if (keys['ArrowUp']) velY -= 0.2; // Small lift for testing

    // Friction
    velX *= 0.98;
    velY *= 0.99;

    worldX += velX;
    worldY += velY;

    // Collision
    const groundY = getGroundHeight(worldX, worldY);
    if (worldY > groundY) {
        worldY = groundY;
        velY = 0;
        // Basic friction on ground
        velX *= 0.95;
    }

    // Boundaries
    const size = getLevelSize();
    if (worldX < 50) worldX = 50;
    if (worldX > size.width - 50) worldX = size.width - 50;

    // Camera follow
    cameraX = worldX - canvas.width / 2;
    cameraY = worldY - canvas.height * 0.7;

    // Clamp camera
    if (cameraX < 0) cameraX = 0;
    if (cameraX > size.width - canvas.width) cameraX = size.width - canvas.width;
    if (cameraY < 0) cameraY = 0;
    if (cameraY > size.height - canvas.height) cameraY = size.height - canvas.height;
    
    // If level is smaller than canvas, center it
    if (size.width < canvas.width) cameraX = (size.width - canvas.width) / 2;
    if (size.height < canvas.height) cameraY = (size.height - canvas.height) / 2;
}

function draw() {
    ctx.fillStyle = '#1a2b4a'; // Sky
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const map = getLevelMap();
    if (!map) return;

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw Tiles
    const startCol = Math.floor(cameraX / TILE_SIZE);
    const endCol = Math.floor((cameraX + canvas.width) / TILE_SIZE) + 1;
    const startRow = Math.floor(cameraY / TILE_SIZE);
    const endRow = Math.floor((cameraY + canvas.height) / TILE_SIZE) + 1;

    for (let row = Math.max(0, startRow); row < Math.min(map.length, endRow); row++) {
        for (let col = Math.max(0, startCol); col < Math.min(map[row].length, endCol); col++) {
            const tileID = map[row][col];
            if (tileID === 0) continue; // Skip empty

            // Draw placeholder for tile
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            
            // Draw collision segments if any
            const segments = F9Fe[tileID];
            if (segments && segments.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = '#4caf50';
                ctx.lineWidth = 2;
                for (let i = 0; i < segments.length; i += 5) {
                    ctx.moveTo(col * TILE_SIZE + segments[i], row * TILE_SIZE + segments[i+1]);
                    ctx.lineTo(col * TILE_SIZE + segments[i+2], row * TILE_SIZE + segments[i+3]);
                }
                ctx.stroke();
            } else {
                // If it's a tile with no collision but exists, draw a small dot
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillText(tileID, col * TILE_SIZE + 2, row * TILE_SIZE + 10);
            }
        }
    }

    // Draw Bike (Placeholder)
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.arc(worldX, worldY - 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function gameLoop() {
    update(1/60);
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
gameLoop();