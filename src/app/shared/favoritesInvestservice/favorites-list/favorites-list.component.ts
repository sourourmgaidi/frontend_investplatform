import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FavoriteService } from '../../../core/services/favorite.service';
import { AuthService } from '../../../core/services/auth';
import { Role } from '../../../shared/models/user.model';

@Component({
  selector: 'app-favorites-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './favorites-list.component.html',
  styleUrls: ['./favorites-list.component.css']
})
export class FavoritesListComponent implements OnInit, OnDestroy {
  favorites: any[] = [];
  loading = true;
  removingIds = new Set<number>();
  userRole: Role | null = null;

  // ✅ AJOUT : Propriétés pour les images
  selectedImage: { url: string; name: string; doc: any } | null = null;
  imageUrls: Map<string, string> = new Map();
  maxConcurrentLoads = 5;
  imageQueue: { doc: any; docId: string; serviceId: number }[] = [];
  isLoading = false;

  constructor(
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient  // ✅ AJOUT : Injecter HttpClient
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.loadFavorites();
  }

  ngOnDestroy(): void {
    // ✅ Nettoyer les URLs blob
    this.imageUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        window.URL.revokeObjectURL(url);
      }
    });
    this.imageUrls.clear();
  }

  // ✅ Méthode pour naviguer vers le dashboard selon le rôle
  goToDashboard(): void {
    if (this.userRole === Role.INVESTOR) {
      this.router.navigate(['/investisseur/dashboard']);
    } else if (this.userRole === Role.INTERNATIONAL_COMPANY) {
      this.router.navigate(['/societe-international/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // ✅ Méthode pour naviguer vers les services selon le rôle
  goToServices(): void {
    if (this.userRole === Role.INVESTOR) {
      this.router.navigate(['/investisseur/services']);
    } else if (this.userRole === Role.INTERNATIONAL_COMPANY) {
      this.router.navigate(['/societe-international/services']);
    } else {
      this.router.navigate(['/services']);
    }
  }

  // ✅ Obtenir le nom du dashboard
  getDashboardName(): string {
    if (this.userRole === Role.INVESTOR) {
      return 'Investisseur Dashboard';
    } else if (this.userRole === Role.INTERNATIONAL_COMPANY) {
      return 'Société Internationale Dashboard';
    } else {
      return 'Dashboard';
    }
  }

  /**
   * Load favorites based on user role
   */
  private loadFavorites(): void {
    this.loading = true;
    
    if (this.userRole === Role.INVESTOR) {
      this.favoriteService.getInvestorFavorites().subscribe({
        next: (response) => {
          this.favorites = response.favorites || [];
          this.loading = false;
          console.log(`✅ Investisseur: ${this.favorites.length} favoris chargés`);
          this.prepareImageLoading();
        },
        error: (error) => {
          console.error('❌ Erreur chargement favoris investisseur:', error);
          this.favorites = [];
          this.loading = false;
        }
      });
    } 
    else if (this.userRole === Role.INTERNATIONAL_COMPANY) {
      this.favoriteService.getCompanyFavorites().subscribe({
        next: (response) => {
          this.favorites = response.favorites || [];
          this.loading = false;
          console.log(`✅ Société Internationale: ${this.favorites.length} favoris chargés`);
          this.prepareImageLoading();
        },
        error: (error) => {
          console.error('❌ Erreur chargement favoris société:', error);
          this.favorites = [];
          this.loading = false;
        }
      });
    } 
    else {
      console.warn('⚠️ Utilisateur non autorisé à voir les favoris');
      this.favorites = [];
      this.loading = false;
    }
  }

  // ✅ AJOUT : Préparer le chargement des images
  prepareImageLoading(): void {
    // Collecter toutes les images de tous les services
    this.favorites.forEach(service => {
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

  // ✅ AJOUT : Traiter la file d'attente des images
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

  /**
   * Remove a service from favorites
   * @param serviceId ID of the service to remove
   */
  removeFavorite(serviceId: number): void {
    this.removingIds.add(serviceId);
    
    if (this.userRole === Role.INVESTOR) {
      this.favoriteService.removeInvestorFavorite(serviceId).subscribe({
        next: () => {
          this.favorites = this.favorites.filter(s => s.id !== serviceId);
          this.removingIds.delete(serviceId);
          console.log(`✅ Service ${serviceId} retiré des favoris investisseur`);
        },
        error: (error) => {
          console.error('❌ Erreur suppression favori investisseur:', error);
          this.removingIds.delete(serviceId);
        }
      });
    } 
    else if (this.userRole === Role.INTERNATIONAL_COMPANY) {
      this.favoriteService.removeCompanyFavorite(serviceId).subscribe({
        next: () => {
          this.favorites = this.favorites.filter(s => s.id !== serviceId);
          this.removingIds.delete(serviceId);
          console.log(`✅ Service ${serviceId} retiré des favoris société`);
        },
        error: (error) => {
          console.error('❌ Erreur suppression favori société:', error);
          this.removingIds.delete(serviceId);
        }
      });
    }
  }

  /**
   * Format price to currency
   * @param price Price value to format
   * @returns Formatted price string
   */
  formatPrice(price: number): string {
    if (!price && price !== 0) return 'N/A';
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Check if user can view favorites
   * @returns boolean indicating if user has access
   */
  canViewFavorites(): boolean {
    return this.userRole === Role.INVESTOR || this.userRole === Role.INTERNATIONAL_COMPANY;
  }

  /**
   * Get role display name
   * @returns Formatted role name
   */
  getRoleDisplayName(): string {
    switch (this.userRole) {
      case Role.INVESTOR:
        return 'Investisseur';
      case Role.INTERNATIONAL_COMPANY:
        return 'Société Internationale';
      default:
        return 'Utilisateur';
    }
  }

  /**
   * Refresh favorites list
   */
  refreshFavorites(): void {
    console.log('🔄 Rafraîchissement des favoris...');
    this.loadFavorites();
  }

  /**
   * Get status class for CSS styling
   * @param status Service status
   * @returns CSS class name
   */
  getStatusClass(status: string): string {
    if (!status) return '';
    return 'status-' + status.toLowerCase();
  }

  /**
   * Format date to readable string
   * @param date Date to format
   * @returns Formatted date string
   */
  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  }

  /**
   * Check if service is being removed
   * @param serviceId ID of the service
   * @returns boolean indicating if service is being removed
   */
  isRemoving(serviceId: number): boolean {
    return this.removingIds.has(serviceId);
  }

  /**
   * Get count of favorites
   * @returns Number of favorites
   */
  getFavoritesCount(): number {
    return this.favorites.length;
  }

  /**
   * Check if favorites list is empty
   * @returns boolean indicating if list is empty
   */
  isEmpty(): boolean {
    return !this.loading && this.favorites.length === 0;
  }
}