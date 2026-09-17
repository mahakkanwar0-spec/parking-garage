"""
Tiered parking fee calculation.

Rules:
- First hour costs FIRST_HOUR_RATE.
- Every additional hour costs ADDITIONAL_HOUR_RATE (cheaper than the first).
- A 24-hour block is capped at DAILY_CAP so long stays are never
  overcharged past a full day's rate.
- Multi-day stays are billed as consecutive 24-hour blocks, each
  subject to the same tiering + cap.
- Any part of an hour counts as a full hour (round up).
"""
import math
from datetime import datetime

FIRST_HOUR_RATE = 50.0
ADDITIONAL_HOUR_RATE = 30.0
DAILY_CAP = 300.0


def hours_between(check_in: datetime, check_out: datetime) -> int:
    """Round any partial hour up to the next full hour. Minimum 1 hour."""
    seconds = (check_out - check_in).total_seconds()
    if seconds <= 0:
        return 1
    return max(1, math.ceil(seconds / 3600))


def _fee_for_block(hours_in_block: int) -> float:
    if hours_in_block <= 0:
        return 0.0
    fee = FIRST_HOUR_RATE + max(0, hours_in_block - 1) * ADDITIONAL_HOUR_RATE
    return min(fee, DAILY_CAP)


def calculate_fee(check_in: datetime, check_out: datetime) -> tuple[float, int]:
    """Returns (fee, total_hours_charged)."""
    total_hours = hours_between(check_in, check_out)
    remaining = total_hours
    total_fee = 0.0
    while remaining > 0:
        block = min(remaining, 24)
        total_fee += _fee_for_block(block)
        remaining -= block
    return round(total_fee, 2), total_hours
