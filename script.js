// --- Configuration & Constants ---
const CONTRACTS = {
    full: { label: "Full-Time (8h)", hours: 8, breakLimit: 60 },
    partA: { label: "Part-Time A (4h)", hours: 4, breakLimit: 30 },
    partB: { label: "Part-Time B (8h)", hours: 8, breakLimit: 60 }
};

const RANKS = [
    { label: "Intern", minHours: 0, maxHours: 50 },
    { label: "Junior Specialist", minHours: 51, maxHours: 200 },
    { label: "Senior Manager", minHours: 201, maxHours: Infinity }
];

const THEMES = {
    'default': { label: 'Pro Blue', cost: 0 },
    'gold': { label: 'Executive Gold', cost: 50 },
    'midnight': { label: 'Midnight Elite', cost: 100 }
};

const ITEMS = {
    'vacation_ticket': { label: 'Vacation Ticket', cost: 200 }
};

const STORAGE_KEY = 'studyJobState_v4';

// --- State Management ---
let state = {
    settings: {
        contractId: 'full',
        shiftStart: '09:00',
        focusMode: false
    },
    user: {
        lifetimeHours: 0,
        coins: 0,
        rank: 'Intern',
        unlockedThemes: ['default'],
        currentTheme: 'default',
        streak: 0,
        lastActiveDate: null,
        // V4.0 Fields
        inventory: {
            vacationTickets: 0
        },
        lastWeeklyReviewDate: null
    },
    session: {
        status: 'idle', // idle, working, break
        startTime: null,
        breakStartTime: null,
        totalBreakTime: 0,
        isLate: false,
        gracePeriodUsed: false,
        lastHeartbeat: null,
        // V4.0 Fields
        tasks: [] // { text: "Task 1", done: false }
    },
    history: []
};

// --- DOM References ---
const els = {
    // Basics
    timeDisplay: document.getElementById('current-time'),
    rankBadge: document.getElementById('current-rank'),
    rankProgress: document.getElementById('rank-progress'),
    streakCount: document.getElementById('streak-count'),
    ticketCount: document.getElementById('ticket-count'), // V4.0

    // Stats
    totalHours: document.getElementById('total-hours'),
    coinBalance: document.getElementById('coin-balance'),
    commitmentScore: document.getElementById('commitment-score'),

    // HR
    hrMessage: document.getElementById('hr-message'),
    hrSection: document.getElementById('hr-section'),

    // Controls
    setupControls: document.getElementById('setup-controls'),
    activeControls: document.getElementById('active-controls'),
    contractSelect: document.getElementById('contract-select'),
    shiftStartInput: document.getElementById('shift-start'),
    focusToggle: document.getElementById('focus-toggle'),
    focusAudio: document.getElementById('focus-audio'),

    // V4.0 Task Inputs
    taskInputs: [
        document.getElementById('task-input-1'),
        document.getElementById('task-input-2'),
        document.getElementById('task-input-3')
    ],
    activeTasksList: document.getElementById('active-tasks-list'),

    // Buttons
    btnClockIn: document.getElementById('btn-clock-in'),
    btnBreak: document.getElementById('btn-break'),
    btnEndBreak: document.getElementById('btn-end-break'),
    btnClockOut: document.getElementById('btn-clock-out'),
    btnOpenShop: document.getElementById('btn-open-shop'),
    btnBackup: document.getElementById('btn-backup'), // V4.0
    btnRestore: document.getElementById('btn-restore'), // V4.0
    importFile: document.getElementById('import-file'), // V4.0

    // Modals
    shopModal: document.getElementById('shop-modal'),
    reportModal: document.getElementById('report-modal'),
    weeklyModal: document.getElementById('weekly-modal'), // V4.0
    shopCoinBalance: document.getElementById('shop-coin-balance'),

    // Report Fields
    reportHours: document.getElementById('report-hours'),
    reportBaseCoins: document.getElementById('report-base-coins'),
    reportOvertimeCoins: document.getElementById('report-overtime-coins'),
    reportTaskCoins: document.getElementById('report-task-coins'), // V4.0
    reportStreakCoins: document.getElementById('report-streak-coins'),
    reportPenaltyCoins: document.getElementById('report-penalty-coins'),
    reportTotalCoins: document.getElementById('report-total-coins'),

    // Weekly Report Fields (V4.0)
    weeklyHours: document.getElementById('weekly-hours'),
    weeklyCoins: document.getElementById('weekly-coins'),
    weeklyLates: document.getElementById('weekly-lates'),
    weeklyRating: document.getElementById('weekly-rating'),

    // Timer
    sessionTimer: document.getElementById('session-timer'),
    currentContract: document.getElementById('current-contract'),
    startTimeDisplay: document.getElementById('start-time-display'),
    breakTimer: document.getElementById('break-timer'),
    breakLimit: document.getElementById('break-limit'),
    workStatus: document.getElementById('work-status'),

    // History
    historyTableBody: document.querySelector('#history-table tbody'),

    // Audio
    audioClockIn: document.getElementById('audio-clock-in'),
    audioClockOut: document.getElementById('audio-clock-out')
};

// --- Helpers ---
function getLocalISODate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function roundOneDecimal(num) { return Math.round(num * 10) / 10; }
function getDayDifference(date1Str, date2Str) {
    if (!date1Str || !date2Str) return null;
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
function formatDuration(ms) {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const h = Math.floor((ms / (1000 * 60 * 60)));
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Initialization ---
function init() {
    loadState();
    DataMigration();
    setupEventListeners();
    handleSessionRestoration();

    applyTheme(state.user.currentTheme);
    checkDailyLimit();
    updateDashboard();
    updateUIState();

    setInterval(updateTime, 1000);
    setInterval(updateTimers, 1000);
    setInterval(sendHeartbeat, 5000);
    updateTime();
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        state = JSON.parse(saved);
        return;
    }
    // V3 Migration
    const v3Key = 'studyJobState_v3';
    const v3Data = localStorage.getItem(v3Key);
    if (v3Data) {
        let v3 = JSON.parse(v3Data);
        state.settings = v3.settings;
        state.user = { ...state.user, ...v3.user };
        state.session = { ...state.session, ...v3.session };
        state.history = v3.history;
        localStorage.removeItem(v3Key);
    }
}
function DataMigration() {
    // Ensure V4 fields
    if (!state.user.inventory) state.user.inventory = { vacationTickets: 0 };
    if (!state.session.tasks) state.session.tasks = [];
    if (state.user.lastWeeklyReviewDate === undefined) state.user.lastWeeklyReviewDate = null;
    // Fix existing task structure if needed
    if (!Array.isArray(state.session.tasks)) state.session.tasks = [];
}
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Data Backup & Restore (V4.0) ---
function exportData() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `studyjob_backup_${getLocalISODate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.user && imported.history) {
                state = imported;
                saveState();
                alert('Data restored successfully! Refreshing...');
                location.reload();
            } else {
                alert('Invalid backup file format.');
            }
        } catch (err) {
            alert('Error parsing backup file.');
        }
    };
    reader.readAsText(file);
}

// --- Event Listeners ---
function setupEventListeners() {
    // Clock Logic
    els.btnClockIn.addEventListener('click', clockIn);
    els.btnBreak.addEventListener('click', startBreak);
    els.btnEndBreak.addEventListener('click', endBreak);
    els.btnClockOut.addEventListener('click', clockOut);

    // Inputs
    els.contractSelect.addEventListener('change', (e) => {
        state.settings.contractId = e.target.value;
        saveState();
    });
    els.shiftStartInput.addEventListener('change', (e) => {
        state.settings.shiftStart = e.target.value;
        saveState();
    });
    els.focusToggle.addEventListener('change', (e) => {
        state.settings.focusMode = e.target.checked;
        updateAudioState();
        saveState();
    });

    // Shops & Modals
    els.btnOpenShop.addEventListener('click', () => {
        updateShopUI();
        els.shopModal.classList.remove('hidden');
    });
    document.querySelector('#shop-modal .close-modal').addEventListener('click', () => els.shopModal.classList.add('hidden'));

    document.querySelector('#report-modal .close-modal').addEventListener('click', () => els.reportModal.classList.add('hidden'));
    document.getElementById('btn-close-report').addEventListener('click', () => els.reportModal.classList.add('hidden'));

    document.querySelector('#weekly-modal .close-modal').addEventListener('click', () => els.weeklyModal.classList.add('hidden'));
    document.getElementById('btn-close-weekly').addEventListener('click', () => els.weeklyModal.classList.add('hidden'));

    // Shop Buying Delegation
    els.shopModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-shop')) {
            // Theme Buy/Equip
            const card = e.target.closest('.shop-card');
            const themeId = card.dataset.themeId;
            buyTheme(themeId);
        } else if (e.target.classList.contains('btn-buy-item')) {
            // Item Buy
            const card = e.target.closest('.shop-card');
            const itemId = card.dataset.itemId;
            buyItem(itemId);
        }
    });

    // Backup (V4.0)
    els.btnBackup.addEventListener('click', exportData);
    els.btnRestore.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', importData);

    // Task Checkboxes (V4.0 Delegation)
    els.activeTasksList.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const idx = parseInt(e.target.dataset.index);
            state.session.tasks[idx].done = e.target.checked;
            saveState();
        }
    });
}

// --- Shop Logic ---
function updateShopUI() {
    els.shopCoinBalance.textContent = state.user.coins;

    // Themes
    document.querySelectorAll('[data-theme-id]').forEach(card => {
        const id = card.dataset.themeId;
        const btn = card.querySelector('.btn-shop');
        if (state.user.unlockedThemes.includes(id)) {
            if (state.user.currentTheme === id) {
                btn.textContent = "Equipped";
                btn.disabled = true;
                btn.style.backgroundColor = 'var(--accent-success)';
            } else {
                btn.textContent = "Equip";
                btn.disabled = false;
                btn.style.backgroundColor = 'var(--brand-primary)';
                btn.onclick = () => applyTheme(id); // Direct reassignment safe here? using delegation above actually.
                // Delegation handles calls. We just set visuals here.
            }
            const cost = card.querySelector('.cost');
            if (cost) cost.style.display = 'none';
        }
    });
}

function buyTheme(themeId) {
    if (state.user.unlockedThemes.includes(themeId)) {
        applyTheme(themeId);
        return;
    }
    const cost = THEMES[themeId].cost;
    if (state.user.coins >= cost) {
        state.user.coins -= cost;
        state.user.unlockedThemes.push(themeId);
        applyTheme(themeId);
        alert(`Purchased ${THEMES[themeId].label}!`);
    } else {
        alert("Insufficient Funds!");
    }
    updateDashboard();
}

function buyItem(itemId) {
    const cost = ITEMS[itemId].cost;
    if (state.user.coins >= cost) {
        state.user.coins -= cost;
        if (itemId === 'vacation_ticket') {
            state.user.inventory.vacationTickets++;
            alert("Purchased 1 Vacation Ticket! 🎫");
        }
    } else {
        alert("Insufficient Funds!");
    }
    updateDashboard();
}

function applyTheme(themeId) {
    state.user.currentTheme = themeId;
    document.body.setAttribute('data-theme', themeId);
    checkDailyLimit(); // Color override check
    saveState();
    updateShopUI();
}

// --- Core Shift Logic ---

function checkDailyLimit() {
    const today = getLocalISODate();
    const alreadyWorked = state.history.some(entry => entry.date === today);

    if (alreadyWorked && state.session.status === 'idle') {
        els.btnClockIn.disabled = true;
        els.btnClockIn.textContent = "Shift Completed";
        els.btnClockIn.style.backgroundColor = 'var(--bg-card)';
        els.btnClockIn.style.cursor = 'not-allowed';
        return true;
    } else {
        els.btnClockIn.disabled = false;
        els.btnClockIn.textContent = "Clock In";
        els.btnClockIn.style.backgroundColor = '';
        els.btnClockIn.style.cursor = 'pointer';
        return false;
    }
}

function clockIn() {
    if (checkDailyLimit()) return;

    // V4.0: Capture Tasks
    const taskList = [];
    els.taskInputs.forEach(input => {
        if (input.value.trim() !== "") {
            taskList.push({ text: input.value.trim(), done: false });
        }
        input.value = ""; // Clear
    });
    // If no tasks entered, default empty
    state.session.tasks = taskList;

    els.audioClockOut.load();
    els.audioClockIn.play().catch(e => { });

    const now = new Date();
    const [tHour, tMinute] = state.settings.shiftStart.split(':').map(Number);
    const target = new Date(now); target.setHours(tHour, tMinute, 0, 0);
    const diffMins = (now - target) / 60000;
    const isLate = diffMins > 10;

    state.session.status = 'working';
    state.session.startTime = now.getTime();
    state.session.isLate = isLate;
    state.session.gracePeriodUsed = (diffMins > 0 && diffMins <= 10);
    state.session.lastHeartbeat = Date.now();

    saveState();
    updateUIState();
    updateAudioState();
}

function clockOut() {
    if (state.session.status === 'idle') return;
    if (state.session.status === 'break') {
        state.session.totalBreakTime += (Date.now() - state.session.breakStartTime);
    }

    const now = Date.now();
    const rawDuration = now - state.session.startTime;
    const contract = CONTRACTS[state.settings.contractId];

    let netHours = Math.max(0, (rawDuration - state.session.totalBreakTime) / (1000 * 60 * 60));
    netHours = roundOneDecimal(netHours);

    // Earnings
    let coinRate = 10;
    let baseHours = Math.min(netHours, contract.hours);
    let overtimeHours = Math.max(0, netHours - contract.hours);

    let baseEarnings = Math.floor(baseHours * coinRate);
    let overtimeEarnings = Math.floor(overtimeHours * (coinRate * 1.5));
    let earnedCoins = baseEarnings + overtimeEarnings;

    // Lateness
    let latenessPenalty = state.session.isLate ? 10 : 0;
    earnedCoins = Math.max(0, earnedCoins - latenessPenalty);

    // V4.0: Task Bonus
    let taskBonus = 0;
    if (state.session.tasks) {
        const completedCount = state.session.tasks.filter(t => t.done).length;
        taskBonus = completedCount * 5;
        earnedCoins += taskBonus;
    }

    // Streak Logic (V4.0 Vacation Update)
    const todayStr = getLocalISODate();
    let streakBonus = 0;
    let savedByTicket = false;

    if (state.user.lastActiveDate) {
        const diffDays = getDayDifference(state.user.lastActiveDate, todayStr);
        if (diffDays === 1) {
            state.user.streak++;
        } else if (diffDays > 1) {
            // Broken streak? Check Ticket
            if (state.user.inventory.vacationTickets > 0) {
                state.user.inventory.vacationTickets--;
                savedByTicket = true;
                // Streak Maintained (No increment, just keep it? Or increment? 
                // "Save streak" usually means don't reset. Let's not increment to avoid farming, just maintain level.)
                // Actually, if I work today after a gap, and use a ticket for the gap, today counts.
                // But simplified: Ticket prevents reset.
                state.user.streak++; // Increment for today's work
            } else {
                state.user.streak = 1; // Reset
            }
        }
    } else {
        state.user.streak = 1;
    }
    state.user.lastActiveDate = todayStr;

    if (state.user.streak > 0 && state.user.streak % 3 === 0) {
        streakBonus = 50;
        earnedCoins += streakBonus;
        alert(`🔥 3-Day Streak! Bonus 50 Coins! 🔥`);
    }

    if (savedByTicket) {
        alert("🎫 Vacation Ticket Used! Streak Saved.");
    }

    // Update Stats
    state.user.lifetimeHours = roundOneDecimal(state.user.lifetimeHours + netHours);
    state.user.coins += earnedCoins;

    updateRank();

    // History
    const historyEntry = {
        date: todayStr,
        hours: netHours,
        late: state.session.isLate,
        contractHours: contract.hours,
        coinsEarned: earnedCoins,
        status: state.session.isLate ? 'Late' : (overtimeHours > 0 ? 'Overtime' : 'On Time')
    };
    state.history.push(historyEntry);
    if (state.history.length > 100) state.history = state.history.slice(-100);

    // Reset Session
    state.session = {
        status: 'idle',
        startTime: null, lastHeartbeat: null,
        breakStartTime: null, totalBreakTime: 0,
        isLate: false, gracePeriodUsed: false, tasks: []
    };

    els.audioClockOut.play().catch(e => { });
    saveState();

    // UI
    checkDailyLimit();
    updateUIState();
    updateDashboard();
    updateAudioState();
    renderHistory();

    showReport(netHours, baseEarnings, overtimeEarnings, streakBonus, latenessPenalty, taskBonus, earnedCoins);

    // V4.0: Weekly Review Check
    checkWeeklyReview();
}

// --- V4.0 Weekly Review ---
function checkWeeklyReview() {
    const today = new Date();
    const lastRev = state.user.lastWeeklyReviewDate ? new Date(state.user.lastWeeklyReviewDate) : null;

    // Logic: If no last review OR > 7 days since last review
    let due = false;
    if (!lastRev) {
        due = true; // First time
    } else {
        const diffStats = (today - lastRev) / (1000 * 60 * 60 * 24);
        if (diffStats >= 7) due = true;
    }

    if (due) {
        showWeeklyReport();
        state.user.lastWeeklyReviewDate = getLocalISODate();
        saveState();
    }
}

function showWeeklyReport() {
    // Aggregate last 7 days from history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekEntries = state.history.filter(entry => new Date(entry.date) >= sevenDaysAgo);

    const totalHours = weekEntries.reduce((acc, cur) => acc + cur.hours, 0);
    const totalCoins = weekEntries.reduce((acc, cur) => acc + cur.coinsEarned, 0);
    const totalLates = weekEntries.filter(e => e.late).length;

    // Rating
    let rating = "Needs Improvement";
    if (totalHours >= 30) rating = "Excellent";
    else if (totalHours >= 15) rating = "Good";

    els.weeklyHours.textContent = roundOneDecimal(totalHours) + 'h';
    els.weeklyCoins.textContent = totalCoins + ' 🪙';
    els.weeklyLates.textContent = totalLates;
    els.weeklyRating.textContent = rating;

    if (rating === "Excellent") els.weeklyRating.style.color = "var(--accent-success)";
    else if (rating === "Good") els.weeklyRating.style.color = "var(--accent-primary)";
    else els.weeklyRating.style.color = "var(--accent-warning)";

    els.weeklyModal.classList.remove('hidden');
}

// --- Dashboard & Timers ---

function updateDashboard() {
    els.totalHours.textContent = state.user.lifetimeHours.toFixed(1) + 'h';
    els.coinBalance.textContent = state.user.coins;
    els.streakCount.textContent = state.user.streak;
    // V4.0 Ticket
    els.ticketCount.textContent = state.user.inventory.vacationTickets;

    const lates = state.history.filter(h => h.late).length;
    let totalScore = Math.max(0, 100 - (lates * 5));
    els.commitmentScore.textContent = totalScore + '%';
    updateRank();
}

function updateUIState() {
    const status = state.session.status;
    const contract = CONTRACTS[state.settings.contractId];

    // V4.0 Tasks Render
    if (status !== 'idle') {
        renderActiveTasks();
        els.activeTasksList.classList.remove('hidden');
    } else {
        els.activeTasksList.classList.add('hidden');
    }

    if (status === 'idle') {
        els.setupControls.classList.remove('hidden');
        els.activeControls.classList.add('hidden');
        els.workStatus.textContent = 'OFF SHIFT';
        els.workStatus.className = 'status-badge';
        checkDailyLimit();
    } else {
        els.setupControls.classList.add('hidden');
        els.activeControls.classList.remove('hidden');

        els.currentContract.textContent = contract.label;
        els.startTimeDisplay.textContent = new Date(state.session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        els.breakLimit.textContent = contract.breakLimit;

        if (status === 'working') {
            els.workStatus.textContent = state.session.isLate ? 'WORKING (LATE)' : 'WORKING';
            els.workStatus.className = state.session.isLate ? 'status-badge status-break' : 'status-badge status-working';
        } else if (status === 'break') {
            els.workStatus.textContent = 'ON BREAK';
            els.workStatus.className = 'status-badge status-break';
        }
    }
}

function renderActiveTasks() {
    els.activeTasksList.innerHTML = '<h4>Current Tasks</h4>';
    if (!state.session.tasks || state.session.tasks.length === 0) {
        els.activeTasksList.innerHTML += '<p style="color:var(--text-secondary); font-size:0.8rem;">No tasks defined.</p>';
        return;
    }

    state.session.tasks.forEach((task, idx) => {
        const div = document.createElement('div');
        div.className = 'task-item';
        // Check if done
        const checked = task.done ? 'checked' : '';
        div.innerHTML = `
            <input type="checkbox" id="task-${idx}" data-index="${idx}" ${checked}>
            <label for="task-${idx}">${task.text}</label>
        `;
        els.activeTasksList.appendChild(div);
    });
}

function sendHeartbeat() {
    if (state.session.status !== 'idle') {
        state.session.lastHeartbeat = Date.now();
        saveState();
    }
}

function handleSessionRestoration() {
    if (state.session.status === 'idle') return;
    const now = Date.now();
    const lastHeartbeat = state.session.lastHeartbeat || state.session.startTime;
    const diff = now - lastHeartbeat;
    if (diff > 60000) {
        applyAbandonmentPenalty();
    } else {
        // Resume
        sendHeartbeat();
    }
}

function applyAbandonmentPenalty() {
    state.user.coins = Math.max(0, state.user.coins - 15);
    state.session = { status: 'idle', startTime: null, lastHeartbeat: null, tasks: [] }; // Reset
    saveState();
    setTimeout(() => {
        alert("⚠️ ABANDONMENT PENALTY: -15 Coins.");
        location.reload();
    }, 500);
}

// ... (Other helpers like startBreak, endBreak, updateRank same as before logic) ...
// Included for completeness in `clockOut` logic above.

// Boilerplate Helpers
function startBreak() {
    if (state.session.status !== 'working') return;
    state.session.status = 'break';
    state.session.breakStartTime = Date.now();
    state.session.lastHeartbeat = Date.now();
    saveState();
    updateUIState();
    updateAudioState();
}

function endBreak() {
    if (state.session.status !== 'break') return;
    state.session.totalBreakTime += (Date.now() - state.session.breakStartTime);
    state.session.breakStartTime = null;
    state.session.status = 'working';
    state.session.lastHeartbeat = Date.now();
    saveState();
    updateUIState();
    updateAudioState();
}

function updateRank() {
    const hrs = state.user.lifetimeHours;
    let nextRank = null;
    let currentRankObj = RANKS[0];
    for (let i = 0; i < RANKS.length; i++) {
        if (hrs >= RANKS[i].minHours) {
            currentRankObj = RANKS[i];
            if (i < RANKS.length - 1) nextRank = RANKS[i + 1];
        }
    }
    state.user.rank = currentRankObj.label;
    els.rankBadge.textContent = state.user.rank;
    if (nextRank) {
        const range = nextRank.minHours - currentRankObj.minHours;
        const progress = hrs - currentRankObj.minHours;
        const pct = Math.min(100, Math.max(0, (progress / range) * 100));
        els.rankProgress.style.width = pct + '%';
        els.rankProgress.parentElement.title = `${Math.round(progress)}/${range} hrs to ${nextRank.label}`;
    } else {
        els.rankProgress.style.width = '100%';
    }
}

function updateTime() {
    const now = new Date();
    els.timeDisplay.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // HR Message
    let msg = "";
    if (checkDailyLimit()) {
        msg = "Daily quota reached.";
        els.hrSection.style.borderLeftColor = 'var(--accent-warning)';
    } else if (state.session.status === 'idle') {
        msg = "Ready for work?";
        els.hrSection.style.borderLeftColor = 'var(--brand-primary)';
    } else {
        msg = "Productivity is key.";
        els.hrSection.style.borderLeftColor = 'var(--accent-success)';
    }
    els.hrMessage.textContent = msg;
}

function updateTimers() {
    if (state.session.status === 'idle') return;
    const now = Date.now();
    const elapsed = now - state.session.startTime;
    els.sessionTimer.textContent = formatDuration(elapsed);

    let currentBreak = state.session.totalBreakTime;
    if (state.session.status === 'break') currentBreak += (now - state.session.breakStartTime);
    const m = Math.floor(currentBreak / 60000);
    els.breakTimer.textContent = `${m}m`;
}

function updateAudioState() {
    if (state.session.status === 'working' && state.settings.focusMode) els.focusAudio.play().catch(e => { });
    else els.focusAudio.pause();
}

function showReport(net, base, over, streak, penalty, taskBonus, total) {
    els.reportHours.textContent = net.toFixed(1) + 'h';
    els.reportBaseCoins.textContent = base + ' 🪙';

    const setRow = (el, val) => {
        if (val > 0) {
            el.textContent = "+" + val + ' 🪙';
            el.parentElement.classList.remove('hidden');
        } else {
            el.parentElement.classList.add('hidden');
        }
    };

    setRow(els.reportOvertimeCoins, over);
    setRow(els.reportStreakCoins, streak);
    setRow(els.reportTaskCoins, taskBonus); // V4.0

    if (penalty > 0) {
        els.reportPenaltyCoins.textContent = '-' + penalty + ' 🪙';
        els.reportPenaltyCoins.parentElement.classList.remove('hidden');
    } else els.reportPenaltyCoins.parentElement.classList.add('hidden');

    els.reportTotalCoins.textContent = total + ' 🪙';
    els.reportModal.classList.remove('hidden');
}

function renderHistory() {
    const tbody = els.historyTableBody;
    tbody.innerHTML = '';
    const recent = state.history.slice(-5).reverse();
    recent.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${entry.date}</td><td>${entry.hours.toFixed(1)}h</td><td>${entry.status || (entry.late ? 'Late' : 'On Time')}</td><td>+${entry.coinsEarned}</td>`;
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', init);
