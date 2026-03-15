import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request.service';
import { CollaborationRequestService, CollaborationServiceRequest } from '../../../core/services/collaboration-request.service';
// ✅ IMPORTER LE SERVICE TOURIST
import { TouristRequestService, TouristRequest } from '../../../core/services/tourist-request.service';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-requests.component.html',
  styleUrls: ['./admin-requests.component.css']
})
export class AdminRequestsComponent implements OnInit {
  // Pour l'investissement
  investmentRequests: ServiceRequest[] = [];
  filteredInvestmentRequests: ServiceRequest[] = [];
  
  // Pour la collaboration
  collaborationRequests: CollaborationServiceRequest[] = [];
  filteredCollaborationRequests: CollaborationServiceRequest[] = [];
  
  // ✅ POUR LE TOURISME
  touristRequests: TouristRequest[] = [];
  filteredTouristRequests: TouristRequest[] = [];
  
  loading = true;
  // ✅ AJOUTER 'tourist' DANS LES TYPES POSSIBLES
  activeTab: 'investment' | 'collaboration' | 'tourist' = 'investment';
  
  // Filtres pour l'investissement
  investmentFilterType: string = 'all';
  investmentFilterStatus: string = 'all';
  
  // Filtres pour la collaboration
  collaborationFilterType: string = 'all';
  collaborationFilterStatus: string = 'all';
  
  // ✅ FILTRES POUR LE TOURISME
  touristFilterType: string = 'all';
  touristFilterStatus: string = 'all';
  
  // Modals
  showRejectModal = false;
  selectedRequest: any = null;
  // ✅ AJOUTER 'tourist' DANS LES TYPES POSSIBLES
  selectedRequestType: 'investment' | 'collaboration' | 'tourist' | null = null;
  rejectReason = '';

  // Propriétés pour les messages et le traitement
  successMsg = '';
  errorMsg = '';
  processingId: number | null = null;

  constructor(
    private investmentService: ServiceRequestService,
    private collaborationService: CollaborationRequestService,
    // ✅ INJECTER LE SERVICE TOURIST
    private touristService: TouristRequestService
  ) {}

  ngOnInit() {
    this.loadAllRequests();
  }

  // Getter pour les statistiques de l'investissement
  get investmentPendingCount(): number {
    return this.investmentRequests.filter(r => r.status === 'PENDING').length;
  }

  get investmentApprovedCount(): number {
    return this.investmentRequests.filter(r => r.status === 'APPROVED').length;
  }

  get investmentRejectedCount(): number {
    return this.investmentRequests.filter(r => r.status === 'REJECTED').length;
  }

  get investmentTotal(): number {
    return this.investmentRequests.length;
  }

  // Getter pour les statistiques de la collaboration
  get collaborationPendingCount(): number {
    return this.collaborationRequests.filter(r => r.status === 'PENDING').length;
  }

  get collaborationApprovedCount(): number {
    return this.collaborationRequests.filter(r => r.status === 'APPROVED').length;
  }

  get collaborationRejectedCount(): number {
    return this.collaborationRequests.filter(r => r.status === 'REJECTED').length;
  }

  get collaborationTotal(): number {
    return this.collaborationRequests.length;
  }

  // ✅ GETTERS POUR LES STATISTIQUES TOURIST
  get touristPendingCount(): number {
    return this.touristRequests.filter(r => r.status === 'PENDING').length;
  }

  get touristApprovedCount(): number {
    return this.touristRequests.filter(r => r.status === 'APPROVED').length;
  }

  get touristRejectedCount(): number {
    return this.touristRequests.filter(r => r.status === 'REJECTED').length;
  }

  get touristTotal(): number {
    return this.touristRequests.length;
  }

  // Statistiques totales
  get totalPending(): number {
    return this.investmentPendingCount + this.collaborationPendingCount + this.touristPendingCount;
  }

  loadAllRequests() {
    this.loading = true;
    this.clearMessages();
    
    // Charger les trois types de requêtes en parallèle
    Promise.all([
      this.loadInvestmentRequests(),
      this.loadCollaborationRequests(),
      this.loadTouristRequests() // ✅ AJOUTER
    ]).finally(() => {
      this.loading = false;
    });
  }

  loadInvestmentRequests(): Promise<void> {
    return new Promise((resolve) => {
      this.investmentService.getAllRequests().subscribe({
        next: (response) => {
          this.investmentRequests = response.requests;
          this.applyInvestmentFilters();
          resolve();
        },
        error: (error) => {
          console.error('Error loading investment requests:', error);
          this.errorMsg = 'Unable to load investment requests';
          resolve();
        }
      });
    });
  }

  loadCollaborationRequests(): Promise<void> {
    return new Promise((resolve) => {
      this.collaborationService.getAllRequests().subscribe({
        next: (response) => {
          this.collaborationRequests = response.requests;
          this.applyCollaborationFilters();
          resolve();
        },
        error: (error) => {
          console.error('Error loading collaboration requests:', error);
          this.errorMsg = 'Unable to load collaboration requests';
          resolve();
        }
      });
    });
  }

  // ✅ MÉTHODE POUR CHARGER LES DEMANDES TOURIST
 loadTouristRequests(): Promise<void> {
  return new Promise((resolve) => {
    this.touristService.getAllRequests().subscribe({
      next: (response) => {
        console.log('📥 Réponse tourist requests:', response);
        
        // ✅ GESTION DES DIFFÉRENTES STRUCTURES DE RÉPONSE
        if (response && Array.isArray(response)) {
          // Si la réponse est directement un tableau
          this.touristRequests = response;
        } else if (response && response.requests && Array.isArray(response.requests)) {
          // Si la réponse a une propriété 'requests'
          this.touristRequests = response.requests;
        } else {
          // Sinon, tableau vide
          console.warn('⚠️ Structure de réponse inattendue:', response);
          this.touristRequests = [];
        }
        
        this.applyTouristFilters();
        resolve();
      },
      error: (error) => {
        console.error('Error loading tourist requests:', error);
        this.touristRequests = []; // ✅ IMPORTANT: initialiser à vide même en cas d'erreur
        this.errorMsg = 'Unable to load tourist requests';
        resolve();
      }
    });
  });
}


  // Filtres pour l'investissement
  applyInvestmentFilters() {
    this.filteredInvestmentRequests = this.investmentRequests.filter(req => {
      const typeMatch = this.investmentFilterType === 'all' || req.requestType === this.investmentFilterType;
      const statusMatch = this.investmentFilterStatus === 'all' || req.status === this.investmentFilterStatus;
      return typeMatch && statusMatch;
    });
  }

  setInvestmentFilter(type: string) {
    this.investmentFilterType = type;
    this.applyInvestmentFilters();
  }

  // Filtres pour la collaboration
  applyCollaborationFilters() {
    this.filteredCollaborationRequests = this.collaborationRequests.filter(req => {
      const typeMatch = this.collaborationFilterType === 'all' || req.requestType === this.collaborationFilterType;
      const statusMatch = this.collaborationFilterStatus === 'all' || req.status === this.collaborationFilterStatus;
      return typeMatch && statusMatch;
    });
  }

  setCollaborationFilter(type: string) {
    this.collaborationFilterType = type;
    this.applyCollaborationFilters();
  }

  // ✅ FILTRES POUR LE TOURISME
  applyTouristFilters() {
    this.filteredTouristRequests = this.touristRequests.filter(req => {
      const typeMatch = this.touristFilterType === 'all' || req.requestType === this.touristFilterType;
      const statusMatch = this.touristFilterStatus === 'all' || req.status === this.touristFilterStatus;
      return typeMatch && statusMatch;
    });
  }

  setTouristFilter(type: string) {
    this.touristFilterType = type;
    this.applyTouristFilters();
  }

  // ✅ MODIFIER POUR INCLURE 'tourist'
  setTab(tab: 'investment' | 'collaboration' | 'tourist') {
    this.activeTab = tab;
  }

  // Gérer le cas où status est undefined
  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Unknown';
    
    switch(status) {
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  }

  // Obtenir la classe CSS pour le statut
  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    return status.toLowerCase();
  }

  // ✅ Approve investment request
  approveInvestmentRequest(request: ServiceRequest) {
    this.processingId = request.id;
    this.clearMessages();

    const action = request.requestType === 'EDIT' 
      ? this.investmentService.approveEditRequest(request.id)
      : this.investmentService.approveDeleteRequest(request.id);

    action.subscribe({
      next: (response) => {
        this.successMsg = request.requestType === 'EDIT' 
          ? 'Investment modification request approved' 
          : 'Investment deletion request approved';
        
        this.investmentRequests = this.investmentRequests.filter(r => r.id !== request.id);
        this.applyInvestmentFilters();
        
        this.processingId = null;
        this.autoHideSuccess();
      },
      error: (error) => {
        console.error('Error approving investment request:', error);
        this.errorMsg = 'Unable to approve request';
        this.processingId = null;
      }
    });
  }

  // ✅ Approve collaboration request
  approveCollaborationRequest(request: CollaborationServiceRequest) {
    this.processingId = request.id;
    this.clearMessages();

    const action = request.requestType === 'EDIT' 
      ? this.collaborationService.approveEditRequest(request.id)
      : this.collaborationService.approveDeleteRequest(request.id);

    action.subscribe({
      next: (response) => {
        this.successMsg = request.requestType === 'EDIT' 
          ? 'Collaboration modification request approved' 
          : 'Collaboration deletion request approved';
        
        this.collaborationRequests = this.collaborationRequests.filter(r => r.id !== request.id);
        this.applyCollaborationFilters();
        
        this.processingId = null;
        this.autoHideSuccess();
      },
      error: (error) => {
        console.error('Error approving collaboration request:', error);
        this.errorMsg = 'Unable to approve request';
        this.processingId = null;
      }
    });
  }

  // ✅ NOUVELLE MÉTHODE: Approve tourist request
  approveTouristRequest(request: TouristRequest) {
    this.processingId = request.id;
    this.clearMessages();

    const action = request.requestType === 'EDIT' 
      ? this.touristService.approveEditRequest(request.id)
      : this.touristService.approveDeleteRequest(request.id);

    action.subscribe({
      next: (response) => {
        this.successMsg = request.requestType === 'EDIT' 
          ? 'Tourist modification request approved' 
          : 'Tourist deletion request approved';
        
        this.touristRequests = this.touristRequests.filter(r => r.id !== request.id);
        this.applyTouristFilters();
        
        this.processingId = null;
        this.autoHideSuccess();
      },
      error: (error) => {
        console.error('Error approving tourist request:', error);
        this.errorMsg = 'Unable to approve request';
        this.processingId = null;
      }
    });
  }

  // ✅ MODIFIER openRejectDialog pour inclure 'tourist'
  openRejectDialog(request: any, type: 'investment' | 'collaboration' | 'tourist') {
    this.selectedRequest = request;
    this.selectedRequestType = type;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeRejectDialog() {
    this.showRejectModal = false;
    this.selectedRequest = null;
    this.selectedRequestType = null;
    this.rejectReason = '';
  }

  // ✅ MODIFIER confirmReject pour inclure 'tourist'
  confirmReject() {
    if (!this.selectedRequest || !this.rejectReason.trim() || !this.selectedRequestType) return;

    this.processingId = this.selectedRequest.id;
    
    let action;
    if (this.selectedRequestType === 'investment') {
      action = this.investmentService.rejectRequest(this.selectedRequest.id, this.rejectReason);
    } else if (this.selectedRequestType === 'collaboration') {
      action = this.collaborationService.rejectRequest(this.selectedRequest.id, this.rejectReason);
    } else { // 'tourist'
      action = this.touristService.rejectRequest(this.selectedRequest.id, this.rejectReason);
    }

    action.subscribe({
      next: (response) => {
        this.successMsg = 'Request rejected successfully';
        
        if (this.selectedRequestType === 'investment') {
          this.investmentRequests = this.investmentRequests.filter(r => r.id !== this.selectedRequest?.id);
          this.applyInvestmentFilters();
        } else if (this.selectedRequestType === 'collaboration') {
          this.collaborationRequests = this.collaborationRequests.filter(r => r.id !== this.selectedRequest?.id);
          this.applyCollaborationFilters();
        } else { // 'tourist'
          this.touristRequests = this.touristRequests.filter(r => r.id !== this.selectedRequest?.id);
          this.applyTouristFilters();
        }
        
        this.closeRejectDialog();
        this.processingId = null;
        this.autoHideSuccess();
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.errorMsg = 'Unable to reject request';
        this.processingId = null;
      }
    });
  }

  // Effacer les messages
  private clearMessages(): void {
    this.successMsg = '';
    this.errorMsg = '';
  }

  // Auto-cacher le message de succès
  private autoHideSuccess(): void {
    setTimeout(() => {
      this.successMsg = '';
    }, 3000);
  }

  // Gérer le cas où dateString est undefined
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Formater le prix
  formatPrice(price: number | undefined): string {
    if (!price && price !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Obtenir l'icône selon le type
  getRequestIcon(type: string | undefined): string {
    return type === 'EDIT' ? '✏️' : '🗑️';
  }

  // ✅ Rafraîchir la liste
  refreshRequests(): void {
    this.loadAllRequests();
  }

  // ✅ MODIFIER rejectRequestWithoutReason pour inclure 'tourist'
  rejectRequestWithoutReason(request: any, type: 'investment' | 'collaboration' | 'tourist') {
    if (!confirm('Are you sure you want to reject this request?')) {
      return;
    }
    
    this.processingId = request.id;
    
    let action;
    if (type === 'investment') {
      action = this.investmentService.rejectRequest(request.id, 'Rejected without reason');
    } else if (type === 'collaboration') {
      action = this.collaborationService.rejectRequest(request.id, 'Rejected without reason');
    } else { // 'tourist'
      action = this.touristService.rejectRequest(request.id, 'Rejected without reason');
    }

    action.subscribe({
      next: (response) => {
        this.successMsg = 'Request rejected successfully';
        
        if (type === 'investment') {
          this.investmentRequests = this.investmentRequests.filter(r => r.id !== request.id);
          this.applyInvestmentFilters();
        } else if (type === 'collaboration') {
          this.collaborationRequests = this.collaborationRequests.filter(r => r.id !== request.id);
          this.applyCollaborationFilters();
        } else { // 'tourist'
          this.touristRequests = this.touristRequests.filter(r => r.id !== request.id);
          this.applyTouristFilters();
        }
        
        this.processingId = null;
        this.autoHideSuccess();
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.errorMsg = 'Unable to reject request';
        this.processingId = null;
      }
    });
  }
}