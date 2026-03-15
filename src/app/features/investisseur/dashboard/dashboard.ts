import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { NotificationBellComponent } from '../../../shared/notification-bell/notification-bell.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-investor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, NotificationBellComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  // ✅ Seulement le compteur d'opportunités
  opportunitiesCount = 0;

  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    this.loadOpportunitiesCount();
  }

  // ✅ Méthode pour charger uniquement le nombre d'opportunités
  loadOpportunitiesCount(): void {
    this.http.get<any[]>('http://localhost:8089/api/investment-services/approved',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => {
        this.opportunitiesCount = data.length;
        console.log(`✅ ${this.opportunitiesCount} opportunités disponibles`);
      },
      error: (err) => {
        console.error('❌ Erreur chargement opportunités:', err);
        this.opportunitiesCount = 0;
      }
    });
  }
}