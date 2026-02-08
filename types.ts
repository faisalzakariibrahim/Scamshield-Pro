
export enum Verdict {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  SCAM = 'SCAM'
}

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
  reasoning: string;
  advice: string;
  imageUrl?: string;
  sources?: GroundingSource[];
  isDeepScan?: boolean;
}

export interface ScanStats {
  total: number;
  scams: number;
  suspicious: number;
  safe: number;
}

export interface SystemLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'success' | 'database';
}
