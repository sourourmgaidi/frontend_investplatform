import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request.service';

@Component({
  selector: 'app-admin-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.css']
})
export class AdminRequestDetailComponent implements OnInit {
  request: ServiceRequest | null = null;
  loading = true;
  error = '';
  requestId: number;
  showRejectModal = false;
  rejectReason = '';

  // ✅ NOUVELLE PROPRIÉTÉ
  showSimpleRejectModal = false;

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
    this.requestService.getAdminRequestById(this.requestId).subscribe({
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

  approveRequest(): void {
    if (!this.request) return;

    const action = this.request.requestType === 'EDIT' 
      ? this.requestService.approveEditRequest(this.request.id)
      : this.requestService.approveDeleteRequest(this.request.id);

    action.subscribe({
      next: () => {
        this.router.navigate(['/admin/requests']);
      },
      error: (error) => {
        console.error('Erreur approbation:', error);
        this.error = 'Impossible d\'approuver la demande';
      }
    });
  }

  openRejectModal(): void {
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.rejectReason = '';
  }

  rejectRequest(): void {
    if (!this.request || !this.rejectReason.trim()) return;

    this.requestService.rejectRequest(this.request.id, this.rejectReason).subscribe({
      next: () => {
        this.closeRejectModal();
        this.router.navigate(['/admin/requests']);
      },
      error: (error) => {
        console.error('Erreur rejet:', error);
        this.error = 'Impossible de rejeter la demande';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/requests']);
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

  // ✅ NOUVELLE MÉTHODE - Ouvrir la modal simple
  openSimpleRejectModal(): void {
    this.showSimpleRejectModal = true;
  }

  // ✅ NOUVELLE MÉTHODE - Fermer la modal simple
  closeSimpleRejectModal(): void {
    this.showSimpleRejectModal = false;
  }

  // ✅ NOUVELLE MÉTHODE - Confirmer le rejet sans raison
  confirmRejectWithoutReason(): void {
    if (!this.request) return;
    
    this.closeSimpleRejectModal();
    
    this.requestService.rejectRequest(this.request.id, 'Rejeté sans raison').subscribe({
      next: () => {
        this.router.navigate(['/admin/requests']);
      },
      error: (error) => {
        console.error('Erreur rejet:', error);
        this.error = 'Impossible de rejeter la demande';
      }
    });
  }

  /**
   * Rejeter une demande sans raison (avec confirmation simple)
   */
  rejectRequestWithoutReason(): void {
    if (!this.request) return;
    
    // Confirmation simple
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) {
      return;
    }

    // Appel au service avec une raison par défaut
    this.requestService.rejectRequest(this.request.id, 'Rejeté sans raison').subscribe({
      next: () => {
        // Redirection vers la liste des demandes
        this.router.navigate(['/admin/requests']);
      },
      error: (error) => {
        console.error('Erreur rejet:', error);
        this.error = 'Impossible de rejeter la demande';
      }
    });
  }
}