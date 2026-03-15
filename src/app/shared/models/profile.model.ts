
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  photo?: string;  
  photoFile?: File; 
  role: string;
  registrationDate: string;
  isActive: boolean;
  
  // Champs spécifiques selon le rôle
  companyName?: string;
  originCountry?: string;
  activitySector?: string;
  website?: string;
  linkedinProfile?: string;
  headquartersAddress?: string;
  siret?: string;
  nationality?: string;
  region?: string;
  address?: string;
  businessRegistrationNumber?: string;
  professionalTaxNumber?: string;
}