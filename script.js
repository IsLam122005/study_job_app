// --- Configuration ---
const CONTRACTS = { full: { hours: 8 }, partA: { hours: 4 }, partB: { hours: 8 } };
const STORAGE_KEY = 'studyJobState_v4_fixed';

// --- State ---
let state = {
    settings: { contractId: 'full', focusMode: false, muteSfx: false }, // Added muteSfx
    user: { lifetimeHours: 0, coins: 0, rank: 'Intern', streak: 0, inventory: { vacationTickets: 0 } },
    session: { status: 'idle', startTime: null, tasks: [], isLate: false }
};

// --- DOM Elements ---
const els = {
    // ... (Basic mapping)
    btnClockIn: document.getElementById('btn-clock-in'),
    btnBreak: document.getElementById('btn-break'),
    btnEndBreak: document.getElementById('btn-end-break'), // Important!
    btnClockOut: document.getElementById('btn-clock-out'),
    activeControls: document.getElementById('active-controls'),
    setupControls: document.getElementById('setup-controls'),
    muteSfx: document.getElementById('mute-sfx'), // New Button
    // ... (Rest of elements implied)
    audioClockIn: document.getElementById('audio-clock-in'),
    focusAudio: document.getElementById('focus-audio'),
};

// --- Core Fixes ---

function init() {
    loadState();
    setupEventListeners();
    updateUIState(); // This fixes the button visibility on reload
    setInterval(() => {
        document.getElementById('current-time').textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }, 1000);
}

function updateUIState() {
    const status = state.session.status;
    
    // 1. Toggle Panels
    if (status === 'idle') {
        document.getElementById('setup-controls').classList.remove('hidden');
        document.getElementById('active-controls').classList.add('hidden');
        document.getElementById('work-status').textContent = "OFF SHIFT";
        document.getElementById('work-status').className = "status-badge";
    } else {
        document.getElementById('setup-controls').classList.add('hidden');
        document.getElementById('active-controls').classList.remove('hidden');
        
        // 2. Fix Break Button Logic
        const btnBreak = document.getElementById('btn-break');
        const btnEndBreak = document.getElementById('btn-end-break');
        
        if (status === 'working') {
            document.getElementById('work-status').textContent = "WORKING";
            document.getElementById('work-status').className = "status-badge status-working";
            btnBreak.classList.remove('hidden'); // Show Break
            btnEndBreak.classList.add('hidden'); // Hide End Break
            
            // Resume Audio if Focus Mode is ON
            if(state.settings.focusMode && !state.settings.muteSfx) els.focusAudio.play().catch(()=>{});

        } else if (status === 'break') {
            document.getElementById('work-status').textContent = "ON BREAK";
            document.getElementById('work-status').className = "status-badge status-break";
            btnBreak.classList.add('hidden'); // Hide Break
            btnEndBreak.classList.remove('hidden'); // Show End Break (Fixes glitch)
            
            els.focusAudio.pause(); // Always pause audio on break
        }
    }
}

function clockIn() {
    // Collect Tasks
    const tasks = [];
    [1,2,3].forEach(i => {
        const val = document.getElementById(`task-input-${i}`).value;
        if(val) tasks.push({text: val, done: false});
    });

    state.session = { 
        status: 'working', 
        startTime: Date.now(), 
        tasks: tasks, 
        isLate: false 
    };
    
    playSound('in');
    saveState();
    updateUIState();
}

function startBreak() {
    state.session.status = 'break';
    saveState();
    updateUIState();
}

function endBreak() {
    state.session.status = 'working';
    saveState();
    updateUIState(); // This will bring back the "Take Break" button
}

function clockOut() {
    if(state.session.status === 'idle') return;
    
    // Logic for Hours & Coins (Simplified for brevity)
    const now = Date.now();
    const hours = (now - state.session.startTime) / (1000 * 60 * 60);
    const coins = Math.floor(hours * 10);
    
    // --- New Rating Logic (The Fairness Update) ---
    // If you completed all tasks -> Excellent (regardless of time)
    // If you worked > 4 hours -> Excellent
    const completedTasks = state.session.tasks.filter(t => t.done).length;
    const totalTasks = state.session.tasks.length;
    
    let rating = "Good";
    if (totalTasks > 0 && completedTasks === totalTasks) {
        rating = "Excellent (Productivity King 👑)";
        state.user.coins += 20; // Extra bonus
    } else if (hours > 4) {
        rating = "Excellent (Hard Worker 💪)";
    } else if (completedTasks === 0 && hours < 1) {
        rating = "Needs Improvement";
    }

    state.user.coins += coins;
    state.session.status = 'idle';
    
    playSound('out');
    saveState();
    updateUIState();
    
    alert(`Shift Over!\nRating: ${rating}\nEarned: ${coins} Coins`);
}

// Helper: Sound System
function playSound(type) {
    if (state.settings.muteSfx) return; // Silent Mode
    
    if (type === 'in') document.getElementById('audio-clock-in').play().catch(()=>{});
    if (type === 'out') document.getElementById('audio-clock-out').play().catch(()=>{});
}

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
document.getElementById('btn-clock-in').addEventListener('click', clockIn);
document.getElementById('btn-break').addEventListener('click', startBreak);
document.getElementById('btn-end-break').addEventListener('click', endBreak);
document.getElementById('btn-clock-out').addEventListener('click', clockOut);
document.getElementById('mute-sfx').addEventListener('change', (e) => {
    state.settings.muteSfx = e.target.checked;
    if(e.target.checked) els.focusAudio.pause();
    saveState();
});

// Mock Save/Load
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function loadState() { 
    const s = localStorage.getItem(STORAGE_KEY); 
    if(s) state = JSON.parse(s); 
}