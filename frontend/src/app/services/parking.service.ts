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

  getRates(): Observable<{ id: number; spot_type: string; rate_per_hour: number; cleaned_rate: number; raw: string | null }[]> {
    return this.http.get<{ id: number; spot_type: string; rate_per_hour: number; cleaned_rate: number; raw: string | null }[]>('/api/rates');
  }

  importRates(rows: { spot_type: string; raw: string }[]): Observable<{ count: number; rates: any[] }> {
    return this.http.post<{ count: number; rates: any[] }>('/api/rates/import', { rows });
  }

  transferSession(sessionId: number, newPlate: string): Observable<ParkingSession> {
    return this.http.post<ParkingSession>(`/api/sessions/${sessionId}/transfer`, { new_plate: newPlate });
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
