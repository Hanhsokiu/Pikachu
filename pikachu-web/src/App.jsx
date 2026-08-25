import React, { useState, useEffect } from 'react';
import './App.css';
import { pikachuAudio } from './utils/pikachuAudio';
import Instructions from './components/Instructions';
import Leaderboard from './components/Leaderboard';
import ClassicGame from './components/ClassicGame';
import OverloadGame from './components/OverloadGame';
import AuthModal from './components/AuthModal';
import HomeScreen from './components/HomeScreen';

export default function App() {
  const [screen, setScreen] = useState('HOME'); // HOME, DIFFICULTY, GAME_CLASSIC, GAME_OVERLOAD, RANK, INSTRUCTIONS
  const [classicParams, setClassicParams] = useState(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMuted, setIsMuted] = useState(pikachuAudio.isMuted());
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

  // Khởi động nhạc nền khi có tương tác đầu tiên từ người dùng
  useEffect(() => {
    const handleFirstInteraction = () => {
      pikachuAudio.playBGM();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const handleNavigate = (targetScreen) => {
    pikachuAudio.playSound('click');
    setScreen(targetScreen);
  };

  const startClassicGame = (playRow, playCol, difficulty, maxTime, shuffles) => {
    pikachuAudio.playSound('click');
    setClassicParams({ playRow, playCol, difficulty, maxTime, shuffles });
    setScreen('GAME_CLASSIC');
  };

  return (
    <div className="app-container">
      {screen === 'HOME' && (
        <HomeScreen
          onNavigate={handleNavigate}
          onSettings={() => {
            pikachuAudio.playSound('click');
            setShowSettingsModal(true);
          }}
          onAccount={() => setShowAuthModal(true)}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

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

      {screen === 'DIFFICULTY' && (
        <div className="panel difficulty-screen">
          <h2 className="title-main" style={{ fontSize: '28px', marginBottom: '6px' }}>CHỌN ĐỘ KHÓ</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px', letterSpacing: '0.5px' }}>
            Chế độ Cổ Điển — Dọn sạch toàn bộ bàn cờ để chiến thắng
          </p>

          <div className="diff-cards">
            {/* DỄ */}
            <div className="diff-card easy" onClick={() => startClassicGame(6, 6, 0, 400, 5)}>
              <div className="diff-card-icon">🌿</div>
              <div className="diff-card-info">
                <div className="diff-card-title">DỄ</div>
                <div className="diff-card-stats">
                  <span className="diff-stat">🎴 5 loại hình</span>
                  <span className="diff-stat">⏱ 400 giây</span>
                  <span className="diff-stat">🔀 5 lần đổi</span>
                </div>
              </div>
              <div className="diff-card-arrow">›</div>
            </div>

            {/* TRUNG BÌNH */}
            <div className="diff-card normal" onClick={() => startClassicGame(10, 10, 1, 300, 3)}>
              <div className="diff-card-icon">🔥</div>
              <div className="diff-card-info">
                <div className="diff-card-title">TRUNG BÌNH</div>
                <div className="diff-card-stats">
                  <span className="diff-stat">🎴 15 loại hình</span>
                  <span className="diff-stat">⏱ 300 giây</span>
                  <span className="diff-stat">🔀 3 lần đổi</span>
                </div>
              </div>
              <div className="diff-card-arrow">›</div>
            </div>

            {/* KHÓ */}
            <div className="diff-card hard" onClick={() => startClassicGame(14, 14, 2, 210, 1)}>
              <div className="diff-card-icon">💀</div>
              <div className="diff-card-info">
                <div className="diff-card-title">KHÓ</div>
                <div className="diff-card-stats">
                  <span className="diff-stat">🎴 21 loại hình</span>
                  <span className="diff-stat">⏱ 210 giây</span>
                  <span className="diff-stat">🔀 1 lần đổi</span>
                </div>
              </div>
              <div className="diff-card-arrow">›</div>
            </div>
          </div>

          <button className="menu-btn btn-back" onClick={() => handleNavigate('HOME')} style={{ width: '100%' }}>
            ← QUAY LẠI
          </button>
        </div>
      )}


      {screen === 'INSTRUCTIONS' && (
        <Instructions onBack={() => handleNavigate('HOME')} />
      )}

      {screen === 'RANK' && (
        <Leaderboard onBack={() => handleNavigate('HOME')} />
      )}

      {screen === 'GAME_CLASSIC' && classicParams && (
        <ClassicGame 
          {...classicParams} 
          onHome={() => {
            pikachuAudio.stopBGM();
            handleNavigate('HOME');
          }} 
        />
      )}

      {screen === 'GAME_OVERLOAD' && (
        <OverloadGame 
          onHome={() => {
            pikachuAudio.stopBGM();
            handleNavigate('HOME');
          }} 
        />
      )}
    </div>
  );
}
