import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.css']
})
export class RequestDetailComponent implements OnInit {
  request: ServiceRequest | null = null;
  loading = true;
  error = '';
  requestId: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: ServiceRequestService
  ) {
    this.requestId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.loadRequest();
  }

  loadRequest(): void {
    this.loading = true;
    this.requestService.getRequestById(this.requestId).subscribe({
      next: (response) => {
        this.request = response.request;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement demande:', error);
        this.error = 'Impossible de charger les détails de la demande';
        this.loading = false;
      }
    });
  }

  cancelRequest(): void {
    if (!this.request) return;
    
    if (confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
      this.requestService.cancelRequest(this.request.id).subscribe({
        next: () => {
          this.router.navigate(['/partenaire-local/requests']);
        },
        error: (error) => {
          console.error('Erreur annulation:', error);
          this.error = 'Impossible d\'annuler la demande';
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/partenaire-local/requests']);
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Inconnu';
    switch(status) {
      case 'PENDING': return 'En attente';
      case 'APPROVED': return 'Approuvée';
      case 'REJECTED': return 'Rejetée';
      default: return status;
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    return status.toLowerCase();
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number | undefined): string {
    if (!price && price !== 0) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND'
    }).format(price);
  }
}