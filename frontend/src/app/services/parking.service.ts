import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SpotAvailability {
  type: string;
  total: number;
  available: number;
}

export interface ParkingSpot {
  id: number;
  spot_number: string;
  level: number;
  type: string;
  is_occupied: boolean;
}

export interface ParkingSession {
  id: number;
  plate: string;
  vehicle_type: string;
  spot_id: number;
  check_in_time: string;
  check_out_time: string | null;
  fee: number | null;
  status: 'active' | 'completed';
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

@Injectable({ providedIn: 'root' })
export class ParkingService {
  constructor(private http: HttpClient) {}

  getAvailability(): Observable<SpotAvailability[]> {
    return this.http.get<SpotAvailability[]>('/api/spots/availability');
  }

  getSpots(opts: {
    type?: string;
    available_only?: boolean;
    page?: number;
    page_size?: number;
    sort_by?: string;
    order?: string;
  }): Observable<Paginated<ParkingSpot>> {
    let params = new HttpParams();
    Object.entries(opts).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<Paginated<ParkingSpot>>('/api/spots', { params });
  }

  checkIn(plate: string, vehicle_type: string): Observable<ParkingSession> {
    return this.http.post<ParkingSession>('/api/checkin', { plate, vehicle_type });
  }

  checkOut(sessionId: number): Observable<{ session: ParkingSession; fee: number; hours_charged: number }> {
    return this.http.post<{ session: ParkingSession; fee: number; hours_charged: number }>(
      `/api/checkout/${sessionId}`,
      {}
    );
  }

  getSessions(opts: {
    plate?: string;
    status?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    order?: string;
  }): Observable<Paginated<ParkingSession>> {
    let params = new HttpParams();
    Object.entries(opts).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<Paginated<ParkingSession>>('/api/sessions', { params });
  }
}
