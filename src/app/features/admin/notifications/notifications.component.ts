import { Component, OnInit, OnDestroy } from '@angular/core'; // ✅ Ajout OnDestroy
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar';

interface PendingServices {
  collaboration: any[];
  investment: any[];
  tourist: any[];
}

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class AdminNotificationsComponent implements OnInit, OnDestroy { // ✅ Ajout OnDestroy

  pendingServices: PendingServices = {
    collaboration: [],
    investment: [],
    tourist: []
  };

  loading = false;
  processingId: number | null = null;
  successMsg = '';
  errorMsg = '';

  // ✅ AJOUT : Propriétés pour les images
  selectedImage: { url: string; name: string; doc: any } | null = null;
  imageUrls: Map<string, string> = new Map();
  maxConcurrentLoads = 5;
  imageQueue: { doc: any; docId: string; serviceId: number }[] = [];
  isLoading = false;

  private apiBase = 'http://localhost:8089/api/admin/services';
  private apiBaseInvestment = 'http://localhost:8089/api/investment-services';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPendingServices();
  }

  // ✅ AJOUT : Nettoyer les URLs blob
  ngOnDestroy(): void {
    this.imageUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        window.URL.revokeObjectURL(url);
      }
    });
    this.imageUrls.clear();
  }

  // ✅ AJOUT : Headers pour les requêtes
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  get totalPending(): number {
    return (
      this.pendingServices.collaboration.length +
      this.pendingServices.investment.length +
      this.pendingServices.tourist.length
    );
  }

  loadPendingServices(): void {
    this.loading = true;
    this.errorMsg = '';

    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<PendingServices>(`${this.apiBase}/pending`, { headers }).subscribe({
      next: (data) => {
        this.pendingServices = {
          collaboration: data.collaboration || [],
          investment: data.investment || [],
          tourist: data.tourist || []
        };
        this.loading = false;
        this.prepareImageLoading(); // ✅ AJOUT : Préparer le chargement des images
      },
      error: (err) => {
        console.error('Error loading pending services:', err);
        this.errorMsg = 'Failed to load pending services. Please try again.';
        this.loading = false;
      }
    });
  }

  // ✅ AJOUT : Préparer le chargement des images
  prepareImageLoading(): void {
    // Collecter toutes les images des services d'investissement
    this.pendingServices.investment.forEach(service => {
      if (service.images) {
        service.images.forEach((doc: any) => {
          const docId = doc.id.toString();
          if (!this.imageUrls.has(docId)) {
            this.imageQueue.push({ doc, docId, serviceId: service.id });
          }
        });
      }
    });
    
    // Démarrer le chargement
    this.processQueue();
  }

  // ✅ AJOUT : Traiter la file d'attente
  processQueue(): void {
    if (this.isLoading || this.imageQueue.length === 0) return;
    
    this.isLoading = true;
    const batch = this.imageQueue.splice(0, this.maxConcurrentLoads);
    
    Promise.all(batch.map(item => this.loadImage(item.doc, item.docId)))
      .finally(() => {
        this.isLoading = false;
        if (this.imageQueue.length > 0) {
          this.processQueue();
        }
      });
  }

  // ✅ AJOUT : Charger une image
  loadImage(doc: any, docId: string): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`http://localhost:8089${doc.downloadUrl}`, {
        headers: this.getHeaders(),
        responseType: 'blob'
      }).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          this.imageUrls.set(docId, url);
          resolve();
        },
        error: (err) => {
          console.error(`❌ Erreur chargement image ${doc.fileName}:`, err);
          this.imageUrls.set(docId, this.getErrorImageUrl());
          resolve();
        }
      });
    });
  }

  // ✅ AJOUT : Obtenir l'URL d'une image
  getImageUrl(doc: any): string {
    const docId = doc.id.toString();
    
    if (this.imageUrls.has(docId)) {
      return this.imageUrls.get(docId)!;
    }
    
    return this.getPlaceholderImageUrl();
  }

  // ✅ AJOUT : URL du placeholder
  getPlaceholderImageUrl(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'30\' text-anchor=\'middle\' fill=\'%239ca3af\'%3E📷%3C/text%3E%3C/svg%3E';
  }

  // ✅ AJOUT : URL d'erreur
  getErrorImageUrl(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23fee2e2\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'30\' text-anchor=\'middle\' fill=\'%23ef4444\'%3E❌%3C/text%3E%3C/svg%3E';
  }

  // ✅ AJOUT : Ouvrir une image en grand
  openImage(doc: any): void {
    const docId = doc.id.toString();
    
    if (this.imageUrls.has(docId)) {
      this.selectedImage = {
        url: this.imageUrls.get(docId)!,
        name: doc.fileName,
        doc: doc
      };
    } else {
      this.loadImage(doc, docId).then(() => {
        this.selectedImage = {
          url: this.imageUrls.get(docId)!,
          name: doc.fileName,
          doc: doc
        };
      });
    }
  }

  // ✅ AJOUT : Fermer l'image
  closeImage(): void {
    this.selectedImage = null;
  }

  // ✅ AJOUT : Télécharger un fichier
  downloadFile(doc: any): void {
    this.http.get(`http://localhost:8089${doc.downloadUrl}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('❌ Erreur téléchargement', err)
    });
  }

  // ✅ AJOUT : Formater la taille du fichier
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  approveService(type: 'collaboration' | 'investment' | 'tourist', id: number): void {
    this.processingId = id;
    this.clearMessages();

    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    let endpoint = '';
    
    if (type === 'investment') {
      endpoint = `${this.apiBaseInvestment}/${id}/approve`;
      console.log(`📝 Approbation investissement via endpoint: ${endpoint}`);
    } else if (type === 'collaboration') {
      endpoint = `http://localhost:8089/api/collaboration-services/${id}/approve`;
      console.log(`📝 Approbation collaboration via endpoint: ${endpoint}`);
    } else if (type === 'tourist') {
      endpoint = `http://localhost:8089/api/tourist-services/${id}/approve`;
    }

    this.http.put(endpoint, {}, { headers }).subscribe({
      next: (response) => {
        console.log('✅ Réponse approbation:', response);
        this.removeServiceFromList(type, id);
        this.successMsg = type === 'investment' 
          ? `Service d'investissement approuvé avec succès ! Notifications envoyées à toutes les parties prenantes.` 
          : `Service approuvé avec succès !`;
        this.processingId = null;
        this.autoHideSuccess();
      },
      error: (err) => {
        console.error('Error approving service:', err);
        this.errorMsg = 'Failed to approve service. Please try again.';
        this.processingId = null;
      }
    });
  }

  rejectService(type: 'collaboration' | 'investment' | 'tourist', id: number): void {
    this.processingId = id;
    this.clearMessages();

    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    let endpoint = '';
    
    if (type === 'investment') {
      endpoint = `${this.apiBaseInvestment}/${id}/reject`;
      console.log(`📝 Rejet investissement via PUT: ${endpoint}`);
      
      this.http.put(endpoint, {}, { headers }).subscribe({
        next: (response) => {
          console.log('✅ Réponse rejet:', response);
          this.removeServiceFromList(type, id);
          this.successMsg = `Service d'investissement rejeté avec succès.`;
          this.processingId = null;
          this.autoHideSuccess();
        },
        error: (err) => {
          console.error('❌ Error rejecting investment service:', err);
          this.errorMsg = 'Échec du rejet du service d\'investissement.';
          this.processingId = null;
        }
      });
    } else if (type === 'collaboration') {
      endpoint = `http://localhost:8089/api/collaboration-services/${id}/reject`;
      console.log(`📝 Rejet collaboration via PUT: ${endpoint}`);
      
      this.http.put(endpoint, {}, { headers }).subscribe({
        next: (response) => {
          console.log('✅ Réponse rejet collaboration:', response);
          this.removeServiceFromList(type, id);
          this.successMsg = `Service de collaboration rejeté avec succès.`;
          this.processingId = null;
          this.autoHideSuccess();
        },
        error: (err) => {
          console.error('❌ Error rejecting collaboration service:', err);
          this.errorMsg = 'Échec du rejet du service de collaboration.';
          this.processingId = null;
        }
      });
    } else if (type === 'tourist') {
      endpoint = `http://localhost:8089/api/tourist-services/${id}/reject`;
      console.log(`📝 Rejet tourist via PUT: ${endpoint}`);
      
      this.http.put(endpoint, {}, { headers }).subscribe({
        next: (response) => {
          console.log('✅ Réponse rejet tourist:', response);
          this.removeServiceFromList(type, id);
          this.successMsg = `Service touristique rejeté avec succès.`;
          this.processingId = null;
          this.autoHideSuccess();
        },
        error: (err) => {
          console.error('❌ Error rejecting tourist service:', err);
          this.errorMsg = 'Échec du rejet du service touristique.';
          this.processingId = null;
        }
      });
    }
  }

  private removeServiceFromList(type: string, id: number): void {
    (this.pendingServices as any)[type] = (this.pendingServices as any)[type].filter(
      (s: any) => s.id !== id
    );
  }

  private clearMessages(): void {
    this.successMsg = '';
    this.errorMsg = '';
  }

  private autoHideSuccess(): void {
    setTimeout(() => {
      this.successMsg = '';
    }, 3000);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}