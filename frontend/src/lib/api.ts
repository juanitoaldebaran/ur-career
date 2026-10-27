const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 204) {
    return undefined as T
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      body && typeof body.error === 'string' ? body.error : `request failed (${res.status})`
    throw new ApiError(res.status, message)
  }

  return body as T
}

export interface AuthUser {
  user_id: string
  email: string
}

export interface RegisteredUser {
  id: string
  email: string
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export interface Profile {
  user_id: string
  full_name: string
  current_role: string
  target_role: string
  updated_at: string
}

export interface RoadmapSummary {
  id: string
  slug: string
  title: string
  node_count: number
}

export interface RoadmapNode {
  id: string
  parent_id: string | null
  title: string
  position: number
  status: string
}

export function register(email: string, password: string): Promise<RegisteredUser> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email: string, password: string): Promise<TokenPair> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function refresh(refreshToken: string): Promise<TokenPair> {
  return request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function logout(refreshToken: string): Promise<void> {
  return request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function me(accessToken: string): Promise<AuthUser> {
  return request('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getProfile(accessToken: string): Promise<Profile> {
  return request('/profile', {
    headers: { Authorization: `Bearer ${accessToken}`},
  })
}

export interface ProfileInput {
  full_name: string
  current_role: string
  target_role: string
}

export function updateProfile(input: ProfileInput, accessToken: string): Promise<Profile> {
  return request('/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  })
}

export function listRoadmaps(accessToken: string): Promise<RoadmapSummary[]> {
  return request('/roadmaps', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getRoadmap(slug: string, accessToken: string): Promise<RoadmapNode[]> {
  return request(`/roadmap/${slug}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function updateNodeStatus(
  nodeId: string,
  status: string,
  accessToken: string,
): Promise<void> {
  return request(`/roadmap/nodes/${nodeId}/progress`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ status }),
  })
}

export type PracticeCategory = 'coding' | 'system_design'

export interface PracticeQuestion {
  id: string
  category: PracticeCategory
  difficulty: 'easy' | 'medium' | 'hard'
  prompt: string
  approach: string
  evaluating: string
  best_score: number | null
}

export interface PracticeCriterion {
  name: string
  score: number
  max: number
  comment: string
}

export interface PracticeResult {
  attempt_id: string
  score: number
  feedback: string
  criteria: PracticeCriterion[]
  reference_answer: string
}

export function listPracticeQuestions(
  role: string,
  accessToken: string,
): Promise<PracticeQuestion[]> {
  return request(`/practice/questions?role=${encodeURIComponent(role)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function submitPracticeAnswer(
  questionId: string,
  answer: string,
  accessToken: string,
): Promise<PracticeResult> {
  return request(`/practice/questions/${questionId}/attempts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ answer }),
  })
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
}

export interface QuizSession {
  id: string
  role: string
  questions: QuizQuestion[]
}

export interface QuizReviewItem {
  question_id: string
  selected: number | null
  correct: number
  is_correct: boolean
  explanation: string
}

export interface QuizResult {
  score: number
  correct: number
  total: number
  review: QuizReviewItem[]
}

export function createQuiz(role: string, accessToken: string): Promise<QuizSession> {
  return request('/practice/quizzes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ role }),
  })
}

export function submitQuiz(
  quizId: string,
  answers: Record<string, number>,
  accessToken: string,
): Promise<QuizResult> {
  return request(`/practice/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ answers }),
  })
}
