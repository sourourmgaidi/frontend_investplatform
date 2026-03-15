import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MessagerieService, Conversation, Message } from '../../core/services/messagerie.service';
import { AuthService } from '../../core/services/auth';
import { Role } from '../models/user.model';
import { interval, Subscription, switchMap } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  template: `
    <div class="page-layout">
      <app-navbar></app-navbar>

      <div class="page-main">
        <div class="inbox-container">

          <!-- Sidebar des conversations -->
          <div class="conversations-sidebar" [class.mobile-hidden]="mobileShowChat">
            <div class="sidebar-header">
              <h2>💬 Messages</h2>
            </div>

            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="searchConversations()"
                placeholder="Search conversations..."
              />
            </div>

            <div class="conversations-list">
              <div
                class="conversation-item"
                *ngFor="let conv of filteredConversations"
                [class.active]="selectedConversation?.id === conv.id"
                [class.unread]="!isViewed(conv)"
                (click)="selectConversation(conv)"
              >
                <div class="conv-avatar">{{ getInitials(conv) }}</div>
                <div class="conv-details">
                  <div class="conv-header">
                    <span class="conv-name">{{ getContactName(conv) }}</span>
                    <span class="conv-time">{{ formatTime(conv.lastMessageDate) }}</span>
                  </div>
                  <div class="conv-last-message">
                    <span class="last-msg">{{ getLastMessagePreview(conv) }}</span>
                    <span class="unread-badge" *ngIf="!isViewed(conv)">●</span>
                  </div>
                </div>
              </div>

              <div class="empty-conversations" *ngIf="filteredConversations.length === 0 && !loading">
                <div class="empty-icon">✉️</div>
                <p>No conversations yet</p>
              </div>

              <div class="loading-conv" *ngIf="loading">
                <div class="spinner-small"></div>
              </div>
            </div>
          </div>

          <!-- Zone de chat -->
          <div class="chat-area" [class.mobile-visible]="mobileShowChat">

            <!-- Chat header with back button (mobile) -->
            <div class="chat-header" *ngIf="selectedConversation">
              <button class="back-btn" (click)="mobileShowChat = false">←</button>
              <div class="contact-info">
                <div class="contact-avatar">{{ getInitials(selectedConversation) }}</div>
                <div>
                  <h3>{{ getContactName(selectedConversation) }}</h3>
                  <p class="contact-role">{{ getContactRoleLabel(selectedConversation) }}</p>
                </div>
              </div>
            </div>

            <div class="chat-header empty-header" *ngIf="!selectedConversation">
              <h3>Select a conversation to start messaging</h3>
            </div>

            <!-- Messages -->
            <div class="messages-container" #messagesContainer>
              <div class="messages-list" *ngIf="messages.length > 0">
                <div
                  class="message-item"
                  *ngFor="let msg of messages"
                  [class.my-message]="msg.senderEmail === myEmail"
                >
                  <div class="message-bubble">
                    <p>{{ msg.content }}</p>
                    <span class="message-time">{{ formatMessageTime(msg.sentDate) }}</span>
                  </div>
                </div>
              </div>

              <div class="no-messages" *ngIf="messages.length === 0 && selectedConversation">
                <div class="no-msg-icon">💬</div>
                <p>No messages yet. Say hello! 👋</p>
              </div>
            </div>

            <!-- Input -->
            <div class="message-input-area" *ngIf="selectedConversation">
              <textarea
                [(ngModel)]="newMessage"
                placeholder="Type your message..."
                (keydown.enter)="$event.preventDefault(); sendMessage()"
                rows="1"
              ></textarea>
              <button
                class="send-btn"
                [disabled]="!newMessage.trim() || sending"
                (click)="sendMessage()"
              >
                <span *ngIf="!sending">Send ➤</span>
                <span *ngIf="sending">...</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── Page Layout (matches other pages) ─── */
    .page-layout {
      display: flex;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      font-family: 'Inter', sans-serif;
    }
    app-navbar {
      width: 280px;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
    }
    .page-main {
      flex: 1;
      padding: 2rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ─── Inbox Container ─── */
    .inbox-container {
      display: flex;
      height: calc(100vh - 4rem);
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 30px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }

    /* ─── Sidebar ─── */
    .conversations-sidebar {
      width: 320px;
      flex-shrink: 0;
      border-right: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      background: #fafbff;
    }
    .sidebar-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .sidebar-header h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }
    .search-box {
      padding: 0.75rem 1rem;
      position: relative;
      border-bottom: 1px solid #f1f5f9;
    }
    .search-box input {
      width: 100%;
      padding: 0.55rem 0.75rem 0.55rem 2.2rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.85rem;
      background: white;
      outline: none;
      box-sizing: border-box;
    }
    .search-box input:focus { border-color: #2563eb; }
    .search-icon {
      position: absolute;
      left: 1.65rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      pointer-events: none;
    }
    .conversations-list { flex: 1; overflow-y: auto; }
    .conversation-item {
      display: flex;
      padding: 0.9rem 1.25rem;
      gap: 0.75rem;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid #f8fafc;
    }
    .conversation-item:hover { background: #f0f4ff; }
    .conversation-item.active { background: #eff6ff; border-left: 3px solid #2563eb; }
    .conversation-item.unread { background: #fffbeb; }
    .conv-avatar {
      width: 42px; height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
      flex-shrink: 0;
    }
    .conv-details { flex: 1; min-width: 0; }
    .conv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem; }
    .conv-name { font-weight: 600; font-size: 0.9rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
    .conv-time { font-size: 0.7rem; color: #94a3b8; flex-shrink: 0; }
    .conv-last-message { display: flex; justify-content: space-between; align-items: center; }
    .last-msg { font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .unread-badge { color: #2563eb; font-size: 0.9rem; flex-shrink: 0; }
    .empty-conversations { text-align: center; padding: 3rem 1rem; color: #94a3b8; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .empty-conversations p { font-size: 0.9rem; }
    .loading-conv { display: flex; justify-content: center; padding: 2rem; }
    .spinner-small {
      width: 28px; height: 28px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── Chat Area ─── */
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      min-width: 0;
    }
    .chat-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: white;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .empty-header { justify-content: center; color: #94a3b8; }
    .empty-header h3 { margin: 0; font-size: 0.95rem; font-weight: 500; }
    .back-btn {
      display: none;
      background: none; border: none;
      font-size: 1.3rem; cursor: pointer; color: #2563eb;
      padding: 0 0.5rem 0 0;
    }
    .contact-info { display: flex; align-items: center; gap: 0.75rem; }
    .contact-avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
    }
    .contact-info h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .contact-role { margin: 0; font-size: 0.78rem; color: #64748b; }

    /* ─── Messages ─── */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
    }
    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .message-item { display: flex; }
    .message-item.my-message { justify-content: flex-end; }
    .message-bubble {
      max-width: 65%;
      padding: 0.7rem 1rem;
      border-radius: 18px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }
    .my-message .message-bubble {
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: white;
      border-color: transparent;
    }
    .message-bubble p { margin: 0 0 0.2rem; font-size: 0.9rem; line-height: 1.5; word-wrap: break-word; }
    .message-time { font-size: 0.65rem; opacity: 0.65; display: block; text-align: right; }
    .no-messages { text-align: center; margin: auto; color: #94a3b8; }
    .no-msg-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .no-messages p { font-size: 0.9rem; }

    /* ─── Input Area ─── */
    .message-input-area {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      align-items: flex-end;
    }
    .message-input-area textarea {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      resize: none;
      font-family: inherit;
      font-size: 0.9rem;
      max-height: 120px;
      outline: none;
      transition: border-color 0.2s;
      line-height: 1.4;
    }
    .message-input-area textarea:focus { border-color: #2563eb; }
    .send-btn {
      padding: 0.75rem 1.4rem;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white; border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .send-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(37,99,235,0.3);
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ─── Responsive ─── */
    @media (max-width: 900px) {
      app-navbar { width: 100%; height: auto; position: relative; }
      .page-layout { flex-direction: column; }
      .page-main { padding: 0; }
      .inbox-container { border-radius: 0; height: calc(100vh - 60px); }
      .conversations-sidebar { width: 100%; }
      .conversations-sidebar.mobile-hidden { display: none; }
      .chat-area { display: none; }
      .chat-area.mobile-visible { display: flex; }
      .back-btn { display: block; }
    }
  `]
})
export class InboxComponent implements OnInit, OnDestroy {

  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';
  searchQuery = '';
  myEmail = '';
  myRole: Role | null = null;
  loading = false;
  sending = false;
  mobileShowChat = false;

  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  private refreshSubscription?: Subscription;

  constructor(
    private messagerieService: MessagerieService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    // Récupérer l'email du current user
    const currentUser = this.authService.getCurrentUser();
    console.log('👤 Current user complet:', currentUser);
    
    this.myEmail = currentUser?.email || '';
    console.log('📧 Email récupéré du currentUser:', this.myEmail);
    
    this.myRole = this.authService.getUserRole();
    console.log('👤 Rôle:', this.myRole);
    
    // Si pas d'email, essayer de le récupérer du token
    if (!this.myEmail) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 JWT payload:', payload);
          console.log('🔍 Tous les champs du payload:', Object.keys(payload));
          
          // Essayer tous les champs possibles
          this.myEmail = payload.email || 
                         payload.sub || 
                         payload.preferred_username || 
                         payload.username || 
                         payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
                         '';
          
          console.log('📧 Email extrait du token:', this.myEmail);
          
          // Vérifier les rôles
          const roles = payload.realm_access?.roles || payload.roles || [];
          console.log('👤 Rôles du token:', roles);
          
        } catch (e) {
          console.error('❌ Erreur parsing token:', e);
        }
      }
    }
  }

  ngOnInit(): void {
    this.loadConversations();

    this.route.queryParams.subscribe(params => {
      if (params['contact']) {
        const contactEmail = params['contact'];
        const contactName = params['name'] || contactEmail;
        setTimeout(() => this.openOrCreateConversation(contactEmail, contactName), 600);
      }
    });

    // Rafraîchissement toutes les 10 secondes
    this.refreshSubscription = interval(10000).pipe(
      switchMap(() => this.messagerieService.getMyConversations())
    ).subscribe({
      next: (data) => {
        this.conversations = data;
        this.filterConversations();
      },
      error: (err) => console.error('Refresh error:', err)
    });

    // Vérifier si l'email existe dans la base après 2 secondes
    setTimeout(() => this.verifierEmailDansBase(), 2000);
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadConversations(): void {
    this.loading = true;
    this.messagerieService.getMyConversations().subscribe({
      next: (data) => {
        this.conversations = data;
        this.filterConversations();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading conversations:', err);
        this.loading = false;
      }
    });
  }

  // Vérifier si l'email existe dans la base de données
  verifierEmailDansBase(): void {
    if (!this.myEmail) {
      console.error('❌ Pas d\'email à vérifier');
      return;
    }
    
    console.log('🔍 Vérification de l\'email dans la base:', this.myEmail);
    
    this.messagerieService.searchLocalPartners(this.myEmail).subscribe({
      next: (results) => {
        console.log('Résultats recherche partenaire local:', results);
        
        const existe = results && results.some((r: any) => 
          r.email && r.email.toLowerCase() === this.myEmail.toLowerCase()
        );
        
        if (existe) {
          console.log('✅ Votre email EXISTE dans la table local_partner');
        } else {
          console.error('❌ Votre email N\'EXISTE PAS dans la table local_partner');
          if (results && results.length > 0) {
            console.log('Emails trouvés dans la base:', results.map((r: any) => r.email));
          }
        }
      },
      error: (err) => {
        console.error('Erreur vérification email:', err);
      }
    });
  }

  openOrCreateConversation(contactEmail: string, contactName?: string): void {
    const existing = this.conversations.find(c =>
      c.senderEmail === contactEmail || c.recipientEmail === contactEmail
    );
    if (existing) {
      this.selectConversation(existing);
    } else {
      // Créer une conversation temporaire
      const fakeConv: Conversation = {
        id: -1,
        senderRole: this.myRole?.toString() || '',
        senderEmail: this.myEmail,
        recipientEmail: contactEmail,
        recipientRole: 'LOCAL_PARTNER',
        lastMessage: '',
        lastMessageDate: new Date().toISOString(),
        senderViewed: true,
        partnerViewed: false,
        recipientName: contactName || contactEmail,
        senderName: this.myEmail
      };
      this.selectedConversation = fakeConv;
      this.messages = [];
      this.mobileShowChat = true;
    }
  }

  filterConversations(): void {
    if (!this.searchQuery.trim()) {
      this.filteredConversations = this.conversations;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredConversations = this.conversations.filter(conv => {
      const name = this.getContactName(conv).toLowerCase();
      return name.includes(q) || (conv.lastMessage?.toLowerCase().includes(q) ?? false);
    });
  }

  searchConversations(): void {
    this.filterConversations();
  }

  selectConversation(conv: Conversation): void {
    this.selectedConversation = conv;
    this.mobileShowChat = true;
    const otherEmail = this.getOtherEmail(conv);

    this.messagerieService.getConversation(otherEmail).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => console.error('Error loading conversation:', err)
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.sending) return;

    const otherEmail = this.getOtherEmail(this.selectedConversation);
    const content = this.newMessage.trim();
    
    console.log('📤 ===== TENTATIVE D\'ENVOI =====');
    console.log('1️⃣ Mon email (expéditeur):', this.myEmail);
    console.log('2️⃣ Email destinataire:', otherEmail);
    console.log('3️⃣ Contenu:', content);
    
    // Vérifications
    if (!this.myEmail) {
      alert('❌ Erreur: Votre email n\'est pas défini. Reconnectez-vous.');
      return;
    }
    
    if (!otherEmail) {
      alert('❌ Erreur: Email du destinataire manquant');
      return;
    }
    
    if (otherEmail.toLowerCase() === this.myEmail.toLowerCase()) {
      alert('❌ Erreur: Vous ne pouvez pas vous envoyer un message à vous-même');
      return;
    }

    this.sending = true;
    const messageToSend = content;
    this.newMessage = '';

    this.messagerieService.sendMessage(otherEmail, messageToSend).subscribe({
      next: (msg) => {
        console.log('✅ Message envoyé avec succès:', msg);
        this.messages.push(msg);
        this.sending = false;

        if (this.selectedConversation?.id === -1) {
          setTimeout(() => this.loadConversations(), 500);
        } else {
          this.loadConversations();
        }
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('❌ ERREUR COMPLÈTE:', err);
        console.error('Status:', err.status);
        console.error('Message backend:', err.error);
        
        let errorMessage = 'Erreur lors de l\'envoi';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else {
            errorMessage = JSON.stringify(err.error);
          }
        }
        
        alert('❌ ' + errorMessage);
        
        this.sending = false;
        this.newMessage = messageToSend;
      }
    });
  }

  getOtherEmail(conv: Conversation): string {
    return conv.senderEmail === this.myEmail ? conv.recipientEmail : conv.senderEmail;
  }

  getContactName(conv: Conversation): string {
    if (conv.senderEmail === this.myEmail) {
      return conv.recipientName || conv.recipientEmail || 'Contact';
    }
    return conv.senderName || conv.senderEmail || 'Contact';
  }

  getInitials(conv: Conversation): string {
    const name = this.getContactName(conv);
    if (!name || name === 'Contact') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  getContactRoleLabel(conv: Conversation): string {
    const role = conv.senderEmail === this.myEmail ? conv.recipientRole : conv.senderRole;
    const labels: Record<string, string> = {
      'LOCAL_PARTNER': 'Local Partner',
      'INVESTOR': 'Investor',
      'PARTNER': 'Economic Partner',
      'TOURIST': 'Tourist'
    };
    return labels[role] || role || '';
  }

  getLastMessagePreview(conv: Conversation): string {
    if (!conv.lastMessage) return 'Start a conversation';
    return conv.lastMessage.length > 35
      ? conv.lastMessage.substring(0, 35) + '...'
      : conv.lastMessage;
  }

  isViewed(conv: Conversation): boolean {
    return conv.senderEmail === this.myEmail ? conv.senderViewed : conv.partnerViewed;
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  formatMessageTime(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}