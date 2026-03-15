import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { NotificationBellComponent } from '../../../shared/notification-bell/notification-bell.component';
import { FavoriteButtonComponent } from '../../../shared/favoritesInvestservice/favorite-button/favorite-button.component';

@Component({
  selector: 'app-investor-services',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    NavbarComponent, 
    NotificationBellComponent,
    FavoriteButtonComponent
  ],
  template: `
    <div class="page-layout">
      <app-navbar></app-navbar>
      <div class="page-main">
        <div class="page-content">

          <!-- Header -->
          <div class="page-header">
            <div>
              <a routerLink="/investisseur/dashboard" class="back-link">← Back to Dashboard</a>
              <h1>Investment Opportunities</h1>
              <p class="subtitle">All approved investment services available for you</p>
            </div>
            <div class="header-actions">
              <a routerLink="/investisseur/favorites" class="favorites-link">
                <span>❤️</span> My Favorites
              </a>
              <app-notification-bell></app-notification-bell>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="search-wrapper">
            <div class="search-box">
              <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearch()"
                placeholder="Search by title, description, zone, region, contact, duration..."
                class="search-input"
              />
              <button class="clear-btn" *ngIf="searchQuery" (click)="clearSearch()">✕</button>
            </div>
            <span class="results-count" *ngIf="searchQuery">
              {{ filtered.length }} result{{ filtered.length !== 1 ? 's' : '' }} found
            </span>
          </div>

          <!-- Loading -->
          <div class="loading-state" *ngIf="loading">
            <div class="spinner"></div>
            <p>Loading services...</p>
          </div>

          <!-- Empty -->
          <div class="empty-state" *ngIf="!loading && filtered.length === 0">
            <div class="empty-icon">{{ searchQuery ? '🔍' : '📈' }}</div>
            <h3>{{ searchQuery ? 'No results for "' + searchQuery + '"' : 'No investment services available yet' }}</h3>
            <p>{{ searchQuery ? 'Try different keywords' : 'Check back later for new opportunities' }}</p>
            <button class="clear-search-btn" *ngIf="searchQuery" (click)="clearSearch()">Clear search</button>
          </div>

          <!-- Services Grid -->
          <div class="services-grid" *ngIf="!loading && filtered.length > 0">
            <div class="service-card" *ngFor="let s of filtered">
              <div class="card-top">
                <span class="card-type">📈 Investment</span>
                <span class="card-zone" *ngIf="s.zone">{{ s.zone }}</span>
              </div>
              <div class="card-body">
                <div class="card-header-row">
                  <h3>{{ s.title || s.name }}</h3>
                  <app-favorite-button [serviceId]="s.id"></app-favorite-button>
                </div>
                
                <p class="card-desc">{{ (s.description || '') | slice:0:120 }}{{ (s.description?.length || 0) > 120 ? '...' : '' }}</p>

                <div class="card-meta" *ngIf="s.region">
                  <span class="meta-label">📍 Region:</span>
                  <span>{{ s.region.name }}</span>
                </div>
                <div class="card-meta" *ngIf="s.totalAmount">
                  <span class="meta-label">💰 Total Amount:</span>
                  <span>{{ s.totalAmount | number }} TND</span>
                </div>
                <div class="card-meta" *ngIf="s.minimumAmount">
                  <span class="meta-label">📊 Min Investment:</span>
                  <span>{{ s.minimumAmount | number }} TND</span>
                </div>
                <div class="card-meta" *ngIf="s.deadlineDate">
                  <span class="meta-label">📅 Deadline:</span>
                  <span>{{ s.deadlineDate | date }}</span>
                </div>
                <div class="card-meta" *ngIf="s.projectDuration">
                  <span class="meta-label">⏱ Duration:</span>
                  <span>{{ s.projectDuration }}</span>
                </div>
                <div class="card-meta" *ngIf="s.contactPerson">
                  <span class="meta-label">👤 Contact:</span>
                  <span>{{ s.contactPerson }}</span>
                </div>
                <div class="card-meta" *ngIf="s.economicSector">
                  <span class="meta-label">🏭 Sector:</span>
                  <span>{{ s.economicSector.name }}</span>
                </div>

                <!-- ✅ SECTION POUR AFFICHER LES DOCUMENTS -->
                <div class="documents-section" *ngIf="s.documents && s.documents.length > 0">
                  <h4 class="documents-title">📎 Documents</h4>
                  <div class="documents-grid">
                    <!-- Images -->
                    <div class="document-item image-item" *ngFor="let doc of s.images">
                      <img 
                        [src]="getImageUrl(doc)" 
                        class="document-thumbnail" 
                        alt="{{ doc.fileName }}"
                        (click)="openImage(doc)"
                        loading="lazy"
                      >
                      <span class="document-name">{{ doc.fileName }}</span>
                      <span class="document-size" *ngIf="doc.fileSize">{{ formatFileSize(doc.fileSize) }}</span>
                    </div>
                    
                    <!-- Autres documents (PDF, etc.) -->
                    <div class="document-item" *ngFor="let doc of s.otherDocuments">
                      <a href="javascript:void(0)" (click)="downloadFile(doc)" class="document-link">
                        <span class="document-icon">📄</span>
                        <span class="document-name">{{ doc.fileName }}</span>
                        <span class="document-size" *ngIf="doc.fileSize">{{ formatFileSize(doc.fileSize) }}</span>
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Bouton Contact Provider -->
                <div class="card-contact" *ngIf="s.provider">
                  <button class="contact-btn" (click)="contactProvider(s.provider)">
                    <span>💬</span> Contact Provider
                  </button>
                </div>
              </div>
              <div class="card-footer">
                <span class="availability-badge">{{ s.availability }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ✅ IMAGE MODAL -->
    <div class="image-modal" *ngIf="selectedImage" (click)="closeImage()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <span class="close" (click)="closeImage()">&times;</span>
        <img [src]="selectedImage.url" alt="{{ selectedImage.name }}">
        <div class="image-footer">
          <p class="image-name">{{ selectedImage.name }}</p>
          <button class="btn-download" (click)="downloadFile(selectedImage.doc)">
            <span class="btn-icon">📥</span> Télécharger
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-layout { display: flex; min-height: 100vh; background: linear-gradient(135deg, #f8fafc, #f1f5f9); font-family: 'Inter', sans-serif; }
    app-navbar { width: 280px; flex-shrink: 0; position: sticky; top: 0; height: 100vh; z-index: 100; }
    .page-main { flex: 1; padding: 2rem; overflow-y: auto; }
    .page-content { max-width: 1300px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .header-actions { display: flex; align-items: center; gap: 1rem; }
    .favorites-link { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; color: #dc3545; text-decoration: none; font-weight: 500; transition: all 0.2s; }
    .favorites-link:hover { background: #dc3545; color: white; border-color: #dc3545; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(220,53,69,0.2); }
    .back-link { display: inline-block; color: #2563eb; font-size: 0.9rem; font-weight: 500; text-decoration: none; margin-bottom: 0.5rem; }
    .back-link:hover { color: #7c3aed; }
    h1 { font-size: 2rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; }
    h1::after { content: ''; display: block; width: 60px; height: 4px; background: linear-gradient(90deg, #2563eb, #7c3aed); margin-top: 0.4rem; border-radius: 2px; }
    .subtitle { color: #64748b; margin: 0; }
    .search-wrapper { margin-bottom: 1.5rem; }
    .search-box { display: flex; align-items: center; gap: 0.75rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 0.75rem 1.1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: border-color 0.2s, box-shadow 0.2s; }
    .search-box:focus-within { border-color: #2563eb; box-shadow: 0 4px 16px rgba(37,99,235,0.12); }
    .search-icon { color: #94a3b8; flex-shrink: 0; }
    .search-input { flex: 1; border: none; outline: none; font-size: 0.95rem; color: #0f172a; background: transparent; }
    .search-input::placeholder { color: #94a3b8; }
    .clear-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.9rem; padding: 0 0.25rem; transition: color 0.2s; }
    .clear-btn:hover { color: #dc2626; }
    .results-count { display: block; margin-top: 0.5rem; font-size: 0.85rem; color: #64748b; padding-left: 0.25rem; }
    .loading-state, .empty-state { text-align: center; padding: 4rem; background: white; border-radius: 16px; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #0f172a; margin-bottom: 0.5rem; }
    .empty-state p { color: #64748b; margin-bottom: 1.5rem; }
    .clear-search-btn { padding: 0.6rem 1.4rem; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .service-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
    .service-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(37,99,235,0.12); }
    .card-top { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: linear-gradient(135deg, #2563eb, #3b82f6); }
    .card-type { color: white; font-size: 0.8rem; font-weight: 600; }
    .card-zone { color: rgba(255,255,255,0.85); font-size: 0.75rem; }
    .card-body { padding: 1.25rem; flex: 1; }
    .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
    .card-header-row h3 { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; flex: 1; }
    .card-desc { font-size: 0.85rem; color: #64748b; line-height: 1.5; margin: 0 0 1rem; }
    .card-meta { display: flex; gap: 0.4rem; font-size: 0.83rem; margin-bottom: 0.3rem; color: #334155; }
    .meta-label { color: #94a3b8; font-weight: 500; flex-shrink: 0; }
    .documents-section { margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .documents-title { font-size: 0.9rem; font-weight: 600; color: #1e293b; margin-bottom: 0.75rem; }
    .documents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; }
    .document-item { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem; text-align: center; transition: all 0.2s; }
    .image-item { cursor: pointer; }
    .image-item:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .document-thumbnail { width: 100%; height: 80px; object-fit: cover; border-radius: 4px; margin-bottom: 0.25rem; background: #f1f5f9; }
    .document-name { display: block; font-size: 0.7rem; color: #4a5568; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .document-size { font-size: 0.65rem; color: #718096; }
    .document-link { display: flex; flex-direction: column; align-items: center; text-decoration: none; color: #2d3748; }
    .document-link:hover { color: #2563eb; }
    .document-icon { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .card-contact { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed #e2e8f0; }
    .contact-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #0f172a; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .contact-btn:hover { background: #2563eb; color: white; border-color: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
    .card-footer { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.25rem; border-top: 1px solid #f1f5f9; background: #fafafa; }
    .availability-badge { font-size: 0.75rem; font-weight: 600; color: #2563eb; background: #eff6ff; padding: 0.2rem 0.6rem; border-radius: 50px; }
    .price { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    /* Image Modal */
    .image-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .image-modal .modal-content { position: relative; max-width: 90%; max-height: 90%; }
    .image-modal img { max-width: 100%; max-height: 80vh; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .image-modal .close { position: absolute; top: -40px; right: 0; color: white; font-size: 2rem; cursor: pointer; transition: opacity 0.2s; }
    .image-modal .close:hover { opacity: 0.8; }
    .image-footer { position: absolute; bottom: -60px; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; color: white; padding: 1rem; }
    .btn-download { background: #4299e1; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s; }
    .btn-download:hover { background: #3182ce; }
    @media (max-width: 768px) {
      .page-layout { flex-direction: column; }
      app-navbar { width: 100%; height: auto; position: relative; }
      .services-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 1rem; }
      .header-actions { width: 100%; justify-content: space-between; }
      .image-footer { flex-direction: column; gap: 1rem; bottom: -100px; }
    }
  `]
})
export class InvestorServicesComponent implements OnInit, OnDestroy {

  services: any[] = [];
  filtered: any[] = [];
  searchQuery = '';
  loading = false;

  // Propriétés pour les images
  selectedImage: { url: string; name: string; doc: any } | null = null;
  imageUrls: Map<string, string> = new Map();
  maxConcurrentLoads = 5;
  imageQueue: { doc: any; docId: string }[] = [];
  isLoading = false;

  private http = inject(HttpClient);
  private router = inject(Router);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    this.loadServices();
  }

  ngOnDestroy(): void {
    this.imageUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        window.URL.revokeObjectURL(url);
      }
    });
    this.imageUrls.clear();
  }

  loadServices(): void {
    this.loading = true;
    this.http.get<any[]>('http://localhost:8089/api/investment-services/approved',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => { 
        this.services = data; 
        this.filtered = data; 
        this.loading = false;
        this.prepareImageLoading();
      },
      error: () => { 
        this.loading = false; 
      }
    });
  }

  prepareImageLoading(): void {
    // Collecter toutes les images
    this.services.forEach(service => {
      if (service.images) {
        service.images.forEach((doc: any) => {
          const docId = doc.id.toString();
          if (!this.imageUrls.has(docId)) {
            this.imageQueue.push({ doc, docId });
          }
        });
      }
    });
    
    // Démarrer le chargement
    this.processQueue();
  }

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

  getImageUrl(doc: any): string {
    const docId = doc.id.toString();
    
    if (this.imageUrls.has(docId)) {
      return this.imageUrls.get(docId)!;
    }
    
    return this.getPlaceholderImageUrl();
  }

  getPlaceholderImageUrl(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'30\' text-anchor=\'middle\' fill=\'%239ca3af\'%3E📷%3C/text%3E%3C/svg%3E';
  }

  getErrorImageUrl(): string {
    return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23fee2e2\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'30\' text-anchor=\'middle\' fill=\'%23ef4444\'%3E❌%3C/text%3E%3C/svg%3E';
  }

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

  closeImage(): void {
    this.selectedImage = null;
  }

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

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { 
      this.filtered = this.services; 
      return; 
    }
    this.filtered = this.services.filter(s => [
      s.title, s.name, s.description, s.zone,
      s.contactPerson, s.projectDuration, s.availability, s.type,
      s.region?.name, s.economicSector?.name,
      s.provider?.firstName, s.provider?.lastName,
      s.totalAmount?.toString(), s.minimumAmount?.toString(),
      s.price?.toString(), s.deadlineDate
    ].some(val => val && val.toString().toLowerCase().includes(q)));
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filtered = this.services;
  }

  contactProvider(provider: any): void {
    if (!provider?.email) return;
    const name = provider.firstName && provider.lastName
      ? `${provider.firstName} ${provider.lastName}` : 'Local Partner';
    this.router.navigate(['/messagerie'], {
      queryParams: { contact: provider.email, name }
    });
  }
}