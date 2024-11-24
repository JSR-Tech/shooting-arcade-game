// Constants
const leaderboardKey = 'leaderboard'; // Key for storing leaderboard data in localStorage
const colors = ['#00FF9C', '#B6FFA1', '#563A9C', '#FFE700']; // Array of colors for game elements

// DOM Elements
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const home = document.querySelector('.home');
const customAlert = document.querySelector('.custom-alert');
const nameInput = document.querySelector('.name-input');
const alertButton = document.querySelector('.alert-button');
const leaderboardSection = document.querySelector('.leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardButton = document.querySelector('.leaderboard-button');
const backToHomeButton = document.querySelector('.back-to-home');
const alert = document.querySelector('.restart');

// Audio Elements
const homeAudio = new Audio('./Audios/retro-game-arcade-short-236130.mp3');
const shootAudio = new Audio('./Audios/laser-45816.mp3');
const enemyDieAudio = new Audio('./Audios/retro-jump-2-236687.mp3');
const playerDieAudio = new Audio('./Audios/game-over-arcade-6435.mp3');
const gameStart = new Audio('./Audios/game-start-6104.mp3');

// Canvas Dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player Start Position
const x = canvas.width / 2;
const y = canvas.height / 2;

// Game State Variables
const projctiles = [];
const enemies = [];
let animationId;
let score = 0;
let enemySpawnInterval;

// Initialize leaderboard in localStorage if not present
if (!localStorage.getItem(leaderboardKey)) {
    localStorage.setItem(leaderboardKey, JSON.stringify([]));
  }
  
  /**
   * Retrieve the leaderboard from localStorage.
   * @returns {Array} Array of leaderboard entries.
   */
  function getLeaderboard() {
    return JSON.parse(localStorage.getItem(leaderboardKey));
  }
  
  /**
   * Save the leaderboard to localStorage.
   * @param {Array} leaderboard - Array of leaderboard entries.
   */
  function saveLeaderboard(leaderboard) {
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
  }
  
  /**
   * Add a player to the leaderboard.
   * Updates points if the player already exists.
   * @param {string} name - Player's name.
   * @param {number} points - Player's score.
   */
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
  
  /**
   * Display leaderboard entries in the leaderboard section.
   */
  function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    const leaderboard = getLeaderboard();
  
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
  
/**
 * Represents the player.
 * @class
 */
class Player {
    /**
     * @param {number} x - X-coordinate of the player.
     * @param {number} y - Y-coordinate of the player.
     * @param {number} radius - Radius of the player.
     * @param {string} color - Color of the player.
     */
    constructor(x, y, radius, color) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
    }
  
    /**
     * Draws the player on the canvas.
     */
    draw() {
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      c.fillStyle = this.color;
      c.fill();
    }
  }

/**
 * Represents a projectile.
 * @class
 */
class Projectile {
    /**
     * @param {number} x - X-coordinate of the projectile.
     * @param {number} y - Y-coordinate of the projectile.
     * @param {number} radius - Radius of the projectile.
     * @param {string} color - Color of the projectile.
     * @param {Object} velocity - Velocity of the projectile.
     */
    constructor(x, y, radius, color, velocity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
    }
  
    /**
     * Draws the projectile on the canvas.
     */
    draw() {
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      c.fillStyle = this.color;
      c.fill();
    }
  
    /**
     * Updates the position of the projectile.
     */
    update() {
      this.draw();
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
  }

/**
 * Represents an enemy.
 * @class
 */
class Enemy {
    /**
     * @param {number} x - X-coordinate of the enemy.
     * @param {number} y - Y-coordinate of the enemy.
     * @param {number} radius - Radius of the enemy.
     * @param {string} color - Color of the enemy.
     * @param {Object} velocity - Velocity of the enemy.
     */
    constructor(x, y, radius, color, velocity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
    }
  
    /**
     * Draws the enemy on the canvas.
     */
    draw() {
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      c.fillStyle = this.color;
      c.fill();
    }
  
    /**
     * Updates the position of the enemy.
     */
    update() {
      this.draw();
      this.x += this.velocity.x;
      this.y += this.velocity.y;
    }
  }
  
/**
 * Selects a random color from a list.
 * @param {Array} colors - Array of color strings.
 * @returns {string} A random color.
 */
function randomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Spawns enemies at random positions with random sizes.
   * Enemies are given a random velocity that moves them towards the player.
   */
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
    }, 900); // Spawn new enemy every 900ms
  }
  
/**
 * Main animation loop for the game.
 * Continuously updates the player's, projectiles', and enemies' positions.
 */
function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height); // Clear canvas with slight transparency
    player.draw();
  
    projctiles.forEach((Projctile, index) => {
      Projctile.update();
  
      // Remove projectiles that go off-screen
      if (Projctile.x - Projctile.radius < 0 || Projctile.x + Projctile.radius > canvas.width ||
          Projctile.y - Projctile.radius < 0 || Projctile.y + Projctile.radius > canvas.height) {
        projctiles.splice(index, 1);
      }
    });
  
    // Handle enemies
    for (let index = enemies.length - 1; index >= 0; index--) {
      const enemy = enemies[index];
  
      // Update enemy position
      enemy.update();
  
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
  
      // End game if player collides with an enemy
      if (dist - enemy.radius - player.radius < 1) {
        playerDieAudio.play();
        cancelAnimationFrame(animationId);
        toggleAlert();
        document.querySelector('.points').textContent = score * 100;
        return; // Stop further processing
      }
  
      // Check for collisions with projectiles
      for (let pIndex = projctiles.length - 1; pIndex >= 0; pIndex--) {
        const Projctile = projctiles[pIndex];
        const dist = Math.hypot(Projctile.x - enemy.x, Projctile.y - enemy.y);
  
        // Handle projectile hitting enemy
        if (dist - enemy.radius - Projctile.radius < 1) {
          if (enemy.radius > 20) {
            enemy.radius -= 10; // Decrease enemy size
            enemy.velocity.x *= SPEED_REDUCTION_FACTOR; // Reduce speed
            enemy.velocity.y *= SPEED_REDUCTION_FACTOR; // Reduce speed
          } else {
            // Remove enemy if radius is small enough
            enemyDieAudio.play();
            enemies.splice(index, 1);
            score++;
          }
  
          // Remove the projectile after it hits the enemy
          projctiles.splice(pIndex, 1);
        }
      }
    }
  }
  
// Reduce speed of enemy when hit
const SPEED_REDUCTION_FACTOR = 2.5; // Adjust this value to control speed reduction

/**
 * Resets the game state to its initial condition.
 * Stops the animation, clears projectiles, enemies, and restarts the game.
 */
function resetGame() {
    // Stop the animation
    cancelAnimationFrame(animationId);
  
    // Reset game score and update display
    score = 0;
    document.querySelector('.points').textContent = score * 100;
  
    // Clear projectiles and enemies
    projctiles.length = 0;
    enemies.length = 0;
  
    // Clear the canvas
    c.clearRect(0, 0, canvas.width, canvas.height);
  
    // Restart enemy spawn and game animation
    clearInterval(enemySpawnInterval); // Clear existing enemy spawn interval
    animate();
    spawnEnemies();
  }
  
/**
 * Handles firing of projectiles when the canvas is clicked.
 * Calculates the angle between the player and the mouse click location to determine projectile velocity.
 */
canvas.addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - canvas.height / 2, event.clientX - canvas.width / 2);
    const velocity = {
      x: Math.cos(angle) * 4,
      y: Math.sin(angle) * 4,
    };
    projctiles.push(new Projctile(canvas.width / 2, canvas.height / 2, 5, 'white', velocity));
  });
  
/**
 * Event listener for the restart button.
 * Resets the game and hides the alert when clicked.
 */
document.querySelector('button').addEventListener('click', () => {
    toggleAlert();
    resetGame();
  
    // Pause player die audio and reset playback position
    playerDieAudio.pause();
    gameStart.play();
    playerDieAudio.currentTime = 0;
  });
  
/**
 * Event listener for the menu button.
 * Hides the home screen and starts a new game.
 */
document.querySelector('.menu-button').addEventListener('click', () => {
    home.style.display = 'none';
    homeAudio.pause();
    gameStart.play();
    homeAudio.currentTime = 0;
    resetGame();
  });
  
/**
 * Event listener for the mute button.
 * Toggles the music play/pause state when clicked.
 */

mute.addEventListener('click', () => {
  if (homeAudio.paused) {
    mute.style.textDecoration = 'none';
    homeAudio.play();
  } else {
    homeAudio.pause();
    mute.style.textDecoration = 'line-through';
  }
});

/**
 * Event listener for the back button.
 * Resets the game and returns to the home screen when clicked.
 */
document.querySelector('.back').addEventListener('click', () => {
    home.style.display = 'block';
    alert.style.display = 'none';
  
    // Stop the animation
    cancelAnimationFrame(animationId);
  
    // Pause player die audio and reset playback position
    playerDieAudio.pause();
    playerDieAudio.currentTime = 0;
    homeAudio.play();
  
    // Clear game state (optional)
    projctiles.length = 0;
    enemies.length = 0;
    c.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  });
  
/**
 * Retrieves the leaderboard from localStorage.
 * @returns {Array} The leaderboard array containing player names and scores.
 */
function getLeaderboard() {
    return JSON.parse(localStorage.getItem(leaderboardKey));
  }
  
/**
 * Saves the leaderboard to localStorage.
 * @param {Array} leaderboard - The updated leaderboard array.
 */
function saveLeaderboard(leaderboard) {
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
  }
  
/**
 * Adds a player to the leaderboard or updates their score if they already exist.
 * Sorts the leaderboard in descending order by points.
 * @param {string} name - The name of the player.
 * @param {number} points - The score of the player.
 */
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
  
/**
 * Logs the top players in the leaderboard to the console.
 */
function displayTopPlayers() {
    const leaderboard = getLeaderboard();
    console.log('Leaderboard:');
    leaderboard.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} - ${player.points}`);
    });
  }
  
/**
 * Displays the leaderboard in the UI.
 * Updates the leaderboard list with the top players.
 */
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
  
/**
 * Event listener for the leaderboard button.
 * Displays the leaderboard when clicked.
 */
leaderboardButton.addEventListener('click', () => {
    home.style.display = 'none';
    leaderboardSection.style.display = 'block';
    displayLeaderboard();
  });
  
/**
 * Event listener for the back-to-home button in the leaderboard section.
 * Hides the leaderboard and shows the home screen when clicked.
 */
backToHomeButton.addEventListener('click', () => {
    leaderboardSection.style.display = 'none';
    home.style.display = 'block';
  });
  
/**
 * Toggles the visibility of the custom alert box for entering player name.
 * When displayed, adds the player's score to the leaderboard.
 */
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
  
/**
 * Event listener for the alert button. 
 * Validates the player's name and starts the background music.
 */
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
  
/**
 * Event listener for the 'Enter' key press.
 * Submits the name when 'Enter' is pressed.
 */
nameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      alertButton.click();
    }
  });
  
/**
 * Event listener for the restart button.
 * Resets the game and starts a new game.
 */
document.querySelector('button').addEventListener('click', () => {
    toggleAlert();
    resetGame();
  
    // Pause player die audio and reset playback position
    playerDieAudio.pause();
    gameStart.play();
    playerDieAudio.currentTime = 0;
  });
  
/**
 * Resets the game by clearing the canvas, resetting score, and reinitializing enemies and projectiles.
 */
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
  
/**
 * Event listener for the menu button. 
 * Starts a new game by hiding the home screen, stopping the home audio, and resetting the game state.
 */
document.querySelector('.menu-button').addEventListener('click', () => {
    home.style.display = 'none';
    homeAudio.pause(); // Stop home screen music
    gameStart.play(); // Play the start game sound
    homeAudio.currentTime = 0; // Reset home audio to the beginning
    resetGame(); // Reset the game state
  });
  
/**
 * Event listener for the mute button. 
 * Toggles between muting and unmuting the background music.
 */
let mute = document.querySelector('.footer-button');

mute.addEventListener('click', () => {
  if (homeAudio.paused) {
    mute.style.textDecoration = 'none'; // Show audio is on
    homeAudio.play(); // Play audio
  } else {
    homeAudio.pause(); // Pause audio
    mute.style.textDecoration = 'line-through'; // Show audio is muted
  }
});

/**
 * Event listener for the back button. 
 * Resets the game state, hides the leaderboard, and shows the home screen.
 */
document.querySelector('.back').addEventListener('click', () => {
    home.style.display = 'block'; // Show home screen
    alert.style.display = 'none'; // Hide the restart alert
  
    // Stop the animation
    cancelAnimationFrame(animationId); 
  
    // Pause player die audio and reset playback position
    playerDieAudio.pause(); 
    playerDieAudio.currentTime = 0;
    
    homeAudio.play(); // Play home screen music
  
    // Clear game state
    projctiles.length = 0; // Clear projectiles
    enemies.length = 0; // Clear enemies
    c.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  });
  
/**
 * Function to display the leaderboard on the leaderboard screen.
 * Fetches leaderboard data from localStorage and updates the leaderboard list in the HTML.
 */
function displayLeaderboard() {
    leaderboardList.innerHTML = ''; // Clear the leaderboard list
  
    const leaderboard = getLeaderboard(); // Fetch the leaderboard data
  
    // If there are no scores yet, show a message
    if (!leaderboard.length) {
      leaderboardList.innerHTML = '<li>No scores yet!</li>';
      return;
    }
  
    // Loop through the leaderboard array and create a list item for each player
    leaderboard.forEach((entry, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${entry.name}: ${entry.points}`; // Display player name and score
      leaderboardList.appendChild(li); // Append the list item to the leaderboard list
    });
  }
  
/**
 * Event listener for the leaderboard button.
 * Shows the leaderboard screen and displays the top players.
 */
leaderboardButton.addEventListener('click', () => {
    home.style.display = 'none'; // Hide the home screen
    leaderboardSection.style.display = 'block'; // Show the leaderboard section
    displayLeaderboard(); // Display the leaderboard
  });

/**
 * Event listener for the "Back to Home" button.
 * Hides the leaderboard section and shows the home screen.
 */
backToHomeButton.addEventListener('click', () => {
    leaderboardSection.style.display = 'none'; // Hide leaderboard
    home.style.display = 'block'; // Show home screen
  });
  
/**
 * Event listener for the alert button (Enter button).
 * Starts the game and validates the name input.
 */
alertButton.addEventListener('click', () => {
    if (nameInput.value.trim() === '') { // If name input is empty
      nameInput.style.borderColor = 'red'; // Show error styling
      nameInput.classList.add('vibrate'); // Add a vibration effect
  
      // Remove the vibration class after the animation
      setTimeout(() => {
        nameInput.classList.remove('vibrate');
      }, 300);
    } else {
      customAlert.style.display = 'none'; // Hide the name input alert
      homeAudio.loop = true; // Loop home screen music
      homeAudio.play().catch((error) => console.error('Audio playback error:', error)); // Play the music
      console.log(`Welcome, ${nameInput.value}!`); // Log the entered name
    }
  });
  
/**
 * Event listener for the "Enter" key press on the name input field.
 * Triggers the alert button click when "Enter" is pressed.
 */
nameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      alertButton.click(); // Simulate the button click on "Enter" key press
    }
  });
  