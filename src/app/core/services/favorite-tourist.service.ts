import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { AuthService } from './auth';

export interface FavoriteService {
  id: number;
  name: string;
  description: string;
  price: number;
  groupPrice?: number;              // ✅ AJOUTÉ
  category: string;
  targetAudience?: string;          // ✅ AJOUTÉ
  contactPerson?: string;           // ✅ AJOUTÉ
  createdAt?: string;               // ✅ AJOUTÉ
  region: { id: number; name: string };
  provider: { 
    id: number; 
    firstName: string; 
    lastName: string;
    email?: string;                  // ✅ AJOUTÉ (optionnel)
    phone?: string;                  // ✅ AJOUTÉ (optionnel)
  };
  availability: string;
  durationHours?: number;
  maxCapacity?: number;
  includedServices?: string[];
  availableLanguages?: string[];
  status: string;
}

export interface FavoriteResponse {
  success: boolean;
  message?: string;
  favorites?: FavoriteService[];
  service?: FavoriteService;
  count?: number;
  isFavorite?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteTouristService {
  private readonly API_URL = 'http://localhost:8089/api/tourist/favorites';
  
  // BehaviorSubject pour gérer l'état des favoris en temps réel
  private favoritesSubject = new BehaviorSubject<FavoriteService[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();
  
  private countSubject = new BehaviorSubject<number>(0);
  public count$ = this.countSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Récupère les headers avec le token d'authentification
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Charge tous les favoris et met à jour les subjects
   */
  loadFavorites(): void {
    this.http.get<FavoriteResponse>(this.API_URL, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          if (response.success && response.favorites) {
            this.favoritesSubject.next(response.favorites);
            this.countSubject.next(response.count || response.favorites.length);
          }
        },
        error: (error) => {
          console.error('❌ Erreur chargement favoris:', error);
          this.favoritesSubject.next([]);
          this.countSubject.next(0);
        }
      });
  }

  /**
   * Ajoute un service aux favoris
   */
  addFavorite(serviceId: number): Observable<FavoriteResponse> {
    console.log(`❤️ Ajout du service ${serviceId} aux favoris`);
    
    return this.http.post<FavoriteResponse>(
      `${this.API_URL}/add/${serviceId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Favori ajouté, rechargement de la liste...');
          setTimeout(() => this.loadFavorites(), 100);
        }
        return response;
      })
    );
  }

  /**
   * Retire un service des favoris
   */
  removeFavorite(serviceId: number): Observable<FavoriteResponse> {
    console.log(`💔 Retrait du service ${serviceId} des favoris`);
    
    return this.http.delete<FavoriteResponse>(
      `${this.API_URL}/remove/${serviceId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Favori retiré, rechargement de la liste...');
          setTimeout(() => this.loadFavorites(), 100);
        }
        return response;
      })
    );
  }

  /**
   * Vérifie si un service est en favori
   */
  checkFavorite(serviceId: number): Observable<boolean> {
    return this.http.get<FavoriteResponse>(
      `${this.API_URL}/check/${serviceId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success ? response.isFavorite || false : false)
    );
  }

  /**
   * Récupère la liste complète des favoris
   */
  getFavorites(): Observable<FavoriteService[]> {
    return this.http.get<FavoriteResponse>(this.API_URL, { headers: this.getHeaders() })
      .pipe(
        map(response => response.success ? response.favorites || [] : [])
      );
  }

  /**
   * Récupère le nombre de favoris
   */
  getFavoritesCount(): Observable<number> {
    return this.http.get<FavoriteResponse>(`${this.API_URL}/count`, { headers: this.getHeaders() })
      .pipe(
        map(response => response.success ? response.count || 0 : 0)
      );
  }

  /**
   * Vide tous les favoris (optionnel)
   */
  clearFavorites(): void {
    this.favoritesSubject.next([]);
    this.countSubject.next(0);
  }

  /**
   * Bascule l'état favori d'un service
   */
  toggleFavorite(serviceId: number): Observable<boolean> {
    return this.checkFavorite(serviceId).pipe(
      map(isFavorite => {
        if (isFavorite) {
          this.removeFavorite(serviceId).subscribe();
          return false;
        } else {
          this.addFavorite(serviceId).subscribe();
          return true;
        }
      })
    );
  }

  /**
   * Rafraîchit les données
   */
  refresh(): void {
    this.loadFavorites();
  }
}