import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSnakeGame } from '../hooks/useSnakeGame'
import { api } from '../services/api'

interface GameProps {
  user: { id: string; username: string }
  onLogout: () => void
}

export default function Game({ user, onLogout }: GameProps) {
  const navigate = useNavigate()
  const [showGameOver, setShowGameOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    snake,
    food,
    score,
    isRunning,
    isGameOver,
    startGame,
    pauseGame,
    resumeGame,
    changeDirection,
  } = useSnakeGame()

  // 游戏结束时提交分数
  useEffect(() => {
    if (isGameOver && score > 0) {
      setShowGameOver(true)
      submitScore(score)
    }
  }, [isGameOver, score])

  const submitScore = async (finalScore: number) => {
    setSubmitting(true)
    try {
      await api.submitScore(finalScore)
    } catch (err) {
      console.error('提交分数失败:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePlayAgain = () => {
    setShowGameOver(false)
    startGame()
  }

  const handleViewLeaderboard = () => {
    navigate('/leaderboard')
  }

  // 渲染游戏格子
  const renderGrid = () => {
    const cells = []
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const isSnake = snake.some(s => s.x === x && s.y === y)
        const isHead = snake[0]?.x === x && snake[0]?.y === y
        const isFood = food.x === x && food.y === y

        let className = 'cell'
        if (isHead) className += ' snake-head'
        else if (isSnake) className += ' snake'
        else if (isFood) className += ' food'

        cells.push(<div key={`${x}-${y}`} className={className} />)
      }
    }
    return cells
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>🐍 贪吃蛇</h1>
        <div className="score-display">{score}</div>
      </div>

      <div className="game-info">
        <span>玩家: {user.username}</span>
        <span>{isRunning ? '游戏中' : isGameOver ? '游戏结束' : '已暂停'}</span>
      </div>

      <div className="game-container">
        <div className="game-board">{renderGrid()}</div>
      </div>

      <div className="game-controls">
        {!isRunning && !isGameOver && (
          <button className="control-btn primary" onClick={startGame}>
            开始游戏
          </button>
        )}
        {isRunning && (
          <button className="control-btn" onClick={pauseGame}>
            暂停
          </button>
        )}
        {!isRunning && !isGameOver && score > 0 && (
          <button className="control-btn primary" onClick={resumeGame}>
            继续
          </button>
        )}
      </div>

      {/* 移动端方向键 */}
      <div className="mobile-controls">
        <div className="d-pad">
          <button className="d-btn up" onClick={() => changeDirection('UP')}>↑</button>
          <button className="d-btn left" onClick={() => changeDirection('LEFT')}>←</button>
          <button className="d-btn right" onClick={() => changeDirection('RIGHT')}>→</button>
          <button className="d-btn down" onClick={() => changeDirection('DOWN')}>↓</button>
        </div>
      </div>

      {/* 游戏结束弹窗 */}
      {showGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-box">
            <h2 className="game-over-title">游戏结束</h2>
            <div className="final-score">{score}</div>
            <div className="game-over-actions">
              <button
                className="control-btn primary"
                onClick={handlePlayAgain}
                disabled={submitting}
              >
                再来一局
              </button>
              <button className="control-btn" onClick={handleViewLeaderboard}>
                查看排行榜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="bottom-nav">
        <div className="nav-item active">
          <span>🎮</span>
          游戏
        </div>
        <div className="nav-item" onClick={() => navigate('/leaderboard')}>
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
