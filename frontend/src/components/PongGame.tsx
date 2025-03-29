// frontend/src/components/PongGame.tsx
import React, { useRef, useEffect, useState } from "react";

const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let animationFrameId: number;

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
    ballVX: 2,
    ballVY: 2,
  });

  // React state for controlling game mode and scores
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  const resetPositions = () => {
    gameState.current.userPaddleY = canvasHeight / 2 - paddleHeight / 2;
    gameState.current.aiPaddleY = canvasHeight / 2 - paddleHeight / 2;
    gameState.current.ballX = canvasWidth / 2;
    gameState.current.ballY = canvasHeight / 2;
    gameState.current.ballVX = 2 * (Math.random() > 0.5 ? 1 : -1);
    gameState.current.ballVY = 2 * (Math.random() > 0.5 ? 1 : -1);
  };

  const startGame = () => {
    setUserScore(0);
    setAiScore(0);
    setIsGameOver(false);
    resetPositions();
    setIsGameActive(true);
  };

  const endGame = () => {
    setIsGameActive(false);
    setIsGameOver(true);
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
    ctx.fillText(`${userScore} : ${aiScore}`, canvasWidth / 2, 12);

    // Overlay for instructions/game over
    if (!isGameActive) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      if (isGameOver) {
        const winner = userScore > aiScore ? "You Win!" : "AI Wins!";
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

  const update = () => {
    // Smooth movement: update user paddle continuously based on key press
    if (isUpPressed.current) {
      gameState.current.userPaddleY -= userPaddleSpeed;
      if (gameState.current.userPaddleY < 0) gameState.current.userPaddleY = 0;
    }
    if (isDownPressed.current) {
      gameState.current.userPaddleY += userPaddleSpeed;
      if (gameState.current.userPaddleY + paddleHeight > canvasHeight)
        gameState.current.userPaddleY = canvasHeight - paddleHeight;
    }
    
    // Update ball and other logic (as before)
    gameState.current.ballX += gameState.current.ballVX;
    gameState.current.ballY += gameState.current.ballVY;
  
    if (gameState.current.ballY < ballSize / 2 || gameState.current.ballY > canvasHeight - ballSize / 2) {
      gameState.current.ballVY = -gameState.current.ballVY;
    }
  
    // Collision with user paddle
    if (
      gameState.current.ballX - ballSize / 2 < 4 + paddleWidth &&
      gameState.current.ballY > gameState.current.userPaddleY &&
      gameState.current.ballY < gameState.current.userPaddleY + paddleHeight
    ) {
      gameState.current.ballVX = -gameState.current.ballVX;
      gameState.current.ballX = 4 + paddleWidth + ballSize / 2;
    }
  
    // Collision with AI paddle
    if (
      gameState.current.ballX + ballSize / 2 > canvasWidth - paddleWidth - 4 &&
      gameState.current.ballY > gameState.current.aiPaddleY &&
      gameState.current.ballY < gameState.current.aiPaddleY + paddleHeight
    ) {
      gameState.current.ballVX = -gameState.current.ballVX;
      gameState.current.ballX = canvasWidth - paddleWidth - 4 - ballSize / 2;
    }
  
    // Scoring
    if (gameState.current.ballX < 0) {
      setAiScore((prev) => prev + 1);
      resetPositions();
    }
    if (gameState.current.ballX > canvasWidth) {
      setUserScore((prev) => prev + 1);
      resetPositions();
    }
  
    // Dynamic AI paddle movement (you can adjust multiplier for difficulty)
    const aiCenter = gameState.current.aiPaddleY + paddleHeight / 2;
    const diff = gameState.current.ballY - aiCenter;
    gameState.current.aiPaddleY += diff * 0.1;
    if (gameState.current.aiPaddleY < 0) gameState.current.aiPaddleY = 0;
    if (gameState.current.aiPaddleY + paddleHeight > canvasHeight)
      gameState.current.aiPaddleY = canvasHeight - paddleHeight;
  
    if (userScore >= winningScore || aiScore >= winningScore) {
      endGame();
    }
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isGameActive) {
      update();
    }
    draw(ctx);
    animationFrameId = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isGameActive, isGameOver, userScore, aiScore]);

  const isUpPressed = useRef(false);
  const isDownPressed = useRef(false);
  const userPaddleSpeed = 4; // adjust as needed

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
