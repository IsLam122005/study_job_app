# 💼 StudyJob Pro (CEO Edition V4.0)

![Version](https://img.shields.io/badge/version-4.0-blue.svg)
![Status](https://img.shields.io/badge/status-Stable-success.svg)
![Technology](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-orange.svg)

**StudyJob Pro** is a gamified productivity application that transforms your study sessions into a professional career simulation. By treating studying like a "9-to-5 job," it leverages behavioral psychology to boost discipline, focus, and consistency.

---

## 🚀 What's New in V4.0 (CEO Update)

This version introduces advanced management features to give you full control over your career data and productivity:

* **💾 Data Backup & Restore:** Never lose your progress. Export your career data to a JSON file and restore it on any device.
* **🎫 Vacation System:** Going on a trip? Buy **Vacation Tickets** from the shop to freeze your streak if you miss a day.
* **✅ Task-Based Bonuses:** Define 3 key tasks before your shift. Checking them off earns you **extra coins**.
* **📅 Weekly Performance Review:** Get a detailed report every 7 days with an HR rating based on your total hours and punctuality.

---

## ✨ Key Features

### 🏢 Work Contracts
Choose the commitment level that suits your schedule:
* **Full-Time:** 8 hours/day, 5 days/week (60m break).
* **Part-Time A:** 4 hours/day, 6 days/week (30m break).
* **Part-Time B:** 8 hours/day, 3 days/week (60m break).

### 🎮 Gamification Economy
* **Earn Coins:** Get paid 10 coins/hour (plus overtime & bonuses).
* **Career Ranks:** Climb from **Intern** → **Junior Specialist** → **Senior Manager**.
* **Shop:** Spend coins on visual **Themes** (Gold, Midnight) or **Consumables** (Vacation Tickets).
* **Streaks:** Maintain a daily streak for massive coin bonuses (50 coins every 3 days).

### ⚖️ Strict Corporate Rules
* **Lateness Penalty:** Late clock-ins result in a **10-coin deduction**.
* **Abandonment Penalty:** Leaving the tab without clocking out fines you **15 coins**.
* **Daily Quota:** Strict "One Shift Per Day" policy to prevent burnout and farming.

### 🧠 Focus Tools
* **Focus Mode:** Toggle ambient "Coffee Shop" noise to enter the flow state.
* **Active Timer:** Real-time tracking of work and break durations.

---

## 🛠️ Installation & Usage

### Option 1: Run Locally
1.  Clone or download this repository.
2.  Open the folder.
3.  Double-click `index.html` to launch the app in your browser.

### Option 2: GitHub Pages (Recommended)
Host it for free to access it from your phone:
1.  Upload files to a GitHub Repository.
2.  Go to **Settings** > **Pages**.
3.  Select `main` branch and save.

---

## 📖 How to Use

1.  **Setup:** Enter your name (optional), choose a contract, and set your start time.
2.  **Tasks:** (Optional) List top 3 tasks for the session.
3.  **Clock In:** Click the button within the 10-minute grace period to avoid penalties.
4.  **Work:** Keep the tab open. Use "Focus Mode" for audio.
5.  **Clock Out:** When finished, click Clock Out to save your hours and earn coins.
6.  **Backup:** Periodically click the 💾 icon to save your progress file.

---

## 🎨 Themes

* **Pro Blue:** Default professional look.
* **Executive Gold:** Unlocked for 50 Coins.
* **Midnight Elite:** Unlocked for 100 Coins.

---

## 🛡️ Technical Details

* **Storage:** Uses browser `localStorage` for persistence.
* **Audio:** Integration with Google Actions sounds for UI feedback.
* **Logic:** Custom JavaScript state management with "Heartbeat" mechanism to prevent data loss on refresh.

---

*Built with ❤️ for productivity enthusiasts.*
