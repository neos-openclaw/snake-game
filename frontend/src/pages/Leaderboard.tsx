import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

interface LeaderboardItem {
  rank: number
  username: string
  score: number
  createdAt: string
}

interface LeaderboardProps {
  user: { id: string; username: string }
  onLogout: () => void
}

export default function Leaderboard({ user, onLogout }: LeaderboardProps) {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [personalBest, setPersonalBest] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard()
      setLeaderboard(data.leaderboard || [])
      setPersonalBest(data.personalBest || 0)
    } catch (err) {
      console.error('加载排行榜失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    })
  }

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'silver'
    if (rank === 3) return 'bronze'
    return ''
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 排行榜</h1>
        <button className="logout-btn" onClick={onLogout}>
          退出
        </button>
      </div>

      {/* 个人最佳 */}
      <div className="personal-best">
        <h3>你的最高分</h3>
        <div className="score">{personalBest > 0 ? personalBest : '-'}</div>
      </div>

      {/* 排行榜列表 */}
      <div className="leaderboard-list">
        <div className="leaderboard-title">TOP 10</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">暂无记录，快来创造历史！</div>
        ) : (
          leaderboard.map((item) => (
            <div
              key={`${item.username}-${item.createdAt}`}
              className="leaderboard-item"
              style={
                item.username === user.username
                  ? { border: '2px solid #4ecca3' }
                  : {}
              }
            >
              <div className={`rank ${getRankClass(item.rank)}`}>
                {item.rank}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {item.username}
                  {item.username === user.username && ' (你)'}
                </div>
                <div className="player-score">{formatDate(item.createdAt)}</div>
              </div>
              <div className="player-points">{item.score}</div>
            </div>
          ))
        )}
      </div>

      {/* 底部导航 */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate('/game')}>
          <span>🎮</span>
          游戏
        </div>
        <div className="nav-item active">
          <span>🏆</span>
          排行榜
        </div>
        <div className="nav-item" onClick={onLogout}>
          <span>🚪</span>
          退出
        </div>
      </div>
    </div>
  )
}
