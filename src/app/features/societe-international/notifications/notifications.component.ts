import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  serviceId: number;
  serviceType?: string;
  read: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-company-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class CompanyNotificationsComponent implements OnInit {
  
  notifications: AppNotification[] = [];
  loading = true;
  processingIds = new Set<number>();
  
  private apiUrl = 'http://localhost:8089/api/notifications';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // Rafraîchir toutes les 30 secondes
    setInterval(() => {
      this.loadNotifications();
    }, 30000);
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get hasUnread(): boolean {
    return this.unreadCount > 0;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadNotifications(): void {
    this.loading = true;
    
    this.http.get<AppNotification[]>(this.apiUrl, { headers: this.getHeaders() })
      .subscribe({
        next: (data) => {
          this.notifications = data.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.loading = false;
          console.log('📬 Notifications chargées:', this.notifications);
        },
        error: (error) => {
          console.error('❌ Erreur chargement notifications:', error);
          this.loading = false;
        }
      });
  }

  markAsRead(id: number): void {
    this.processingIds.add(id);
    
    this.http.put(`${this.apiUrl}/${id}/read`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          const notification = this.notifications.find(n => n.id === id);
          if (notification) {
            notification.read = true;
          }
          this.processingIds.delete(id);
        },
        error: (error) => {
          console.error('❌ Erreur marquage notification:', error);
          this.processingIds.delete(id);
        }
      });
  }

  markAllAsRead(): void {
    this.http.put(`${this.apiUrl}/read-all`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.notifications.forEach(n => n.read = true);
        },
        error: (error) => {
          console.error('❌ Erreur marquage toutes les notifications:', error);
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getNotificationIcon(title: string): string {
    if (title.includes('Nouveau') || title.includes('disponible')) return '🚀';
    if (title.includes('mis à jour') || title.includes('updated')) return '🔄';
    if (title.includes('supprimé') || title.includes('deleted')) return '🗑️';
    return '📢';
  }
}