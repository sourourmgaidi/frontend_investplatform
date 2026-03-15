export enum Role {
  ADMIN = 'ADMIN',
  TOURIST = 'TOURIST',
  INVESTOR = 'INVESTOR',
  PARTNER = 'PARTNER',
  LOCAL_PARTNER = 'LOCAL_PARTNER',
  INTERNATIONAL_COMPANY = 'INTERNATIONAL_COMPANY'
}

export interface RegisterRequest {
  // Champs de base
  email: string;
  motDePasse: string;
  role: Role;
  actif?: boolean;
  dateInscription?: string;
  
  // Champs communs
  nom?: string;
  prenom?: string;
  telephone?: string;
  photoProfil?: string;
  siteWeb?: string;
  description?: string;
  
  // Investisseur
  nationality?: string;
  investmentBudget?: number;
  
  // Partenaire (PARTNER)
  companyName?: string;
  secteurActivite?: string;
  numeroRegistreCommerce?: string;
  taxeProfessionnelle?: string;
  
  // Partenaire Local
  region?: string;
  adresse?: string;
  
  // Société Internationale
  paysOrigine?: string;
  siret?: string;
  
  // Pour compatibilité avec le backend
  firstName?: string;
  lastName?: string;
  password?: string;
  contactLastName?: string;
  contactFirstName?: string;
  activitySector?: string;
  interetPrincipal?: string;
  phone?: string;
  originCountry?: string;
  website?: string;
  linkedinProfile?: string;
}

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface CurrentUser {
  id?: number;
  email: string;
  role: Role;
  nom?: string;
  prenom?: string;
  firstName?: string;
  lastName?: string;
  token: string;
  
  // ✅ TOUS LES CHAMPS POSSIBLES POUR LA PHOTO DE PROFIL
  profilePhoto?: string;      // Pour Admin, Tourist, Partner
  profilePicture?: string;    // Pour Investor, InternationalCompany
  photo?: string;             // Pour compatibilité
  photoProfil?: string;       // Pour LocalPartner
  picture?: string;           // Pour compatibilité générale
  
  // Autres champs utiles pour le dashboard
  phone?: string;
  telephone?: string;
  companyName?: string;
  originCountry?: string;
  paysOrigine?: string;
  activitySector?: string;
  secteurActivite?: string;
  website?: string;
  linkedinProfile?: string;
}