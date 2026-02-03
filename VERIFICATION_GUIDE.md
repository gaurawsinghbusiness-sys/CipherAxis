# 🧪 CipherAxis Testing & Verification Guide

Follow these steps to ensure the entire multi-agent system is running at 100% capacity.

## 1. Prerequisites (Setup)

Ensure your environment is ready:

- [ ] **Check .env**: Ensure `GEMINI_API_KEY` is set correctly.
- [ ] **Install Deps**: `npm install` (to ensure LangChain is ready).
- [ ] **Start/Restart Server** (Crucial after any code edits!):
  ```bash
  node backend/server.js
  ```
- [ ] **Open Dashboard**: Go to [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)

---

## 2. Verify Agent Connectivity

- [ ] Check the **Agent Status** panel on the left of the dashboard.
- [ ] Verify **ARCHIMEDES**, **VULCAN**, and **NOVA** show a green "Idle" or "Connected" status.
- [ ] _If they are offline, check your terminal for connection errors._

---

## 3. Run a Mission (End-to-End Test)

1.  **Select a Topic**: Type something specific like: `"Add a 'Binary to Decimal' converter button to the calculator with a neon pink glow."`
2.  **Execute**: Hit the **EXECUTE MISSION** button.
3.  **Observe the Chain**:
    - You should see **ARCHIMEDES** start the analysis first.
    - The logs should say: `[ARCHIMEDES] Analyzing request with LangChain [Deep]...`
    - Watch the sequence: Archimedes -> Prism -> Vulcan -> Nova.
4.  **Verify Robustness**: If the API is slow, you might see "Retrying..." logs—this is LangChain keeping the system alive!

---

## 4. Preview & Go Live

1.  **Check Sandbox**: Look at the **Mission Control Preview** window in the dashboard. It loads `app_dev.html`.
2.  **Refresh**: Click the **🔄 REFRESH** button in the preview header to see the updated calculator.
3.  **Push to Production**:
    - Click **🚀 PUSH TO PRODUCTION**.
    - Confirm the popup.
    - Click the **🌍 View Production Site** link at the bottom of the preview panel.
    - Verify that it now shows your new "Neon Pink" conversion features.

---

## 5. Audit the Logs

Check these files in the `logs/` directory:

- **logs/agents.log**: Detailed "Chain of Thought" for every agent.
- **logs/error.log**: Should be empty (or only have old errors). New errors will appear here with timestamps.
- **footprints/pre_prod_backups/**: Verify a backup was created during your "Push to Production".

---

**Mission Accomplished?** If you see your changes on the live site, the system is 100% robust. 🚀⚖️
