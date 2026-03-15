import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { FavoriteTouristService, FavoriteService } from '../../../core/services/favorite-tourist.service';
import { NavbarComponent } from '../../../shared/navbar/navbar';

// ✅ Interface pour les documents
interface TouristServiceDocument {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  downloadUrl: string;
  isPrimary: boolean;
  uploadedAt: string;
}

// ✅ Interface pour les services touristiques
interface TouristService {
  id: number;
  name: string;
  description: string;
  price: number;
  groupPrice?: number;
  availability: string;
  contactPerson: string;
  category: string;
  targetAudience: string;
  durationHours: number;
  maxCapacity: number;
  includedServices: string[];
  availableLanguages: string[];
  region?: any;
  provider?: any;
  status: string;
  createdAt: string;
  documents?: TouristServiceDocument[]; // ✅ Propriété documents optionnelle
}

@Component({
  selector: 'app-tourist-favorites',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class TouristFavoritesComponent implements OnInit, OnDestroy {
  // ✅ Utiliser l'interface TouristService au lieu de FavoriteService
  favorites: TouristService[] = [];
  loading = true;
  error: string | null = null;
  removingIds = new Set<number>();

  // Propriétés pour les images
  selectedImage: { url: string; name: string; doc: any } | null = null;
  imageBlobUrls: Map<string, string> = new Map();
  imageLoading: Set<string> = new Set();

  private subscriptions: Subscription[] = [];
  private http = inject(HttpClient);

  constructor(
    private favoriteService: FavoriteTouristService,
    private router: Router
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    this.loadFavorites();
    
    this.subscriptions.push(
      this.favoriteService.favorites$.subscribe(favorites => {
        this.favorites = favorites as TouristService[]; // ✅ Cast
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Nettoyer les URLs blob
    this.imageBlobUrls.forEach(url => {
      window.URL.revokeObjectURL(url);
    });
    this.imageBlobUrls.clear();
  }

  loadFavorites(): void {
    this.loading = true;
    this.error = null;
    
    this.favoriteService.getFavorites().subscribe({
      next: (favorites) => {
        this.favorites = favorites as TouristService[]; // ✅ Cast
        this.loading = false;
        console.log(`✅ ${favorites.length} favoris chargés`);
      },
      error: (err) => {
        console.error('❌ Erreur chargement favoris:', err);
        this.error = 'Unable to load your favorites. Please try again.';
        this.loading = false;
      }
    });
  }

  removeFavorite(serviceId: number): void {
    if (this.removingIds.has(serviceId)) return;
    
    this.removingIds.add(serviceId);
    
    this.favoriteService.removeFavorite(serviceId).subscribe({
      next: (response) => {
        if (response.success) {
          this.removingIds.delete(serviceId);
        }
      },
      error: (err) => {
        console.error('❌ Erreur retrait favori:', err);
        this.removingIds.delete(serviceId);
        this.error = 'Error removing favorite. Please try again.';
        setTimeout(() => this.error = null, 3000);
      }
    });
  }

  isRemoving(serviceId: number): boolean {
    return this.removingIds.has(serviceId);
  }

  refreshFavorites(): void {
    this.favoriteService.refresh();
  }

  goToDashboard(): void {
    this.router.navigate(['/touriste/dashboard']);
  }

  goToServices(): void {
    this.router.navigate(['/touriste/services']);
  }

  getDashboardName(): string {
    return 'Tourist';
  }

  getStatusClass(status: string): string {
    switch(status?.toUpperCase()) {
      case 'APPROVED': return 'status-approved';
      case 'PENDING': return 'status-pending';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }

  formatEnum(value: string): string {
    if (!value) return '';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('TND', '').trim() + ' TND';
  }

  formatDuration(hours?: number): string {
    if (!hours) return 'N/A';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  // ========================================
  // MÉTHODES POUR LES DOCUMENTS
  // ========================================

  /**
   * Charger une image avec authentification
   */
  loadImage(doc: any): void {
    const docId = doc.id.toString();
    
    if (this.imageLoading.has(docId)) {
      return;
    }
    
    this.imageLoading.add(docId);
    
    const headers = this.getHeaders();
    
    this.http.get(`http://localhost:8089${doc.downloadUrl}`, {
      headers: headers,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        this.imageBlobUrls.set(docId, url);
        this.imageLoading.delete(docId);
      },
      error: (err) => {
        console.error(`❌ Erreur chargement image ${doc.fileName}:`, err);
        this.imageLoading.delete(docId);
      }
    });
  }

  /**
   * Obtenir l'URL d'une image (avec gestion du chargement)
   */
  getImageUrl(doc: any): string {
    const docId = doc.id.toString();
    
    if (this.imageBlobUrls.has(docId)) {
      return this.imageBlobUrls.get(docId)!;
    } else {
      this.loadImage(doc);
      return 'assets/images/loading-image.png';
    }
  }

  /**
   * Ouvrir une image en grand
   */
  openImage(doc: any): void {
    const docId = doc.id.toString();
    
    if (this.imageBlobUrls.has(docId)) {
      this.selectedImage = {
        url: this.imageBlobUrls.get(docId)!,
        name: doc.fileName,
        doc: doc
      };
    } else {
      const headers = this.getHeaders();
      
      this.http.get(`http://localhost:8089${doc.downloadUrl}`, {
        headers: headers,
        responseType: 'blob'
      }).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          this.imageBlobUrls.set(docId, url);
          this.selectedImage = {
            url: url,
            name: doc.fileName,
            doc: doc
          };
        },
        error: (err) => console.error('Erreur chargement image', err)
      });
    }
  }

  /**
   * Fermer l'image agrandie
   */
  closeImage(): void {
    this.selectedImage = null;
  }

  /**
   * Télécharger un fichier
   */
  downloadFile(doc: any): void {
    const headers = this.getHeaders();
    
    this.http.get(`http://localhost:8089${doc.downloadUrl}`, {
      headers: headers,
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
      error: (err) => console.error('Erreur téléchargement', err)
    });
  }

  /**
   * Formater la taille du fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}