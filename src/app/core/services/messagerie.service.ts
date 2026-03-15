import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Message {
  id: number;
  content: string;
  senderEmail: string;
  recipientEmail: string;
  sentDate: string;
  read: boolean;
}

export interface Conversation {
  id: number;
  senderRole: string;
  senderEmail: string;
  recipientEmail: string;   // ✅ remplace partner
  recipientRole: string;    // ✅ remplace senderRole du destinataire
  lastMessage: string;
  lastMessageDate: string;
  senderViewed: boolean;
  partnerViewed: boolean;
  // Champs calculés pour l'affichage
  senderName?: string;
  recipientName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagerieService {

  private apiUrl = 'http://localhost:8089/api/messagerie';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ENVOYER UN MESSAGE (universel)
  // ─────────────────────────────────────────────────────────────────────────

  sendMessage(recipientEmail: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/send`, {
      recipientEmail,  // ✅ clé correcte
      content
    }, { headers: this.getHeaders() });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RÉPONDRE (universel - même endpoint pour tous les rôles)
  // ─────────────────────────────────────────────────────────────────────────

  replyToMessage(recipientEmail: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/reply`, {
      recipientEmail,  // ✅ unifié
      content
    }, { headers: this.getHeaders() });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONVERSATIONS
  // ─────────────────────────────────────────────────────────────────────────

  // Pour tous les rôles (sender ET recipient)
  getMyConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(
      `${this.apiUrl}/my-conversations`,
      { headers: this.getHeaders() }
    );
  }

  // Alias pour compatibilité (partenaire local)
  getPartnerConversations(): Observable<Conversation[]> {
    return this.getMyConversations();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGES D'UNE CONVERSATION
  // ─────────────────────────────────────────────────────────────────────────

  getConversation(otherEmail: string): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/conversation/${otherEmail}`,
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGES NON LUS
  // ─────────────────────────────────────────────────────────────────────────

  getUnreadMessages(): Observable<{ unreadCount: number; messages: Message[] }> {
    return this.http.get<{ unreadCount: number; messages: Message[] }>(
      `${this.apiUrl}/unread`,
      { headers: this.getHeaders() }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RECHERCHE
  // ─────────────────────────────────────────────────────────────────────────

  searchLocalPartners(q: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/search-local-partners?q=${q}`,
      { headers: this.getHeaders() }
    );
  }
}