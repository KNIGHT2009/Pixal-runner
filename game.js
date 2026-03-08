// Pixel Runner - Mobile Optimized Version

// Game variables
let isGameRunning = false;
let isGameOver = false;
let isPaused = false;
let score = 0;
let highScore = 0;
let gameSpeed = 3;
let maxSpeed = 5;
let speedIncrement = 0.1;
let animationId = null;
let obstacles = [];
let obstacleTimeout = null;
let groundElement = null;

// New features
let lives = 3;
let canDoubleJump = false;
let hasDoubleJumped = false;
let combo = 0;
let comboTimer = null;
let invulnerable = false;
let invulnerableTimer = null;
let flashIntervalId = null;

// Audio context - lazily initialized
let audioCtx = null;

// Performance optimization variables
let lastFrameTime = 0;
let lastObstacleUpdate = 0;
const MOBILE_FPS_LIMIT = 60;
const FRAME_TIME = 1000 / MOBILE_FPS_LIMIT;

// Cached player position for collision detection (avoids getBoundingClientRect)
const playerPosition = {
    left: 40,
    bottom: 60,
    width: 35,
    height: 40
};

// DOM Elements
const gameCanvas = document.getElementById('gameCanvas');
const player = document.getElementById('player');
const obstaclesContainer = document.getElementById('obstacles');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// Initialize ground element after DOM is ready
function initGroundElement() {
    groundElement = document.querySelector('.ground');
}

// Create UI elements for new features
function createUI() {
    // Combo display
    if (!document.getElementById('comboContainer')) {
        const comboContainer = document.createElement('div');
        comboContainer.id = 'comboContainer';
        comboContainer.innerHTML = '<span class="combo-label">COMBO</span><span id="combo">x0</span>';
        comboContainer.style.display = 'none';
        document.querySelector('.score-board').appendChild(comboContainer);
    }
    
    // Pause overlay
    if (!document.getElementById('pauseOverlay')) {
        const pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pauseOverlay';
        pauseOverlay.className = 'hidden';
        pauseOverlay.innerHTML = '<div class="pause-text">PAUSED</div><div class="pause-hint">Press P to Resume</div>';
        gameCanvas.appendChild(pauseOverlay);
    }
}

function updateLivesDisplay() {
    const livesEl = document.getElementById('lives');
    if (livesEl) {
        livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    }
}

function updateComboDisplay() {
    const comboContainer = document.getElementById('comboContainer');
    const comboEl = document.getElementById('combo');
    if (comboContainer && comboEl) {
        if (combo > 1) {
            comboContainer.style.display = 'block';
            comboEl.textContent = 'x' + combo;
            comboEl.style.color = combo >= 5 ? '#ff6b6b' : '#ffa502';
        } else {
            comboContainer.style.display = 'none';
        }
    }
}

// Load high score from localStorage
function loadHighScore() {
    try {
        const saved = localStorage.getItem('pixelRunnerHighScore');
        if (saved) {
            highScore = parseInt(saved, 10);
            updateHighScoreDisplay();
        }
    } catch (e) {
        console.warn('Could not load high score:', e);
    }
}

// Save high score to localStorage
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        try {
            localStorage.setItem('pixelRunnerHighScore', highScore);
            updateHighScoreDisplay();
        } catch (e) {
            console.warn('Could not save high score:', e);
        }
    }
}

// Update score display with 5 digits
function updateScoreDisplay() {
    const displayScore = Math.floor(score).toString().padStart(5, '0');
    scoreElement.textContent = displayScore;
}

// Update high score display with 5 digits
function updateHighScoreDisplay() {
    const displayHighScore = highScore.toString().padStart(5, '0');
    highScoreElement.textContent = displayHighScore;
}

// Update ground animation speed based on game speed
function updateGroundAnimation() {
    const animSpeed = Math.max(0.5, 1 - (gameSpeed - 3) / 10);
    if (groundElement) {
        groundElement.style.animationDuration = animSpeed + 's';
    }
}

// Player jump - with double jump!
function jump() {
    if (!isGameRunning || isPaused) return;
    
    if (!player.classList.contains('jumping')) {
        // First jump
        player.classList.add('jumping');
        player.classList.remove('running');
        canDoubleJump = true;
        hasDoubleJumped = false;
        
        // Add combo
        combo++;
        updateComboDisplay();
        resetComboTimer();
        
        playSound('jump');
        
        setTimeout(() => {
            player.classList.remove('jumping');
            if (isGameRunning && !isPaused) {
                player.classList.add('running');
            }
        }, 1000);
    } else if (canDoubleJump && !hasDoubleJumped) {
        // Double jump!
        hasDoubleJumped = true;
        canDoubleJump = false;
        
        // Bonus points for double jump
        score += 10 * combo;
        updateComboDisplay();
        resetComboTimer();
        
        // Visual effect for double jump
        player.style.transform = 'scale(1.2)';
        setTimeout(() => {
            player.style.transform = 'scale(1)';
        }, 100);
        
        playSound('doubleJump');
    }
}

function resetComboTimer() {
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        combo = 0;
        updateComboDisplay();
    }, 2000);
}

// Sound effects using Web Audio API - lazily initialized
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playSound(type) {
    try {
        const ctx = initAudio();
        if (!ctx) return;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        if (type === 'jump') {
            oscillator.frequency.setValueAtTime(400, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
        } else if (type === 'doubleJump') {
            oscillator.frequency.setValueAtTime(600, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
        } else if (type === 'hit') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } else if (type === 'gameOver') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
        }
    } catch (e) {
        // Audio not supported or blocked
    }
}

// Create obstacle
function createObstacle() {
    if (!isGameRunning || isPaused) return;
    
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    
    const type = Math.random();
    let obstacleHeight, obstacleWidth;
    
    if (type < 0.4) {
        obstacle.classList.add('type1');
        obstacleWidth = 25;
        obstacleHeight = 40;
    } else if (type < 0.7) {
        obstacle.classList.add('type2');
        obstacleWidth = 35;
        obstacleHeight = 30;
    } else {
        obstacle.classList.add('type3');
        obstacleWidth = 20;
        obstacleHeight = 55;
    }
    
    obstacle.style.left = '500px';
    obstaclesContainer.appendChild(obstacle);
    
    const obstacleData = {
        element: obstacle,
        position: 500,
        width: obstacleWidth,
        height: obstacleHeight
    };
    obstacles.push(obstacleData);
}

// Move and check obstacles - Optimized collision detection
function updateObstacles(timestamp) {
    if (!isGameRunning || isPaused) return;
    
    // Throttle obstacle updates on mobile
    if (isMobile && timestamp - lastObstacleUpdate < FRAME_TIME) {
        return;
    }
    lastObstacleUpdate = timestamp;
    
    // Calculate player bounding box (cached values + jump offset)
    const playerBottom = player.classList.contains('jumping') ? 60 + 150 : 60;
    const playerLeft = 40;
    const playerWidth = 35;
    const playerHeight = 40;
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position -= gameSpeed;
        obs.element.style.left = obs.position + 'px';
        
        // Optimized collision detection using cached positions
        // No getBoundingClientRect() - avoids reflow
        const obsLeft = obs.position;
        const obsRight = obs.position + obs.width;
        const playerRight = playerLeft + playerWidth;
        
        // Ground level collision check
        const groundLevel = 60;
        
        // Check if obstacle is at ground level
        if (obs.height >= 40) {
            // Collision detection with optimized calculations
            if (
                playerRight - 8 > obsLeft + 8 &&
                playerLeft + 8 < obsRight - 8 &&
                playerBottom - 8 > groundLevel
            ) {
                // Hit! Check if invulnerable
                if (!invulnerable) {
                    handleHit();
                }
            }
        } else {
            // For shorter obstacles
            if (
                playerRight - 8 > obsLeft + 8 &&
                playerLeft + 8 < obsRight - 8 &&
                playerBottom - 8 > groundLevel
            ) {
                if (!invulnerable) {
                    handleHit();
                }
            }
        }
        
        // Remove off-screen obstacles
        if (obs.position < -50) {
            obs.element.remove();
            obstacles.splice(i, 1);
            
            // Bonus points for dodging
            if (!isGameOver) {
                score += 5 + (combo * 2);
            }
        }
    }
}

function handleHit() {
    lives--;
    updateLivesDisplay();
    playSound('hit');
    
    if (lives <= 0) {
        endGame();
    } else {
        // Invulnerable for 1.5 seconds
        invulnerable = true;
        player.style.opacity = '0.5';
        
        // Flash effect using requestAnimationFrame instead of setInterval
        let flashCount = 0;
        const flashDuration = 250;
        let lastFlashTime = 0;
        
        function flashEffect(currentTime) {
            if (!invulnerable) return;
            
            if (currentTime - lastFlashTime >= flashDuration) {
                player.style.opacity = player.style.opacity === '0.5' ? '1' : '0.5';
                flashCount++;
                lastFlashTime = currentTime;
                
                if (flashCount >= 6) {
                    player.style.opacity = '1';
                    invulnerable = false;
                    return;
                }
            }
            
            if (invulnerable) {
                requestAnimationFrame(flashEffect);
            }
        }
        
        requestAnimationFrame(flashEffect);
        
        // Set invulnerability timeout
        if (invulnerableTimer) clearTimeout(invulnerableTimer);
        invulnerableTimer = setTimeout(() => {
            invulnerable = false;
            player.style.opacity = '1';
        }, 1500);
    }
}

// Spawn obstacles
function scheduleObstacle() {
    if (!isGameRunning || isPaused) return;
    
    createObstacle();
    // Adjust spawn rate based on game speed
    const baseSpawnTime = isMobile ? 2500 : 2000;
    const nextSpawn = baseSpawnTime + Math.random() * 1500;
    obstacleTimeout = setTimeout(scheduleObstacle, Math.max(800, nextSpawn - gameSpeed * 100));
}

// Toggle pause
function togglePause() {
    if (!isGameRunning || isGameOver) return;
    
    isPaused = !isPaused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    
    if (isPaused) {
        if (obstacleTimeout) {
            clearTimeout(obstacleTimeout);
            obstacleTimeout = null;
        }
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
        lastFrameTime = performance.now();
        lastObstacleUpdate = performance.now();
        updateGame();
    }
}

// Update game loop with frame limiting
function updateGame(timestamp = 0) {
    if (!isGameRunning || isPaused) return;
    
    // Frame rate limiting for mobile
    const elapsed = timestamp - lastFrameTime;
    if (elapsed < FRAME_TIME) {
        animationId = requestAnimationFrame(updateGame);
        return;
    }
    lastFrameTime = timestamp - (elapsed % FRAME_TIME);
    
    score += 0.3;
    updateScoreDisplay();
    
    const speedLevel = Math.floor(score / 150);
    const targetSpeed = Math.min(2 + (speedLevel * speedIncrement), maxSpeed);
    
    if (gameSpeed < targetSpeed) {
        gameSpeed = targetSpeed;
        updateGroundAnimation();
    }
    
    updateObstacles(timestamp);
    
    animationId = requestAnimationFrame(updateGame);
}

// Start game
function startGame() {
    if (isGameRunning) return;
    
    // Initialize/reset all game variables
    isGameRunning = true;
    isGameOver = false;
    isPaused = false;
    score = 0;
    gameSpeed = 2;
    obstacles = [];
    lives = 3;
    combo = 0;
    canDoubleJump = false;
    hasDoubleJumped = false;
    invulnerable = false;
    
    // Reset timers
    lastFrameTime = 0;
    lastObstacleUpdate = 0;
    
    createUI();
    updateLivesDisplay();
    updateComboDisplay();
    updateGroundAnimation();
    
    obstaclesContainer.innerHTML = '';
    updateScoreDisplay();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) pauseOverlay.classList.add('hidden');
    
    player.classList.add('running');
    player.classList.remove('jumping');
    player.style.opacity = '1';
    
    // Resume audio context
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    updateGame();
    scheduleObstacle();
}

// End game
function endGame() {
    isGameRunning = false;
    isGameOver = true;
    
    saveHighScore();
    
    finalScoreElement.textContent = Math.floor(score).toString().padStart(5, '0');
    
    player.classList.remove('running');
    gameOverScreen.classList.remove('hidden');
    
    playSound('gameOver');
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Clear any pending timeouts
    if (obstacleTimeout) {
        clearTimeout(obstacleTimeout);
        obstacleTimeout = null;
    }
    if (invulnerableTimer) {
        clearTimeout(invulnerableTimer);
        invulnerableTimer = null;
    }
}

// Handle visibility change - pause game when tab/app is hidden
function handleVisibilityChange() {
    if (document.hidden && isGameRunning && !isGameOver && !isPaused) {
        togglePause();
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        
        if (!isGameRunning && !isGameOver) {
            startGame();
        } else if (isGameOver) {
            startGame();
        } else {
            jump();
        }
    } else if (e.code === 'KeyP') {
        togglePause();
    }
});

// Touch/Click controls with passive listeners for better mobile performance
gameCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    if (!isGameRunning && !isGameOver) {
        startGame();
    } else if (isGameOver) {
        startGame();
    } else {
        jump();
    }
}, { passive: false });

gameCanvas.addEventListener('click', (e) => {
    if (!isGameRunning && !isGameOver) {
        startGame();
    } else if (isGameOver) {
        startGame();
    } else {
        jump();
    }
});

// Prevent double-tap zoom on mobile
document.addEventListener('dblclick', (e) => {
    e.preventDefault();
});

// Visibility change handler
document.addEventListener('visibilitychange', handleVisibilityChange);

// Prevent default touch behaviors
document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Initialize game
loadHighScore();
player.classList.add('running');
createUI();
initGroundElement();

// Log performance mode
if (isMobile) {
    console.log('Pixel Runner: Mobile performance mode enabled');
}

