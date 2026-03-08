// Pixel Runner - Enhanced Version with Lives, Double Jump, Combo & Pause

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
let obstacleTimeout = null;  // Track the timeout
let groundElement = null;     // Will be initialized when DOM is ready

// New features
let lives = 3;
let canDoubleJump = false;
let hasDoubleJumped = false;
let combo = 0;
let comboTimer = null;
let invulnerable = false;
let invulnerableTimer = null;

// Audio context - lazily initialized
let audioCtx = null;

// DOM Elements
const gameCanvas = document.getElementById('gameCanvas');
const player = document.getElementById('player');
const obstaclesContainer = document.getElementById('obstacles');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// Initialize ground element after DOM is ready
function initGroundElement() {
    groundElement = document.querySelector('.ground');
}

// Create UI elements for new features (without lives - already in HTML)
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
        livesEl.textContent = '❤️'.repeat(lives);
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
        // localStorage not available (private browsing, etc.)
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
            // localStorage not available
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
    const animSpeed = Math.max(0.3, 1 - (gameSpeed - 3) / 10);
    groundElement.style.setProperty('--ground-speed', animSpeed + 's');
    document.documentElement.style.setProperty('--ground-animation-duration', animSpeed + 's');
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
    }, 2000); // Combo lasts 2 seconds
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
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
        } else if (type === 'doubleJump') {
            oscillator.frequency.setValueAtTime(600, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);
        } else if (type === 'hit') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } else if (type === 'gameOver') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
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
    if (type < 0.4) {
        obstacle.classList.add('type1');
    } else if (type < 0.7) {
        obstacle.classList.add('type2');
    } else {
        obstacle.classList.add('type3');
    }
    
    obstacle.style.left = '500px';
    obstaclesContainer.appendChild(obstacle);
    
    const obstacleData = {
        element: obstacle,
        position: 500
    };
    obstacles.push(obstacleData);
}

// Move and check obstacles
function updateObstacles() {
    if (!isGameRunning || isPaused) return;
    
    obstacles.forEach((obs, index) => {
        obs.position -= gameSpeed;
        obs.element.style.left = obs.position + 'px';
        
        const playerRect = player.getBoundingClientRect();
        const obstacleRect = obs.element.getBoundingClientRect();
        
        const padding = 8;
        
        // Collision detection
        if (
            playerRect.right - padding > obstacleRect.left + padding &&
            playerRect.left + padding < obstacleRect.right - padding &&
            playerRect.bottom - padding > obstacleRect.top + padding
        ) {
            // Hit! Check if invulnerable
            if (!invulnerable) {
                handleHit();
            }
        }
        
        // Remove off-screen obstacles
        if (obs.position < -50) {
            obs.element.remove();
            obstacles.splice(index, 1);
            
            // Bonus points for dodging!
            if (!isGameOver) {
                score += 5 + (combo * 2); // Combo bonus for dodging
            }
        }
    });
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
        
        // Flash effect
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            player.style.opacity = player.style.opacity === '0.5' ? '1' : '0.5';
            flashCount++;
            if (flashCount >= 6) {
                clearInterval(flashInterval);
                player.style.opacity = '1';
                invulnerable = false;
            }
        }, 250);
    }
}

// Spawn obstacles
function scheduleObstacle() {
    if (!isGameRunning || isPaused) return;
    
    createObstacle();
    const nextSpawn = 2000 + Math.random() * 2000;
    obstacleTimeout = setTimeout(scheduleObstacle, nextSpawn);
}

// Toggle pause
function togglePause() {
    if (!isGameRunning || isGameOver) return;
    
    isPaused = !isPaused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    
    if (isPaused) {
        // Clear the timeout when pausing
        if (obstacleTimeout) {
            clearTimeout(obstacleTimeout);
            obstacleTimeout = null;
        }
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
        // Restart obstacle spawning when resuming
        scheduleObstacle();
        updateGame();
    }
}

// Update game loop
function updateGame() {
    if (!isGameRunning || isPaused) return;
    
    score += 0.3;
    updateScoreDisplay();
    
    const speedLevel = Math.floor(score / 150);
    const targetSpeed = Math.min(2 + (speedLevel * speedIncrement), maxSpeed);
    
    if (gameSpeed < targetSpeed) {
        gameSpeed = targetSpeed;
        updateGroundAnimation();
    }
    
    updateObstacles();
    
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
    
    // Resume audio context (needed for some browsers)
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

// Touch/Click controls
gameCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    if (!isGameRunning && !isGameOver) {
        startGame();
    } else if (isGameOver) {
        startGame();
    } else {
        jump();
    }
});

gameCanvas.addEventListener('click', (e) => {
    if (!isGameRunning && !isGameOver) {
        startGame();
    } else if (isGameOver) {
        startGame();
    } else {
        jump();
    }
});

document.addEventListener('dblclick', (e) => {
    e.preventDefault();
});

// Initialize game
loadHighScore();
player.classList.add('running');
createUI();
initGroundElement();

