import { useState } from 'react'
import { api } from '../services/api'

interface LoginProps {
  onLogin: (token: string, user: { id: string; username: string }) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password || (isRegister && !email)) {
      setError('请填写所有字段')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = isRegister
        ? await api.register(username, email, password)
        : await api.login(username, password)

      onLogin(data.token, data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="login-title">🐍 贪吃蛇</h1>
        <p className="login-subtitle">经典游戏，全新体验</p>

        <div className="tab-switch">
          <button
            className={`tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(false)}
          >
            登录
          </button>
          <button
            className={`tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(true)}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  )
}
