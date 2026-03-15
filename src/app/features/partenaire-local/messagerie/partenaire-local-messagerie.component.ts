import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { NotificationBellComponent } from '../../../shared/notification-bell/notification-bell.component';

interface Message {
  id: number;
  content: string;
  senderEmail: string;
  recipientEmail: string;
  sentDate: string;
  read: boolean;
}

interface Conversation {
  id: number;
  senderRole: string;
  senderEmail: string;
  recipientEmail: string;
  recipientRole: string;
  lastMessage: string;
  lastMessageDate: string;
  senderViewed: boolean;
  partnerViewed: boolean;
  _contactName?: string; // champ local pour affichage
}

@Component({
  selector: 'app-partenaire-local-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, NotificationBellComponent],
  template: `
    <div class="page-layout">
      <app-navbar></app-navbar>

      <div class="page-main">

        <!-- Header page -->
        <div class="page-header">
          <div>
            <a routerLink="/partenaire-local/dashboard" class="back-link">← Retour au Dashboard</a>
            <h1>Messagerie</h1>
            <p class="subtitle">Gérez vos conversations avec vos partenaires</p>
          </div>
          <app-notification-bell></app-notification-bell>
        </div>

        <div class="inbox-container">

          <!-- ────────── SIDEBAR ────────── -->
          <div class="sidebar" [class.mobile-hidden]="mobileShowChat">

            <div class="sidebar-header">
              <h2>💬 Conversations</h2>
              <span class="badge-count" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
            </div>

            <div class="search-wrapper">
              <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="filterConversations()"
                placeholder="Rechercher une conversation..."
                class="search-input"
              />
            </div>

            <div class="conv-list">

              <div class="loading-state" *ngIf="loadingConv">
                <div class="spinner"></div>
              </div>

              <div
                class="conv-item"
                *ngFor="let conv of filteredConversations"
                [class.active]="selectedConv?.id === conv.id"
                [class.unread]="!isViewed(conv)"
                (click)="selectConversation(conv)"
              >
                <div class="conv-avatar" [class.green]="conv.recipientRole === 'LOCAL_PARTNER'">
                  {{ getInitials(conv) }}
                </div>
                <div class="conv-info">
                  <div class="conv-top">
                    <span class="conv-name">{{ getContactName(conv) }}</span>
                    <span class="conv-time">{{ formatTime(conv.lastMessageDate) }}</span>
                  </div>
                  <div class="conv-bottom">
                    <span class="conv-preview">{{ conv.lastMessage || 'Démarrer la conversation...' }}</span>
                    <span class="unread-dot" *ngIf="!isViewed(conv)">●</span>
                  </div>
                  <span class="role-badge">{{ getRoleLabel(conv) }}</span>
                </div>
              </div>

              <div class="empty-conv" *ngIf="filteredConversations.length === 0 && !loadingConv">
                <div class="empty-icon">📭</div>
                <p>Aucune conversation</p>
                <small>Les messages des investisseurs, touristes et partenaires apparaîtront ici</small>
              </div>

            </div>
          </div>

          <!-- ────────── ZONE CHAT ────────── -->
          <div class="chat-zone" [class.mobile-show]="mobileShowChat">

            <!-- Header chat (conversation sélectionnée) -->
            <div class="chat-header" *ngIf="selectedConv">
              <button class="back-btn" (click)="mobileShowChat = false" title="Retour">←</button>
              <div class="avatar-lg" [class.green]="selectedConv.recipientRole === 'LOCAL_PARTNER'">
                {{ getInitials(selectedConv) }}
              </div>
              <div class="contact-info">
                <h3>{{ getContactName(selectedConv) }}</h3>
                <span class="role-tag">{{ getRoleLabel(selectedConv) }}</span>
              </div>
            </div>

            <!-- Header vide -->
            <div class="chat-header empty-header" *ngIf="!selectedConv">
              <div class="empty-chat-hint">
                <div class="hint-icon">💬</div>
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            </div>

            <!-- Zone messages -->
            <div class="messages-area" #messagesContainer>

              <!-- Loader messages -->
              <div class="loading-msgs" *ngIf="loadingMessages">
                <div class="spinner"></div>
                <span>Chargement des messages...</span>
              </div>

              <!-- Liste des messages -->
              <ng-container *ngIf="!loadingMessages && selectedConv">

                <div class="messages-list" *ngIf="messages.length > 0">
                  <div
                      class="msg-row"
                     *ngFor="let msg of messages"
                      [class.mine]="msg.senderEmail === myEmail">

                    <!-- Avatar pour les messages reçus -->
                    <div class="msg-avatar" *ngIf="msg.senderEmail !== myEmail">
                      {{ getInitials(selectedConv) }}
                    </div>

                    <div class="msg-bubble">
                      <p>{{ msg.content }}</p>
                      <div class="msg-meta">
                        <span class="msg-time">{{ formatMsgTime(msg.sentDate) }}</span>
                        <span class="msg-status" *ngIf="msg.senderEmail === myEmail">
                          {{ msg.read ? '✓✓' : '✓' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Aucun message -->
                <div class="no-messages" *ngIf="messages.length === 0">
                  <div class="no-msg-icon">👋</div>
                  <p>Commencez la conversation !</p>
                  <small>Envoyez votre premier message à {{ getContactName(selectedConv) }}</small>
                </div>

              </ng-container>

            </div>

            <!-- Zone saisie -->
            <div class="input-area" *ngIf="selectedConv">
              <div class="input-wrapper">
                <textarea
                  [(ngModel)]="newMessage"
                  placeholder="Écrire un message... (Entrée pour envoyer)"
                  (keydown.enter)="$event.preventDefault(); sendMessage()"
                  (input)="autoResize($event)"
                  rows="1"
                  class="msg-input"
                ></textarea>
                <button
                  class="send-btn"
                  [disabled]="!newMessage.trim() || sending"
                  (click)="sendMessage()"
                  [title]="sending ? 'Envoi en cours...' : 'Envoyer'"
                >
                  <span *ngIf="!sending">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </span>
                  <div class="spinner-sm" *ngIf="sending"></div>
                </button>
              </div>
              <p class="input-hint">Appuyez sur Entrée pour envoyer · Shift+Entrée pour une nouvelle ligne</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── Layout ─── */
    .page-layout {
      display: flex;
      min-height: 100vh;
      background: linear-gradient(135deg, #f0fdf4, #f1f5f9);
      font-family: 'Inter', sans-serif;
    }
    app-navbar {
      width: 280px; flex-shrink: 0;
      position: sticky; top: 0; height: 100vh; z-index: 100;
    }
    .page-main {
      flex: 1; padding: 1.5rem 2rem;
      overflow: hidden; display: flex; flex-direction: column;
      gap: 1rem;
    }

    /* ─── Page Header ─── */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-shrink: 0;
    }
    .back-link {
      display: inline-block; color: #059669; font-size: 0.85rem;
      font-weight: 500; text-decoration: none; margin-bottom: 0.4rem;
    }
    .back-link:hover { color: #047857; }
    h1 {
      font-size: 1.75rem; font-weight: 700; color: #0f172a;
      margin: 0 0 0.2rem;
    }
    h1::after {
      content: ''; display: block; width: 50px; height: 3px;
      background: linear-gradient(90deg, #059669, #10b981);
      margin-top: 0.3rem; border-radius: 2px;
    }
    .subtitle { color: #64748b; margin: 0; font-size: 0.9rem; }

    /* ─── Inbox Container ─── */
    .inbox-container {
      display: flex;
      flex: 1;
      min-height: 0;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 30px rgba(0,0,0,0.08);
      border: 1px solid #d1fae5;
    }

    /* ─── Sidebar ─── */
    .sidebar {
      width: 320px; flex-shrink: 0;
      border-right: 1px solid #f0fdf4;
      display: flex; flex-direction: column;
      background: #fafffe;
    }
    .sidebar-header {
      padding: 1.2rem 1.5rem;
      border-bottom: 1px solid #f0fdf4;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .sidebar-header h2 { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
    .badge-count {
      background: #ef4444; color: white; border-radius: 50%;
      width: 20px; height: 20px; font-size: 0.7rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .search-wrapper {
      padding: 0.75rem 1rem; position: relative;
      border-bottom: 1px solid #f0fdf4;
    }
    .search-input {
      width: 100%; padding: 0.55rem 0.75rem 0.55rem 2.1rem;
      border: 1px solid #d1fae5; border-radius: 10px;
      font-size: 0.85rem; outline: none; background: white;
      box-sizing: border-box; transition: border-color 0.2s;
    }
    .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
    .search-icon {
      position: absolute; left: 1.65rem; top: 50%;
      transform: translateY(-50%); color: #94a3b8; pointer-events: none;
    }
    .conv-list { flex: 1; overflow-y: auto; }

    /* ─── Conversation Item ─── */
    .conv-item {
      display: flex; padding: 0.85rem 1.25rem; gap: 0.75rem;
      cursor: pointer; transition: all 0.15s;
      border-bottom: 1px solid #f8fafc;
      position: relative;
    }
    .conv-item:hover { background: #f0fdf4; }
    .conv-item.active {
      background: #ecfdf5;
      border-left: 3px solid #10b981;
    }
    .conv-item.unread { background: #fffbeb; }
    .conv-item.unread .conv-name { font-weight: 700; }

    .conv-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem;
    }
    .conv-avatar.green { background: linear-gradient(135deg, #059669, #10b981); }

    .conv-info { flex: 1; min-width: 0; }
    .conv-top {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 0.2rem;
    }
    .conv-name {
      font-weight: 600; font-size: 0.9rem; color: #0f172a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;
    }
    .conv-time { font-size: 0.7rem; color: #94a3b8; flex-shrink: 0; }
    .conv-bottom {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 0.2rem;
    }
    .conv-preview {
      font-size: 0.8rem; color: #64748b;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;
    }
    .unread-dot { color: #10b981; font-size: 0.85rem; flex-shrink: 0; }
    .role-badge {
      font-size: 0.68rem; font-weight: 600; color: #059669;
      background: #d1fae5; padding: 0.1rem 0.5rem; border-radius: 20px;
      display: inline-block;
    }

    .empty-conv { text-align: center; padding: 3rem 1.5rem; color: #94a3b8; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .empty-conv p { font-size: 0.95rem; font-weight: 500; margin: 0 0 0.5rem; color: #64748b; }
    .empty-conv small { font-size: 0.8rem; }

    .loading-state { display: flex; justify-content: center; padding: 2rem; }

    /* ─── Chat Zone ─── */
    .chat-zone {
      flex: 1; display: flex; flex-direction: column;
      background: #f8fafc; min-width: 0;
    }

    /* ─── Chat Header ─── */
    .chat-header {
      padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0;
      background: white; display: flex; align-items: center; gap: 0.75rem;
      flex-shrink: 0; min-height: 70px;
    }
    .empty-header { justify-content: center; }
    .empty-chat-hint { text-align: center; color: #94a3b8; }
    .hint-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .empty-chat-hint p { margin: 0; font-size: 0.9rem; }

    .back-btn {
      display: none; background: none; border: none;
      font-size: 1.3rem; cursor: pointer; color: #059669;
      padding: 0.25rem 0.5rem; border-radius: 8px;
      transition: background 0.2s;
    }
    .back-btn:hover { background: #f0fdf4; }

    .avatar-lg {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem;
    }
    .avatar-lg.green { background: linear-gradient(135deg, #059669, #10b981); }

    .contact-info h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
    .role-tag {
      font-size: 0.75rem; color: #059669; background: #d1fae5;
      padding: 0.15rem 0.6rem; border-radius: 20px; font-weight: 500;
    }

    /* ─── Messages Area ─── */
    .messages-area {
      flex: 1; overflow-y: auto; padding: 1.5rem;
      display: flex; flex-direction: column;
      background: linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%);
    }
    .loading-msgs {
      display: flex; align-items: center; justify-content: center;
      gap: 0.75rem; color: #64748b; font-size: 0.9rem; margin: auto;
    }
    .messages-list { display: flex; flex-direction: column; gap: 0.6rem; }

    .msg-row { display: flex; align-items: flex-end; gap: 0.5rem; }
    .msg-row.mine { flex-direction: row-reverse; }

    .msg-avatar {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700;
    }

    .msg-bubble {
      max-width: 60%; padding: 0.65rem 1rem;
      border-radius: 18px;
      background: white;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }
    .mine .msg-bubble {
      background: linear-gradient(135deg, #059669, #10b981);
      color: white; border-color: transparent;
      border-radius: 18px 18px 4px 18px;
    }
    .msg-row:not(.mine) .msg-bubble {
      border-radius: 18px 18px 18px 4px;
    }

    .msg-bubble p { margin: 0 0 0.25rem; font-size: 0.88rem; line-height: 1.5; word-wrap: break-word; }
    .msg-meta { display: flex; justify-content: flex-end; align-items: center; gap: 0.3rem; }
    .msg-time { font-size: 0.65rem; opacity: 0.65; }
    .msg-status { font-size: 0.65rem; opacity: 0.8; }

    .no-messages { text-align: center; margin: auto; color: #94a3b8; padding: 2rem; }
    .no-msg-icon { font-size: 3rem; margin-bottom: 0.75rem; }
    .no-messages p { font-size: 0.95rem; font-weight: 500; color: #64748b; margin: 0 0 0.4rem; }
    .no-messages small { font-size: 0.8rem; }

    /* ─── Input Area ─── */
    .input-area {
      padding: 1rem 1.5rem 0.75rem;
      background: white; border-top: 1px solid #e2e8f0;
      flex-shrink: 0;
    }
    .input-wrapper {
      display: flex; gap: 0.75rem; align-items: flex-end;
    }
    .msg-input {
      flex: 1; padding: 0.75rem 1rem;
      border: 1.5px solid #d1fae5; border-radius: 14px;
      resize: none; font-family: inherit; font-size: 0.9rem;
      max-height: 120px; outline: none; line-height: 1.4;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: #fafffe;
    }
    .msg-input:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
    }
    .send-btn {
      width: 44px; height: 44px; flex-shrink: 0;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white; border: none; border-radius: 12px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .send-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(5,150,105,0.4);
    }
    .send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    .input-hint { margin: 0.4rem 0 0; font-size: 0.72rem; color: #94a3b8; }

    /* ─── Spinners ─── */
    .spinner {
      width: 28px; height: 28px;
      border: 3px solid #d1fae5; border-top-color: #10b981;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    .spinner-sm {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── Responsive ─── */
    @media (max-width: 900px) {
      app-navbar { width: 100%; height: auto; position: relative; }
      .page-layout { flex-direction: column; }
      .page-main { padding: 0; gap: 0; }
      .page-header { padding: 1rem; }
      .inbox-container { border-radius: 0; flex: 1; }
      .sidebar { width: 100%; }
      .sidebar.mobile-hidden { display: none; }
      .chat-zone { display: none; }
      .chat-zone.mobile-show { display: flex; }
      .back-btn { display: flex; }
    }
  `]
})
export class PartenaireLocalMessagerieComponent implements OnInit, OnDestroy, AfterViewChecked {

  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConv: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';
  searchQuery = '';
  myEmail = '';
  sending = false;
  loadingConv = false;
  loadingMessages = false;
  mobileShowChat = false;
  unreadCount = 0;
  private shouldScroll = false;

  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private refreshSub?: Subscription;

  private readonly API = 'http://localhost:8089/api/messagerie';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  ngOnInit(): void {
    // Décoder le token JWT pour obtenir l'email
    const token = localStorage.getItem('auth_token') || '';
    if (token) {
      try {
// ✅ APRÈS - Ajouter un console.log pour voir le vrai claim
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT payload:', payload); // ← Vérifiez dans la console quel champ contient l'email
      this.myEmail = payload.email || payload.sub || payload.preferred_username || '';
      console.log('myEmail:', this.myEmail); // ← Doit afficher l'email du partenaire local
      } catch { this.myEmail = ''; }
    }

    this.loadConversations();

    // Ouvrir conversation depuis queryParams (venant de "Contact Provider")
    this.route.queryParams.subscribe(params => {
      if (params['contact']) {
        setTimeout(() => {
          this.openOrCreate(params['contact'], params['name']);
        }, 800);
      }
    });

    // Rafraîchissement automatique toutes les 10 secondes
    this.refreshSub = interval(10000).subscribe(() => {
      this.loadConversations(false);
      if (this.selectedConv) {
        this.reloadMessages();
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // ────────── Chargement conversations ──────────

  loadConversations(showLoader = true): void {
    if (showLoader) this.loadingConv = true;

    this.http.get<Conversation[]>(`${this.API}/my-conversations`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this.conversations = data;
        this.filterConversations();
        this.unreadCount = data.filter(c => !this.isViewed(c)).length;
        this.loadingConv = false;
      },
      error: () => { this.loadingConv = false; }
    });
  }

  filterConversations(): void {
    if (!this.searchQuery.trim()) {
      this.filteredConversations = this.conversations;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredConversations = this.conversations.filter(c =>
      this.getContactName(c).toLowerCase().includes(q) ||
      (c.lastMessage?.toLowerCase().includes(q) ?? false)
    );
  }

  // ────────── Sélectionner une conversation ──────────

  selectConversation(conv: Conversation): void {
    this.selectedConv = conv;
    this.mobileShowChat = true;
    this.loadMessages(conv);
  }

  // ✅ FIX PRINCIPAL : Charger TOUS les messages depuis le début
  loadMessages(conv: Conversation): void {
    this.loadingMessages = true;
    this.messages = [];

    const otherEmail = this.getOtherEmail(conv);

    this.http.get<Message[]>(`${this.API}/conversation/${otherEmail}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        // Trier par date croissante (plus anciens en premier)
        this.messages = [...data].sort((a, b) =>
          new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime()
        );
        this.loadingMessages = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.messages = [];
        this.loadingMessages = false;
      }
    });
  }

  // Rechargement silencieux pour le refresh auto
  reloadMessages(): void {
    if (!this.selectedConv) return;
    const otherEmail = this.getOtherEmail(this.selectedConv);

    this.http.get<Message[]>(`${this.API}/conversation/${otherEmail}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) =>
          new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime()
        );
        if (sorted.length > this.messages.length) {
          this.messages = sorted;
          this.shouldScroll = true;
        }
      },
      error: () => {}
    });
  }

  // ────────── Ouvrir ou créer une conversation ──────────

  openOrCreate(contactEmail: string, contactName?: string): void {
    const existing = this.conversations.find(c =>
      c.senderEmail === contactEmail || c.recipientEmail === contactEmail
    );
    if (existing) {
      this.selectConversation(existing);
    } else {
      const fakeConv: Conversation = {
        id: -1,
        senderRole: 'LOCAL_PARTNER',
        senderEmail: this.myEmail,
        recipientEmail: contactEmail,
        recipientRole: '',
        lastMessage: '',
        lastMessageDate: new Date().toISOString(),
        senderViewed: true,
        partnerViewed: false,
        _contactName: contactName || contactEmail
      };
      this.selectedConv = fakeConv;
      this.messages = [];
      this.mobileShowChat = true;
    }
  }

  // ────────── Envoyer un message ──────────

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConv || this.sending) return;

    const otherEmail = this.getOtherEmail(this.selectedConv);
    const content = this.newMessage.trim();
    this.sending = true;
    this.newMessage = '';

    this.http.post<Message>(`${this.API}/send`,
      { recipientEmail: otherEmail, content },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.sending = false;
        this.shouldScroll = true;
        // Recharger les conversations pour màj lastMessage
        setTimeout(() => this.loadConversations(false), 400);
      },
      error: () => {
        this.sending = false;
        // Remettre le message en cas d'erreur
        this.newMessage = content;
        alert('Erreur lors de l\'envoi. Veuillez réessayer.');
      }
    });
  }

  // ────────── Auto-resize textarea ──────────

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  // ────────── Helpers ──────────

  getOtherEmail(conv: Conversation): string {
    return conv.senderEmail === this.myEmail ? conv.recipientEmail : conv.senderEmail;
  }

  getContactName(conv: Conversation): string {
    if (conv._contactName) return conv._contactName;
    const email = this.getOtherEmail(conv);
    // Afficher juste la partie avant le @ pour les emails longs
    return email?.includes('@') ? email.split('@')[0] : (email || 'Contact');
  }

  getInitials(conv: Conversation): string {
    const name = this.getContactName(conv);
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  getRoleLabel(conv: Conversation): string {
    const role = conv.senderEmail === this.myEmail ? conv.recipientRole : conv.senderRole;
    const labels: Record<string, string> = {
      'LOCAL_PARTNER': 'Partenaire Local',
      'INVESTOR': 'Investisseur',
      'PARTNER': 'Partenaire Économique',
      'TOURIST': 'Touriste',
      'ADMIN': 'Administrateur'
    };
    return labels[role] || role || '';
  }

  isViewed(conv: Conversation): boolean {
    return conv.senderEmail === this.myEmail ? conv.senderViewed : conv.partnerViewed;
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'maintenant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    if (diffMins < 10080) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  formatMsgTime(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}