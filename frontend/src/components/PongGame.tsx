// frontend/src/components/PongGame.tsx
import React, { useRef, useEffect, useState } from "react";

const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastFrameTime = useRef<number | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Canvas dimensions
  const canvasWidth = 275;
  const canvasHeight = 180;
  const paddleWidth = 8;
  const paddleHeight = 32;
  const ballSize = 6;
  const winningScore = 7;

  // Use a ref for game state variables
  const gameState = useRef({
    userPaddleY: canvasHeight / 2 - paddleHeight / 2,
    aiPaddleY: canvasHeight / 2 - paddleHeight / 2,
    ballX: canvasWidth / 2,
    ballY: canvasHeight / 2,
    ballVX: 140,
    ballVY: 90,
  });

  // React state for controlling game mode and scores
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  const isGameActiveRef = useRef(isGameActive);
  const isGameOverRef = useRef(isGameOver);
  const userScoreRef = useRef(userScore);
  const aiScoreRef = useRef(aiScore);

  useEffect(() => {
    isGameActiveRef.current = isGameActive;
  }, [isGameActive]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    userScoreRef.current = userScore;
  }, [userScore]);

  useEffect(() => {
    aiScoreRef.current = aiScore;
  }, [aiScore]);

  const resetPositions = () => {
    gameState.current.userPaddleY = canvasHeight / 2 - paddleHeight / 2;
    gameState.current.aiPaddleY = canvasHeight / 2 - paddleHeight / 2;
    gameState.current.ballX = canvasWidth / 2;
    gameState.current.ballY = canvasHeight / 2;
    const direction = Math.random() > 0.5 ? 1 : -1;
    gameState.current.ballVX = 140 * direction;
    gameState.current.ballVY = 90 * (Math.random() > 0.5 ? 1 : -1);
  };

  const startGame = () => {
    userScoreRef.current = 0;
    aiScoreRef.current = 0;
    setUserScore(0);
    setAiScore(0);
    setIsGameOver(false);
    isGameOverRef.current = false;
    resetPositions();
    setIsGameActive(true);
    isGameActiveRef.current = true;
    lastFrameTime.current = null;
  };

  const endGame = () => {
    setIsGameActive(false);
    setIsGameOver(true);
    isGameActiveRef.current = false;
    isGameOverRef.current = true;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw ball
    ctx.fillStyle = "white";
    ctx.fillRect(
      gameState.current.ballX - ballSize / 2,
      gameState.current.ballY - ballSize / 2,
      ballSize,
      ballSize
    );

    // Draw user paddle
    ctx.fillRect(4, gameState.current.userPaddleY, paddleWidth, paddleHeight);

    // Draw AI paddle
    ctx.fillRect(canvasWidth - paddleWidth - 4, gameState.current.aiPaddleY, paddleWidth, paddleHeight);

    // Draw scores
    ctx.fillStyle = "white";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${userScoreRef.current} : ${aiScoreRef.current}`, canvasWidth / 2, 12);

    // Overlay for instructions/game over
    if (!isGameActiveRef.current) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      if (isGameOverRef.current) {
        const winner = userScoreRef.current > aiScoreRef.current ? "You Win!" : "AI Wins!";
        ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2 - 12);
        ctx.fillText(winner, canvasWidth / 2, canvasHeight / 2);
        ctx.fillText("Click to Restart", canvasWidth / 2, canvasHeight / 2 + 16);
      } else {
        ctx.fillText("PONG GAME", canvasWidth / 2, canvasHeight / 2 - 12);
        ctx.fillText("Click to Start", canvasWidth / 2, canvasHeight / 2 + 4);
        ctx.fillText("Use arrow keys to move paddle", canvasWidth / 2, canvasHeight / 2 + 20);
      }
    }
  };

  const update = (dt: number) => {
    // Smooth movement: update user paddle continuously based on key press
    if (isUpPressed.current) {
      gameState.current.userPaddleY -= userPaddleSpeed * dt;
      if (gameState.current.userPaddleY < 0) gameState.current.userPaddleY = 0;
    }
    if (isDownPressed.current) {
      gameState.current.userPaddleY += userPaddleSpeed * dt;
      if (gameState.current.userPaddleY + paddleHeight > canvasHeight)
        gameState.current.userPaddleY = canvasHeight - paddleHeight;
    }
    
    // Update ball and other logic (as before)
    gameState.current.ballX += gameState.current.ballVX * dt;
    gameState.current.ballY += gameState.current.ballVY * dt;
  
    if (gameState.current.ballY < ballSize / 2 || gameState.current.ballY > canvasHeight - ballSize / 2) {
      gameState.current.ballVY = -gameState.current.ballVY;
      gameState.current.ballY = Math.max(ballSize / 2, Math.min(canvasHeight - ballSize / 2, gameState.current.ballY));
    }
  
    // Collision with user paddle
    if (
      gameState.current.ballVX < 0 &&
      gameState.current.ballX - ballSize / 2 < 4 + paddleWidth &&
      gameState.current.ballY > gameState.current.userPaddleY &&
      gameState.current.ballY < gameState.current.userPaddleY + paddleHeight
    ) {
      const hitOffset = (gameState.current.ballY - (gameState.current.userPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
      gameState.current.ballVX = Math.abs(gameState.current.ballVX);
      gameState.current.ballVY = hitOffset * 160;
      gameState.current.ballX = 4 + paddleWidth + ballSize / 2;
    }
  
    // Collision with AI paddle
    if (
      gameState.current.ballVX > 0 &&
      gameState.current.ballX + ballSize / 2 > canvasWidth - paddleWidth - 4 &&
      gameState.current.ballY > gameState.current.aiPaddleY &&
      gameState.current.ballY < gameState.current.aiPaddleY + paddleHeight
    ) {
      const hitOffset = (gameState.current.ballY - (gameState.current.aiPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
      gameState.current.ballVX = -Math.abs(gameState.current.ballVX);
      gameState.current.ballVY = hitOffset * 160;
      gameState.current.ballX = canvasWidth - paddleWidth - 4 - ballSize / 2;
    }
  
    // Scoring
    if (gameState.current.ballX < -ballSize) {
      const nextScore = aiScoreRef.current + 1;
      aiScoreRef.current = nextScore;
      setAiScore(nextScore);
      if (nextScore >= winningScore) {
        endGame();
        return;
      }
      resetPositions();
    }
    if (gameState.current.ballX > canvasWidth + ballSize) {
      const nextScore = userScoreRef.current + 1;
      userScoreRef.current = nextScore;
      setUserScore(nextScore);
      if (nextScore >= winningScore) {
        endGame();
        return;
      }
      resetPositions();
    }
  
    // Dynamic AI paddle movement (you can adjust multiplier for difficulty)
    const aiCenter = gameState.current.aiPaddleY + paddleHeight / 2;
    const diff = gameState.current.ballY - aiCenter;
    const aiMove = Math.max(-aiPaddleSpeed * dt, Math.min(aiPaddleSpeed * dt, diff));
    gameState.current.aiPaddleY += aiMove;
    if (gameState.current.aiPaddleY < 0) gameState.current.aiPaddleY = 0;
    if (gameState.current.aiPaddleY + paddleHeight > canvasHeight)
      gameState.current.aiPaddleY = canvasHeight - paddleHeight;
  };

  const gameLoop = (timestamp: number) => {
    if (!ctxRef.current) return;
    if (!isGameActiveRef.current || isGameOverRef.current) return;

    if (lastFrameTime.current === null) {
      lastFrameTime.current = timestamp;
    }
    const deltaMs = Math.min(32, timestamp - lastFrameTime.current);
    const dt = deltaMs / 1000;
    lastFrameTime.current = timestamp;

    update(dt);
    draw(ctxRef.current);
    if (isGameActiveRef.current && !isGameOverRef.current) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
  };

  const isUpPressed = useRef(false);
  const isDownPressed = useRef(false);
  const userPaddleSpeed = 220;
  const aiPaddleSpeed = 190;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameActive || isGameOver) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        isUpPressed.current = true;
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        isDownPressed.current = true;
      }
    };
  
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        isUpPressed.current = false;
      } else if (e.key === "ArrowDown") {
        isDownPressed.current = false;
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isGameActive, isGameOver]);

  const handleCanvasClick = () => {
    if (!isGameActive) {
      startGame();
    }
  };

  // Draw once when idle or after state changes to avoid running the loop unnecessarily
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
    draw(ctx);
  }, [isGameActive, isGameOver, userScore, aiScore]);

  // Run animation loop only while the game is active
  useEffect(() => {
    if (!isGameActive) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      return;
    }

    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isGameActive]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={handleCanvasClick}
      className="bg-black"
    />
  );
};

export default PongGame;
