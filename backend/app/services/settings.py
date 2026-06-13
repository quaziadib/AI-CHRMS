import calendar
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.system_setting import SystemSetting


def _add_months(dt: datetime, months: int) -> datetime:
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def get_or_create_settings(db: Session) -> SystemSetting:
    row = db.query(SystemSetting).filter(SystemSetting.id == 1).first()
    if row:
        return row
    row = SystemSetting(
        id=1,
        resubmit_interval_months=settings.RESUBMIT_INTERVAL_MONTHS_DEFAULT,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_resubmit_interval_months(db: Session) -> int:
    return get_or_create_settings(db).resubmit_interval_months


def update_resubmit_interval_months(db: Session, months: int, admin_id: str) -> SystemSetting:
    row = get_or_create_settings(db)
    row.resubmit_interval_months = months
    row.updated_by = admin_id
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return row
