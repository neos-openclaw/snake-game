const API_BASE = '/api'

interface LoginResponse {
  token: string
  user: { id: string; username: string }
}

interface RegisterResponse {
  token: string
  user: { id: string; username: string }
}

interface ScoreResponse {
  success: boolean
  score: number
}

interface LeaderboardItem {
  rank: number
  username: string
  score: number
  createdAt: string
}

interface LeaderboardResponse {
  leaderboard: LeaderboardItem[]
  personalBest: number
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || '请求失败')
  }

  return response.json()
}

export const api = {
  login: (username: string, password: string): Promise<LoginResponse> =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, email: string, password: string): Promise<RegisterResponse> =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  submitScore: (score: number): Promise<ScoreResponse> =>
    request('/scores', {
      method: 'POST',
      body: JSON.stringify({ score }),
    }),

  getLeaderboard: (): Promise<LeaderboardResponse> =>
    request('/leaderboard'),

  getPersonalBest: (): Promise<{ score: number }> =>
    request('/scores/personal-best'),
}
