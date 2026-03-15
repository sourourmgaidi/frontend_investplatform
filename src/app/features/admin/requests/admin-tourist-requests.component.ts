import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { TouristRequestService } from '../../../core/services/tourist-request.service';

interface TouristRequest {
  id: number;
  service: any;
  partner: any;
  requestType: 'EDIT' | 'DELETE';
  reason: string;
  requestedChanges?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: string;
  responseDate?: string;
  admin?: any;
  adminComment?: string;
}

@Component({
  selector: 'app-admin-tourist-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: 'admin-tourist-requests.component.html',
  styleUrls: ['admin-tourist-requests.component.css']
})
export class AdminTouristRequestsComponent implements OnInit {
  requests: TouristRequest[] = [];
  filteredRequests: TouristRequest[] = [];
  loading = false;
  processingId: number | null = null;
  error = '';
  success = '';
  
  // Filtres
  activeTab: string = 'PENDING';
  searchQuery = '';
  
  // Modal de rejet
  showRejectModal = false;
  selectedRequest: TouristRequest | null = null;
  rejectionReason = '';

  // Statistiques
  stats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    editRequests: 0,
    deleteRequests: 0
  };

  constructor(
    private touristRequestService: TouristRequestService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadRequests();
    this.loadStatistics();
  }

  // Charger toutes les demandes
  loadRequests() {
    this.loading = true;
    this.error = '';

    this.touristRequestService.getAllRequests().subscribe({
      next: (response: any) => {
        this.requests = response.requests || [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement demandes:', err);
        this.error = 'Impossible de charger les demandes';
        this.loading = false;
      }
    });
  }

  // Charger les statistiques
  loadStatistics() {
    this.touristRequestService.getRequestStatistics().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        console.error('❌ Erreur chargement statistiques:', err);
      }
    });
  }

  // Appliquer les filtres
  applyFilters() {
    let filtered = [...this.requests];

    // Filtrer par statut
    if (this.activeTab !== 'ALL') {
      filtered = filtered.filter(r => r.status === this.activeTab);
    }

    // Filtrer par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.service?.name?.toLowerCase().includes(query) ||
        r.partner?.firstName?.toLowerCase().includes(query) ||
        r.partner?.lastName?.toLowerCase().includes(query) ||
        r.reason?.toLowerCase().includes(query)
      );
    }

    // Trier par date (plus récent d'abord)
    this.filteredRequests = filtered.sort((a, b) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  }

  // Changer d'onglet
  setTab(tab: string) {
    this.activeTab = tab;
    this.applyFilters();
  }

  // Recherche
  onSearch() {
    this.applyFilters();
  }

  // Ouvrir modal de rejet
  openRejectModal(request: TouristRequest) {
    this.selectedRequest = request;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  // Fermer modal
  closeModal() {
    this.showRejectModal = false;
    this.selectedRequest = null;
    this.rejectionReason = '';
  }

  // Approuver une demande
  approveRequest(requestId: number, type: 'EDIT' | 'DELETE') {
    if (!confirm(`Êtes-vous sûr de vouloir approuver cette demande de ${type === 'EDIT' ? 'modification' : 'suppression'} ?`)) {
      return;
    }

    this.processingId = requestId;
    this.error = '';
    this.success = '';

    const action = type === 'EDIT' 
      ? this.touristRequestService.approveEditRequest(requestId)
      : this.touristRequestService.approveDeleteRequest(requestId);

    action.subscribe({
      next: (response) => {
        console.log('✅ Demande approuvée', response);
        this.success = `Demande de ${type === 'EDIT' ? 'modification' : 'suppression'} approuvée avec succès`;
        this.loadRequests();
        this.loadStatistics();
        this.processingId = null;
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => {
        console.error('❌ Erreur approbation:', err);
        this.error = err.error?.error || err.message || 'Erreur lors de l\'approbation';
        this.processingId = null;
        setTimeout(() => this.error = '', 4000);
      }
    });
  }

  // Rejeter une demande
  rejectRequest() {
    if (!this.selectedRequest || !this.rejectionReason.trim()) {
      this.error = 'Veuillez fournir une raison de rejet';
      setTimeout(() => this.error = '', 4000);
      return;
    }

    this.processingId = this.selectedRequest.id;
    this.error = '';

    this.touristRequestService.rejectRequest(
      this.selectedRequest.id,
      this.rejectionReason
    ).subscribe({
      next: (response) => {
        console.log('✅ Demande rejetée', response);
        this.success = 'Demande rejetée avec succès';
        this.closeModal();
        this.loadRequests();
        this.loadStatistics();
        this.processingId = null;
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => {
        console.error('❌ Erreur rejet:', err);
        this.error = err.error?.error || err.message || 'Erreur lors du rejet';
        this.processingId = null;
        setTimeout(() => this.error = '', 4000);
      }
    });
  }

  // Utilitaires
  getStatusClass(status: string): string {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'PENDING': return 'En attente';
      case 'APPROVED': return 'Approuvée';
      case 'REJECTED': return 'Rejetée';
      default: return status;
    }
  }

  getTypeIcon(type: 'EDIT' | 'DELETE'): string {
    return type === 'EDIT' ? '✏️' : '🗑️';
  }

  getTypeLabel(type: 'EDIT' | 'DELETE'): string {
    return type === 'EDIT' ? 'Modification' : 'Suppression';
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

  formatShortDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}