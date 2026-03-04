import { useState, useEffect, useCallback, useRef } from 'react'

const GRID_SIZE = 20
const INITIAL_SPEED = 150

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

interface GameState {
  snake: Position[]
  food: Position
  direction: Direction
  score: number
  isRunning: boolean
  isGameOver: boolean
}

function getRandomFood(snake: Position[]): Position {
  let food: Position
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y))
  return food
}

export function useSnakeGame() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    return {
      snake: initialSnake,
      food: getRandomFood(initialSnake),
      direction: 'RIGHT',
      score: 0,
      isRunning: false,
      isGameOver: false,
    }
  })

  const directionRef = useRef(gameState.direction)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    directionRef.current = gameState.direction
  }, [gameState.direction])

  const startGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    setGameState({
      snake: initialSnake,
      food: getRandomFood(initialSnake),
      direction: 'RIGHT',
      score: 0,
      isRunning: true,
      isGameOver: false,
    })
  }, [])

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: false }))
  }, [])

  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: true }))
  }, [])

  const changeDirection = useCallback((newDirection: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    }

    if (opposites[newDirection] !== directionRef.current) {
      setGameState(prev => ({ ...prev, direction: newDirection }))
    }
  }, [])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isRunning) return

      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
      }

      if (keyMap[e.key]) {
        e.preventDefault()
        changeDirection(keyMap[e.key])
      }

      if (e.key === ' ') {
        e.preventDefault()
        if (gameState.isRunning) pauseGame()
        else resumeGame()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState.isRunning, changeDirection, pauseGame, resumeGame])

  // 触屏控制
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !gameState.isRunning) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      const minSwipe = 30

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipe) changeDirection('RIGHT')
        else if (deltaX < -minSwipe) changeDirection('LEFT')
      } else {
        if (deltaY > minSwipe) changeDirection('DOWN')
        else if (deltaY < -minSwipe) changeDirection('UP')
      }

      touchStartRef.current = null
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [gameState.isRunning, changeDirection])

  // 游戏循环
  useEffect(() => {
    if (!gameState.isRunning || gameState.isGameOver) return

    const interval = setInterval(() => {
      setGameState(prev => {
        const head = prev.snake[0]
        let newHead: Position

        switch (prev.direction) {
          case 'UP':
            newHead = { x: head.x, y: head.y - 1 }
            break
          case 'DOWN':
            newHead = { x: head.x, y: head.y + 1 }
            break
          case 'LEFT':
            newHead = { x: head.x - 1, y: head.y }
            break
          case 'RIGHT':
            newHead = { x: head.x + 1, y: head.y }
            break
        }

        // 检查碰撞边界
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          return { ...prev, isRunning: false, isGameOver: true }
        }

        // 检查碰撞自身
        if (prev.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          return { ...prev, isRunning: false, isGameOver: true }
        }

        const newSnake = [newHead, ...prev.snake]
        let newFood = prev.food
        let newScore = prev.score

        // 吃到食物
        if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
          newFood = getRandomFood(newSnake)
          newScore = prev.score + 10
        } else {
          newSnake.pop()
        }

        return {
          ...prev,
          snake: newSnake,
          food: newFood,
          score: newScore,
        }
      })
    }, INITIAL_SPEED)

    return () => clearInterval(interval)
  }, [gameState.isRunning, gameState.isGameOver])

  return {
    ...gameState,
    startGame,
    pauseGame,
    resumeGame,
    changeDirection,
  }
}
