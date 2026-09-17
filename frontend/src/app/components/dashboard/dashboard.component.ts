import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ParkingService,
  SpotAvailability,
  ParkingSession,
} from '../../services/parking.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <!-- Live availability -->
      <div class="card">
        <h2>Live Spot Availability</h2>
        <div style="display:flex; gap:16px; flex-wrap:wrap;">
          <div *ngFor="let a of availability" style="flex:1; min-width:160px; text-align:center; padding:14px; border:1px solid var(--border); border-radius:8px;">
            <div style="text-transform:uppercase; font-size:12px; color:#777;">{{ a.type }}</div>
            <div style="font-size:28px; font-weight:700;">{{ a.available }} / {{ a.total }}</div>
            <span class="badge" [ngClass]="a.available > 0 ? 'available' : 'full'">
              {{ a.available > 0 ? 'Spot free' : 'Full' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Check-in -->
      <div class="card">
        <h2>Check In a Vehicle</h2>
        <form (ngSubmit)="doCheckIn()" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <input type="text" placeholder="Plate number" [(ngModel)]="checkInPlate" name="plate" required style="flex:1; min-width:180px;">
          <select [(ngModel)]="checkInType" name="type" required>
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
            <option value="ev">EV (charger)</option>
          </select>
          <button class="btn" type="submit" [disabled]="checkInLoading">
            {{ checkInLoading ? 'Checking in...' : 'Check In' }}
          </button>
        </form>
        <p *ngIf="checkInError" class="error">{{ checkInError }}</p>
        <p *ngIf="checkInMsg" style="color:var(--ok); font-size:14px;">{{ checkInMsg }}</p>
      </div>

      <div class="card">
        <h2>Messy Rate Card Import</h2>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
          <button class="btn" type="button" (click)="importRateCard()">Import cleaned rates</button>
        </div>
        <div *ngIf="rateRows.length" style="display:flex; flex-wrap:wrap; gap:10px;">
          <div *ngFor="let rate of rateRows" style="border:1px solid var(--border); border-radius:8px; padding:8px 12px; min-width:150px;">
            <div style="font-weight:600; text-transform:uppercase; font-size:12px; color:#666;">{{ rate.spot_type }}</div>
            <div>₹{{ rate.cleaned_rate }}/hr</div>
          </div>
        </div>
      </div>

     <div class="card">
  <h2>Valet Plate Transfer</h2>

  <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
    <select [(ngModel)]="transferSessionId" name="transferSessionId">
      <option [ngValue]="null">Select active session</option>

      <ng-container *ngFor="let s of sessions">
        <option *ngIf="s.status === 'active'" [ngValue]="s.id">
          {{ s.plate }} (#{{ s.id }})
        </option>
      </ng-container>

    </select>

    <input
      type="text"
      placeholder="New plate"
      [(ngModel)]="transferPlate"
      name="transferPlate"
    >

    <button
      class="btn secondary"
      type="button"
      (click)="doTransfer()"
    >
      Transfer
    </button>
  </div>

  <p *ngIf="transferError" class="error">
    {{ transferError }}
  </p>

  <p *ngIf="transferSuccess" style="color:var(--ok); font-size:14px;">
    {{ transferSuccess }}
  </p>
</div>

      <!-- Sessions: search, sort, paginate -->
      <div class="card">
        <h2>Parking Sessions</h2>
        <div style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap;">
          <input type="text" placeholder="Search by plate..." [(ngModel)]="searchPlate" (ngModelChange)="onSearchChange()" name="search">
          <select [(ngModel)]="statusFilter" (ngModelChange)="loadSessions()" name="statusFilter">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th (click)="sortBy('plate')">Plate {{ sortIndicator('plate') }}</th>
              <th>Spot</th>
              <th (click)="sortBy('check_in_time')">Check-in {{ sortIndicator('check_in_time') }}</th>
              <th (click)="sortBy('check_out_time')">Check-out {{ sortIndicator('check_out_time') }}</th>
              <th (click)="sortBy('fee')">Fee {{ sortIndicator('fee') }}</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of sessions">
              <td>{{ s.plate }}</td>
              <td>#{{ s.spot_id }} ({{ s.vehicle_type }})</td>
              <td>{{ formatStamp(s.check_in_time) }}</td>
              <td>{{ s.check_out_time ? formatStamp(s.check_out_time) : '—' }}</td>
              <td>{{ s.fee !== null ? ('₹' + s.fee) : '—' }}</td>
              <td><span class="badge" [ngClass]="s.status">{{ s.status }}</span></td>
              <td>
                <button *ngIf="s.status === 'active'" class="btn secondary" (click)="doCheckOut(s.id)">
                  Check Out
                </button>
              </td>
            </tr>
            <tr *ngIf="sessions.length === 0">
              <td colspan="7" style="text-align:center; color:#888;">No sessions found.</td>
            </tr>
          </tbody>
        </table>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px;">
          <span style="font-size:13px; color:#666;">{{ total }} total session(s)</span>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn secondary" [disabled]="page <= 1" (click)="changePage(page - 1)">Prev</button>
            <span style="font-size:14px;">Page {{ page }} / {{ totalPages() }}</span>
            <button class="btn secondary" [disabled]="page >= totalPages()" (click)="changePage(page + 1)">Next</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  availability: SpotAvailability[] = [];
  rateRows: Array<{ id: number; spot_type: string; rate_per_hour: number; cleaned_rate: number; raw: string | null }> = [];

  checkInPlate = '';
  checkInType = 'standard';
  checkInLoading = false;
  checkInError = '';
  checkInMsg = '';

  sessions: ParkingSession[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  sortField = 'check_in_time';
  sortOrder: 'asc' | 'desc' = 'desc';
  searchPlate = '';
  statusFilter = '';
  transferSessionId: number | null = null;
  transferPlate = '';
  transferError = '';
  transferSuccess = '';
  rateImportRows = [
    { spot_type: 'compact', raw: 'compact | ₹ 80 / hour | junk 99' },
    { spot_type: 'standard', raw: 'standard || 120 per hr // old rate' },
    { spot_type: 'ev', raw: 'EV | 150/hr | out of order' },
  ];
  private searchTimer: any;

  constructor(private parking: ParkingService) {}

  ngOnInit() {
    this.loadAvailability();
    this.loadSessions();
    this.loadRates();
  }

  loadAvailability() {
    this.parking.getAvailability().subscribe((res) => (this.availability = res));
  }

  loadRates() {
    this.parking.getRates().subscribe((res) => (this.rateRows = res));
  }

  loadSessions() {
    this.parking
      .getSessions({
        plate: this.searchPlate || undefined,
        status: this.statusFilter || undefined,
        page: this.page,
        page_size: this.pageSize,
        sort_by: this.sortField,
        order: this.sortOrder,
      })
      .subscribe((res) => {
        this.sessions = res.items;
        this.total = res.total;
      });
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.loadSessions();
    }, 300);
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.loadSessions();
  }

  sortIndicator(field: string): string {
    if (this.sortField !== field) return '';
    return this.sortOrder === 'asc' ? '▲' : '▼';
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  formatStamp(value: string | null): string {
    if (!value) return '—';

    const normalized = value.includes('Z') || value.includes('+') ? value : `${value}Z`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }

  changePage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page = p;
    this.loadSessions();
  }

  doCheckIn() {
    this.checkInError = '';
    this.checkInMsg = '';
    this.checkInLoading = true;
    this.parking.checkIn(this.checkInPlate, this.checkInType).subscribe({
      next: (session) => {
        this.checkInLoading = false;
        this.checkInMsg = `${session.plate} checked into spot #${session.spot_id}.`;
        this.checkInPlate = '';
        this.loadAvailability();
        this.loadSessions();
      },
      error: (err) => {
        this.checkInLoading = false;
        this.checkInError = err?.error?.detail || 'Check-in failed';
      },
    });
  }

  doCheckOut(sessionId: number) {
    this.parking.checkOut(sessionId).subscribe({
      next: () => {
        this.loadAvailability();
        this.loadSessions();
      },
      error: (err) => alert(err?.error?.detail || 'Check-out failed'),
    });
  }

  importRateCard() {
    this.parking.importRates(this.rateImportRows).subscribe({
      next: (res) => {
        this.rateRows = res.rates;
      },
      error: (err) => alert(err?.error?.detail || 'Rate import failed'),
    });
  }

  doTransfer() {
    if (!this.transferSessionId || !this.transferPlate.trim()) {
      this.transferError = 'Choose a session and enter a new plate.';
      return;
    }
    this.transferError = '';
    this.transferSuccess = '';
    this.parking.transferSession(this.transferSessionId, this.transferPlate.trim()).subscribe({
      next: (session) => {
        this.transferSuccess = `Session ${session.id} transferred to ${session.plate}.`;
        this.transferSessionId = null;
        this.transferPlate = '';
        this.loadSessions();
      },
      error: (err) => {
        this.transferError = err?.error?.detail || 'Transfer failed';
      },
    });
  }
}
