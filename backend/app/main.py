from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import init_db, get_db, SessionLocal
from app.models import Event
from app.seed.seed_data import seed_database

# Routers
from app.routers import (
    dashboard,
    events,
    dependencies,
    replay,
    audit,
    experiments,
    rules
)

def setup_application_db():
    """Ensure database schema exists and initial seed data is loaded."""
    init_db()
    db = SessionLocal()
    try:
        seed_database(db, target_count=10000)
    finally:
        db.close()

# Execute DB setup immediately on module load so SQLite tables exist for all test & app contexts
setup_application_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_application_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Safe Historical Replay Platform for Healthcare Integrations (Synthetic Demo)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(dependencies.router)
app.include_router(replay.router)
app.include_router(audit.router)
app.include_router(experiments.router)
app.include_router(rules.router)

@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    event_count = db.query(Event).count()
    return {
        "status": "OK",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "CONNECTED",
        "synthetic_event_count": event_count,
        "timestamp": datetime.utcnow().isoformat()
    }
