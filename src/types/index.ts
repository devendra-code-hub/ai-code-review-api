export interface User {
  _id: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface ReviewRequest {
  code: string;
  language: string;
  context?: string;
}

export interface ReviewResponse {
  bugs: string[];
  security: string[];
  complexity: string;
  suggestions: string[];
  score: number;
  summary: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}