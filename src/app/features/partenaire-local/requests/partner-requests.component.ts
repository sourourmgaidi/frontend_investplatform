import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request.service';
import { CollaborationRequestService } from '../../../core/services/collaboration-request.service';
import { TouristRequestService } from '../../../core/services/tourist-request.service';

@Component({
  selector: 'app-partner-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './partner-requests.component.html',
  styleUrls: ['./partner-requests.component.css']
})
export class PartnerRequestsComponent implements OnInit {
  // All pending requests combined from 3 services
  allRequests: any[] = [];
  filteredRequests: any[] = [];
  loading = true;
  activeTab: string = 'all';

  constructor(
    private requestService: ServiceRequestService,
    private collaborationRequestService: CollaborationRequestService,
    private touristRequestService: TouristRequestService
  ) {}

  ngOnInit() {
    this.loadPendingRequests();
  }

  getCountByType(type: string): number {
    if (type === 'all') return this.allRequests.length;
    return this.allRequests.filter(r => r.serviceType === type).length;
  }

  loadPendingRequests() {
    this.loading = true;
    this.allRequests = [];
    
    // Load pending requests from all 3 services in parallel
    Promise.all([
      this.loadInvestmentRequests(),
      this.loadCollaborationRequests(),
      this.loadTouristRequests()
    ]).then(() => {
      this.filterByType('all');
      this.loading = false;
    }).catch(error => {
      console.error('Error loading requests:', error);
      this.loading = false;
    });
  }

  // Load investment requests
  loadInvestmentRequests(): Promise<void> {
    return new Promise((resolve) => {
      this.requestService.getMyRequests().subscribe({
        next: (response) => {
          // Filter only PENDING requests
          const pendingReqs = (response.requests || [])
            .filter(req => req.status === 'PENDING')
            .map(req => ({
              ...req,
              serviceType: 'INVESTMENT',
              serviceIcon: '📈'
            }));
          this.allRequests = [...this.allRequests, ...pendingReqs];
          resolve();
        },
        error: (error) => {
          console.error('Error loading investment requests:', error);
          resolve();
        }
      });
    });
  }

  // Load collaboration requests
  loadCollaborationRequests(): Promise<void> {
    return new Promise((resolve) => {
      this.collaborationRequestService.getMyRequests().subscribe({
        next: (response) => {
          // Filter only PENDING requests
          const pendingReqs = (response.requests || [])
            .filter(req => req.status === 'PENDING')
            .map(req => ({
              ...req,
              serviceType: 'COLLABORATION',
              serviceIcon: '🤝'
            }));
          this.allRequests = [...this.allRequests, ...pendingReqs];
          resolve();
        },
        error: (error) => {
          console.error('Error loading collaboration requests:', error);
          resolve();
        }
      });
    });
  }

  // Load tourist requests
  loadTouristRequests(): Promise<void> {
    return new Promise((resolve) => {
      this.touristRequestService.getMyRequests().subscribe({
        next: (response) => {
          // Filter only PENDING requests
          const pendingReqs = (response.requests || [])
            .filter(req => req.status === 'PENDING')
            .map(req => ({
              ...req,
              serviceType: 'TOURIST',
              serviceIcon: '🌍'
            }));
          this.allRequests = [...this.allRequests, ...pendingReqs];
          resolve();
        },
        error: (error) => {
          console.error('Error loading tourist requests:', error);
          resolve();
        }
      });
    });
  }

  filterByType(type: string) {
    this.activeTab = type;
    
    if (type === 'all') {
      // Sort by date (most recent first)
      this.filteredRequests = [...this.allRequests].sort((a, b) => 
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      );
    } else {
      this.filteredRequests = this.allRequests
        .filter(r => r.serviceType === type)
        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }
  }

  cancelRequest(requestId: number) {
    if (confirm('Are you sure you want to cancel this request?')) {
      // Find the request to know its type
      const request = this.allRequests.find(r => r.id === requestId);
      
      if (!request) return;
      
      let cancelObservable;
      
      // Choose the right service based on type
      switch(request.serviceType) {
        case 'INVESTMENT':
          cancelObservable = this.requestService.cancelRequest(requestId);
          break;
        case 'COLLABORATION':
          cancelObservable = this.collaborationRequestService.cancelRequest(requestId);
          break;
        case 'TOURIST':
          cancelObservable = this.touristRequestService.cancelRequest(requestId);
          break;
        default:
          return;
      }
      
      cancelObservable.subscribe({
        next: () => {
          // Remove from local array
          this.allRequests = this.allRequests.filter(r => r.id !== requestId);
          this.filterByType(this.activeTab);
        },
        error: (error) => {
          console.error('Error cancelling request:', error);
          alert('Failed to cancel request. Please try again.');
        }
      });
    }
  }

  // Helper methods
  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Unknown';
    
    switch(status) {
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  }

  getServiceTypeLabel(serviceType: string): string {
    switch(serviceType) {
      case 'INVESTMENT': return 'Investment';
      case 'COLLABORATION': return 'Collaboration';
      case 'TOURIST': return 'Tourism';
      default: return '';
    }
  }

  getServiceIcon(serviceType: string): string {
    switch(serviceType) {
      case 'INVESTMENT': return '📈';
      case 'COLLABORATION': return '🤝';
      case 'TOURIST': return '🌍';
      default: return '📋';
    }
  }

  getServiceColor(serviceType: string): string {
    switch(serviceType) {
      case 'INVESTMENT': return '#10b981'; // green
      case 'COLLABORATION': return '#6366f1'; // blue
      case 'TOURIST': return '#f59e0b'; // orange
      default: return '#6b7280'; // gray
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}