import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  serviceId: number;
  serviceType?: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private apiUrl = 'http://localhost:8089/api/notifications';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getMyNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(
      `${this.apiUrl}/unread/count`, { headers: this.getHeaders() }
    ).pipe(map(r => r.count));
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/read`, {}, { headers: this.getHeaders() });
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/read-all`, {}, { headers: this.getHeaders() });
  }

  // ========================================
  // ✅ NOUVELLES MÉTHODES AJOUTÉES
  // ========================================

  /**
   * Supprimer une notification spécifique
   * @param notificationId ID de la notification à supprimer
   */
  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Supprimer toutes les notifications lues
   */
  deleteAllReadNotifications(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/read/all`, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Récupérer uniquement les notifications non lues
   */
  getUnreadNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/unread`, { 
      headers: this.getHeaders() 
    });
  }

  /**
   * Vérifier si des notifications non lues existent
   */
  hasUnreadNotifications(): Observable<boolean> {
    return this.getUnreadCount().pipe(map(count => count > 0));
  }
}