import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth'; // ✅ Changé de './auth.service' à './auth'

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  active: boolean;
  registrationDate: string;
  
  // Investor specific
  company?: string;
  originCountry?: string;
  activitySector?: string;
  profilePicture?: string;
  nationality?: string;
  website?: string;
  linkedinProfile?: string;
  
  // International Company specific
  companyName?: string;
  siret?: string;
  
  // Partner specific
  countryOfOrigin?: string;
  businessSector?: string;
  headquartersAddress?: string;
  
  // Local Partner specific
  address?: string;
  region?: string;
  description?: string;
  status?: string;
  businessRegistrationNumber?: string;
  professionalTaxNumber?: string;
  activityDomain?: string;
  
  // Tourist specific
  profilePhoto?: string;
}

export interface UsersResponse {
  success: boolean;
  total: number;
  message: string;
  users: User[];
}

export interface StatisticsResponse {
  success: boolean;
  totalInvestors: number;
  totalTourists: number;
  totalPartners: number;
  totalLocalPartners: number;
  totalInternationalCompanies: number;
  totalAdmins: number;
  totalUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8089/api/admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Récupérer tous les utilisateurs
  getAllUsers(searchTerm?: string): Observable<UsersResponse> {
    let params = new HttpParams();
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    
    return this.http.get<UsersResponse>(`${this.apiUrl}/users`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Rechercher des utilisateurs
  searchUsers(keyword: string): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/users/search`, {
      headers: this.getHeaders(),
      params: new HttpParams().set('keyword', keyword)
    });
  }

  // Obtenir les statistiques
  getStatistics(): Observable<StatisticsResponse> {
    return this.http.get<StatisticsResponse>(`${this.apiUrl}/users/statistics`, {
      headers: this.getHeaders()
    });
  }

  // Supprimer un utilisateur par email
  deleteUser(email: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${email}`, {
      headers: this.getHeaders()
    });
  }

  // Supprimer un utilisateur par type et email
  deleteUserByType(email: string, userType: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-user/${userType}/${email}`, {
      headers: this.getHeaders()
    });
  }
}