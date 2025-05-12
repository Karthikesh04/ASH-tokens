<script>
    // App State
    let currentUser = null;
    let totalGamesPlayed = 0;
    let highestWin = 0;
    let totalSpins = 0;
    let totalTasksCompleted = 0;
    let currentTriviaQuestion = null;
    const MAX_TOKENS = 3000; // Maximum tokens limit

    // Task descriptions
    const taskDescriptions = [
      "Take a 10-minute walk outside",
      "Drink a glass of water",
      "Read 5 pages of a book",
      "Write down 3 things you're grateful for",
      "Do 10 pushups",
      "Meditate for 5 minutes",
      "Organize your workspace",
      "Call a friend or family member",
      "Learn something new for 10 minutes",
      "Write a short journal entry",
      "Do a random act of kindness",
      "Take a photo of something beautiful",
      "Plan your next day",
      "Stretch for 5 minutes",
      "List 5 things you like about yourself"
    ];

    // Trivia questions
    const triviaQuestions = [
      {
        question: "What is the capital of France?",
        options: ["London", "Paris", "Berlin", "Madrid"],
        answer: 1
      },
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        answer: 1
      },
      {
        question: "What is the largest mammal?",
        options: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
        answer: 1
      },
      {
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        answer: 2
      },
      {
        question: "What is the chemical symbol for gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        answer: 2
      }
    ];

    // Game state variables
    let ticTacToeBoard = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = false;
    let memoryCards = [];
    let flippedCards = [];
    let matchedPairs = 0;

    // Initialize the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
      init();
    });

    // Initialize the app
    function init() {
      // Check if we have a logged in user from previous session
      const loggedInUser = localStorage.getItem('currentUser');
      if (loggedInUser) {
        const userData = JSON.parse(localStorage.getItem(loggedInUser));
        if (userData) {
          currentUser = loggedInUser;
          showPage('home');
          updateUserDisplay();
          return;
        }
      }
      // If no user, show login page
      showPage('loginPage');
    }

    // Show modal message
    function showModal(title, message) {
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalMessage').textContent = message;
      document.getElementById('messageModal').style.display = 'flex';
    }

    // Close modal
    function closeModal() {
      document.getElementById('messageModal').style.display = 'none';
    }

    // Show a specific page
    function showPage(page) {
      // Hide all pages first
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('signupPage').style.display = 'none';
      document.getElementById('home').style.display = 'none';
      document.getElementById('tasks').style.display = 'none';
      document.getElementById('games').style.display = 'none';
      document.getElementById('stats').style.display = 'none';
      document.getElementById('mainPage').style.display = 'none';

      // Hide all games when switching pages
      document.getElementById('ticTacToe').style.display = 'none';
      document.getElementById('diceGame').style.display = 'none';
      document.getElementById('slotsGame').style.display = 'none';
      document.getElementById('memoryGame').style.display = 'none';
      document.getElementById('triviaGame').style.display = 'none';

      if (page === 'games') {
        // Check if all tasks are completed
        const completed = getCompletedTasks();
        if (completed.length < 15) {
          showModal('Games Locked', 'You must complete all 15 tasks to unlock the Games section!');
          showPage('tasks');
          return;
        }
        
        showGame('ticTacToe'); // Default to tic-tac-toe game
      }

      if (page === 'tasks' && currentUser) {
        // Check if tasks need reset
        if (shouldResetTasks(currentUser)) {
          resetTasks(currentUser);
        }
        renderTasks();
      }

      if (page === 'home' || page === 'tasks' || page === 'games' || page === 'stats') {
        document.getElementById('mainPage').style.display = 'block';
        document.getElementById(page).style.display = 'block';
        updateUserDisplay();
        
        if (page === 'stats') {
          updateStatsDisplay();
        }
      } else {
        document.getElementById(page).style.display = 'block';
      }
    }

    // Show a specific game
    function showGame(gameId) {
      // Hide all games first
      document.getElementById('ticTacToe').style.display = 'none';
      document.getElementById('diceGame').style.display = 'none';
      document.getElementById('slotsGame').style.display = 'none';
      document.getElementById('memoryGame').style.display = 'none';
      document.getElementById('triviaGame').style.display = 'none';
      
      // Show the selected game
      document.getElementById(gameId).style.display = 'block';
      
      // Initialize the game if needed
      if (gameId === 'ticTacToe') {
        resetTicTacToe();
      } else if (gameId === 'memoryGame') {
        resetMemoryGame();
      }
    }

    // Sign up a new user
    function signup() {
      const username = document.getElementById('signupUsername').value.trim();
      const password = document.getElementById('signupPassword').value.trim();
      
      if (!username || !password) {
        showModal('Error', 'Please enter both username and password');
        return;
      }
      
      if (username.length < 4 || password.length < 6) {
        showModal('Error', 'Username must be at least 4 characters and password at least 6 characters');
        return;
      }
      
      if (localStorage.getItem(username)) {
        showModal('Error', 'Username already exists!');
        return;
      }
      
      // Create user data with additional stats
      const userData = { 
        password, 
        tokens: 100, // Starting bonus
        stats: {
          totalEarned: 100,
          highestWin: 0,
          totalGames: 0,
          totalTasks: 0,
          lastGame: null,
          activityLog: []
        }
      };
      
      localStorage.setItem(username, JSON.stringify(userData));
      
      // Log activity
      logActivity(username, 'account_created', { bonus: 100 });
      
      showModal('Success', 'Account created successfully! You received 100 bonus tokens!');
      
      // Clear form
      document.getElementById('signupUsername').value = '';
      document.getElementById('signupPassword').value = '';
      
      showPage('loginPage');
    }

    // Log in a user
    function login() {
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      
      if (!username || !password) {
        showModal('Error', 'Please enter both username and password');
        return;
      }
      
      const userData = JSON.parse(localStorage.getItem(username));
      
      if (!userData) {
        showModal('Error', 'User not found');
        return;
      }
      
      if (userData.password !== password) {
        showModal('Error', 'Incorrect password');
        return;
      }
      
      currentUser = username;
      localStorage.setItem('currentUser', username);
      
      // Check if tasks need reset on login
      if (shouldResetTasks(currentUser)) {
        resetTasks(currentUser);
      }
      
      // Log activity
      logActivity(username, 'login', {});
      
      // Clear form
      document.getElementById('loginUsername').value = '';
      document.getElementById('loginPassword').value = '';
      
      showPage('home');
      updateUserDisplay();
    }

    // Log out
    function logout() {
      if (currentUser) {
        logActivity(currentUser, 'logout', {});
      }
      currentUser = null;
      localStorage.removeItem('currentUser');
      showPage('loginPage');
    }

    // Check if tasks should be reset (24 hours passed)
    function shouldResetTasks(username) {
      const lastResetKey = `lastReset_${username}`;
      const lastReset = localStorage.getItem(lastResetKey);
      if (!lastReset) return true;
      
      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return (now - parseInt(lastReset)) > twentyFourHours;
    }

    // Reset all tasks for a user
    function resetTasks(username) {
      for (let i = 0; i < 15; i++) {
        const key = `task_${username}_${i}`;
        localStorage.removeItem(key);
      }
      // Update last reset time
      localStorage.setItem(`lastReset_${username}`, new Date().getTime());
      
      // Log activity
      logActivity(username, 'tasks_reset', {});
    }

    // Get completed tasks
    function getCompletedTasks() {
      if (!currentUser) return [];
      
      const completed = [];
      for (let i = 0; i < 15; i++) {
        const key = `task_${currentUser}_${i}`;
        if (localStorage.getItem(key) === 'done') {
          completed.push(i);
        }
      }
      return completed;
    }

    // Render tasks list
    function renderTasks() {
      if (!currentUser) return;
      
      const tasksList = document.getElementById('tasksList');
      tasksList.innerHTML = '';
      
      const completedTasks = getCompletedTasks();
      const progress = (completedTasks.length / 15) * 100;
      document.getElementById('taskProgress').style.width = `${progress}%`;
      
      taskDescriptions.forEach((desc, index) => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        if (completedTasks.includes(index)) {
          taskItem.classList.add('completed');
        }
        
        taskItem.innerHTML = `
          <p><strong>Task ${index + 1}:</strong> ${desc}</p>
          <button id="taskBtn${index}" onclick="completeTask(${index})" ${completedTasks.includes(index) ? 'disabled' : ''}>
            ${completedTasks.includes(index) ? 'Completed' : 'Claim 100 Tokens'}
          </button>
        `;
        
        tasksList.appendChild(taskItem);
      });
    }

    // Complete a task
    function completeTask(taskIndex) {
      if (!currentUser) return;
      
      const key = `task_${currentUser}_${taskIndex}`;
      if (localStorage.getItem(key) === 'done') {
        showModal('Already Completed', 'You have already completed this task today!');
        return;
      }
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      
      // Check token limit
      if (userData.tokens >= MAX_TOKENS) {
        showModal('Token Limit Reached', `You've reached the maximum token limit of ${MAX_TOKENS}. Play some games to spend your tokens!`);
        return;
      }
      
      userData.tokens += 100;
      userData.stats.totalEarned += 100;
      userData.stats.totalTasks += 1;
      
      // Update activity log
      logActivity(currentUser, 'task_completed', { 
        taskId: taskIndex, 
        taskDesc: taskDescriptions[taskIndex],
        tokensEarned: 100 
      });
      
      localStorage.setItem(currentUser, JSON.stringify(userData));
      localStorage.setItem(key, 'done');
      
      // Update display
      updateUserDisplay();
      renderTasks();
      
      // Show celebration for completing all tasks
      const completedTasks = getCompletedTasks();
      if (completedTasks.length === 15) {
        showModal('Congratulations!', 'You completed all tasks! The Games section is now unlocked!');
      }
    }

    // Tic Tac Toe Game
    function startTicTacToe() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      if (userData.tokens < 50) {
        showModal('Not Enough Tokens', 'You need at least 50 tokens to play Tic Tac Toe!');
        return;
      }

      // Deduct tokens
      userData.tokens -= 50;
      localStorage.setItem(currentUser, JSON.stringify(userData));
      
      // Reset game
      ticTacToeBoard = ['', '', '', '', '', '', '', '', ''];
      currentPlayer = 'X';
      gameActive = true;
      
      // Update UI
      document.getElementById('ticTacToeStatus').textContent = 'Your turn (X)';
      document.getElementById('ticTacToeResult').textContent = '';
      
      // Render board
      const grid = document.getElementById('ticTacToeGrid');
      grid.innerHTML = '';
      
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'game-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', handleTicTacToeClick);
        grid.appendChild(cell);
      }
      
      updateUserDisplay();
    }

    function handleTicTacToeClick(e) {
      if (!gameActive) return;
      
      const index = e.target.dataset.index;
      
      // Check if cell is empty
      if (ticTacToeBoard[index] !== '') return;
      
      // Make player move
      ticTacToeBoard[index] = currentPlayer;
      e.target.textContent = currentPlayer;
      e.target.classList.add(currentPlayer.toLowerCase());
      
      // Check for win or draw
      if (checkTicTacToeWin()) {
        endTicTacToeGame(`${currentPlayer} wins!`);
        if (currentPlayer === 'X') {
          awardTicTacToeWin();
        }
        return;
      }
      
      if (checkTicTacToeDraw()) {
        endTicTacToeGame('Draw!');
        return;
      }
      
      // Switch to computer player
      currentPlayer = 'O';
      document.getElementById('ticTacToeStatus').textContent = 'Computer thinking...';
      
      // Computer makes a move after a short delay
      setTimeout(makeComputerMove, 1000);
    }

    function makeComputerMove() {
      if (!gameActive) return;
      
      // Simple AI - first try to win, then block, then random
      let move = findWinningMove('O') || findWinningMove('X') || findRandomMove();
      
      if (move !== -1) {
        ticTacToeBoard[move] = 'O';
        const cells = document.querySelectorAll('#ticTacToeGrid .game-cell');
        cells[move].textContent = 'O';
        cells[move].classList.add('o');
        
        // Check for win or draw
        if (checkTicTacToeWin()) {
          endTicTacToeGame(`${currentPlayer} wins!`);
          return;
        }
        
        if (checkTicTacToeDraw()) {
          endTicTacToeGame('Draw!');
          return;
        }
      }
      
      // Switch back to player
      currentPlayer = 'X';
      document.getElementById('ticTacToeStatus').textContent = 'Your turn (X)';
    }

    function findWinningMove(player) {
      // Check rows
      for (let i = 0; i < 9; i += 3) {
        const row = [ticTacToeBoard[i], ticTacToeBoard[i+1], ticTacToeBoard[i+2]];
        if (row.filter(cell => cell === player).length === 2 && row.includes('')) {
          return i + row.indexOf('');
        }
      }
      
      // Check columns
      for (let i = 0; i < 3; i++) {
        const col = [ticTacToeBoard[i], ticTacToeBoard[i+3], ticTacToeBoard[i+6]];
        if (col.filter(cell => cell === player).length === 2 && col.includes('')) {
          return i + (col.indexOf('') * 3);
        }
      }
      
      // Check diagonals
      const diag1 = [ticTacToeBoard[0], ticTacToeBoard[4], ticTacToeBoard[8]];
      if (diag1.filter(cell => cell === player).length === 2 && diag1.includes('')) {
        return diag1.indexOf('') * 4;
      }
      
      const diag2 = [ticTacToeBoard[2], ticTacToeBoard[4], ticTacToeBoard[6]];
      if (diag2.filter(cell => cell === player).length === 2 && diag2.includes('')) {
        return 2 + (diag2.indexOf('') * 2);
      }
      
      return -1;
    }

    function findRandomMove() {
      const emptyCells = [];
      for (let i = 0; i < 9; i++) {
        if (ticTacToeBoard[i] === '') {
          emptyCells.push(i);
        }
      }
      
      if (emptyCells.length > 0) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
      
      return -1;
    }

    function checkTicTacToeWin() {
      const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
      ];
      
      return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return ticTacToeBoard[a] !== '' && 
               ticTacToeBoard[a] === ticTacToeBoard[b] && 
               ticTacToeBoard[a] === ticTacToeBoard[c];
      });
    }

    function checkTicTacToeDraw() {
      return !ticTacToeBoard.includes('') && !checkTicTacToeWin();
    }

    function endTicTacToeGame(message) {
      gameActive = false;
      document.getElementById('ticTacToeStatus').textContent = message;
      document.getElementById('ticTacToeResult').textContent = message;
    }

    function awardTicTacToeWin() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      const prize = 200;
      
      // Check token limit
      if (userData.tokens >= MAX_TOKENS) {
        showModal('Token Limit Reached', `You've reached the maximum token limit of ${MAX_TOKENS}. Play some games to spend your tokens!`);
        return;
      }
      
      userData.tokens += prize;
      userData.stats.totalEarned += prize;
      userData.stats.totalGames += 1;
      userData.stats.lastGame = new Date().toISOString();
      
      if (prize > userData.stats.highestWin) {
        userData.stats.highestWin = prize;
      }
      
      // Log activity
      logActivity(currentUser, 'tic_tac_toe_win', { 
        prize: prize 
      });
      
      localStorage.setItem(currentUser, JSON.stringify(userData));
      
      totalGamesPlayed++;
      updateUserDisplay();
      
      // Show result
      document.getElementById('ticTacToeResult').innerHTML = `You won <strong>+${prize}</strong> tokens!`;
      document.getElementById('ticTacToeResult').classList.add('win-animation');
    }

    function resetTicTacToe() {
      ticTacToeBoard = ['', '', '', '', '', '', '', '', ''];
      currentPlayer = 'X';
      gameActive = false;
      
      // Render empty board
      const grid = document.getElementById('ticTacToeGrid');
      grid.innerHTML = '';
      
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'game-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', handleTicTacToeClick);
        grid.appendChild(cell);
      }
      
      document.getElementById('ticTacToeStatus').textContent = 'Press "Start" to begin!';
      document.getElementById('ticTacToeResult').textContent = '';
    }

    // Dice Game
    function rollDice() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      if (userData.tokens < 30) {
        showModal('Not Enough Tokens', 'You need at least 30 tokens to roll the dice!');
        return;
      }

      // Deduct tokens
      userData.tokens -= 30;
      localStorage.setItem(currentUser, JSON.stringify(userData));
      
      // Animate dice
      const dice1 = document.getElementById('dice1');
      const dice2 = document.getElementById('dice2');
      const resultElement = document.getElementById('diceResult');
      
      dice1.textContent = '?';
      dice2.textContent = '?';
      resultElement.textContent = 'Rolling...';
      resultElement.classList.remove('win-animation');
      
      // Roll animation
      let rolls = 0;
      const maxRolls = 10;
      const rollInterval = setInterval(() => {
        const val1 = Math.floor(Math.random() * 6) + 1;
        const val2 = Math.floor(Math.random() * 6) + 1;
        
        dice1.textContent = val1;
        dice2.textContent = val2;
        
        rolls++;
        if (rolls >= maxRolls) {
          clearInterval(rollInterval);
          evaluateDiceRoll(val1, val2);
        }
      }, 100);
      
      updateUserDisplay();
    }

    function evaluateDiceRoll(val1, val2) {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      const resultElement = document.getElementById('diceResult');
      
      if (val1 === val2) {
        // Win
        const prize = 100;
        
        // Check token limit
        if (userData.tokens >= MAX_TOKENS) {
          showModal('Token Limit Reached', `You've reached the maximum token limit of ${MAX_TOKENS}. Play some games to spend your tokens!`);
          return;
        }
        
        userData.tokens += prize;
        userData.stats.totalEarned += prize;
        userData.stats.totalGames += 1;
        userData.stats.lastGame = new Date().toISOString();
        
        if (prize > userData.stats.highestWin) {
          userData.stats.highestWin = prize;
        }
        
        // Log activity
        logActivity(currentUser, 'dice_win', { 
          dice1: val1,
          dice2: val2,
          prize: prize 
        });
        
        resultElement.innerHTML = `Doubles! You won <strong>+${prize}</strong> tokens!`;
        resultElement.classList.add('win-animation');
      } else {
        // Lose
        userData.stats.totalGames += 1;
        userData.stats.lastGame = new Date().toISOString();
        
        // Log activity
        logActivity(currentUser, 'dice_loss', { 
          dice1: val1,
          dice2: val2
        });
        
        resultElement.textContent = `No doubles. Try again!`;
      }
      
      localStorage.setItem(currentUser, JSON.stringify(userData));
      totalGamesPlayed++;
      updateUserDisplay();
    }

    // Slots Game
    function spinSlots() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      if (userData.tokens < 40) {
        showModal('Not Enough Tokens', 'You need at least 40 tokens to spin the slots!');
        return;
      }

      // Deduct tokens
      userData.tokens -= 40;
      localStorage.setItem(currentUser, JSON.stringify(userData));
      
      // Animate slots
      const slot1 = document.getElementById('slot1');
      const slot2 = document.getElementById('slot2');
      const slot3 = document.getElementById('slot3');
      const resultElement = document.getElementById('slotsResult');
      
      slot1.textContent = '?';
      slot2.textContent = '?';
      slot3.textContent = '?';
      resultElement.textContent = 'Spinning...';
      resultElement.classList.remove('win-animation');
      
      // Spin animation
      let spins = 0;
      const maxSpins = 15;
      const spinInterval = setInterval(() => {
        const symbols = ['7', '🍒', '🍋', '🍊', '⭐', '🔔'];
        slot1.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        slot2.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        slot3.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        
        spins++;
        if (spins >= maxSpins) {
          clearInterval(spinInterval);
          evaluateSlotsSpin(slot1.textContent, slot2.textContent, slot3.textContent);
        }
      }, 100);
      
      updateUserDisplay();
    }

    function evaluateSlotsSpin(val1, val2, val3) {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      const resultElement = document.getElementById('slotsResult');
      
      if (val1 === val2 && val2 === val3) {
        // 3 matching - big win
        const prize = 200;
        
        // Check token limit
        if (userData.tokens >= MAX_TOKENS) {
          showModal('Token Limit Reached', `You've reached the maximum token limit of ${MAX_TOKENS}. Play some games to spend your tokens!`);
          return;
        }
        
        userData.tokens += prize;
        userData.stats.totalEarned += prize;
        userData.stats.totalGames += 1;
        userData.stats.lastGame = new Date().toISOString();
        
        if (prize > userData.stats.highestWin) {
          userData.stats.highestWin = prize;
        }
        
        // Log activity
        logActivity(currentUser, 'slots_win', { 
          symbols: [val1, val2, val3],
          prize: prize 
        });
        
        resultElement.innerHTML = `Jackpot! You won <strong>+${prize}</strong> tokens!`;
        resultElement.classList.add('win-animation');
      } else if (val1 === val2 || val2 === val3 || val1 === val3) {
        // 2 matching - small win
        const prize = 50;
        
        // Check token limit
        if (userData.tokens >= MAX_TOKENS) {
          showModal('Token Limit Reached', `You've reached the maximum token limit of ${MAX_TOKENS}. Play some games to spend your tokens!`);
          return;
        }
        
        userData.tokens += prize;
        userData.stats.totalEarned += prize;
        userData.stats.totalGames += 1;
        userData.stats.lastGame = new Date().toISOString();
        
        if (prize > userData.stats.highestWin) {
          userData.stats.highestWin = prize;
        }
        
        // Log activity
        logActivity(currentUser, 'slots_small_win', { 
          symbols: [val1, val2, val3],
          prize: prize 
        });
        
        resultElement.innerHTML = `Two matching! You won <strong>+${prize}</strong> tokens!`;
        resultElement.classList.add('win-animation');
      } else {
        // Lose
        userData.stats.totalGames += 1;
        userData.stats.lastGame = new Date().toISOString();
        
        // Log activity
        logActivity(currentUser, 'slots_loss', { 
          symbols: [val1, val2, val3]
        });
        
        resultElement.textContent = `No matches. Try again!`;
      }
      
      localStorage.setItem(currentUser, JSON.stringify(userData));
      totalGamesPlayed++;
      updateUserDisplay();
    }

    // Memory Game
    function startMemoryGame() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      if (userData.tokens < 60) {
        showModal('Not Enough Tokens', 'You need at least 60 tokens to play Memory!');
        return;
      }

      // Deduct tokens
      userData.tokens -= 60;
      localStorage.setItem(currentUser, JSON.stringify(userData));
      
      // Initialize game
      memoryCards = [];
      flippedCards = [];
      matchedPairs = 0;
      
      // Create pairs of cards
      const symbols = ['🍎', '🍌', '🍒', '🍊', '🍋', '🍉'];
      const cards = [...symbols, ...symbols];
      
      // Shuffle cards
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      
      memoryCards = cards;
      
      // Render board
      const grid = document.getElementById('memoryGrid');
      grid.innerHTML = '';
      
      for (let i = 0; i < cards.length; i++) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = i;
        card.addEventListener('click', handleMemoryCardClick);
        
        const front = document.createElement('div');
        front.className = 'front';
        front.textContent = cards[i];
        
        const back = document.createElement('div');
        back.className = 'back';
        
        card.appendChild(front);
        card.appendChild(back);
        grid.appendChild(card);
      }
      
      document.getElementById('memoryStatus').textContent = 'Pairs found: 0/6';
      document.getElementById('memoryResult').textContent = '';
      
      updateUserDisplay();
    }

    function handleMemoryCardClick(e) {
      if (flippedCards.length >= 2 || !e.target.classList.contains('memory-card')) return;
      
      const card = e.target;
      const index = card.dataset.index;
      
      // Don't flip already matched or flipped cards
      if (card.classList.contains('matched') || card.classList.contains('flipped')) {
        return;
      }
      
      // Flip the card
      card.classList.add('flipped');
      flippedCards.push({ index, card });
      
      // Check for match if two cards are flipped
      if (flippedCards.length === 2) {
        const card1 = memoryCards[flippedCards[0].index];
        const card2 = memoryCards[flippedCards[1].index];
        
        if (card1 === card2) {
          // Match found
          matchedPairs++;
          document.getElementById('memoryStatus').textContent = `Pairs found: ${matchedPairs}/6`;
          
          // Mark as matched
          setTimeout(() => {
            flippedCards[0].card.classList.add('matched');
            flippedCards[1].card.classList.add('matched');
            flippedCards = [];
            
            // Check for win
            if (matchedPairs === 6) {
              awardMemoryWin();
            }
          }, 500);
        } else {
          // No match - flip back
          setTimeout(() => {
            flippedCards[0].card.classList.remove('flipped');
            flippedCards[1].card.classList.remove('flipped');
            flippedCards = [];
          }, 1000);
        }
      }
    }

    function awardMemoryWin() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      const prize = 300;
      
      // Check token limit
      if (userData.tokens >= MAX_TOKENS) {
        showModal('Token Limit Reached', `You've reached the maximum token limit of ${MAX_TOKENS}. Play some games to spend your tokens!`);
        return;
      }
      
      userData.tokens += prize;
      userData.stats.totalEarned += prize;
      userData.stats.totalGames += 1;
      userData.stats.lastGame = new Date().toISOString();
      
      if (prize > userData.stats.highestWin) {
        userData.stats.highestWin = prize;
      }
      
      // Log activity
      logActivity(currentUser, 'memory_win', { 
        prize: prize 
      });
      
      localStorage.setItem(currentUser, JSON.stringify(userData));
      
      totalGamesPlayed++;
      updateUserDisplay();
      
      // Show result
      document.getElementById('memoryResult').innerHTML = `You won <strong>+${prize}</strong> tokens!`;
      document.getElementById('memoryResult').classList.add('win-animation');
    }

    function resetMemoryGame() {
      memoryCards = [];
      flippedCards = [];
      matchedPairs = 0;
      
      // Render empty board
      const grid = document.getElementById('memoryGrid');
      grid.innerHTML = '';
      
      document.getElementById('memoryStatus').textContent = 'Press "Start" to begin!';
      document.getElementById('memoryResult').textContent = '';
    }

    // Trivia Game
    function startTrivia() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      if (userData.tokens < 20) {
        showModal('Not Enough Tokens', 'You need at least 20 tokens to play Trivia!');
        return;
      }

      // Deduct tokens
      userData.tokens -= 20;
      localStorage.setItem(currentUser, JSON.stringify(userData));
      
      // Get a random question
      currentTriviaQuestion = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
      
      // Display question and options
      document.getElementById('triviaQuestion').textContent = currentTriviaQuestion.question;
      
      const optionsContainer = document.getElementById('triviaOptions');
      optionsContainer.innerHTML = '';
      
      currentTriviaQuestion.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'trivia-option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        optionElement.addEventListener('click', handleTriviaAnswer);
        optionsContainer.appendChild(optionElement);
      });
      
      document.getElementById('triviaResult').textContent = '';
      
      updateUserDisplay();
    }

    function handleTriviaAnswer(e) {
      if (!currentTriviaQuestion || !e.target.classList.contains('trivia-option')) return;
      
      const selectedIndex = parseInt(e.target.dataset.index);
      const options = document.querySelectorAll('.trivia-option');
      
      // Disable all options
      options.forEach(opt => {
        opt.style.pointerEvents = 'none';
      });
      
      // Highlight correct/incorrect
      if (selectedIndex === currentTriviaQuestion.answer) {
        e.target.classList.add('correct');
        awardTriviaWin();
      } else {
        e.target.classList.add('incorrect');
        options[currentTriviaQuestion.answer].classList.add('correct');
        document.getElementById('triviaResult').textContent = 'Incorrect! Try another question.';
      }
    }

    function awardTriviaWin() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      const prize = 50;
      
      // Check token limit
      if (userData.tokens >= MAX_TOKENS) {
        showModal('Token Limit Reached', `You've reached the maximum token limit of ${MAX_TOKENS}. Play some games to spend your tokens!`);
        return;
      }
      
      userData.tokens += prize;
      userData.stats.totalEarned += prize;
      userData.stats.totalGames += 1;
      userData.stats.lastGame = new Date().toISOString();
      
      if (prize > userData.stats.highestWin) {
        userData.stats.highestWin = prize;
      }
      
      // Log activity
      logActivity(currentUser, 'trivia_win', { 
        prize: prize 
      });
      
      localStorage.setItem(currentUser, JSON.stringify(userData));
      
      totalGamesPlayed++;
      updateUserDisplay();
      
      // Show result
      document.getElementById('triviaResult').innerHTML = `Correct! You won <strong>+${prize}</strong> tokens!`;
      document.getElementById('triviaResult').classList.add('win-animation');
    }

    // Update user display
    function updateUserDisplay() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      if (!userData) return;
      
      document.getElementById('tokenCount').textContent = userData.tokens;
      
      // Update home stats
      const completedTasks = getCompletedTasks().length;
      document.getElementById('completedTasks').textContent = completedTasks;
      document.getElementById('totalTokens').textContent = userData.tokens;
      
      // Calculate daily games (resets at midnight)
      const now = new Date();
      const lastGame = userData.stats.lastGame ? new Date(userData.stats.lastGame) : null;
      let dailyGames = 0;
      
      if (lastGame && isSameDay(now, lastGame)) {
        dailyGames = userData.stats.totalGames - totalGamesPlayed;
      }
      
      document.getElementById('dailyGames').textContent = dailyGames;
    }

    // Update stats display
    function updateStatsDisplay() {
      if (!currentUser) return;
      
      const userData = JSON.parse(localStorage.getItem(currentUser));
      if (!userData) return;
      
      document.getElementById('statsTotalEarned').textContent = userData.stats.totalEarned;
      document.getElementById('statsHighestWin').textContent = userData.stats.highestWin;
      document.getElementById('statsTotalGames').textContent = userData.stats.totalGames;
      document.getElementById('statsTotalTasks').textContent = userData.stats.totalTasks;
      
      // Display recent activity
      const activityContainer = document.getElementById('recentActivity');
      activityContainer.innerHTML = '';
      
      const activities = userData.stats.activityLog.slice(0, 5); // Show last 5 activities
      
      if (activities.length === 0) {
        activityContainer.innerHTML = '<p>No recent activity</p>';
        return;
      }
      
      activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        let activityText = '';
        const activityDate = new Date(activity.timestamp);
        
        switch(activity.type) {
          case 'login':
            activityText = 'You logged in';
            break;
          case 'logout':
            activityText = 'You logged out';
            break;
          case 'task_completed':
            activityText = `Completed task: "${activity.data.taskDesc}" (+${activity.data.tokensEarned} tokens)`;
            break;
          case 'tic_tac_toe_win':
            activityText = `Tic Tac Toe win: +${activity.data.prize} tokens`;
            break;
          case 'dice_win':
            activityText = `Dice game win: Rolled ${activity.data.dice1} and ${activity.data.dice2} (+${activity.data.prize} tokens)`;
            break;
          case 'dice_loss':
            activityText = `Dice game: Rolled ${activity.data.dice1} and ${activity.data.dice2}`;
            break;
          case 'slots_win':
            activityText = `Slots jackpot: ${activity.data.symbols.join(' ')} (+${activity.data.prize} tokens)`;
            break;
          case 'slots_small_win':
            activityText = `Slots win: ${activity.data.symbols.join(' ')} (+${activity.data.prize} tokens)`;
            break;
          case 'slots_loss':
            activityText = `Slots game: ${activity.data.symbols.join(' ')}`;
            break;
          case 'memory_win':
            activityText = `Memory game win: +${activity.data.prize} tokens`;
            break;
          case 'trivia_win':
            activityText = `Trivia correct answer: +${activity.data.prize} tokens`;
            break;
          case 'bonus_received':
            activityText = `Received bonus: +${activity.data.amount} tokens`;
            break;
          case 'account_created':
            activityText = 'Account created';
            break;
          case 'tasks_reset':
            activityText = 'Daily tasks reset';
            break;
          default:
            activityText = 'Activity recorded';
        }
        
        activityItem.innerHTML = `
          <div>${activityText}</div>
          <div class="activity-time">${formatTime(activityDate)}</div>
        `;
        
        activityContainer.appendChild(activityItem);
      });
    }

    // Log user activity
    function logActivity(username, type, data) {
      const userData = JSON.parse(localStorage.getItem(username));
      if (!userData) return;
      
      const activity = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      userData.stats.activityLog.unshift(activity); // Add to beginning of array
      
      // Keep only the last 50 activities
      if (userData.stats.activityLog.length > 50) {
        userData.stats.activityLog = userData.stats.activityLog.slice(0, 50);
      }
      
      localStorage.setItem(username, JSON.stringify(userData));
    }

    // Helper function to check if two dates are the same day
    function isSameDay(date1, date2) {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    }

    // Helper function to format time
    function formatTime(date) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  </script>