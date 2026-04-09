export type BugStatus = 'nouveau' | 'en_analyse' | 'en_cours' | 'en_test' | 'resolu' | 'ferme';
export type BugPriority = 'critique' | 'haute' | 'moyenne' | 'basse' | 'a_analyser';
export type BugImpact = 'production_bloquee' | 'cloture_impactee' | 'reporting_errone' | 'decision_faussee' | 'gene_operationnelle' | 'aucun_impact';
export type BugFrequency = 'toujours' | 'souvent' | 'parfois' | 'une_seule_fois' | 'intermittent';

export interface BugComment {
  id: string;
  bugId: string;
  authorId: string;
  author?: { id: string; firstName?: string; lastName?: string; email: string };
  content: string;
  createdAt: string;
  isInternal: boolean; // Pour les notes internes admin
}

export interface Bug {
  id: string;
  bugId: string; // Ex: BR-20250311-001
  title: string;
  bug_type: string[];
  module: string;
  priority: BugPriority;
  severity: number;
  status: BugStatus;
  
  // Environment
  url: string;
  browser: string;
  os: string;
  screen: string;
  
  // Business context
  entity_code: string;
  fiscal_year: number;
  period_start?: string;
  period_end?: string;
  
  // Details
  description: string;
  steps_to_reproduce: string[];
  expected_behavior?: string;
  actual_behavior?: string;
  frequency: BugFrequency;
  impact: BugImpact;
  users_impacted?: string;
  workaround: boolean;
  workaround_description?: string;
  
  // Logs & Attachments
  tags: string[];
  attachments: string[]; // URLs (S3)
  console_errors?: string;
  
  // Metadata
  notify_emails: string[];
  submittedBy: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
  };
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  estimated_resolution?: string;
  comments?: BugComment[];
}

export interface BugStats {
  total: number;
  byStatus: Record<BugStatus, number>;
  byPriority: Record<BugPriority, number>;
  byModule: Record<string, number>;
  avgResolutionTimeDays: number;
}
