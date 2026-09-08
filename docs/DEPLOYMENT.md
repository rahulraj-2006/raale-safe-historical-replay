# RAALE – Deployment & Prerequisites Checklist

## 1. System Requirements

- **Operating System**: Windows 10 / Windows 11 (PowerShell compatible)
- **Python Environment**: Python 3.11, 3.12, or 3.14.6+ (Virtual Environment `.venv` in `backend/`)
- **Node.js Environment**: Node.js LTS (18+ or 20+) with npm (for `frontend/`)
- **Database**: SQLite 3 (Auto-created at `data/raale.db`)
- **External Dependencies**: NONE (No Docker, Redis, Kafka, PostgreSQL, or Paid APIs required)

## 2. Deployment Verification Checklist

- [x] **Folder Structure Created**: `D:\Users\welcome\Documents\Raale project`
- [x] **Backend Virtualenv Set Up**: `backend/.venv` created and populated with FastAPI, Uvicorn, SQLAlchemy, Pydantic, Pytest.
- [x] **SQLite Database Auto-Initialized**: `data/raale.db` created with 10,000+ synthetic historical events.
- [x] **Backend API Operational**: GET `/api/health` returns status OK and synthetic event count.
- [x] **Automated Tests Passing**: `python -m pytest -q` passes 13/13 tests cleanly.
- [x] **Frontend Configured**: Complete Vite + React + TypeScript + Tailwind CSS structure in `frontend/`.
- [x] **Startup Automation**: `start.bat` created for automated execution on Windows.
- [x] **Documentation Complete**: Architecture, User Guide, Test Results, Ethics, and Deployment docs generated.
