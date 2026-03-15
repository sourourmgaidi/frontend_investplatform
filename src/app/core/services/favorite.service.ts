import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InvestmentService } from '../../shared/models/service.model';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {

  private baseUrl = 'http://localhost:8089/api';

  constructor(private http: HttpClient) { }

  // ========================================
  // POUR INVESTOR
  // ========================================

  // Ajouter aux favoris (investor)
  addInvestorFavorite(serviceId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/investors/favorites/${serviceId}`, {});
  }

  // Retirer des favoris (investor)
  removeInvestorFavorite(serviceId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/investors/favorites/${serviceId}`);
  }

  // Lister les favoris (investor)
  getInvestorFavorites(): Observable<any> {
    return this.http.get(`${this.baseUrl}/investors/favorites`);
  }

  // Vérifier si un service est en favori (investor)
  checkInvestorFavorite(serviceId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/investors/favorites/check/${serviceId}`);
  }

  // Compter les favoris (investor)
  countInvestorFavorites(): Observable<any> {
    return this.http.get(`${this.baseUrl}/investors/favorites/count`);
  }

  // ========================================
  // POUR INTERNATIONAL COMPANY
  // ========================================

  // Ajouter aux favoris (company)
  addCompanyFavorite(serviceId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/international-companies/favorites/${serviceId}`, {});
  }

  // Retirer des favoris (company)
  removeCompanyFavorite(serviceId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/international-companies/favorites/${serviceId}`);
  }

  // Lister les favoris (company)
  getCompanyFavorites(): Observable<any> {
    return this.http.get(`${this.baseUrl}/international-companies/favorites`);
  }

  // Vérifier si un service est en favori (company)
  checkCompanyFavorite(serviceId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/international-companies/favorites/check/${serviceId}`);
  }

  // Compter les favoris (company)
  countCompanyFavorites(): Observable<any> {
    return this.http.get(`${this.baseUrl}/international-companies/favorites/count`);
  }
}