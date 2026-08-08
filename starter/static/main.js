// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
let puzzle = [];
let timerInterval = null;
let secondsElapsed = 0;
let hintsUsed = 0;
let currentDifficulty = 'medium';

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        validateBoardUI();
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

async function newGame() {
  stopTimer();
  secondsElapsed = 0;
  hintsUsed = 0;
  updateTimerDisplay();
  
  const diffSelect = document.getElementById('difficulty');
  currentDifficulty = diffSelect ? diffSelect.value : 'medium';
  
  const res = await fetch(`/new?difficulty=${currentDifficulty}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  document.getElementById('message').innerText = '';
  
  startTimer();
  validateBoardUI();
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0) {
    msg.style.color = 'var(--message-success)';
    msg.innerText = 'Congratulations! You solved it!';
    
    stopTimer();
    const playerName = prompt("You won! Enter your name for the leaderboard:", "Anonymous");
    if (playerName !== null) {
      saveGameResult(playerName, secondsElapsed, currentDifficulty, hintsUsed);
    }
  } else {
    msg.style.color = 'var(--message-color)';
    msg.innerText = 'Some cells are incorrect.';
  }
}

// --- Game Logic Additions ---
function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const timerDiv = document.getElementById('timer');
  if (timerDiv) {
    const min = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const sec = (secondsElapsed % 60).toString().padStart(2, '0');
    timerDiv.innerText = `Time: ${min}:${sec}`;
  }
}

async function getHint() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  
  const res = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  
  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }
  
  const idx = data.row * SIZE + data.col;
  const inp = inputs[idx];
  inp.value = data.value;
  inp.disabled = true;
  inp.style.backgroundColor = 'var(--cell-focus)';
  inp.style.fontWeight = 'bold';
  
  hintsUsed++;
}

function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem('sudoku-theme', newTheme);
}

function validateBoardUI() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const checkBtn = document.getElementById('check-solution');
  
  for (let inp of inputs) {
    inp.classList.remove('invalid-live');
  }

  const getVal = (r, c) => inputs[r * SIZE + c].value;
  let hasAnyConflict = false;

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const val = getVal(i, j);
      if (!val) continue;

      let isConflict = false;
      // Check row & col
      for (let x = 0; x < SIZE; x++) {
        if (x !== j && getVal(i, x) === val) isConflict = true;
        if (x !== i && getVal(x, j) === val) isConflict = true;
      }
      // Check 3x3 box
      const startRow = i - (i % 3);
      const startCol = j - (j % 3);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const rIdx = startRow + r;
          const cIdx = startCol + c;
          if (rIdx !== i && cIdx !== j && getVal(rIdx, cIdx) === val) {
            isConflict = true;
          }
        }
      }

      if (isConflict) {
        inputs[i * SIZE + j].classList.add('invalid-live');
        hasAnyConflict = true;
      }
    }
  }
  
  if (checkBtn) {
    checkBtn.disabled = hasAnyConflict;
    if (hasAnyConflict) {
      checkBtn.style.opacity = '0.5';
      checkBtn.style.cursor = 'not-allowed';
    } else {
      checkBtn.style.opacity = '1';
      checkBtn.style.cursor = 'pointer';
    }
  }
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  
  const hintBtn = document.getElementById('hint-btn');
  if (hintBtn) hintBtn.addEventListener('click', getHint);
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  
  const diffSelect = document.getElementById('difficulty');
  if (diffSelect) diffSelect.addEventListener('change', newGame);
  
  // Load saved theme
  const savedTheme = localStorage.getItem('sudoku-theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  
  // initialize
  newGame();
  displayLeaderboard();
});

// --- Leaderboard Logic ---
const LEADERBOARD_KEY = 'sudoku_top_10';

function saveGameResult(playerName, timeInSeconds, difficulty, hintsUsed) {
  let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
  
  leaderboard.push({
    name: playerName || 'Anonymous',
    time: timeInSeconds,
    difficulty: difficulty,
    hints: hintsUsed,
    date: new Date().toISOString()
  });

  // Sort by time ascending (fastest first)
  leaderboard.sort((a, b) => a.time - b.time);
  
  // Keep only Top 10
  if (leaderboard.length > 10) {
    leaderboard = leaderboard.slice(0, 10);
  }

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  displayLeaderboard();
}

function displayLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
  const leaderboardContainer = document.getElementById('leaderboard-container');
  
  if (!leaderboardContainer) return; // Prevent errors if UI isn't ready
  
  if (leaderboard.length === 0) {
    leaderboardContainer.innerHTML = '<p>No scores yet. Be the first!</p>';
    return;
  }

  let html = '<table><tr><th>Rank</th><th>Name</th><th>Time</th><th>Difficulty</th><th>Hints</th></tr>';
  leaderboard.forEach((entry, index) => {
    const timeFormatted = `${Math.floor(entry.time / 60)}:${(entry.time % 60).toString().padStart(2, '0')}`;
    html += `<tr>
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${timeFormatted}</td>
      <td>${entry.difficulty}</td>
      <td>${entry.hints}</td>
    </tr>`;
  });
  html += '</table>';
  
  leaderboardContainer.innerHTML = html;
}