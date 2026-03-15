import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CollaborationRequestService, CollaborationServiceRequest } from '../../../core/services/collaboration-request.service';

@Component({
  selector: 'app-collaboration-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: 'collaboration-request-detail.component.html',
  styleUrls: ['collaboration-request-detail.component.css']
})
export class CollaborationRequestDetailComponent implements OnInit {
  request: CollaborationServiceRequest | null = null;
  loading = true;
  error = '';
  requestId: number;
  showRejectModal = false;
  rejectReason = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private collaborationRequestService: CollaborationRequestService
  ) {
    this.requestId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.loadRequest();
  }

  loadRequest(): void {
    this.loading = true;
    this.collaborationRequestService.getAdminRequestById(this.requestId).subscribe({
      next: (response) => {
        this.request = response.request;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement demande de collaboration:', error);
        this.error = 'Impossible de charger les détails de la demande';
        this.loading = false;
      }
    });
  }

  approveRequest(): void {
    if (!this.request) return;

    const action = this.request.requestType === 'EDIT' 
      ? this.collaborationRequestService.approveEditRequest(this.request.id)
      : this.collaborationRequestService.approveDeleteRequest(this.request.id);

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

    this.collaborationRequestService.rejectRequest(this.request.id, this.rejectReason).subscribe({
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

  formatBudget(budget: number | undefined): string {
    if (!budget && budget !== 0) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND'
    }).format(budget);
  }

  getRequestIcon(type: string | undefined): string {
    return type === 'EDIT' ? '✏️' : '🗑️';
  }

  formatActivityDomain(domain: string | undefined): string {
    if (!domain) return '';
    return domain.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  }
    // ✅ Nouvelle propriété pour la modal simple
  showSimpleRejectModal = false;

  // ✅ Ouvrir la modal simple
  openSimpleRejectModal(): void {
    this.showSimpleRejectModal = true;
  }

  // ✅ Fermer la modal simple
  closeSimpleRejectModal(): void {
    this.showSimpleRejectModal = false;
  }

  // ✅ Confirmer le rejet sans raison depuis la modal
  confirmRejectWithoutReason(): void {
    if (!this.request) return;
    
    this.closeSimpleRejectModal();
    
    this.collaborationRequestService.rejectRequest(this.request.id, 'Rejeté sans raison').subscribe({
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
    this.collaborationRequestService.rejectRequest(this.request.id, 'Rejeté sans raison').subscribe({
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