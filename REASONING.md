# Reasoning

## Reading the brief

The storyline names five hard requirements buried in prose:
1. Check-in / check-out with a fee charged at check-out.
2. Tiered pricing (first hour ≠ later hours) with a daily cap, and
   round-up on part-hours.
3. Multiple spot **types** (compact / standard / EV), with EVs constrained
   to EV spots specifically — not just "any free spot."
4. A live "is an EV spot free?" query — this is availability *by type*,
   not just a spot count.
5. Plate lookup that stays fast as the log grows — i.e. search, not
   "scroll the whole table."

The parenthetical ("build it for any garage, not one") was the signal to
keep level/type counts as seed data, not hard-coded logic — `main.py`'s
`seed_spots()` is the only place garage layout is defined, and the billing
constants live in one place (`billing.py`) so both are easy to retune
without touching request-handling code.

## Design decisions

- **Fee = its own module.** `billing.py` has no FastAPI or SQLAlchemy
  imports — it's pure functions on `datetime` objects. That made it
  possible to unit-test the tiering/cap/round-up logic directly (see
  Testing below) without spinning up the API or a database.
- **Daily cap applied per 24-hour block, not once overall.** The brief
  says "so nobody is overcharged for a long stay" — a single global cap
  would make a 5-day stay free after day one, which isn't a real cap,
  it's a loophole. Billing consecutive capped blocks means a long stay
  is still bounded per day, just never uncapped.
- **One active session per plate.** Check-in rejects a plate that's
  already checked in (HTTP 400) rather than silently creating a second
  session — otherwise the same car could occupy two spots in the data
  model, which is the double-parking bug from the other direction.
- **Spot assignment is atomic-enough for a single-attendant garage:**
  check-in queries for a free spot of the requested type and flips
  `is_occupied` in the same request/transaction. Good enough for the
  scope here; a multi-attendant, high-concurrency version would need a
  row lock or `SELECT ... FOR UPDATE` to fully rule out a race between
  two simultaneous check-ins for the last spot of a type.
- **JWT over sessions/cookies** — stateless, and the frontend is a
  separate Angular dev server (different port) talking to the API, so
  a bearer token avoids cross-origin cookie complications entirely.
- **SQLite over Postgres** — zero extra services to install/run inside
  Codespaces, while still being a real relational schema with a foreign
  key (`parking_sessions.spot_id → spots.id`) rather than an in-memory
  dict that vanishes on restart.
- **Search implemented as `ilike` partial match on plate**, not exact
  match — an attendant remembering "ends in AB1234" is a realistic use
  case, and it's cheap at this scale without needing a search index.

## Testing / how issues were found and fixed

- **Backend:** ran the FastAPI app locally with `uvicorn` and drove the
  full flow with `curl` — register → login → check spot availability →
  check in an EV → check in a compact → attempt a duplicate check-in
  (confirmed it's rejected) → check out → confirm the freed spot shows
  back up in `/api/spots/availability`.
- **Billing logic:** exercised `calculate_fee()` directly for 0.5h, 1h,
  2h, 5h, 10h, 24h, 30h, 48h, and 50h stays and checked each result by
  hand against the tiering rule, which is what caught that a *global*
  cap (rather than a per-24h-block cap) would have let a multi-day stay
  go free after the first day — the per-block version fixed that.
- **Frontend:** ran `ng build` to catch template/type errors before
  ever loading it in a browser, then `npm install` + `ng serve` against
  the running backend to confirm the check-in form, live availability
  cards, and the search/sort/paginate table actually round-trip through
  the proxy to the real API.
-
