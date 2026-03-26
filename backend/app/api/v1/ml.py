"""ML Engineer endpoints — anonymized data access and prediction stubs."""

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.api.deps import DB, MLUser
from app.services import ml as ml_svc

router = APIRouter()


@router.get("/data")
def get_anonymized_data(
    current_user: MLUser,
    db: DB,
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=2000),
    verified_only: bool = Query(True, description="Return only verified records"),
):
    """Fetch anonymized health records for model training/evaluation.

    All PII (user_id, pid, names) is stripped. Only health metrics are returned.
    Requires consent approval workflow to be respected at the application level.
    """
    return ml_svc.get_anonymized_dataset(db, skip=skip, limit=limit, verified_only=verified_only)


class PredictRequest(BaseModel):
    features: dict


@router.post("/predict")
def predict(
    body: PredictRequest,
    current_user: MLUser,
):
    """Stub endpoint for model inference.

    In a full deployment this would route to a deployed ML model service.
    Returns a placeholder response for MVP.
    """
    return {
        "status": "stub",
        "message": "Model inference endpoint — connect your deployed model here.",
        "features_received": len(body.features),
    }
