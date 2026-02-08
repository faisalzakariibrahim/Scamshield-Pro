
export enum Verdict {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  SCAM = 'SCAM'
}

export type Language = 'en' | 'es' | 'fr' | 'ar';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  content: string;
  contentType: 'text' | 'image';
  verdict: Verdict;
  riskScore: number;
  indicators: string[];
  reasoning: string; // Plain language why
  advice: string;    // Plain language steps
  imageUrl?: string;
  sources?: GroundingSource[];
  isDeepScan?: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'success';
}
