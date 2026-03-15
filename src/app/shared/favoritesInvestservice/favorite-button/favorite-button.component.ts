import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoriteService } from '../../../core/services/favorite.service';
import { AuthService } from '../../../core/services/auth';
import { Role } from '../../../shared/models/user.model';

@Component({
  selector: 'app-favorite-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.css']
})
export class FavoriteButtonComponent implements OnInit {
  @Input() serviceId!: number;
  
  isFavorite = false;
  isLoading = false;
  userRole: Role | null = null;

  constructor(
    private favoriteService: FavoriteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    if (this.userRole === Role.INVESTOR || this.userRole === Role.INTERNATIONAL_COMPANY) {
      this.checkFavoriteStatus();
    }
  }

  private checkFavoriteStatus(): void {
    if (!this.userRole) return;

    if (this.userRole === Role.INVESTOR) {
      this.favoriteService.checkInvestorFavorite(this.serviceId).subscribe({
        next: (response) => {
          this.isFavorite = response.isFavorite;
        },
        error: (error) => console.error('Error checking favorite:', error)
      });
    } else if (this.userRole === Role.INTERNATIONAL_COMPANY) {
      this.favoriteService.checkCompanyFavorite(this.serviceId).subscribe({
        next: (response) => {
          this.isFavorite = response.isFavorite;
        },
        error: (error) => console.error('Error checking favorite:', error)
      });
    }
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isLoading || !this.userRole) return;
    
    this.isLoading = true;
    
    if (this.isFavorite) {
      this.removeFavorite();
    } else {
      this.addFavorite();
    }
  }

  private addFavorite(): void {
    if (!this.userRole) return;

    if (this.userRole === Role.INVESTOR) {
      this.favoriteService.addInvestorFavorite(this.serviceId).subscribe({
        next: () => {
          this.isFavorite = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error adding favorite:', error);
          this.isLoading = false;
        }
      });
    } else if (this.userRole === Role.INTERNATIONAL_COMPANY) {
      this.favoriteService.addCompanyFavorite(this.serviceId).subscribe({
        next: () => {
          this.isFavorite = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error adding favorite:', error);
          this.isLoading = false;
        }
      });
    }
  }

  private removeFavorite(): void {
    if (!this.userRole) return;

    if (this.userRole === Role.INVESTOR) {
      this.favoriteService.removeInvestorFavorite(this.serviceId).subscribe({
        next: () => {
          this.isFavorite = false;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error removing favorite:', error);
          this.isLoading = false;
        }
      });
    } else if (this.userRole === Role.INTERNATIONAL_COMPANY) {
      this.favoriteService.removeCompanyFavorite(this.serviceId).subscribe({
        next: () => {
          this.isFavorite = false;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error removing favorite:', error);
          this.isLoading = false;
        }
      });
    }
  }

  getTooltip(): string {
    if (!this.userRole) return 'Not authorized';
    return this.isFavorite ? 'Remove from favorites' : 'Add to favorites';
  }
}