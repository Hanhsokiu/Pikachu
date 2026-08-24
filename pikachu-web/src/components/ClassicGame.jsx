import React, { useState, useEffect, useRef } from 'react';
import { 
  createMatrix, 
  getConnectionPath, 
  hasAvailableMoves, 
  shuffleMatrix 
} from '../utils/pikachuEngine';
import { pikachuAudio } from '../utils/pikachuAudio';
import { addLeaderboardEntry, leaderboardNameExists } from '../utils/leaderboardUtils';
import { isOnline, addOnlineScore, unlockAchievement } from '../utils/supabaseClient';

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
  const [isMuted, setIsMuted] = useState(pikachuAudio.isMuted());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [bgmVol, setBgmVol] = useState(Math.round(pikachuAudio.getBGMVolume() * 100));
  const [sfxVol, setSfxVol] = useState(Math.round(pikachuAudio.getSFXVolume() * 100));

  const handleBgmChange = (e) => {
    const val = parseFloat(e.target.value) / 100;
    setBgmVol(e.target.value);
    pikachuAudio.setBGMVolume(val);
  };

  const handleSfxChange = (e) => {
    const val = parseFloat(e.target.value) / 100;
    setSfxVol(e.target.value);
    pikachuAudio.setSFXVolume(val);
  };

  const handleToggleMute = () => {
    const muted = pikachuAudio.toggleMute();
    setIsMuted(muted);
  };

  const [elapsedTime, setElapsedTime] = useState(0);
  const [cellSize, setCellSize] = useState(50);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dialogs
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const particlesRef = useRef([]);
  const activePathsRef = useRef([]);

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
    activePathsRef.current = [];
    setIsPaused(false);
    setShowWinModal(false);
    setShowLoseModal(false);
    setPlayerName('');
    setNameError('');
    setShuffleKey(prev => prev + 1);
    particlesRef.current = [];
    startTimestamp.current = Date.now();
    pauseDuration.current = 0;
    
    pikachuAudio.playBGM();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const now = Date.now();
    activePathsRef.current = activePathsRef.current.filter(p => now - p.startTime < 480);
    
    activePathsRef.current.forEach(p => {
      const elapsed = now - p.startTime;
      const alpha = 1 - elapsed / 480;
      
      ctx.save();
      ctx.strokeStyle = '#ff3d00';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff3d00';
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      p.path.forEach((pt, idx) => {
        const x = pt.c * (cellSize + GAP) + cellSize / 2;
        const y = pt.r * (cellSize + GAP) + cellSize / 2;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = '#ffdc00';
      ctx.shadowColor = '#ffdc00';
      ctx.shadowBlur = 8;
      p.path.forEach(pt => {
        const x = pt.c * (cellSize + GAP) + cellSize / 2;
        const y = pt.r * (cellSize + GAP) + cellSize / 2;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });

    // 2. Cập nhật và vẽ các hạt phát sáng (Particles)
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

  const isGameStateNull = gameState === null;
  useEffect(() => {
    if (!gameState) return;
    requestRef.current = requestAnimationFrame(updateAndDrawCanvas);
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize, isGameStateNull]);

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
    if (isPaused || matrix[r][c] === 0) return;

    pikachuAudio.playSound('click');

    if (!selectedCell) {
      setSelectedCell({ r, c });
    } else {
      if (selectedCell.r === r && selectedCell.c === c) {
        setSelectedCell(null);
        return;
      }

      const p1 = selectedCell;
      const p2 = { r, c };
      const path = getConnectionPath(matrix, row, col, p1, p2);
      if (path.length > 0) {
        pikachuAudio.playSound('match');
        
        // Lưu đường đi laser để vẽ
        activePathsRef.current.push({
          id: Math.random(),
          path,
          startTime: Date.now()
        });

        spawnExplosion(p1, p2);
        setSelectedCell(null);

        // Xóa cờ và cộng điểm ngay lập tức
        const newMatrix = matrix.map(rowArr => [...rowArr]);
        newMatrix[p1.r][p1.c] = 0;
        newMatrix[p2.r][p2.c] = 0;

        setScore(prev => prev + 10);

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
    setShuffleKey(prev => prev + 1);
  };



  const handleReplay = () => {
    const fresh = createMatrix(row, col, difficulty);
    setGameState({ matrix: fresh.matrix });
    setScore(0);
    setRemainingShuffles(shuffles);
    setTimeLeft(maxTime);
    setElapsedTime(0);
    setSelectedCell(null);
    activePathsRef.current = [];
    particlesRef.current = [];
    togglePause(false);
    setShowWinModal(false);
    setShowLoseModal(false);
    setPlayerName('');
    setNameError('');
    setShuffleKey(prev => prev + 1);
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
    
    if (isOnline()) {
      addOnlineScore(name, score, elapsedTime, category);
    }

    unlockAchievement('first_win');
    if (score >= 500) {
      unlockAchievement('score_500');
    }

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

  const isMobile = windowWidth < 768;
  const boardScale = isMobile ? Math.min(1, (windowWidth - 20) / boardWidth) : 1;
  const wrapperHeight = boardHeight * boardScale;

  return (
    <div className="game-screen" style={{ '--cell-size': `${cellSize}px` }}>
      {/* Khu vực bàn cờ */}
      <div 
        className="board-wrapper" 
        style={{ 
          width: isMobile ? '100%' : boardWidth + 40, 
          height: isMobile ? wrapperHeight + 20 : boardHeight + 40,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div 
          style={{ 
            position: 'relative', 
            width: boardWidth, 
            height: boardHeight,
            transform: `scale(${boardScale})`,
            transformOrigin: 'center center',
            flexShrink: 0
          }}
        >
          <div 
            key={shuffleKey}
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
                    style={{ animationDelay: `${(r + c) * 15}ms` }}
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
        <div className="sidebar-title">⚡ CLASSIC MODE</div>
        
        <div className="sidebar-content">
          <div className="hud-grid">
            {/* SCORE */}
            <div className="hud-item">
              <div className="hud-label">🏆 ĐIỂM SỐ</div>
              <div className="hud-val hud-score">{score}</div>
            </div>

            {/* TIME BAR */}
            <div className="hud-item">
              <div className="hud-label">⏱ THỜI GIAN CÒN LẠI</div>
              <div className="hud-time-container">
                <div className="hud-bar-row">
                  <div className="progress-bar-bg">
                    <div 
                      className={`progress-bar-fill ${timeStatus}`} 
                      style={{ width: `${timePercentage}%` }}
                    />
                  </div>
                  <div className="hud-time-text" style={{ color: timeStatus === 'danger' ? '#ff5252' : timeStatus === 'warning' ? '#ff9800' : '#69f0ae' }}>
                    {formatHUDTime(timeLeft)}
                  </div>
                </div>
              </div>
            </div>

            {/* SHUFFLES */}
            <div className="hud-item">
              <div className="hud-label">🔀 ĐỔI HÌNH CÒN LẠI</div>
              <div className="hud-val hud-shuffles">{remainingShuffles} lượt</div>
            </div>
          </div>

          <div className="sidebar-buttons">
            <button 
              className="sidebar-btn btn-sidebar-shuffle" 
              onClick={handleShuffle}
              disabled={isPaused || remainingShuffles <= 0}
              style={{ opacity: remainingShuffles <= 0 ? 0.4 : 1 }}
            >
              🔀 ĐỔI HÌNH
            </button>
            
            <button className="sidebar-btn btn-sidebar-settings" onClick={() => {
              pikachuAudio.playSound('click');
              setShowSettingsModal(true);
            }}>
              ⚙️ CÀI ĐẶT
            </button>

            <button className="sidebar-btn btn-sidebar-new" onClick={handleReplay}>
              🔄 CHƠI LẠI
            </button>

            <button className="sidebar-btn btn-sidebar-home" onClick={onHome}>
              🏠 TRANG CHỦ
            </button>
          </div>

          <img src="/icon/pikachu.png" alt="" className="sidebar-logo" />
        </div>
      </div>

      {showSettingsModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h3 className="settings-title">CÀI ĐẶT</h3>
            
            <div className="settings-mute-row">
              <span className="settings-mute-label">Tắt âm toàn bộ</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isMuted} 
                  onChange={handleToggleMute} 
                />
                <span className="slider-toggle"></span>
              </label>
            </div>

            <div className="settings-group">
              <label className="settings-label">
                <span>Nhạc nền (BGM)</span>
                <span>{isMuted ? 'Tắt' : `${bgmVol}%`}</span>
              </label>
              <div className="settings-slider-container">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={bgmVol} 
                  onChange={handleBgmChange} 
                  className="settings-slider"
                  disabled={isMuted}
                />
              </div>
            </div>

            <div className="settings-group">
              <label className="settings-label">
                <span>Hiệu ứng (SFX)</span>
                <span>{isMuted ? 'Tắt' : `${sfxVol}%`}</span>
              </label>
              <div className="settings-slider-container">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sfxVol} 
                  onChange={handleSfxChange} 
                  className="settings-slider"
                  disabled={isMuted}
                />
              </div>
            </div>

            <button 
              className="btn-settings-close" 
              onClick={() => {
                pikachuAudio.playSound('click');
                setShowSettingsModal(false);
              }}
            >
              ĐỒNG Ý
            </button>
          </div>
        </div>
      )}

      {/* WIN MODAL */}
      {showWinModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ fontSize: '52px', marginBottom: '8px' }}>🏆</div>
            <h2 className="modal-title">CHIẾN THẮNG!</h2>
            <p className="modal-text">Bạn đã dọn sạch toàn bộ bàn cờ!</p>

            <div className="modal-divider" />

            <p className="modal-stats">
              🌟 Điểm: <span style={{ color: '#ffcc00', fontWeight: 900, fontSize: '20px' }}>{score}</span>
            </p>
            <p className="modal-stats">
              ⏱ Thời gian: <span style={{ color: '#00e5ff', fontWeight: 800 }}>{formatHUDTime(elapsedTime)}</span>
            </p>

            <div className="modal-input-group">
              <label>✏️ LƯU TÊN VÀO BẢNG XẾP HẠNG</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setNameError(''); }}
                placeholder="Nhập tên của bạn..."
                className="modal-input"
                maxLength={15}
                autoFocus
              />
              {nameError && <div className="modal-error">⚠️ {nameError}</div>}
            </div>

            <div className="modal-actions">
              <button className="menu-btn btn-classic" onClick={handleSaveWin}>
                💾 LƯU KỶ LỤC
              </button>
              <button className="menu-btn btn-back" onClick={handleReplay}>
                🔄 CHƠI LẠI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOSE MODAL */}
      {showLoseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ fontSize: '52px', marginBottom: '8px' }}>⌛</div>
            <h2 className="modal-title" style={{ color: '#ff5252', textShadow: '0 0 20px rgba(255,82,82,0.4)' }}>
              HẾT GIỜ!
            </h2>
            <p className="modal-text">Thời gian đã cạn. Cố gắng hơn lần sau!</p>

            <div className="modal-divider" />

            <p className="modal-stats">
              🌟 Điểm đạt được: <span style={{ color: '#ffcc00', fontWeight: 900, fontSize: '20px' }}>{score}</span>
            </p>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button className="menu-btn btn-classic" onClick={handleReplay}>
                🔄 THỬ LẠI
              </button>
              <button className="menu-btn btn-back" onClick={onHome}>
                🏠 VỀ TRANG CHỦ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

