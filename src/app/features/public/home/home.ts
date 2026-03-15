// ============================================================
// src/app/features/public/home/home.ts
// ============================================================

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  roles = [
    { label: 'Investisseur', icon: '💼', description: 'Découvrez les opportunités d\'investissement en Tunisie', route: '/register', color: '#1e3a5f' },
    { label: 'Partenaire Économique', icon: '🤝', description: 'Développez vos partenariats économiques', route: '/register', color: '#2d6a4f' },
    { label: 'Partenaire Local', icon: '🏘️', description: 'Engagez-vous dans le développement local', route: '/register', color: '#7b2d8b' },
    { label: 'Touriste', icon: '✈️', description: 'Explorez les merveilles de la Tunisie', route: '/register', color: '#b5451b' },
    { label: 'Société Internationale', icon: '🌍', description: 'Établissez votre présence internationale', route: '/register', color: '#1a6b8a' },
  ];
}