from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ReplayRule
from app.schemas import RuleResponse, RuleUpdateInput

router = APIRouter(prefix="/api/rules", tags=["Safety Rules"])

@router.get("", response_model=List[RuleResponse])
def get_rules(db: Session = Depends(get_db)):
    rules = db.query(ReplayRule).order_by(ReplayRule.id.asc()).all()
    return [
        RuleResponse(
            id=r.id,
            rule_key=r.rule_key,
            name=r.name,
            description=r.description,
            is_enabled=r.is_enabled,
            category=r.category
        )
        for r in rules
    ]

@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: int, payload: RuleUpdateInput, db: Session = Depends(get_db)):
    rule = db.query(ReplayRule).filter(ReplayRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule ID '{rule_id}' not found.")

    rule.is_enabled = payload.is_enabled
    db.commit()
    db.refresh(rule)

    return RuleResponse(
        id=rule.id,
        rule_key=rule.rule_key,
        name=rule.name,
        description=rule.description,
        is_enabled=rule.is_enabled,
        category=rule.category
    )
