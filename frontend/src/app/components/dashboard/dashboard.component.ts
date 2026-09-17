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
              <td>{{ s.check_in_time | date:'short' }}</td>
              <td>{{ s.check_out_time ? (s.check_out_time | date:'short') : '—' }}</td>
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
  private searchTimer: any;

  constructor(private parking: ParkingService) {}

  ngOnInit() {
    this.loadAvailability();
    this.loadSessions();
  }

  loadAvailability() {
    this.parking.getAvailability().subscribe((res) => (this.availability = res));
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
}
