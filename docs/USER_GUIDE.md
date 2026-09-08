# RAALE – User Guide & Guided Demonstration

## 1. Quick Start Guide

### Step 1: Start Backend Server
```powershell
cd D:\Users\welcome\Documents\Raale project\backend
.\.venv\Scripts\activate
python run.py
```
Backend will start on `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.

### Step 2: Start Frontend (When Node.js is installed)
```powershell
cd D:\Users\welcome\Documents\Raale project\frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 2. Guided Demonstration Workflow (EVT-DEMO-001)

Follow these steps to demonstrate the end-to-end Safe Replay workflow on the demonstration event `EVT-DEMO-001`:

1. **Launch Demo Event**: Click the **Launch EVT-DEMO-001** button in the top header (or navigate to `/events/EVT-DEMO-001`).
2. **Check Dependencies**: Click **Check Dependencies**. System verifies event existence, payload validity, satisfied prerequisites (`EVT-DEMO-000`), and target snapshot availability (`PATIENT-TEST-00001`). Status displays `PASS`.
3. **Run Dry Run**: Click **Run Dry Run**. The system simulates applying corrected transformation v2.0 without modifying the target. Diffs show `status: pending` -> `completed` and `interpretation: NORMAL`. Risk Level displays `LOW`.
4. **Request Replay**: Ensure role is set to **Integration Engineer** and click **Request Replay**. Status updates to `PENDING_APPROVAL`.
5. **Approve Replay**: Switch role in the header to **Auditor / Operations Manager** and click **Approve Replay**. Status updates to `APPROVED`.
6. **Execute Safe Replay**: Click **Execute Safe Replay** and confirm in the dialog. The mock target is updated, and status changes to `EXECUTED`.
7. **Verify Idempotency**: Click **Execute Safe Replay** again. System blocks execution with message: *"Replay blocked: event has already been successfully replayed."*
8. **Inspect Audit Trail**: Navigate to **Audit Logs** to view complete logged sequence (`DRY_RUN_STARTED`, `DRY_RUN_COMPLETED`, `REPLAY_REQUESTED`, `REPLAY_APPROVED`, `REPLAY_COMPLETED`, `REPLAY_BLOCKED`).

---

## 3. Testing Edge Cases & Failure Safety

Navigate to `/events` and inspect the following pre-configured test candidates:
- `EVT-TEST-DUP-001`: Demonstrates idempotency duplicate replay blocking.
- `EVT-TEST-MIS-DEP`: Demonstrates missing prerequisite dependency blocking.
- `EVT-TEST-TRF-MIS`: Demonstrates transformation version mismatch blocking.
- `EVT-TEST-SNP-CNF`: Demonstrates concurrent target snapshot conflict blocking.
- `EVT-TEST-MAL-PLD`: Demonstrates malformed payload blocking.
