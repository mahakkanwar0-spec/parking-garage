# AI Logs

The storyline
A busy multi-level city-centre parking garage. Cars come and go all day, and the attendant needs to check a car in, check it out, and charge the right fee. Rates are tiered — the first hour is one price, each extra hour is cheaper, and there’s a daily cap so nobody is overcharged for a long stay; part-hours round up. Spots are limited and come in types — compact, standard, and EV (with a charger) — and an EV must get an EV spot. Drivers keep asking ‘is an EV spot free right now?’ and the attendant hunts for a car by its plate. By evening the log is huge.
Build the attendant something so every car is charged correctly and no spot is double-parked.
(The attendant’s day is the spec — build it for any garage, not one. Get check-in / check-out and the fee right first, then the spot types and lookups.)



What every solution must include (mandatory)

Each submission is expected to be a working full-stack product. Every solution must include:
- A database (real persistence with a sensible schema).
- REST APIs for the core operations — and the candidate must list these endpoints in the README.
- A usable UI over those APIs.
- User registration and login.
- Search.
- A one-page landing page for the product (what it is, key features, target audience, how it helps, and three features they would build next).
- Pagination and sorting

Submission

The final solution must be a public GitHub repository, with the following three files in the root folder (used for evaluation):
- README.md — how to set up, run and debug the project, plus the list of API endpoints.
- REASONING.md — the thought process behind the solution, including how they tested and fixed issues.
- AI_LOGS.md — the complete conversation with the AI tool, pasted as-is. It must not be modified in any way; any alteration will lead to a deduction of marks.

my problem i have pasted the storyline
i have to build full stack -project on my github codespace 
i want to build backend in fastapi and frontend in angular
so give me code 

Now here's how to get it into your Codespace and pushed to a public GitHub repo:

Create an empty public repo on GitHub
On github.com, click New repository. Name it (e.g. parking-garage-round2). Set it Public. Do NOT initialize with a README/gitignore — leave it empty so pushing your existing folder doesn't conflict.
1
2
3
4
5
6
7
8

A couple of things worth flagging before you go:

README, code, and REASONING.md are done and tested — I ran the backend end-to-end (register/login/check-in/check-out/search) and built the Angular app to confirm it compiles cleanly, so this isn't untested scaffolding.
AI_LOGS.md still needs the real transcript pasted in — I left instructions in the file itself.
The submission requires all mandatory pieces to actually work when the evaluator runs it, so once you're in your Codespace, do a real click-through (register → check in a couple of plates → check one out → confirm the fee looks right) before you submit — that's also good material for your own REASONING.md notes.
You've got the 2.5-hour clock running — the setup steps above (repo → codespace → unzip → push) should take under 10 minutes, leaving you the rest of the time to verify it runs and to write your own testing notes.
Parking garage

Twists for this problem
Level 1 — T4 (messy data): import a messy rate card (per spot type) with the junk below and price correctly from the cleaned rates.
Level 2 — T2 (automation): “A nightly job auto-closes and bills any session parked over 24 h.” Graded via POST /clock.
Level 3 — T6 (lifecycle): “Transfer an open session to a different plate (valet hand-off); spot and entry time carry over.”
**
this is the addition twist from my compamy
i have built only this
**The storyline

A busy multi-level city-centre parking garage. Cars come and go all day, and the attendant needs to check a car in, check it out, and charge the right fee. Rates are tiered — the first hour is one price, each extra hour is cheaper, and there’s a daily cap so nobody is overcharged for a long stay; part-hours round up. Spots are limited and come in types — compact, standard, and EV (with a charger) — and an EV must get an EV spot. Drivers keep asking ‘is an EV spot free right now?’ and the attendant hunts for a car by its plate. By evening the log is huge.

Build the attendant something so every car is charged correctly and no spot is double-parked.

(The attendant’s day is the spec — build it for any garage, not one. Get check-in / check-out and the fee right first, then the spot types and lookups.)

**

’m adding the three twist requirements to your existing app and checking the exact API/UI changes needed so the project still behaves correctly.

