import React, { useState, useEffect } from 'react';
import { pikachuAudio } from '../utils/pikachuAudio';

// Helper to get all entries
export function getLeaderboardEntries() {
  const data = localStorage.getItem('pikachu_leaderboard');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse leaderboard:', e);
    }
  }
  
  // Mẫu dữ liệu ban đầu
  const initial = {
    classic_easy: [
      { name: 'MINH ANH', score: 180, time: 124 },
      { name: 'DUC HUY', score: 150, time: 142 }
    ],
    classic_normal: [
      { name: 'XUAN BACH', score: 320, time: 198 },
      { name: 'HOAI NAM', score: 280, time: 215 }
    ],
    classic_hard: [
      { name: 'PHUONG THAO', score: 480, time: 172 },
      { name: 'TUAN PHONG', score: 420, time: 195 }
    ],
    overload: [
      { name: 'THE LINH', score: 1050, time: 265 },
      { name: 'QUOC ANH', score: 850, time: 210 }
    ]
  };
  localStorage.setItem('pikachu_leaderboard', JSON.stringify(initial));
  return initial;
}

// Helper to add a new entry
export function addLeaderboardEntry(category, name, score, time) {
  const all = getLeaderboardEntries();
  if (!all[category]) {
    all[category] = [];
  }
  
  all[category].push({ name: name.toUpperCase(), score, time });
  
  // Sắp xếp: Điểm số giảm dần, sau đó thời gian tăng dần
  all[category].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.time - b.time;
  });
  
  // Giới hạn tối đa 10 dòng kỷ lục
  all[category] = all[category].slice(0, 10);
  
  localStorage.setItem('pikachu_leaderboard', JSON.stringify(all));
}

// Helper to check if name already exists in a category
export function leaderboardNameExists(category, name) {
  const all = getLeaderboardEntries();
  if (!all[category]) return false;
  return all[category].some(entry => entry.name.trim().toUpperCase() === name.trim().toUpperCase());
}

export default function Leaderboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('classic_easy');
  const [entries, setEntries] = useState({});

  useEffect(() => {
    setEntries(getLeaderboardEntries());
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleTabClick = (tab) => {
    pikachuAudio.playSound('click');
    setActiveTab(tab);
  };

  const handleBack = () => {
    pikachuAudio.playSound('click');
    onBack();
  };

  const currentList = entries[activeTab] || [];

  return (
    <div className="panel leaderboard-screen">
      <div className="instructions-header">
        <h2 className="title-main" style={{ fontSize: '32px' }}>BẢNG XẾP HẠNG</h2>
        <div className="tab-bar">
          <button 
            className={`tab-btn ${activeTab === 'classic_easy' ? 'active classic' : ''}`}
            onClick={() => handleTabClick('classic_easy')}
          >
            CỔ ĐIỂN - DỄ
          </button>
          <button 
            className={`tab-btn ${activeTab === 'classic_normal' ? 'active classic' : ''}`}
            onClick={() => handleTabClick('classic_normal')}
          >
            CỔ ĐIỂN - TRUNG BÌNH
          </button>
          <button 
            className={`tab-btn ${activeTab === 'classic_hard' ? 'active classic' : ''}`}
            onClick={() => handleTabClick('classic_hard')}
          >
            CỔ ĐIỂN - KHÓ
          </button>
          <button 
            className={`tab-btn ${activeTab === 'overload' ? 'active overload' : ''}`}
            onClick={() => handleTabClick('overload')}
          >
            OVERLOAD
          </button>
        </div>
      </div>

      <div className="scroll-content" style={{ padding: '0 10px', overflowY: 'auto' }}>
        <table className="rank-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>HẠNG</th>
              <th style={{ width: '45%' }}>TÊN NGƯỜI CHƠI</th>
              <th style={{ width: '20%' }}>ĐIỂM SỐ</th>
              <th style={{ width: '20%' }}>THỜI GIAN</th>
            </tr>
          </thead>
          <tbody>
            {currentList.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  Chưa có kỷ lục nào được ghi nhận. Hãy là người đầu tiên!
                </td>
              </tr>
            ) : (
              currentList.map((entry, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 'bold', color: index === 0 ? 'var(--accent-gold)' : 'inherit' }}>
                    #{index + 1}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{entry.name}</td>
                  <td style={{ color: 'var(--accent-gold)' }}>{entry.score}</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{formatTime(entry.time)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="menu-btn btn-back" onClick={handleBack}>
          QUAY LẠI
        </button>
      </div>
    </div>
  );
}
