import React, { useState, useEffect, useRef } from 'react';
import { 
  createMatrix, 
  getConnectionPath, 
  hasAvailableMoves, 
  shuffleMatrix,
  getInfectedClustersCount,
  decayTiles,
  spawnNewInfection,
  spawnOverloadWave,
  cleanseUnstableTiles,
  getEmptyCellsCount
} from '../utils/pikachuEngine';
import { pikachuAudio } from '../utils/pikachuAudio';
import { addLeaderboardEntry, leaderboardNameExists } from './Leaderboard';

const GAP = 2;

const getComboText = (combo) => {
  if (combo === 2) return { text: "COOL x2", color: "#00e5ff" }; // Cyan
  if (combo === 3) return { text: "GREAT x3", color: "#00e676" }; // Green
  if (combo === 4) return { text: "UNSTOPPABLE x4", color: "#ffea00" }; // Yellow
  return { text: "LEGENDARY x" + combo, color: "#d500f9" }; // Purple
};

export default function OverloadGame({ onHome }) {
  const row = 16;
  const col = 16;

  // Trạng thái chơi thống nhất để tránh lỗi màn hình đen
  const [gameState, setGameState] = useState({
    matrix: [],
    specialType: [],
    spawnTime: [],
    score: 0,
    pressure: 100,
    freezeTime: 0,
    nextWaveTime: 16,
    survivalTime: 0,
    comboCount: 0,
    shuffleKey: 0,
    nextInfectionStartTime: 0,
    nextInfectionReplenishTime: 0
  });

  const [selectedCell, setSelectedCell] = useState(null); // { r, c }
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(pikachuAudio.isMuted());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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

  const [cellSize, setCellSize] = useState(50);
  const [shakeClass, setShakeClass] = useState(''); // Thêm class rung lắc màn hình

  // Dialogs
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');

  // Refs để tránh stale closures trong setInterval
  const isPausedRef = useRef(isPaused);
  const showLoseModalRef = useRef(showLoseModal);
  const lastMatchTime = useRef(Date.now());

  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const particlesRef = useRef([]);
  const activePathsRef = useRef([]);
  const floatingTextsRef = useRef([]);
  const shockwavesRef = useRef([]);

  // Đồng bộ Refs
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    showLoseModalRef.current = showLoseModal;
  }, [showLoseModal]);

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

  // Khởi động Game Overload mới
  const initGame = () => {
    const fresh = createMatrix(row, col, 1);
    
    setGameState({
      matrix: fresh.matrix,
      specialType: fresh.specialType,
      spawnTime: fresh.spawnTime,
      score: 0,
      pressure: 100,
      freezeTime: 0,
      nextWaveTime: 16,
      survivalTime: 0,
      comboCount: 0,
      shuffleKey: Math.random(),
      nextInfectionStartTime: 0,
      nextInfectionReplenishTime: 0
    });

    setSelectedCell(null);
    activePathsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    shockwavesRef.current = [];
    setIsPaused(false);
    setShowLoseModal(false);
    setPlayerName('');
    setNameError('');
    setShakeClass('');

    lastMatchTime.current = Date.now();

    pikachuAudio.playBGM();
  };

  useEffect(() => {
    initGame();
  }, []);

  // Vòng lặp đếm giây cốt lõi (Core Game Loop)
  useEffect(() => {
    if (gameState.matrix.length === 0) return;

    const gameTimer = setInterval(() => {
      if (isPausedRef.current || showLoseModalRef.current) return;

      setGameState(prev => {
        if (prev.matrix.length === 0) return prev;

        const nextSec = prev.survivalTime + 1;
        
        let waveInterval;
        let pairsToSpawn;
        let corruptedAge;
        let idleThreshold;
        let idlePenalty;
        let shouldDecayPressure;
        let pressureDecayAmount;
        let spreadInterval;
        let spawnCount;

        if (nextSec <= 90) {
          waveInterval = 16;
          pairsToSpawn = 2;
          corruptedAge = 90;
          idleThreshold = 10;
          idlePenalty = 1;
          shouldDecayPressure = (nextSec % 2 === 0);
          pressureDecayAmount = 1;
          spreadInterval = 18;
          spawnCount = 1;
        } else if (nextSec <= 180) {
          waveInterval = 12;
          pairsToSpawn = 3;
          corruptedAge = 70;
          idleThreshold = 8;
          idlePenalty = 2;
          shouldDecayPressure = true;
          pressureDecayAmount = 1;
          spreadInterval = 14;
          spawnCount = 2;
        } else {
          waveInterval = 8;
          pairsToSpawn = 4;
          corruptedAge = 50;
          idleThreshold = 6;
          idlePenalty = 3;
          shouldDecayPressure = true;
          pressureDecayAmount = 2;
          spreadInterval = 10;
          spawnCount = 2;
        }

        let nextFreezeTime = prev.freezeTime;
        let nextPressure = prev.pressure;
        const nextMatrix = prev.matrix.map(rArr => [...rArr]);
        const nextSpecial = prev.specialType.map(rArr => [...rArr]);
        const nextSpawnTime = prev.spawnTime.map(rArr => [...rArr]);

        let nextInfectionStartTimeVal = prev.nextInfectionStartTime;
        let nextInfectionReplenishTimeVal = prev.nextInfectionReplenishTime;

        if (prev.freezeTime > 0) {
          nextFreezeTime = prev.freezeTime - 1;
        } else {
          // Tính suy hao áp lực
          const idleTimeSec = Math.floor((Date.now() - lastMatchTime.current) / 1000);
          let decay = 0;
          if (idleTimeSec > idleThreshold) {
            decay = idlePenalty;
          } else if (shouldDecayPressure) {
            decay = pressureDecayAmount;
          }

          // Phạt ô Corrupted
          let corruptedPenalty = 0;
          for (let r = 1; r < row - 1; r++) {
            for (let c = 1; c < col - 1; c++) {
              if (nextMatrix[r][c] !== 0 && nextSpecial[r][c] === 4) {
                const corruptedAgeSec = Math.floor((Date.now() - nextSpawnTime[r][c]) / 1000);
                if (corruptedAgeSec < 10) {
                  corruptedPenalty += 1;
                } else if (corruptedAgeSec < 20) {
                  corruptedPenalty += 3;
                } else {
                  corruptedPenalty += 6;
                }
              }
            }
          }
          decay += corruptedPenalty;
          nextPressure = Math.max(0, prev.pressure - decay);

          if (nextPressure <= 0) {
            clearInterval(gameTimer);
            pikachuAudio.playSound('lose');
            setShowLoseModal(true);
          }

          // Lão hóa, lây lan virus và quản lý ổ dịch 1:1 theo Java
          const updatedInfection = decayTiles(
            nextMatrix,
            nextSpecial,
            nextSpawnTime,
            corruptedAge,
            spreadInterval,
            spawnCount,
            {
              nextInfectionStartTime: prev.nextInfectionStartTime,
              nextInfectionReplenishTime: prev.nextInfectionReplenishTime
            },
            row,
            col
          );
          nextInfectionStartTimeVal = updatedInfection.nextInfectionStartTime;
          nextInfectionReplenishTimeVal = updatedInfection.nextInfectionReplenishTime;
        }

        // Đếm ngược Wave mới
        let nextNextWaveTime = prev.nextWaveTime;
        const emptyCount = getEmptyCellsCount(nextMatrix, row, col);
        if (emptyCount >= 24) {
          nextNextWaveTime = prev.nextWaveTime - 1;
          if (nextNextWaveTime <= 0) {
            const spawned = spawnOverloadWave(nextMatrix, nextSpecial, nextSpawnTime, pairsToSpawn, row, col);
            if (spawned) {
              pikachuAudio.playSound('match');
            }
            nextNextWaveTime = waveInterval;
          }
        }

        // Combo timeout
        let nextComboCount = prev.comboCount;
        if (prev.comboCount > 0 && (Date.now() - lastMatchTime.current) > 3000) {
          nextComboCount = 0;
        }

        return {
          ...prev,
          matrix: nextMatrix,
          specialType: nextSpecial,
          spawnTime: nextSpawnTime,
          pressure: nextPressure,
          freezeTime: nextFreezeTime,
          nextWaveTime: nextNextWaveTime,
          survivalTime: nextSec,
          comboCount: nextComboCount,
          nextInfectionStartTime: nextInfectionStartTimeVal,
          nextInfectionReplenishTime: nextInfectionReplenishTimeVal
        };
      });
    }, 1000);

    return () => clearInterval(gameTimer);
  }, [gameState.matrix.length]);

  // Vòng lặp vẽ Laser & hạt nổ bùng nổ (Canvas Animation Frame Loop)
  const updateAndDrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Vẽ laser đường nối nếu có
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

    // 2. Cập nhật và vẽ hạt nổ bay tỏa
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

    // 3. Cập nhật và vẽ chữ Combo nổi
    floatingTextsRef.current = floatingTextsRef.current.filter(t => {
      const elapsed = now - t.startTime;
      if (elapsed >= t.duration) return false;
      const pct = elapsed / t.duration;
      
      const currentY = t.y - pct * 60; // Bay lên trên 60px
      const alpha = 1 - pct; // Mờ dần
      const scale = 1 + pct * 0.4; // To dần lên
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.floor(22 * scale)}px 'Outfit', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, t.x, currentY);
      ctx.restore();
      return true;
    });

    // 4. Vẽ sóng xung kích (Shockwaves)
    shockwavesRef.current = shockwavesRef.current.filter(sw => {
      const elapsed = now - sw.startTime;
      if (elapsed >= sw.duration) return false;
      const pct = elapsed / sw.duration;
      
      const currentRadius = sw.maxRadius * pct;
      const alpha = 1 - pct;
      
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 6 * (1 - pct);
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 15;
      ctx.shadowColor = sw.color;
      
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, currentRadius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
      return true;
    });

    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    requestRef.current = requestAnimationFrame(updateAndDrawCanvas);
  };

  const isMatrixEmpty = gameState.matrix.length === 0;
  useEffect(() => {
    if (gameState.matrix.length === 0) return;
    requestRef.current = requestAnimationFrame(updateAndDrawCanvas);
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize, isMatrixEmpty]);

  const spawnExplosion = (p1, p2, type) => {
    let color = '#ff9f00'; // Mặc định vàng cam
    if (type === 1) color = '#00e676'; // Xanh lá (Energy)
    if (type === 3) color = '#00e5ff'; // Xanh cyan (Freeze)
    if (type === 4) color = '#aa00ff'; // Tím (Corrupted)
    if (type === 2) color = '#ff1744'; // Đỏ (Bomb)

    const getCenter = (pt) => ({
      x: pt.c * (cellSize + GAP) + cellSize / 2,
      y: pt.r * (cellSize + GAP) + cellSize / 2
    });

    const c1 = getCenter(p1);
    const c2 = getCenter(p2);
    const newParticles = [];
    const count = 16;

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
          color: color,
          startTime: Date.now(),
          duration: 500 + Math.random() * 400
        });
      }
    });

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  const handleCellClick = (r, c) => {
    if (isPaused || gameState.matrix.length === 0 || gameState.matrix[r][c] === 0) return;

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
      const path = getConnectionPath(gameState.matrix, row, col, p1, p2);
      if (path.length > 0) {
        const type1 = gameState.specialType[p1.r][p1.c];
        const type2 = gameState.specialType[p2.r][p2.c];
        const activeType = type1 !== 0 ? type1 : type2;

        if (activeType === 1) { // Energy Tile
          pikachuAudio.playSound('win');
        } else if (activeType === 3) { // Freeze Tile
          pikachuAudio.playSound('freeze');
        } else if (activeType === 4) { // Corrupted Tile
          pikachuAudio.playSound('wrong');
        } else if (activeType === 2) { // Bomb Tile
          pikachuAudio.playSound('bomb');
        } else { // Normal Tile
          pikachuAudio.playSound('match');
        }

        // Lưu đường đi laser để vẽ
        activePathsRef.current.push({
          id: Math.random(),
          path,
          startTime: Date.now()
        });

        spawnExplosion(p1, p2, activeType);
        setSelectedCell(null);

        setGameState(prev => {
          const nextMatrix = prev.matrix.map(rArr => [...rArr]);
          const nextSpecial = prev.specialType.map(rArr => [...rArr]);
          const nextSpawnTime = prev.spawnTime.map(rArr => [...rArr]);

          const t1 = nextSpecial[p1.r][p1.c];
          const t2 = nextSpecial[p2.r][p2.c];

          // Xóa hai ô cờ
          nextMatrix[p1.r][p1.c] = 0;
          nextMatrix[p2.r][p2.c] = 0;
          nextSpecial[p1.r][p1.c] = 0;
          nextSpecial[p2.r][p2.c] = 0;

          const now = Date.now();
          let nextCombo = 1;
          if (now - lastMatchTime.current <= 3000) {
            nextCombo = prev.comboCount + 1;
          }
          lastMatchTime.current = now;

          if (nextCombo > 1) {
            const midX = (p1.c * (cellSize + GAP) + cellSize / 2 + p2.c * (cellSize + GAP) + cellSize / 2) / 2;
            const midY = (p1.r * (cellSize + GAP) + cellSize / 2 + p2.r * (cellSize + GAP) + cellSize / 2) / 2;
            const info = getComboText(nextCombo);
            floatingTextsRef.current.push({
              id: Math.random(),
              x: midX,
              y: midY,
              text: info.text,
              color: info.color,
              startTime: now,
              duration: 1000
            });
          }

          // Tính điểm
          let baseScore = 10;
          let distance = 0;
          for (let i = 0; i < path.length - 1; i++) {
            distance += Math.abs(path[i].r - path[i+1].r) + Math.abs(path[i].c - path[i+1].c);
          }
          if (distance > 4) {
            baseScore += 10;
          }

          const multiplier = Math.min(5, nextCombo);
          let matchScore = baseScore * multiplier;

          let pressureRecovery = 3;
          if (distance > 4) pressureRecovery = 5;
          if (nextCombo > 1) pressureRecovery = 8;

          // Energy Tile
          if (t1 === 1 || t2 === 1) {
            pressureRecovery = 15;
            matchScore += 30;
            const cleansed = cleanseUnstableTiles(nextMatrix, nextSpecial, nextSpawnTime, row, col);
            if (cleansed > 0) {
              pikachuAudio.playSound('win');
            }
          }

          // Freeze Tile
          let newFreeze = prev.freezeTime;
          if (t1 === 3 || t2 === 3) {
            newFreeze = 5;
          }

          // Corrupted Tile
          if (t1 === 4 || t2 === 4) {
            pressureRecovery = -15;
            matchScore -= 15;
          }

          // Bomb Tile
          if (t1 === 2) triggerBomb(nextMatrix, nextSpecial, nextSpawnTime, p1.r, p1.c, val => matchScore += val);
          if (t2 === 2) triggerBomb(nextMatrix, nextSpecial, nextSpawnTime, p2.r, p2.c, val => matchScore += val);

          const nextPressure = newFreeze > 0 ? prev.pressure : Math.min(100, prev.pressure + pressureRecovery);

          // Kiểm tra số cờ còn lại
          let remaining = 0;
          for (let rowIdx = 1; rowIdx < row - 1; rowIdx++) {
            for (let colIdx = 1; colIdx < col - 1; colIdx++) {
              if (nextMatrix[rowIdx][colIdx] !== 0) remaining++;
            }
          }

          let nextNextWaveTime = prev.nextWaveTime;
          let nextShuffleKey = prev.shuffleKey;
          if (remaining === 0) {
            nextNextWaveTime = 1;
          } else if (!hasAvailableMoves(nextMatrix, row, col)) {
            shuffleMatrix(nextMatrix, row, col);
            nextShuffleKey = Math.random();
          }

          return {
            ...prev,
            matrix: nextMatrix,
            specialType: nextSpecial,
            spawnTime: nextSpawnTime,
            score: prev.score + matchScore,
            pressure: nextPressure,
            freezeTime: newFreeze,
            nextWaveTime: nextNextWaveTime,
            comboCount: nextCombo,
            shuffleKey: nextShuffleKey
          };
        });
      } else {
        pikachuAudio.playSound('wrong');
        setSelectedCell(null);
        setGameState(prev => ({
          ...prev,
          pressure: Math.max(0, prev.pressure - 3)
        }));
      }
    }
  };

  const triggerBomb = (mat, spec, st, r, c, addScore) => {
    pikachuAudio.playSound('bomb'); // Phát tiếng nổ bom
    setShakeClass('shake-board');
    setTimeout(() => setShakeClass(''), 400); // Tắt hiệu ứng rung lắc sau 400ms

    const x = c * (cellSize + GAP) + cellSize / 2;
    const y = r * (cellSize + GAP) + cellSize / 2;
    shockwavesRef.current.push({
      id: Math.random(),
      x,
      y,
      maxRadius: cellSize * 2.5,
      color: '#ff1744',
      startTime: Date.now(),
      duration: 500
    });

    let bombScore = 0;
    const rStart = Math.max(1, r - 1);
    const rEnd = Math.min(row - 2, r + 1);
    const cStart = Math.max(1, c - 1);
    const cEnd = Math.min(col - 2, c + 1);

    for (let x = rStart; x <= rEnd; x++) {
      for (let y = cStart; y <= cEnd; y++) {
        if (mat[x][y] !== 0) {
          // Bùng nổ hạt nhỏ tại mỗi ô bị phá hủy bởi bom
          const pt = { r: x, c: y };
          const newParticles = [];
          const center = {
            x: pt.c * (cellSize + GAP) + cellSize / 2,
            y: pt.r * (cellSize + GAP) + cellSize / 2
          };
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            newParticles.push({
              x: center.x,
              y: center.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 1 + Math.random() * 3,
              color: '#ff1744',
              startTime: Date.now(),
              duration: 400 + Math.random() * 300
            });
          }
          particlesRef.current = [...particlesRef.current, ...newParticles];

          mat[x][y] = 0;
          spec[x][y] = 0;
          st[x][y] = 0;
          bombScore += 5;
        }
      }
    }
    addScore(bombScore);
  };





  const handleSaveLose = () => {
    const name = playerName.trim();
    if (!name) {
      setNameError('Tên không được để trống!');
      return;
    }
    if (name.includes('|')) {
      setNameError("Tên không được chứa ký tự '|'!");
      return;
    }

    if (leaderboardNameExists('overload', name)) {
      setNameError('Tên đã tồn tại trên bảng xếp hạng!');
      return;
    }

    addLeaderboardEntry('overload', name, gameState.score, gameState.survivalTime);
    setShowLoseModal(false);
    onHome();
  };

  const formatHUDTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getCellClass = (r, c) => {
    const type = gameState.specialType[r][c];
    if (type === 1) return 'energy';
    if (type === 2) return 'bomb';
    if (type === 3) return 'freeze';
    if (type === 4) return 'corrupted';
    if (type === 5) return 'unstable';
    return '';
  };

  if (gameState.matrix.length === 0) return null;

  const emptyCount = getEmptyCellsCount(gameState.matrix, row, col);
  const waveDisplay = emptyCount < 24 ? 'ĐẦY' : `${gameState.nextWaveTime}s`;

  const pressureStatus = gameState.pressure < 25 ? 'danger' : gameState.pressure <= 50 ? 'warning' : 'normal';

  const boardWidth = col * (cellSize + GAP) - GAP;
  const boardHeight = row * (cellSize + GAP) - GAP;

  return (
    <div className="game-screen" style={{ '--cell-size': `${cellSize}px` }}>
      {/* Khu vực bàn cờ Overload */}
      <div 
        className={`board-wrapper ${shakeClass}`} 
        style={{ 
          width: boardWidth + 40, 
          height: boardHeight + 40,
          backgroundColor: gameState.freezeTime > 0 ? '#0f2430' : '#1a1f2a',
          transition: 'background-color 0.3s',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', width: boardWidth, height: boardHeight }}>
          {pressureStatus === 'danger' && (
            <div className="vignette-danger" />
          )}
          {gameState.freezeTime > 0 && (
            <div className="vignette-freeze" />
          )}
          <div 
            key={gameState.shuffleKey}
            className="board-grid" 
            style={{ 
              gridTemplateRows: `repeat(${row}, ${cellSize}px)`, 
              gridTemplateColumns: `repeat(${col}, ${cellSize}px)`,
              gap: `${GAP}px`
            }}
          >
            {gameState.matrix.map((rowArr, r) => 
              rowArr.map((val, c) => {
                if (val === 0) {
                  return <div key={`${r}-${c}`} className="cell-empty" />;
                }
                const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                const cellClass = getCellClass(r, c);
                return (
                  <button
                    key={`${r}-${c}`}
                    className={`cell-btn ${isSelected ? 'selected' : ''} ${cellClass}`}
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

      {/* Cột HUD thông số */}
      <div className="sidebar">
        <div className="sidebar-title">PIKACHU OVERLOAD</div>
        
        <div className="sidebar-content">
          <div className="hud-grid">
            <div className="hud-label">Điểm số:</div>
            <div className="hud-val hud-score">{gameState.score}</div>

            <div className="hud-label">Áp lực:</div>
            <div className="hud-val hud-time-container">
              <div className="progress-bar-bg">
                <div 
                  className={`progress-bar-fill ${pressureStatus}`} 
                  style={{ width: `${gameState.pressure}%`, backgroundColor: gameState.freezeTime > 0 ? '#00e5ff' : '' }}
                />
              </div>
              <div className="hud-time-text" style={{ color: gameState.freezeTime > 0 ? 'var(--accent-cyan)' : pressureStatus === 'danger' ? 'var(--accent-red)' : pressureStatus === 'warning' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                {gameState.freezeTime > 0 ? 'BĂNG' : `${gameState.pressure}%`}
              </div>
            </div>

            <div className="hud-label">Kế tiếp:</div>
            <div className="hud-val hud-next-wave">{waveDisplay}</div>

            <div className="hud-label">Sinh tồn:</div>
            <div className="hud-val hud-survival">{formatHUDTime(gameState.survivalTime)}</div>

            {gameState.comboCount > 0 && (
              <>
                <div className="hud-label">Combo:</div>
                <div className="hud-val hud-combo">x{gameState.comboCount}</div>
              </>
            )}

          </div>
          
          <button className="sidebar-btn btn-sidebar-settings" onClick={() => {
            pikachuAudio.playSound('click');
            setShowSettingsModal(true);
          }} style={{ backgroundColor: '#4a5568' }}>
            CÀI ĐẶT
          </button>

          <button className="sidebar-btn btn-sidebar-new" onClick={initGame}>
            TRÒ CHƠI MỚI
          </button>

          <button className="sidebar-btn btn-sidebar-home" onClick={onHome}>
            VỀ TRANG CHỦ
          </button>

          <img src="/icon/pikachu.png" alt="Pikachu Logo" className="sidebar-logo" />
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

      {/* CUSTOM LOSE MODAL (OVERLOAD GAME OVER) */}
      {showLoseModal && (
        <div className="modal-overlay">
          <div className="panel modal-content">
            <h2 className="modal-title" style={{ color: 'var(--accent-red)' }}>💀 HỆ THỐNG SỤP ĐỔ</h2>
            <p className="modal-text">Bạn đã bị quá tải hoàn toàn.</p>
            <p className="modal-stats">Thời gian sinh tồn: <span style={{color: 'var(--accent-cyan)'}}>{formatHUDTime(gameState.survivalTime)}</span></p>
            <p className="modal-stats">Điểm đạt được: <span style={{color: 'var(--accent-gold)'}}>{gameState.score}</span></p>
            
            <div className="modal-input-group">
              <label>Nhập tên lưu bảng xếp hạng sinh tồn:</label>
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
              <button className="menu-btn btn-classic" onClick={handleSaveLose} style={{ width: '100%', marginBottom: '10px' }}>
                LƯU KỶ LỤC
              </button>
              <button className="menu-btn btn-back" onClick={initGame} style={{ width: '100%' }}>
                CHƠI LẠI
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
