// Leaderboard functionality using localStorage
const leaderboardKey = 'leaderboard';

// Initialize leaderboard in localStorage if not present
if (!localStorage.getItem(leaderboardKey)) {
  localStorage.setItem(leaderboardKey, JSON.stringify([]));
}

function getLeaderboard() {
  return JSON.parse(localStorage.getItem(leaderboardKey));
}

function saveLeaderboard(leaderboard) {
  localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
}

function addPlayerToLeaderboard(name, points) {
  const leaderboard = getLeaderboard();
  const player = leaderboard.find((p) => p.name === name);

  if (player) {
    player.points += points;
  } else {
    leaderboard.push({ name, points });
  }

  // Sort leaderboard by points in descending order
  leaderboard.sort((a, b) => b.points - a.points);
  saveLeaderboard(leaderboard);
}

function displayTopPlayers() {
  const leaderboard = getLeaderboard();
  console.log('Leaderboard:');
  leaderboard.forEach((player, index) => {
    console.log(`${index + 1}. ${player.name} - ${player.points}`);
  });
}

// Select the canvas element
let canvas = document.querySelector('canvas');

const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const x = canvas.width / 2;
const y = canvas.height / 2;

const home = document.querySelector('.home')
const homeAudio = new Audio('./Audios/retro-game-arcade-short-236130.mp3');
const customAlert = document.querySelector('.custom-alert');
const nameInput = document.querySelector('.name-input');
const alertButton = document.querySelector('.alert-button');
const shootAudio = new Audio('./Audios/laser-45816.mp3')
const enemyDieAudio = new Audio('./Audios/retro-jump-2-236687.mp3')
const playerDieAudio = new Audio('./Audios/game-over-arcade-6435.mp3')
const gameStart = new Audio('./Audios/game-start-6104.mp3')
const leaderboardSection = document.querySelector('.leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardButton = document.querySelector('.leaderboard-button');
const backToHomeButton = document.querySelector('.back-to-home');

let alert = document.querySelector('.restart');

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

const colors = ['#00FF9C', '#B6FFA1', '#563A9C', '#FFE700'];

function randomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
}

class Projctile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const player = new Player(x, y, 10, 'white');
const projctiles = [];
const enemies = [];
let animationId;
let score = 0;

let enemySpawnInterval;

function spawnEnemies() {
    enemySpawnInterval = setInterval(() => {
        const radius = Math.random() * (30 - 10) + 10;

        let x, y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle),
        };
        enemies.push(new Enemy(x, y, radius, randomColor(colors), velocity));
    }, 900);
}

// Reduce speed of enemy when hit
const SPEED_REDUCTION_FACTOR = 2.5; // Adjust this value to control speed reduction (0.9 = reduce by 10%)

function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

    projctiles.forEach((Projctile, index) => {
        Projctile.update();

        // Remove projectiles when they go off-screen
        if (Projctile.x - Projctile.radius < 0 || Projctile.x + Projctile.radius > canvas.width ||
            Projctile.y - Projctile.radius < 0 || Projctile.y + Projctile.radius > canvas.height) {
            projctiles.splice(index, 1);
        }
    });

    for (let index = enemies.length - 1; index >= 0; index--) {
        const enemy = enemies[index];

        // Update enemy position
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // End game if player collides with enemy
        if (dist - enemy.radius - player.radius < 1) {
            playerDieAudio.play();
            cancelAnimationFrame(animationId);
            toggleAlert();
            document.querySelector('.points').textContent = score * 100;
            return; // Stop further processing since the game is over
        }

        for (let pIndex = projctiles.length - 1; pIndex >= 0; pIndex--) {
            const Projctile = projctiles[pIndex];
            const dist = Math.hypot(Projctile.x - enemy.x, Projctile.y - enemy.y);

            // Handle projectile hitting enemy
            if (dist - enemy.radius - Projctile.radius < 1) {
                if (enemy.radius > 20) {
                    enemy.radius -= 10; // Decrease enemy radius

                    // Reduce enemy speed
                    enemy.velocity.x *= SPEED_REDUCTION_FACTOR;
                    enemy.velocity.y *= SPEED_REDUCTION_FACTOR;
                } else {
                    // Remove the enemy if its radius is 10 or less
                    enemyDieAudio.play();
                    enemies.splice(index, 1);
                    score++;
                }

                // Remove the projectile after collision
                projctiles.splice(pIndex, 1);
            }
        }
    }
}


function toggleAlert() {
    alert.style.display = alert.style.display === 'block' ? 'none' : 'block';
  
    if (alert.style.display === 'block') {
      const playerName = nameInput.value.trim();
      if (playerName !== '') {
        const playerScore = score * 100; // Convert score to points
        addPlayerToLeaderboard(playerName, playerScore);
  
        console.log(`Player ${playerName} scored ${playerScore} points.`);
        displayTopPlayers(); // Log the leaderboard in the console
      }
    }
}
  

// Reset animation and game state
function resetGame() {
    // Stop the animation
    cancelAnimationFrame(animationId);

    // Reset game state
    score = 0;
    document.querySelector('.points').textContent = score * 100;
    projctiles.length = 0; // Clear projectiles
    enemies.length = 0; // Clear enemies

    // Clear canvas
    c.clearRect(0, 0, canvas.width, canvas.height);

    // Restart animation and enemies
    clearInterval(enemySpawnInterval); // Clear any existing enemy spawn interval
    animate();
    spawnEnemies();
}

canvas.addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
    const velocity = {
        x: Math.cos(angle) * 4,
        y: Math.sin(angle) * 4,
    };
    projctiles.push(new Projctile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity));
    // shootAudio.play()
});


// Modify existing event listener for restart button
document.querySelector('button').addEventListener('click', () => {
    toggleAlert();
    resetGame();
    
    // Pause player die audio and reset playback position
    playerDieAudio.pause();
    gameStart.play()
    playerDieAudio.currentTime = 0;
});

// Modify menu button event listener to include reset
document.querySelector('.menu-button').addEventListener('click', () => {
    home.style.display = 'none';
    homeAudio.pause()
    gameStart.play()
    homeAudio.currentTime = 0
    resetGame();
});

let mute = document.querySelector('.footer-button')

mute.addEventListener('click', () => {
    if (homeAudio.paused) {
        mute.style.textDecoration = 'none'
        homeAudio.play()
    } else {
        homeAudio.pause()
        mute.style.textDecoration = 'line-through'
    }
})

// Back button event listener to reset game and return to the home screen
document.querySelector('.back').addEventListener('click', () => {
    home.style.display = 'block';
    alert.style.display = 'none';

    // Stop the animation
    cancelAnimationFrame(animationId);

    // Pause player die audio and reset playback position
    playerDieAudio.pause();
    playerDieAudio.currentTime = 0;
    homeAudio.play()

    // Clear game state (optional)
    projctiles.length = 0;
    enemies.length = 0;
    c.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
});

document.addEventListener('DOMContentLoaded', () => {

    alertButton.addEventListener('click', () => {
        if (nameInput.value.trim() === '') {
            nameInput.style.borderColor = 'red';
            nameInput.classList.add('vibrate');

            // Remove vibrate class after the animation
            setTimeout(() => {
                nameInput.classList.remove('vibrate');
            }, 300);
        } else {
            customAlert.style.display = 'none'; // Hide the alert box
            homeAudio.loop = true; // Enable looping
            homeAudio.play().catch((error) => console.error('Audio playback error:', error)); // Play the audio
            console.log(`Welcome, ${nameInput.value}!`); // Log the entered name
        }
    });

    // Allow pressing "Enter" to submit
    nameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            alertButton.click();
        }
    });
});

// Function to display leaderboard
function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    const leaderboard = getLeaderboard(); // Use the `getLeaderboard` function already implemented

    if (!leaderboard.length) {
        leaderboardList.innerHTML = '<li>No scores yet!</li>';
        return;
    }

    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.name}: ${entry.points}`;
        leaderboardList.appendChild(li);
    });
}

// Show Leaderboard
leaderboardButton.addEventListener('click', () => {
    home.style.display = 'none';
    leaderboardSection.style.display = 'block';
    displayLeaderboard();
});

// Back to Home
backToHomeButton.addEventListener('click', () => {
    leaderboardSection.style.display = 'none';
    home.style.display = 'block';
});