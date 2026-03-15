import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { NotificationBellComponent } from '../../../shared/notification-bell/notification-bell.component';
import { FavoriteCollaborationService } from '../../../core/services/favorite-collaboration.service';
import { FavoriteService } from '../../../core/services/favorite.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    NavbarComponent, 
    NotificationBellComponent
  ],
  templateUrl: 'services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  activeTab: 'collaboration' | 'investment' = 'collaboration';
  
  collaborationServices: any[] = [];
  investmentServices: any[] = [];
  filtered: any[] = [];
  searchQuery = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  private http = inject(HttpClient);
  private router = inject(Router);
  private favoriteCollabService = inject(FavoriteCollaborationService);
  private favoriteService = inject(FavoriteService);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    this.loadCollaborationServices();
    this.loadInvestmentServices();
  }

  loadCollaborationServices(): void {
    this.http.get<any[]>('http://localhost:8089/api/international-companies/services/collaboration',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => {
        this.collaborationServices = data;
        this.checkCollaborationFavorites();
        if (this.activeTab === 'collaboration') {
          this.filtered = [...data];
        }
      },
      error: (err) => {
        console.error('❌ Erreur chargement services collaboration:', err);
      }
    });
  }

  loadInvestmentServices(): void {
    this.http.get<any[]>('http://localhost:8089/api/international-companies/services/investment',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => {
        this.investmentServices = data;
        this.checkInvestmentFavorites();
        if (this.activeTab === 'investment') {
          this.filtered = [...data];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement services investment:', err);
        this.loading = false;
      }
    });
  }

  checkCollaborationFavorites(): void {
    this.collaborationServices.forEach(service => {
      this.favoriteCollabService.checkCompanyFavorite(service.id).subscribe({
        next: (res) => service.isFavorite = res.isFavorite,
        error: () => service.isFavorite = false
      });
    });
  }

  checkInvestmentFavorites(): void {
    this.investmentServices.forEach(service => {
      this.favoriteService.checkCompanyFavorite(service.id).subscribe({
        next: (res) => service.isFavorite = res.isFavorite,
        error: () => service.isFavorite = false
      });
    });
  }

  switchTab(tab: 'collaboration' | 'investment'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.filtered = tab === 'collaboration' 
      ? [...this.collaborationServices] 
      : [...this.investmentServices];
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const source = this.activeTab === 'collaboration' 
      ? this.collaborationServices 
      : this.investmentServices;
    
    if (!q) {
      this.filtered = [...source];
      return;
    }
    
    this.filtered = source.filter(s => {
      if (this.activeTab === 'collaboration') {
        const name = s.name || '';
        const desc = s.description || '';
        const region = s.region?.name || '';
        const contact = s.contactPerson || '';
        return [name, desc, region, contact].some(val => val.toLowerCase().includes(q));
      } else {
        const title = s.title || s.name || '';
        const desc = s.description || '';
        const region = s.region?.name || '';
        const sector = s.economicSector?.name || '';
        return [title, desc, region, sector].some(val => val.toLowerCase().includes(q));
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }

  toggleFavorite(service: any): void {
    if (service.favoriteLoading) return;
    service.favoriteLoading = true;
    
    if (this.activeTab === 'collaboration') {
      if (service.isFavorite) {
        this.favoriteCollabService.removeCompanyFavorite(service.id).subscribe({
          next: () => {
            service.isFavorite = false;
            service.favoriteLoading = false;
            this.success = 'Service retiré des favoris';
            setTimeout(() => this.success = null, 3000);
          },
          error: () => service.favoriteLoading = false
        });
      } else {
        this.favoriteCollabService.addCompanyFavorite(service.id).subscribe({
          next: () => {
            service.isFavorite = true;
            service.favoriteLoading = false;
            this.success = 'Service ajouté aux favoris';
            setTimeout(() => this.success = null, 3000);
          },
          error: () => service.favoriteLoading = false
        });
      }
    } else {
      if (service.isFavorite) {
        this.favoriteService.removeCompanyFavorite(service.id).subscribe({
          next: () => {
            service.isFavorite = false;
            service.favoriteLoading = false;
            this.success = 'Service retiré des favoris';
            setTimeout(() => this.success = null, 3000);
          },
          error: () => service.favoriteLoading = false
        });
      } else {
        this.favoriteService.addCompanyFavorite(service.id).subscribe({
          next: () => {
            service.isFavorite = true;
            service.favoriteLoading = false;
            this.success = 'Service ajouté aux favoris';
            setTimeout(() => this.success = null, 3000);
          },
          error: () => service.favoriteLoading = false
        });
      }
    }
  }
}