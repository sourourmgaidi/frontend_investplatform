export type ServiceType = 'COLLABORATION' | 'INVESTMENT' | 'TOURIST';

export interface BaseService {
  id?: number;
  name: string;
  description?: string;
  regionId?: number;
  region?: any;
  providerId?: number;
  price: number;
  availability: 'IMMEDIATE' | 'ON_DEMAND' | 'UPCOMING';   publicationDate?: string;
  contactPerson: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface CollaborationService extends BaseService {
  type: 'COLLABORATION';
  collaborationType?: string;
  activityDomain?: string;
  expectedBenefits?: string;
  requiredSkills?: string[];
  collaborationDuration?: string;
  address?: string;
}

export interface InvestmentService extends BaseService {
  type: 'INVESTMENT';
  title: string;
  zone?: string;
  economicSectorId?: number;
  economicSector?: any;
  totalAmount?: number;
  minimumAmount?: number;
  deadlineDate?: string;
  projectDuration?: string;
  attachedDocuments?: string[];
}

export interface TouristService extends BaseService {
  type: 'TOURIST';
  category?: 'HOTEL' | 'RESTAURANT' | 'ACTIVITY' | 'TRANSPORT' | 'GUIDE' | 'OTHER';
  targetAudience?: 'FAMILY' | 'SOLO' | 'COUPLE' | 'GROUP' | 'BUSINESS';
  durationHours?: number;
  maxCapacity?: number;
  groupPrice?: number;
  includedServices?: string[];
  availableLanguages?: string[];
}

export type AnyService = CollaborationService | InvestmentService | TouristService;

export interface Region {
  id: number;
  name: string;
  code?: string;
  geographicalZone?: string;
}

export interface EconomicSector {
  id: number;
  name: string;
  description?: string;
}