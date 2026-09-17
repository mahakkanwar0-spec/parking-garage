import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <section class="card" style="text-align:center; padding:48px 24px;">
        <h1 style="margin-bottom:8px;">City Centre Parking Garage</h1>
        <p style="font-size:18px; color:#555; max-width:600px; margin:0 auto 20px;">
          A real-time check-in / check-out system for busy multi-level garages —
          built so every car is charged correctly and no spot is ever double-parked.
        </p>
        <a routerLink="/register" class="btn">Get Started</a>
        <a routerLink="/login" class="btn secondary" style="margin-left:10px;">Attendant Login</a>
      </section>

      <section class="card">
        <h2>What it is</h2>
        <p>
          This is an attendant-facing web app for operating a multi-level parking garage day to day.
          It tracks every spot across levels and types (compact, standard, EV-with-charger), checks
          vehicles in and out, and automatically computes the fee using tiered hourly pricing with a
          daily cap — so a five-minute overstay never balloons into an unfair bill, and a two-day
          stay is never uncapped either.
        </p>
      </section>

      <section class="card">
        <h2>Key features</h2>
        <ul>
          <li><strong>Check-in / check-out</strong> — assigns the right spot type automatically; an EV always gets an EV charger spot.</li>
          <li><strong>Tiered, capped billing</strong> — first hour at one rate, cheaper follow-on hours, a daily cap, and round-up on part-hours.</li>
          <li><strong>Live spot availability</strong> — "is an EV spot free right now?" answered instantly, broken down by type and level.</li>
          <li><strong>Plate lookup &amp; search</strong> — find any car's session by plate, even from a huge day's log.</li>
          <li><strong>Sortable, paginated history</strong> — every session, sortable by time or fee, without scrolling through the whole log.</li>
          <li><strong>Attendant accounts</strong> — registration and login so shifts are accountable.</li>
        </ul>
      </section>

      <section class="card">
        <h2>Who it's for</h2>
        <p>
          Parking attendants and shift supervisors running a busy city-centre garage, and garage
          operators who want an accurate, auditable log of occupancy and revenue instead of a
          paper ledger or a spreadsheet.
        </p>
      </section>

      <section class="card">
        <h2>How it helps</h2>
        <p>
          It removes the two things that go wrong with manual logs: double-parking a spot because
          nobody could tell it was already taken, and under/over-charging because the fee was worked
          out by hand. The attendant gets a single screen for check-in, check-out, live availability,
          and search — instead of hunting through a paper log for a plate.
        </p>
      </section>

      <section class="card">
        <h2>Next three features we'd build</h2>
        <ol>
          <li><strong>Reserved / pre-booked spots</strong> — let a driver reserve an EV spot ahead of arrival so it isn't taken by someone else.</li>
          <li><strong>Monthly passes &amp; subscriptions</strong> — a flat-rate tier for regular commuters instead of per-visit tiered billing.</li>
          <li><strong>Analytics dashboard</strong> — occupancy heatmaps by level/hour and revenue trends, to help operators price and staff better.</li>
        </ol>
      </section>
    </div>
  `,
})
export class LandingComponent {}
