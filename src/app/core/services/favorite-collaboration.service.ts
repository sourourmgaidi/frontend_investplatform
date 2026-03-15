import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class FavoriteCollaborationService {
  
  private readonly API_URL = 'http://localhost:8089/api';

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

  // ========================================
  // MÉTHODES POUR INTERNATIONAL COMPANY
  // ========================================

  /**
   * Ajouter un service de collaboration aux favoris (International Company)
   * POST /api/international-companies/collaboration-favorites/{serviceId}
   */
  addCompanyFavorite(serviceId: number): Observable<any> {
    console.log(`📝 [FavoriteCollaboration] Ajout favori company - Service ID: ${serviceId}`);
    
    return this.http.post(
      `${this.API_URL}/international-companies/collaboration-favorites/${serviceId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        console.log('✅ Favori company ajouté avec succès', response);
      }),
      catchError((error) => {
        console.error('❌ Erreur ajout favori company:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Retirer un service de collaboration des favoris (International Company)
   * DELETE /api/international-companies/collaboration-favorites/{serviceId}
   */
  removeCompanyFavorite(serviceId: number): Observable<any> {
    console.log(`🗑️ [FavoriteCollaboration] Retrait favori company - Service ID: ${serviceId}`);
    
    return this.http.delete(
      `${this.API_URL}/international-companies/collaboration-favorites/${serviceId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        console.log('✅ Favori company retiré avec succès', response);
      }),
      catchError((error) => {
        console.error('❌ Erreur retrait favori company:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer tous les favoris de collaboration (International Company)
   * GET /api/international-companies/collaboration-favorites
   */
  getCompanyFavorites(): Observable<{ success: boolean; favorites: any[]; count: number }> {
    console.log('📋 [FavoriteCollaboration] Récupération des favoris company');
    
    return this.http.get<{ success: boolean; favorites: any[]; count: number }>(
      `${this.API_URL}/international-companies/collaboration-favorites`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log(`✅ ${response.count} favoris company trouvés`);
      }),
      catchError((error) => {
        console.error('❌ Erreur récupération favoris company:', error);
        return of({ success: false, favorites: [], count: 0 });
      })
    );
  }

  /**
   * Vérifier si un service est en favori (International Company)
   * GET /api/international-companies/collaboration-favorites/check/{serviceId}
   */
  checkCompanyFavorite(serviceId: number): Observable<{ success: boolean; isFavorite: boolean; serviceId: number }> {
    console.log(`🔍 [FavoriteCollaboration] Vérification favori company - Service ID: ${serviceId}`);
    
    return this.http.get<{ success: boolean; isFavorite: boolean; serviceId: number }>(
      `${this.API_URL}/international-companies/collaboration-favorites/check/${serviceId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log(`✅ Service ${serviceId} est ${response.isFavorite ? 'en favori' : 'pas en favori'}`);
      }),
      catchError((error) => {
        console.error('❌ Erreur vérification favori company:', error);
        return of({ success: false, isFavorite: false, serviceId });
      })
    );
  }

  /**
   * Compter le nombre de favoris (International Company)
   * GET /api/international-companies/collaboration-favorites/count
   */
  countCompanyFavorites(): Observable<{ success: boolean; count: number }> {
    console.log('🔢 [FavoriteCollaboration] Comptage des favoris company');
    
    return this.http.get<{ success: boolean; count: number }>(
      `${this.API_URL}/international-companies/collaboration-favorites/count`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log(`✅ ${response.count} favoris company au total`);
      }),
      catchError((error) => {
        console.error('❌ Erreur comptage favoris company:', error);
        return of({ success: false, count: 0 });
      })
    );
  }

  // ========================================
  // MÉTHODES POUR ECONOMIC PARTNER
  // ========================================

  /**
   * Ajouter un service de collaboration aux favoris (Economic Partner)
   * POST /api/economic-partners/collaboration-favorites/{serviceId}
   */
  addPartnerFavorite(serviceId: number): Observable<any> {
    console.log(`📝 [FavoriteCollaboration] Ajout favori partner - Service ID: ${serviceId}`);
    
    return this.http.post(
      `${this.API_URL}/economic-partners/collaboration-favorites/${serviceId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        console.log('✅ Favori partner ajouté avec succès', response);
      }),
      catchError((error) => {
        console.error('❌ Erreur ajout favori partner:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Retirer un service de collaboration des favoris (Economic Partner)
   * DELETE /api/economic-partners/collaboration-favorites/{serviceId}
   */
  removePartnerFavorite(serviceId: number): Observable<any> {
    console.log(`🗑️ [FavoriteCollaboration] Retrait favori partner - Service ID: ${serviceId}`);
    
    return this.http.delete(
      `${this.API_URL}/economic-partners/collaboration-favorites/${serviceId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        console.log('✅ Favori partner retiré avec succès', response);
      }),
      catchError((error) => {
        console.error('❌ Erreur retrait favori partner:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer tous les favoris de collaboration (Economic Partner)
   * GET /api/economic-partners/collaboration-favorites
   */
  getPartnerFavorites(): Observable<{ success: boolean; favorites: any[]; count: number }> {
    console.log('📋 [FavoriteCollaboration] Récupération des favoris partner');
    
    return this.http.get<{ success: boolean; favorites: any[]; count: number }>(
      `${this.API_URL}/economic-partners/collaboration-favorites`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log(`✅ ${response.count} favoris partner trouvés`);
      }),
      catchError((error) => {
        console.error('❌ Erreur récupération favoris partner:', error);
        return of({ success: false, favorites: [], count: 0 });
      })
    );
  }

  /**
   * Vérifier si un service est en favori (Economic Partner)
   * GET /api/economic-partners/collaboration-favorites/check/{serviceId}
   */
  checkPartnerFavorite(serviceId: number): Observable<{ success: boolean; isFavorite: boolean; serviceId: number }> {
    console.log(`🔍 [FavoriteCollaboration] Vérification favori partner - Service ID: ${serviceId}`);
    
    return this.http.get<{ success: boolean; isFavorite: boolean; serviceId: number }>(
      `${this.API_URL}/economic-partners/collaboration-favorites/check/${serviceId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log(`✅ Service ${serviceId} est ${response.isFavorite ? 'en favori' : 'pas en favori'}`);
      }),
      catchError((error) => {
        console.error('❌ Erreur vérification favori partner:', error);
        return of({ success: false, isFavorite: false, serviceId });
      })
    );
  }

  /**
   * Compter le nombre de favoris (Economic Partner)
   * GET /api/economic-partners/collaboration-favorites/count
   */
  countPartnerFavorites(): Observable<{ success: boolean; count: number }> {
    console.log('🔢 [FavoriteCollaboration] Comptage des favoris partner');
    
    return this.http.get<{ success: boolean; count: number }>(
      `${this.API_URL}/economic-partners/collaboration-favorites/count`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log(`✅ ${response.count} favoris partner au total`);
      }),
      catchError((error) => {
        console.error('❌ Erreur comptage favoris partner:', error);
        return of({ success: false, count: 0 });
      })
    );
  }

  // ========================================
  // MÉTHODES UTILES POUR LES DEUX RÔLES
  // ========================================

  /**
   * Méthode générique qui appelle la bonne fonction selon le rôle
   */
  addFavorite(role: string, serviceId: number): Observable<any> {
    if (role === 'INTERNATIONAL_COMPANY') {
      return this.addCompanyFavorite(serviceId);
    } else if (role === 'PARTNER') {
      return this.addPartnerFavorite(serviceId);
    } else {
      return throwError(() => new Error('Rôle non autorisé pour les favoris'));
    }
  }

  /**
   * Méthode générique pour retirer un favori selon le rôle
   */
  removeFavorite(role: string, serviceId: number): Observable<any> {
    if (role === 'INTERNATIONAL_COMPANY') {
      return this.removeCompanyFavorite(serviceId);
    } else if (role === 'PARTNER') {
      return this.removePartnerFavorite(serviceId);
    } else {
      return throwError(() => new Error('Rôle non autorisé pour les favoris'));
    }
  }

  /**
   * Méthode générique pour vérifier si un service est en favori
   */
  checkFavorite(role: string, serviceId: number): Observable<{ success: boolean; isFavorite: boolean; serviceId: number }> {
    if (role === 'INTERNATIONAL_COMPANY') {
      return this.checkCompanyFavorite(serviceId);
    } else if (role === 'PARTNER') {
      return this.checkPartnerFavorite(serviceId);
    } else {
      return of({ success: false, isFavorite: false, serviceId });
    }
  }

  /**
   * Méthode générique pour récupérer les favoris
   */
  getFavorites(role: string): Observable<{ success: boolean; favorites: any[]; count: number }> {
    if (role === 'INTERNATIONAL_COMPANY') {
      return this.getCompanyFavorites();
    } else if (role === 'PARTNER') {
      return this.getPartnerFavorites();
    } else {
      return of({ success: false, favorites: [], count: 0 });
    }
  }
}