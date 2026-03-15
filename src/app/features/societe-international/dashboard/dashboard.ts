import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';  // ✅ Ajout de Router
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { NotificationBellComponent } from '../../../shared/notification-bell/notification-bell.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MessagerieService } from '../../../core/services/messagerie.service';

@Component({
  selector: 'app-international-company-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, NotificationBellComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  collaborationCount = 0;
  investmentCount = 0;
  unreadCount = 0;
  
  // ✅ Nouveaux compteurs pour les favoris
  investmentFavCount = 0;
  collaborationFavCount = 0;

  private http = inject(HttpClient);
  private messagerieService = inject(MessagerieService);
  private router = inject(Router);  // ✅ Injection du Router

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadUnreadCount();
    this.loadFavoritesCount(); // ✅ Charger les compteurs de favoris
  }

  loadStats(): void {
    // Compter les services de collaboration
    this.http.get<any[]>('http://localhost:8089/api/international-companies/services/collaboration',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => this.collaborationCount = data.length,
      error: () => this.collaborationCount = 0
    });

    // Compter les services d'investissement
    this.http.get<any[]>('http://localhost:8089/api/international-companies/services/investment',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => this.investmentCount = data.length,
      error: () => this.investmentCount = 0
    });
  }

  loadUnreadCount(): void {
    this.messagerieService.getUnreadMessages().subscribe({
      next: (res) => this.unreadCount = res.unreadCount,
      error: () => this.unreadCount = 0
    });
  }

  // ✅ Méthode pour charger les compteurs de favoris
  loadFavoritesCount(): void {
    // Compter les favoris investment
    this.http.get<any>('http://localhost:8089/api/international-companies/favorites/count',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.investmentFavCount = res.count || 0;
        console.log('✅ Investment favorites count:', this.investmentFavCount);
      },
      error: (err) => {
        console.error('❌ Error loading investment favorites count:', err);
        this.investmentFavCount = 0;
      }
    });

    // Compter les favoris collaboration
    this.http.get<any>('http://localhost:8089/api/international-companies/collaboration-favorites/count',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.collaborationFavCount = res.count || 0;
        console.log('✅ Collaboration favorites count:', this.collaborationFavCount);
      },
      error: (err) => {
        console.error('❌ Error loading collaboration favorites count:', err);
        this.collaborationFavCount = 0;
      }
    });
  }

  // ✅ Méthode pour rafraîchir tous les compteurs
  refreshCounts(): void {
    this.loadStats();
    this.loadUnreadCount();
    this.loadFavoritesCount();
  }

  // ✅ Méthode pour obtenir le total des favoris
  getTotalFavorites(): number {
    return this.investmentFavCount + this.collaborationFavCount;
  }

  // ✅ Méthode pour vérifier s'il y a des favoris
  hasFavorites(): boolean {
    return this.getTotalFavorites() > 0;
  }

  // ✅ Navigation vers les services collaboration
  navigateToCollaborationServices(): void {
    this.router.navigate(['/societe-international/collaboration-services']);
  }

 navigateToInvestmentServices(): void {
  this.router.navigate(['/societe-international/services']);  // Route correcte
}

  // ✅ Navigation vers les favoris investment
  navigateToInvestmentFavorites(): void {
    this.router.navigate(['/societe-international/favorites']);
  }

  // ✅ Navigation vers les favoris collaboration
  navigateToCollaborationFavorites(): void {
    this.router.navigate(['/societe-international/favorites-collaboration']);
  }

  // ✅ Navigation vers la messagerie
  navigateToMessages(): void {
    this.router.navigate(['/societe-international/messagerie']);
  }
}