export type UrgencyLevel = 'immediate' | 'short-term' | 'long-term';

export type SalesTeam = 'Sohaib' | 'Sana' | 'Sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'sales' | 'support';
  team: SalesTeam;
}

export interface Feature {
  id: string;
  name: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  uploadedBy: User;
  uploadedDate: string;
  url: string;
}

export interface Comment {
  id: string;
  text: string;
  commentedBy: User;
  commentDate: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  featuresGiven: string[];
  upsellOpportunities: string[];
  urgency: UrgencyLevel;
  assignedSalesPerson: User | null;
  contractStartDate: string;
  contractEndDate: string;
  salesTeam: SalesTeam;
  documents: DocumentFile[];
  comments: Comment[];
  createdBy: User;
  createdDate: string;
  updatedDate: string;
}