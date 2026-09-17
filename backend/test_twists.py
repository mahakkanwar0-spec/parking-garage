import unittest
from datetime import datetime, timedelta

from fastapi.security import OAuth2PasswordRequestForm

from app import models, schemas
from app.database import SessionLocal
from app.main import import_rates, auto_close_overdue_sessions, transfer_session, register, login


class TwistFeatureTests(unittest.TestCase):
    def reset_db(self):
        db = SessionLocal()
        try:
            db.query(models.ParkingSession).delete()
            db.query(models.Spot).delete()
            db.query(models.User).delete()
            db.query(models.SpotRate).delete()
            db.commit()
        finally:
            db.close()

    def seed_spots(self):
        db = SessionLocal()
        try:
            for level in range(1, 4):
                for i in range(1, 9):
                    db.add(models.Spot(spot_number=f"L{level}-C{i}", level=level, type=models.SpotType.compact))
                    db.add(models.Spot(spot_number=f"L{level}-S{i}", level=level, type=models.SpotType.standard))
                for i in range(1, 3):
                    db.add(models.Spot(spot_number=f"L{level}-EV{i}", level=level, type=models.SpotType.ev))
            db.commit()
        finally:
            db.close()

    def make_user(self, username="admin", password="admin123"):
        db = SessionLocal()
        try:
            user = db.query(models.User).filter(models.User.username == username).first()
            if user is None:
                user = register(schemas.UserCreate(username=username, password=password), db=db)
                db.refresh(user)
            return user
        finally:
            db.close()

    def test_rate_import_and_cleanup(self):
        self.reset_db()
        self.seed_spots()
        user = self.make_user()
        db = SessionLocal()
        try:
            payload = schemas.RateImportRequest(rows=[
                schemas.RateImportRow(spot_type=models.SpotType.compact, raw="compact | ₹ 80 / hour | junk 99"),
                schemas.RateImportRow(spot_type=models.SpotType.standard, raw="standard || 120 per hr // old rate"),
                schemas.RateImportRow(spot_type=models.SpotType.ev, raw="EV | 150/hr | out of order"),
            ])
            response = import_rates(payload=payload, db=db, current_user=user)
            self.assertEqual(response['count'], 3)
            self.assertTrue(any(r['spot_type'] == models.SpotType.compact and r['cleaned_rate'] == 80.0 for r in response['rates']))
            self.assertTrue(any(r['spot_type'] == models.SpotType.standard and r['cleaned_rate'] == 120.0 for r in response['rates']))
        finally:
            db.close()

    def test_clock_auto_closes_sessions_over_24h(self):
        self.reset_db()
        self.seed_spots()
        user = self.make_user()
        db = SessionLocal()
        try:
            spot = db.query(models.Spot).filter(models.Spot.type == models.SpotType.standard).first()
            db.add(models.ParkingSession(
                plate='ABC-111',
                vehicle_type=models.SpotType.standard,
                spot_id=spot.id,
                check_in_time=datetime.utcnow() - timedelta(hours=25),
                status=models.SessionStatus.active,
            ))
            db.commit()
            result = auto_close_overdue_sessions(db=db, current_user=user)
            self.assertGreaterEqual(result['closed'], 1)
            self.assertEqual(result['sessions'][0].status, models.SessionStatus.completed)
        finally:
            db.close()

    def test_transfer_keeps_spot_and_entry_time(self):
        self.reset_db()
        self.seed_spots()
        user = self.make_user()
        db = SessionLocal()
        try:
            spot = db.query(models.Spot).filter(models.Spot.type == models.SpotType.compact).first()
            check_in = datetime.utcnow() - timedelta(hours=2)
            session = models.ParkingSession(
                plate='OLD-PLATE',
                vehicle_type=models.SpotType.compact,
                spot_id=spot.id,
                check_in_time=check_in,
                status=models.SessionStatus.active,
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            updated = transfer_session(session_id=session.id, payload=schemas.TransferSessionRequest(new_plate='NEW-PLATE'), db=db, current_user=user)
            self.assertEqual(updated.plate, 'NEW-PLATE')
            self.assertEqual(updated.spot_id, spot.id)
            self.assertIsNotNone(updated.check_in_time)
        finally:
            db.close()


if __name__ == '__main__':
    unittest.main()
