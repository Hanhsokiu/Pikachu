import React, { useState, useEffect, useRef } from 'react';
import { 
  createMatrix, 
  getConnectionPath, 
  hasAvailableMoves, 
  shuffleMatrix 
} from '../utils/pikachuEngine';
import { pikachuAudio } from '../utils/pikachuAudio';
import { addLeaderboardEntry, leaderboardNameExists } from './Leaderboard';

const GAP = 2;

export default function ClassicGame({ playRow, playCol, difficulty, maxTime, shuffles, onHome }) {
  const row = playRow + 2;
  const col = playCol + 2;

  const [gameState, setGameState] = useState(null); // { matrix }
  const [selectedCell, setSelectedCell] = useState(null); // { r, c }
  const [score, setScore] = useState(0);
  const [remainingShuffles, setRemainingShuffles] = useState(shuffles);
  const [timeLeft, setTimeLeft] = useState(maxTime);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPath, setCurrentPath] = useState(null); // [{r,c}]
  const [isMuted, setIsMuted] = useState(pikachuAudio.isMuted());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cellSize, setCellSize] = useState(50);

  // Dialogs
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const particlesRef = useRef([]);

  const startTimestamp = useRef(Date.now());
  const pauseDuration = useRef(0);
  const pauseStart = useRef(0);

  // Tính toán kích thước ô cờ linh hoạt
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxBoardWidth = vw - 215 - 80;
      const maxBoardHeight = vh - 100;
      const sizeFromWidth = Math.floor(maxBoardWidth / col) - GAP;
      const sizeFromHeight = Math.floor(maxBoardHeight / row) - GAP;
      const optimal = Math.max(30, Math.min(50, Math.min(sizeFromWidth, sizeFromHeight)));
      setCellSize(optimal);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [row, col]);

  // Khởi tạo game mới
  useEffect(() => {
    const fresh = createMatrix(row, col, difficulty);
    setGameState({ matrix: fresh.matrix });
    setScore(0);
    setRemainingShuffles(shuffles);
    setTimeLeft(maxTime);
    setElapsedTime(0);
    setSelectedCell(null);
    setCurrentPath(null);
    setIsPaused(false);
    setShowWinModal(false);
    setShowLoseModal(false);
    setPlayerName('');
    setNameError('');
    particlesRef.current = [];
    startTimestamp.current = Date.now();
    pauseDuration.current = 0;
    
    pikachuAudio.playBGM();
  }, [playRow, playCol, difficulty, maxTime, shuffles]);

  // Bộ đếm thời gian chơi
  useEffect(() => {
    if (isPaused || showWinModal || showLoseModal || !gameState) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const realElapsed = Math.floor((now - startTimestamp.current - pauseDuration.current) / 1000);
      setElapsedTime(realElapsed);
      
      const newTime = maxTime - realElapsed;
      if (newTime <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        pikachuAudio.playSound('lose');
        setIsPaused(true);
        setShowLoseModal(true);
      } else {
        setTimeLeft(newTime);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, showWinModal, showLoseModal, gameState, maxTime]);

  // Vòng lặp vẽ và cập nhật hiệu ứng Canvas (Laser + Hạt bùng nổ)
  const updateAndDrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Vẽ đường nối Laser nếu có
    if (currentPath && currentPath.length >= 2) {
      ctx.strokeStyle = '#ff3d00';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff3d00';

      ctx.beginPath();
      currentPath.forEach((pt, idx) => {
        const x = pt.c * (cellSize + GAP) + cellSize / 2;
        const y = pt.r * (cellSize + GAP) + cellSize / 2;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = '#ffdc00';
      ctx.shadowColor = '#ffdc00';
      ctx.shadowBlur = 8;
      currentPath.forEach(pt => {
        const x = pt.c * (cellSize + GAP) + cellSize / 2;
        const y = pt.r * (cellSize + GAP) + cellSize / 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    // 2. Cập nhật và vẽ các hạt phát sáng (Particles)
    const now = Date.now();
    particlesRef.current = particlesRef.current.filter(p => {
      const elapsed = now - p.startTime;
      if (elapsed >= p.duration) return false;

      const pct = elapsed / p.duration;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // Trọng lực nhỏ

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.globalAlpha = 1 - pct;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - pct), 0, Math.PI * 2);
      ctx.fill();

      return true;
    });

    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    requestRef.current = requestAnimationFrame(updateAndDrawCanvas);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateAndDrawCanvas);
    return () => cancelAnimationFrame(requestRef.current);
  }, [cellSize, currentPath]);

  const spawnExplosion = (p1, p2) => {
    const getCenter = (pt) => ({
      x: pt.c * (cellSize + GAP) + cellSize / 2,
      y: pt.r * (cellSize + GAP) + cellSize / 2
    });

    const c1 = getCenter(p1);
    const c2 = getCenter(p2);
    const newParticles = [];
    const count = 16; // 16 hạt mỗi ô cờ

    [c1, c2].forEach(c => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        newParticles.push({
          x: c.x,
          y: c.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4,
          color: '#ff9f00', // Màu vàng neon rực rỡ
          startTime: Date.now(),
          duration: 500 + Math.random() * 400
        });
      }
    });

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  const togglePause = (pauseState) => {
    if (pauseState) {
      pauseStart.current = Date.now();
    } else {
      if (pauseStart.current > 0) {
        pauseDuration.current += Date.now() - pauseStart.current;
        pauseStart.current = 0;
      }
    }
    setIsPaused(pauseState);
  };

  if (!gameState) return null;

  const { matrix } = gameState;

  const handleCellClick = (r, c) => {
    if (isPaused || matrix[r][c] === 0 || currentPath) return;

    pikachuAudio.playSound('click');

    if (!selectedCell) {
      setSelectedCell({ r, c });
    } else {
      if (selectedCell.r === r && selectedCell.c === c) {
        setSelectedCell(null);
        return;
      }

      const path = getConnectionPath(matrix, row, col, selectedCell, { r, c });
      if (path.length > 0) {
        pikachuAudio.playSound('match');
        setCurrentPath(path);
        spawnExplosion(selectedCell, { r, c });
        setSelectedCell(null);

        setTimeout(() => {
          const newMatrix = matrix.map(rowArr => [...rowArr]);
          newMatrix[selectedCell.r][selectedCell.c] = 0;
          newMatrix[r][c] = 0;

          setScore(prev => prev + 10);
          setCurrentPath(null);

          let newRemaining = 0;
          for (let rowIdx = 1; rowIdx < row - 1; rowIdx++) {
            for (let colIdx = 1; colIdx < col - 1; colIdx++) {
              if (newMatrix[rowIdx][colIdx] !== 0) newRemaining++;
            }
          }

          if (newRemaining === 0) {
            setGameState({ matrix: newMatrix });
            pikachuAudio.playSound('win');
            togglePause(true);
            setShowWinModal(true);
          } else {
            if (!hasAvailableMoves(newMatrix, row, col)) {
              shuffleMatrix(newMatrix, row, col);
            }
            setGameState({ matrix: newMatrix });
          }
        }, 480);
      } else {
        pikachuAudio.playSound('wrong');
        setSelectedCell(null);
        setScore(prev => Math.max(0, prev - 5));
      }
    }
  };

  const handleShuffle = () => {
    if (isPaused || remainingShuffles <= 0) return;
    pikachuAudio.playSound('match');
    
    const newMatrix = matrix.map(r => [...r]);
    shuffleMatrix(newMatrix, row, col);
    setGameState({ matrix: newMatrix });
    setRemainingShuffles(prev => prev - 1);
    setSelectedCell(null);
  };

  const handleMute = () => {
    const muted = pikachuAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleReplay = () => {
    const fresh = createMatrix(row, col, difficulty);
    setGameState({ matrix: fresh.matrix });
    setScore(0);
    setRemainingShuffles(shuffles);
    setTimeLeft(maxTime);
    setElapsedTime(0);
    setSelectedCell(null);
    setCurrentPath(null);
    particlesRef.current = [];
    togglePause(false);
    setShowWinModal(false);
    setShowLoseModal(false);
    setPlayerName('');
    setNameError('');
    startTimestamp.current = Date.now();
    pauseDuration.current = 0;
  };

  const handleSaveWin = () => {
    const name = playerName.trim();
    if (!name) {
      setNameError('Tên không được để trống!');
      return;
    }
    if (name.includes('|')) {
      setNameError("Tên không được chứa ký tự '|'!");
      return;
    }
    
    let category = 'classic_easy';
    if (difficulty === 1) category = 'classic_normal';
    else if (difficulty === 2) category = 'classic_hard';

    if (leaderboardNameExists(category, name)) {
      setNameError('Tên đã tồn tại trên bảng xếp hạng!');
      return;
    }

    addLeaderboardEntry(category, name, score, elapsedTime);
    setShowWinModal(false);
    onHome();
  };

  const formatHUDTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const timePercentage = Math.max(0, (timeLeft / maxTime) * 100);
  const timeStatus = timePercentage <= 20 ? 'danger' : timePercentage <= 50 ? 'warning' : 'normal';

  const boardWidth = col * (cellSize + GAP) - GAP;
  const boardHeight = row * (cellSize + GAP) - GAP;

  return (
    <div className="game-screen" style={{ '--cell-size': `${cellSize}px` }}>
      {/* Khu vực bàn cờ */}
      <div 
        className="board-wrapper" 
        style={{ 
          width: boardWidth + 40, 
          height: boardHeight + 40,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', width: boardWidth, height: boardHeight }}>
          <div 
            className="board-grid" 
            style={{ 
              gridTemplateRows: `repeat(${row}, ${cellSize}px)`, 
              gridTemplateColumns: `repeat(${col}, ${cellSize}px)`,
              gap: `${GAP}px`
            }}
          >
            {matrix.map((rowArr, r) => 
              rowArr.map((val, c) => {
                if (val === 0) {
                  return <div key={`${r}-${c}`} className="cell-empty" />;
                }
                const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    className={`cell-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCellClick(r, c)}
                  >
                    <img src={`/icon/${val}.png`} alt={`Icon ${val}`} />
                  </button>
                );
              })
            )}
          </div>
          
          {/* Lớp vẽ canvas laser + hạt nổ */}
          <canvas 
            ref={canvasRef} 
            className="path-canvas"
            width={boardWidth}
            height={boardHeight}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10 
            }}
          />
        </div>
      </div>

      {/* Cột HUD điều khiển */}
      <div className="sidebar">
        <div className="sidebar-title">BẢNG ĐIỀU KHIỂN</div>
        
        <div className="sidebar-content">
          <div className="hud-grid">
            <div className="hud-label">Điểm số:</div>
            <div className="hud-val hud-score">{score}</div>

            <div className="hud-label">Thời gian:</div>
            <div className="hud-val hud-time-container">
              <div className="progress-bar-bg">
                <div 
                  className={`progress-bar-fill ${timeStatus}`} 
                  style={{ width: `${timePercentage}%` }}
                />
              </div>
              <div className="hud-time-text" style={{ color: timeStatus === 'danger' ? 'var(--accent-red)' : timeStatus === 'warning' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                {formatHUDTime(timeLeft)}
              </div>
            </div>

            <div className="hud-label">Trợ giúp:</div>
            <div className="hud-val hud-shuffles">Đổi hình ({remainingShuffles})</div>
          </div>

          <button 
            className="sidebar-btn btn-sidebar-shuffle" 
            onClick={handleShuffle}
            disabled={isPaused || remainingShuffles <= 0}
            style={{ opacity: remainingShuffles <= 0 ? 0.5 : 1 }}
          >
            ĐỔI HÌNH
          </button>
          
          <button 
            className={`sidebar-btn btn-sidebar-mute ${isMuted ? 'muted' : ''}`} 
            onClick={handleMute}
          >
            {isMuted ? 'ÂM THANH: TẮT' : 'ÂM THANH: BẬT'}
          </button>

          <button className="sidebar-btn btn-sidebar-new" onClick={handleReplay}>
            TRÒ CHƠI MỚI
          </button>

          <button className="sidebar-btn btn-sidebar-home" onClick={onHome}>
            VỀ TRANG CHỦ
          </button>

          <img src="/icon/pikachu.png" alt="Pikachu Logo" className="sidebar-logo" />
        </div>
      </div>

      {/* CUSTOM WIN MODAL */}
      {showWinModal && (
        <div className="modal-overlay">
          <div className="panel modal-content">
            <h2 className="modal-title">CHIẾN THẮNG!</h2>
            <p className="modal-text">Bạn đã dọn sạch toàn bộ bàn cờ.</p>
            <p className="modal-stats">Điểm đạt được: <span style={{color: 'var(--accent-gold)'}}>{score}</span></p>
            <p className="modal-stats">Thời gian hoàn thành: <span style={{color: 'var(--accent-cyan)'}}>{formatHUDTime(elapsedTime)}</span></p>
            
            <div className="modal-input-group">
              <label>Nhập tên lưu bảng xếp hạng:</label>
              <input 
                type="text" 
                value={playerName} 
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setNameError('');
                }}
                placeholder="Tên của bạn..."
                className="modal-input"
                maxLength={15}
              />
              {nameError && <div className="modal-error">{nameError}</div>}
            </div>

            <div className="modal-actions">
              <button className="menu-btn btn-classic" onClick={handleSaveWin} style={{ width: '100%', marginBottom: '10px' }}>
                LƯU KỶ LỤC
              </button>
              <button className="menu-btn btn-back" onClick={handleReplay} style={{ width: '100%' }}>
                CHƠI LẠI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM LOSE MODAL */}
      {showLoseModal && (
        <div className="modal-overlay">
          <div className="panel modal-content">
            <h2 className="modal-title" style={{ color: 'var(--accent-red)' }}>THUA CUỘC!</h2>
            <p className="modal-text">Hết giờ mất rồi!</p>
            <p className="modal-stats">Điểm đạt được: <span style={{color: 'var(--accent-gold)'}}>{score}</span></p>
            
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="menu-btn btn-classic" onClick={handleReplay} style={{ width: '100%', marginBottom: '10px' }}>
                CHƠI LẠI
              </button>
              <button className="menu-btn btn-back" onClick={onHome} style={{ width: '100%' }}>
                VỀ TRANG CHỦ
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0,0,0,0.8);
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal-content {
          width: 360px;
          padding: 30px 20px;
          text-align: center;
        }
        .modal-title {
          font-size: 28px;
          color: var(--accent-green);
          margin-bottom: 15px;
          font-weight: bold;
        }
        .modal-text {
          font-size: 15px;
          color: var(--text-main);
          margin-bottom: 10px;
        }
        .modal-stats {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .modal-input-group {
          margin-top: 20px;
          margin-bottom: 20px;
          text-align: left;
        }
        .modal-input-group label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .modal-input {
          width: 100%;
          height: 38px;
          background-color: #121620;
          border: 1px solid #303a4e;
          border-radius: 4px;
          color: white;
          padding: 0 10px;
          font-size: 14px;
          font-weight: bold;
          outline: none;
        }
        .modal-input:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 5px var(--accent-cyan);
        }
        .modal-error {
          color: var(--accent-red);
          font-size: 12px;
          margin-top: 5px;
          font-weight: bold;
        }
        .modal-actions {
          margin-top: 15px;
        }
      `}</style>
    </div>
  );
}
