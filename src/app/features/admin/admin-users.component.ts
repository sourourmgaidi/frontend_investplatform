import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import type { User, UsersResponse, StatisticsResponse } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: 'admin-users.component.html',
  styleUrls: ['admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  statistics: StatisticsResponse | null = null;
  
  loading = false;
  error = '';
  success = '';
  
  searchTerm = '';
  selectedRole = 'ALL';
  selectedUser: User | null = null;
  showUserDetails = false;
  showDeleteModal = false;
  userToDelete: string | null = null;
  
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  roleColors: { [key: string]: string } = {
    'INVESTOR': '#27AE60',
    'TOURIST': '#4A90E2',
    'PARTNER': '#F39C12',
    'LOCAL_PARTNER': '#9B59B6',
    'INTERNATIONAL_COMPANY': '#E74C3C',
    'ADMIN': '#C62828'
  };

  roleLabels: { [key: string]: string } = {
    'INVESTOR': 'Investisseur',
    'TOURIST': 'Touriste',
    'PARTNER': 'Partenaire Économique',
    'LOCAL_PARTNER': 'Partenaire Local',
    'INTERNATIONAL_COMPANY': 'Société Internationale',
    'ADMIN': 'Administrateur'
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadStatistics();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';
    
    this.adminService.getAllUsers().subscribe({
      next: (response: UsersResponse) => {
        this.users = response.users;
        this.applyFilter();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement utilisateurs:', err);
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
      }
    });
  }

  loadStatistics() {
    this.adminService.getStatistics().subscribe({
      next: (stats: StatisticsResponse) => {
        this.statistics = stats;
      },
      error: (err: any) => {
        console.error('Erreur chargement statistiques:', err);
      }
    });
  }

  searchUsers() {
    if (this.searchTerm.trim()) {
      this.loading = true;
      this.adminService.searchUsers(this.searchTerm).subscribe({
        next: (response: UsersResponse) => {
          this.users = response.users;
          this.applyFilter();
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Erreur recherche:', err);
          this.error = 'Erreur lors de la recherche';
          this.loading = false;
        }
      });
    } else {
      this.loadUsers();
    }
  }

  applyFilter() {
    if (this.selectedRole === 'ALL') {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(u => u.role === this.selectedRole);
    }
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsers.slice(start, end);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  viewUserDetails(user: User) {
    this.selectedUser = user;
    this.showUserDetails = true;
  }

  closeDetails() {
    this.showUserDetails = false;
    this.selectedUser = null;
  }

  confirmDelete(email: string) {
    this.userToDelete = email;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  deleteUser() {
    if (!this.userToDelete) return;

    this.loading = true;
    this.error = '';
    
    this.adminService.deleteUser(this.userToDelete).subscribe({
      next: (response: any) => {
        this.success = 'Utilisateur supprimé avec succès';
        this.showDeleteModal = false;
        this.userToDelete = null;
        this.loadUsers();
        this.loadStatistics();
        
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (err: any) => {
        console.error('Erreur suppression:', err);
        this.error = err.error?.error || 'Erreur lors de la suppression';
        this.loading = false;
        this.showDeleteModal = false;
      }
    });
  }

  getRoleColor(role: string): string {
    return this.roleColors[role] || '#666';
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] || role;
  }

  getUserInitials(user: User): string {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email.charAt(0).toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refreshData() {
    this.searchTerm = '';
    this.selectedRole = 'ALL';
    this.loadUsers();
    this.loadStatistics();
  }
}