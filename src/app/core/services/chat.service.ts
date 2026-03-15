import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable,map } from 'rxjs';
import { AuthService } from './auth';

export interface ChatMessage {
  id: number;
  content: string;
  read: boolean;
  sentAt: Date;
  senderType: string;
  senderId: number;
  senderName: string;
  receiverType: string;
  receiverId: number;
  receiverName: string;
  attachments: ChatAttachment[];
}

export interface ChatAttachment {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
}

export interface Conversation {
  otherRole: string;
  otherId: number;
  lastMessageDate: string;
   otherFirstName?: string;  // Ajouté
  otherLastName?: string;   // Ajouté
  otherDisplayName?: string;
}

// NOUVELLE INTERFACE POUR LES RÉSULTATS DE RECHERCHE D'UTILISATEURS
export interface UserSearchResult {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  profilePhoto?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8089/api/multirole-chat';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ========================================
  // MÉTHODES EXISTANTES (MESSAGES)
  // ========================================

  sendMessage(receiverRole: string, receiverId: number, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, 
      { receiverRole, receiverId, content },
      { headers: this.getHeaders() }
    );
  }

  sendMessageWithAttachments(
    receiverRole: string, 
    receiverId: number, 
    content: string, 
    files: File[]
  ): Observable<any> {
    const formData = new FormData();
    formData.append('receiverRole', receiverRole);
    formData.append('receiverId', receiverId.toString());
    formData.append('content', content);
    
    files.forEach(file => {
      formData.append('attachments', file);
    });

    return this.http.post(`${this.apiUrl}/send-with-attachments`, 
      formData,
      { headers: this.getHeaders() }
    );
  }

  getConversation(targetRole: string, targetId: number, page = 0, size = 50): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/conversation/messenger/${targetRole}/${targetId}?page=${page}&size=${size}`,
      { headers: this.getHeaders() }
    );
  }

getConversations(): Observable<Conversation[]> {
  return this.http.get<any[]>(`${this.apiUrl}/conversations`, { headers: this.getHeaders() })
    .pipe(
      map((data: any[]) => {
        console.log('📥 Conversations brutes:', data);
        
        return data.map(item => {
          // La structure retournée par votre backend est un tableau d'objets
          // avec [otherRole, otherId, lastMessageDate, ...]
          // Nous devons récupérer les noms si disponibles
          
          let otherFirstName = '';
          let otherLastName = '';
          
          // Si le backend retourne plus d'informations (à adapter selon la structure réelle)
          if (item.length > 3) {
            // Supposons que l'index 3 contient le prénom et l'index 4 le nom
            otherFirstName = item[3] || '';
            otherLastName = item[4] || '';
          } else if (item.otherFirstName) {
            // Si c'est un objet
            otherFirstName = item.otherFirstName;
            otherLastName = item.otherLastName;
          }
          
          const otherRole = item[0] || item.otherRole || item.role || 'Inconnu';
          const otherId = item[1] || item.otherId || item.id || 0;
          const lastMessageDate = item[2] || item.lastMessageDate || new Date().toISOString();
          
          // Construire le nom d'affichage
          let otherDisplayName = '';
          if (otherFirstName && otherLastName) {
            otherDisplayName = `${otherFirstName} ${otherLastName}`;
          } else if (otherFirstName) {
            otherDisplayName = otherFirstName;
          } else if (otherLastName) {
            otherDisplayName = otherLastName;
          } else {
            otherDisplayName = otherRole;
          }
          
          return {
            otherRole: otherRole,
            otherId: otherId,
            lastMessageDate: lastMessageDate,
            otherFirstName: otherFirstName,
            otherLastName: otherLastName,
            otherDisplayName: otherDisplayName
          };
        });
      })
    );
}

  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unread/count`, { headers: this.getHeaders() });
  }

  markAsRead(messageId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${messageId}/read`, {}, { headers: this.getHeaders() });
  }

  deleteMessage(messageId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${messageId}`, { 
    headers: this.getHeaders() 
  });
}

  downloadAttachment(attachmentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/attachment/${attachmentId}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  // ========================================
  // NOUVELLES MÉTHODES POUR LA RECHERCHE D'UTILISATEURS
  // ========================================

  /**
   * Rechercher des utilisateurs par email, nom ou prénom
   * @param query Terme de recherche
   */
  searchUsers(query: string): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(
      `${this.apiUrl}/users/search?q=${encodeURIComponent(query)}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Récupérer tous les utilisateurs (pour admin uniquement)
   */
  getAllUsers(): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(
      `${this.apiUrl}/users/all`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Récupérer la liste des admins (pour les autres utilisateurs)
   */
  getAdmins(): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(
      `${this.apiUrl}/users/admins`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Démarrer une nouvelle conversation avec un utilisateur
   * @param receiverRole Rôle du destinataire
   * @param receiverId ID du destinataire
   * @param content Message optionnel (peut être vide)
   */
  startConversation(receiverRole: string, receiverId: number, content: string = ''): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/conversation/start`,
      { receiverRole, receiverId, content },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Récupérer les détails d'une conversation spécifique avec format amélioré
   * @param targetRole Rôle de l'autre utilisateur
   * @param targetId ID de l'autre utilisateur
   */
  getConversationDetails(targetRole: string, targetId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/conversation/details/${targetRole}/${targetId}`,
      { headers: this.getHeaders() }
    );
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Vérifier si l'utilisateur courant est admin
   */
  isAdmin(): boolean {
    const role = localStorage.getItem('userRole');
    return role === 'ADMIN';
  }

  /**
   * Obtenir le rôle de l'utilisateur courant
   */
  getCurrentUserRole(): string {
    return localStorage.getItem('userRole') || 'USER';
  }

  /**
   * Obtenir l'ID de l'utilisateur courant
   */
  getCurrentUserId(): number {
    return parseInt(localStorage.getItem('userId') || '0');
  }

  /**
   * Obtenir le nom d'affichage d'un utilisateur
   */
  getDisplayName(user: UserSearchResult): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.displayName) {
      return user.displayName;
    }
    return user.email.split('@')[0];
  }

  /**
   * Obtenir l'initiale d'un utilisateur pour l'avatar
   */
  getUserInitial(user: UserSearchResult): string {
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  }

  /**
   * Formater une date pour l'affichage
   */
  formatMessageDate(date: Date | string): string {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Aujourd'hui à " + messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Hier à " + messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString('fr-FR') + " à " + 
             messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
  }

  /**
   * Obtenir l'icône pour un type de fichier
   */
  getFileIcon(fileType: string): string {
    if (!fileType) return '📎';
    if (fileType.startsWith('image/')) return '📷';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('video')) return '🎬';
    return '📎';
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  /**
 * Récupérer les pièces jointes d'un message spécifique
 * @param chatId ID du message
 */
getMessageAttachments(chatId: number): Observable<ChatAttachment[]> {
  return this.http.get<ChatAttachment[]>(
    `${this.apiUrl}/${chatId}/attachments`,
    { headers: this.getHeaders() }
  );
}
}