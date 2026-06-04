import React, { useState, useEffect } from 'react';
import './App.css';
import { pikachuAudio } from './utils/pikachuAudio';
import Instructions from './components/Instructions';
import Leaderboard from './components/Leaderboard';
import ClassicGame from './components/ClassicGame';
import OverloadGame from './components/OverloadGame';

export default function App() {
  const [screen, setScreen] = useState('HOME'); // HOME, DIFFICULTY, GAME_CLASSIC, GAME_OVERLOAD, RANK, INSTRUCTIONS
  const [classicParams, setClassicParams] = useState(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
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
        <div className="panel home-screen">
          <h1 className="title-main">PIKACHU CLASSIC</h1>
          <p className="subtitle-main">Thử Thách Trí Tuệ & Sự Nhanh Mắt</p>
          
          <img src="/icon/pikachu.png" alt="Pikachu Logo" className="logo-main" />

          <button className="menu-btn btn-classic" onClick={() => handleNavigate('DIFFICULTY')}>
            CHƠI CỔ ĐIỂN
          </button>
          <button className="menu-btn btn-overload" onClick={() => handleNavigate('GAME_OVERLOAD')}>
            PIKACHU OVERLOAD
          </button>
          <button className="menu-btn btn-rank" onClick={() => handleNavigate('RANK')}>
            XẾP HẠNG
          </button>
          <button className="menu-btn btn-guide" onClick={() => handleNavigate('INSTRUCTIONS')}>
            HƯỚNG DẪN
          </button>
          <button className="menu-btn btn-settings" onClick={() => {
            pikachuAudio.playSound('click');
            setShowSettingsModal(true);
          }} style={{ backgroundColor: '#2d3748' }}>
            CÀI ĐẶT
          </button>
          <button className="menu-btn btn-exit" onClick={() => {
            pikachuAudio.playSound('click');
            if (window.confirm("Thoát trò chơi?")) {
              window.close();
            }
          }}>
            THOÁT GAME
          </button>
        </div>
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
          <h2 className="title-main" style={{ fontSize: '30px', marginBottom: '30px' }}>CHỌN CHẾ ĐỘ CHƠI</h2>
          
          <button className="menu-btn btn-classic" onClick={() => startClassicGame(6, 6, 0, 400, 5)}>
            DỄ
          </button>
          <p className="diff-desc">5 loại hình  •  400 giây  •  5 lần đổi hình</p>
          
          <button className="menu-btn btn-overload" onClick={() => startClassicGame(10, 10, 1, 300, 3)} style={{ backgroundColor: '#af5208' }}>
            TRUNG BÌNH
          </button>
          <p className="diff-desc">15 loại hình  •  300 giây  •  3 lần đổi hình</p>

          <button className="menu-btn btn-exit" onClick={() => startClassicGame(14, 14, 2, 200, 1)} style={{ backgroundColor: '#a31c1c' }}>
            KHỎ
          </button>
          <p className="diff-desc" style={{ marginBottom: '25px' }}>21 loại hình  •  200 giây  •  1 lần đổi hình</p>

          <button className="menu-btn btn-back" onClick={() => handleNavigate('HOME')}>
            QUAY LẠI
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
