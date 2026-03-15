import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth';
import { Role } from '../models/user.model';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bell-wrapper" *ngIf="shouldShow">
      <button class="bell-btn" (click)="togglePanel()" [class.active]="panelOpen">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="badge" *ngIf="unreadCount > 0">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <div class="notif-panel" *ngIf="panelOpen">

        <div class="panel-header">
          <span>Notifications</span>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <!-- ✅ NOUVEAU: Bouton supprimer toutes les lues -->
            <button class="delete-all-btn" 
                    (click)="openDeleteAllModal()" 
                    *ngIf="hasReadNotifications"
                    [disabled]="deleting">
              <span *ngIf="!deleting">🗑️ Clear read</span>
              <span *ngIf="deleting">...</span>
            </button>
            <button class="view-all-btn" (click)="goToServices()">View services</button>
            <button class="mark-all-btn" (click)="markAllRead()" *ngIf="unreadCount > 0">
              Mark all read
            </button>
          </div>
        </div>

        <div class="panel-body">
          <div class="notif-empty" *ngIf="notifications.length === 0">
            No notifications
          </div>
          <div class="notif-item"
               *ngFor="let n of notifications"
               [class.unread]="!n.read">
            <div class="notif-icon">{{ getIcon(n.serviceType) }}</div>
            <div class="notif-content" (click)="markRead(n)">
              <p class="notif-title">{{ n.title }}</p>
              <p class="notif-msg">{{ n.message }}</p>
              <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
            </div>
            <!-- ✅ NOUVEAU: Bouton supprimer individuel -->
            <button class="delete-btn" 
                    (click)="openDeleteModal(n)"
                    [disabled]="deletingId === n.id"
                    title="Delete notification">
              <span *ngIf="deletingId !== n.id">✕</span>
              <span *ngIf="deletingId === n.id" class="loading-dot">•</span>
            </button>
            <div class="unread-dot" *ngIf="!n.read"></div>
          </div>
        </div>
      </div>

      <div class="overlay" *ngIf="panelOpen" (click)="panelOpen = false"></div>
    </div>

    <!-- ✅ NOUVEAU: Modal de confirmation pour suppression individuelle -->
    <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Delete Notification</h3>
          <button class="close-btn" (click)="closeDeleteModal()">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this notification?</p>
          <p class="modal-notification">{{ selectedNotification?.title }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeDeleteModal()">Cancel</button>
          <button class="btn-delete" (click)="confirmDelete()" [disabled]="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ NOUVEAU: Modal de confirmation pour suppression de toutes les lues -->
    <div class="modal-overlay" *ngIf="showDeleteAllModal" (click)="closeDeleteAllModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Clear Read Notifications</h3>
          <button class="close-btn" (click)="closeDeleteAllModal()">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete all read notifications?</p>
          <p>This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeDeleteAllModal()">Cancel</button>
          <button class="btn-delete" (click)="confirmDeleteAllRead()" [disabled]="deleting">
            {{ deleting ? 'Deleting...' : 'Delete all' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bell-wrapper { position: relative; display: inline-block; }

    .bell-btn {
      position: relative;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 50%;
      width: 42px; height: 42px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #475569;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .bell-btn:hover, .bell-btn.active {
      color: #2563eb; border-color: #2563eb;
      box-shadow: 0 4px 14px rgba(37,99,235,0.2);
    }

    .badge {
      position: absolute; top: -4px; right: -4px;
      background: #dc2626; color: white;
      font-size: 0.6rem; font-weight: 700;
      min-width: 16px; height: 16px;
      border-radius: 50px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px; border: 2px solid white;
    }

    .notif-panel {
      position: absolute; top: calc(100% + 10px); right: 0;
      width: 340px; background: white;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0; z-index: 1000; overflow: hidden;
    }

    .panel-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.25rem; font-weight: 600; color: #0f172a;
      border-bottom: 1px solid #f1f5f9; background: #f8fafc;
    }

    /* ✅ NOUVEAU: Style pour le bouton delete all */
    .delete-all-btn {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      font-size: 0.75rem;
      padding: 0.3rem 0.7rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }

    .delete-all-btn:hover:not(:disabled) {
      background: #fecaca;
    }

    .delete-all-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .mark-all-btn {
      background: none; border: none;
      font-size: 0.8rem; color: #2563eb;
      cursor: pointer; font-weight: 500;
    }
    .mark-all-btn:hover { text-decoration: underline; }

    .view-all-btn {
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white; border: none;
      font-size: 0.75rem; font-weight: 600;
      padding: 0.3rem 0.7rem;
      border-radius: 8px; cursor: pointer;
      transition: opacity 0.2s;
    }
    .view-all-btn:hover { opacity: 0.85; }

    .panel-body { max-height: 380px; overflow-y: auto; }

    .notif-empty {
      padding: 2.5rem; text-align: center;
      color: #94a3b8; font-size: 0.9rem;
    }

    .notif-item {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 0.9rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s; position: relative;
    }
    .notif-item:hover { background: #f8fafc; }
    .notif-item.unread { background: #eff6ff; }

    .notif-icon { font-size: 1.3rem; flex-shrink: 0; margin-top: 2px; }

    .notif-content { 
      flex: 1; 
      cursor: pointer; 
    }

    .notif-title { margin: 0 0 0.2rem; font-size: 0.85rem; font-weight: 600; color: #0f172a; }
    .notif-msg { margin: 0 0 0.25rem; font-size: 0.82rem; color: #475569; line-height: 1.4; }
    .notif-time { font-size: 0.75rem; color: #94a3b8; }

    /* ✅ NOUVEAU: Style pour le bouton delete individuel */
    .delete-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
      margin-right: 4px;
    }

    .delete-btn:hover:not(:disabled) {
      background: #fee2e2;
      color: #dc2626;
    }

    .delete-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-dot {
      animation: pulse 1s infinite;
      font-size: 1.2rem;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }

    .unread-dot {
      width: 8px; height: 8px; background: #2563eb;
      border-radius: 50%; flex-shrink: 0; margin-top: 6px;
    }

    .overlay { position: fixed; inset: 0; z-index: 999; }

    /* ✅ NOUVEAU: Styles pour les modals */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      animation: fadeIn 0.2s ease;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #64748b;
      padding: 4px;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-body p {
      margin: 0 0 0.5rem 0;
      color: #475569;
    }

    .modal-notification {
      font-weight: 600;
      color: #1e293b !important;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
      margin-top: 0.5rem !important;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn-cancel, .btn-delete {
      flex: 1;
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
    }

    .btn-delete {
      background: #dc2626;
      color: white;
    }

    .btn-delete:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-delete:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {

  notifications: AppNotification[] = [];
  panelOpen = false;
  shouldShow = false;
  private pollSub?: Subscription;

  // ✅ NOUVELLES PROPRIÉTÉS
  deleting = false;
  deletingId: number | null = null;
  showDeleteModal = false;
  showDeleteAllModal = false;
  selectedNotification: AppNotification | null = null;

  private notifService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    // ✅ AJOUTER ADMIN À LA LISTE
    this.shouldShow = role === Role.TOURIST ||
                      role === Role.INVESTOR ||
                      role === Role.PARTNER ||
                      role === Role.LOCAL_PARTNER ||
                      role === Role.INTERNATIONAL_COMPANY ||
                      role === Role.ADMIN;  // <-- AJOUTER CETTE LIGNE POUR ADMIN

    if (this.shouldShow) {
      this.loadNotifications();
      this.pollSub = interval(30000).pipe(
        switchMap(() => this.notifService.getMyNotifications())
      ).subscribe((notifs: AppNotification[]) => this.notifications = notifs);
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // ✅ NOUVEAU: Getter pour vérifier s'il y a des notifications lues
  get hasReadNotifications(): boolean {
    return this.notifications.some(n => n.read);
  }

  togglePanel(): void { 
    this.panelOpen = !this.panelOpen; 
  }

  loadNotifications(): void {
    this.notifService.getMyNotifications().subscribe({
      next: (notifs: AppNotification[]) => this.notifications = notifs,
      error: () => {}
    });
  }

  markRead(n: AppNotification): void {
    if (!n.read) {
      this.notifService.markAsRead(n.id).subscribe();
      n.read = true;
    }
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe();
    this.notifications.forEach(n => n.read = true);
  }

  // ✅ NOUVELLE MÉTHODE: Ouvrir modal de suppression individuelle
  openDeleteModal(notification: AppNotification): void {
    this.selectedNotification = notification;
    this.showDeleteModal = true;
  }

  // ✅ NOUVELLE MÉTHODE: Fermer modal de suppression individuelle
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedNotification = null;
  }

  // ✅ NOUVELLE MÉTHODE: Confirmer suppression individuelle
  confirmDelete(): void {
    if (!this.selectedNotification) return;

    this.deleting = true;
    this.deletingId = this.selectedNotification.id;

    this.notifService.deleteNotification(this.selectedNotification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== this.selectedNotification?.id);
        this.closeDeleteModal();
        this.deleting = false;
        this.deletingId = null;
      },
      error: () => {
        this.deleting = false;
        this.deletingId = null;
      }
    });
  }

  // ✅ NOUVELLE MÉTHODE: Ouvrir modal de suppression de toutes les lues
  openDeleteAllModal(): void {
    this.showDeleteAllModal = true;
  }

  // ✅ NOUVELLE MÉTHODE: Fermer modal de suppression de toutes les lues
  closeDeleteAllModal(): void {
    this.showDeleteAllModal = false;
  }

  // ✅ NOUVELLE MÉTHODE: Confirmer suppression de toutes les lues
  confirmDeleteAllRead(): void {
    this.deleting = true;

    this.notifService.deleteAllReadNotifications().subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => !n.read);
        this.closeDeleteAllModal();
        this.deleting = false;
      },
      error: () => {
        this.deleting = false;
      }
    });
  }

  goToServices(): void {
    const role = this.authService.getUserRole();
    this.panelOpen = false;
    
    if (role === Role.INVESTOR) {
      this.router.navigate(['/investisseur/services']);
    } else if (role === Role.PARTNER) {
      this.router.navigate(['/partenaire-economique/services']);
    } else if (role === Role.TOURIST) {
      this.router.navigate(['/touriste/services']);
    } else if (role === Role.INTERNATIONAL_COMPANY) {
      this.router.navigate(['/societe-international/services']);
    } else if (role === Role.ADMIN) {  // <-- AJOUTER POUR ADMIN
      this.router.navigate(['/admin/notifications']);
    }
  }

  getIcon(type?: string): string {
    switch (type) {
      case 'TOURIST': return '🌍';
      case 'INVESTMENT': return '📈';
      case 'COLLABORATION': return '🤝';
      case 'ADMIN': return '👑';  // <-- AJOUTER POUR ADMIN
      default: return '🔔';
    }
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
}