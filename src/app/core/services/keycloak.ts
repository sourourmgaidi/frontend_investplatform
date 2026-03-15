import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class KeycloakService {

  // ✅ UTILISER VOTRE BACKEND COMME PROXY
  private readonly API_URL = 'http://localhost:8089/api/auth';

  constructor(private http: HttpClient) {}

  /**
   * Login via votre backend (qui gère l'appel à Keycloak)
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password });
  }

  /**
   * Logout via votre backend
   */
  logout(refreshToken: string): Observable<any> {
    return this.http.post(`${this.API_URL}/logout`, { refreshToken });
  }

  /**
   * Rafraîchir le token via votre backend
   */
  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken });
  }

  /**
   * Décoder le token JWT
   */
  decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Extraire les rôles du token
   */
  extractRoles(token: string): string[] {
    const decoded = this.decodeToken(token);
    if (!decoded) return [];
    return decoded?.realm_access?.roles || [];
  }

  /**
   * Extraire l'email du token
   */
  extractEmail(token: string): string {
    const decoded = this.decodeToken(token);
    return decoded?.email || decoded?.preferred_username || '';
  }

  /**
   * Vérifier si le token est expiré
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;
    const exp = decoded.exp * 1000;
    return Date.now() > exp;
  }

  /**
   * Obtenir le temps restant avant expiration (en secondes)
   */
  getTokenExpiresIn(token: string): number {
    const decoded = this.decodeToken(token);
    if (!decoded) return 0;
    const exp = decoded.exp * 1000;
    const now = Date.now();
    return Math.max(0, Math.floor((exp - now) / 1000));
  }
}