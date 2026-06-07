import React, { useState, useEffect } from 'react';
import { pikachuAudio } from '../utils/pikachuAudio';
import { isOnline, fetchOnlineLeaderboard } from '../utils/supabaseClient';
import { getLeaderboardEntries } from '../utils/leaderboardUtils';

export default function Leaderboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('classic_easy');
  const [entries, setEntries] = useState({});
  const [onlineTab, setOnlineTab] = useState(false);
  const [onlineList, setOnlineList] = useState([]);
  const [loadingOnline, setLoadingOnline] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setEntries(getLeaderboardEntries());
      if (isOnline() && onlineTab) {
        setLoadingOnline(true);
        try {
          const data = await fetchOnlineLeaderboard(activeTab);
          setOnlineList(data.map(item => ({
            name: item.player_name,
            score: item.score,
            time: item.elapsed_time
          })));
        } catch (e) {
          console.error('Lỗi tải bảng xếp hạng online:', e);
          setOnlineList([]);
        } finally {
          setLoadingOnline(false);
        }
      }
    };
    loadData();
  }, [activeTab, onlineTab]);

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

  const currentList = onlineTab ? onlineList : (entries[activeTab] || []);

  return (
    <div className="panel leaderboard-screen">
      <div className="instructions-header">
        <h2 className="title-main" style={{ fontSize: '32px' }}>BẢNG XẾP HẠNG</h2>

        {/* Toggle Online/Offline */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '15px', padding: '0 10px' }}>
          <button
            className={`auth-tab-btn ${!onlineTab ? 'active' : ''}`}
            onClick={() => { pikachuAudio.playSound('click'); setOnlineTab(false); }}
            style={{ maxWidth: '160px' }}
          >
            📴 CỤC BỘ (LOCAL)
          </button>
          <button
            className={`auth-tab-btn ${onlineTab ? 'active' : ''}`}
            onClick={() => {
              pikachuAudio.playSound('click');
              if (isOnline()) {
                setOnlineTab(true);
              } else {
                alert('Tính năng bảng xếp hạng Trực tuyến chưa được cấu hình.\nVui lòng điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào file .env');
              }
            }}
            style={{ maxWidth: '160px' }}
          >
            🌐 TOÀN QUỐC (ONLINE)
          </button>
        </div>

        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === 'classic_easy' ? 'active classic' : ''}`} onClick={() => handleTabClick('classic_easy')}>
            CỔ ĐIỂN - DỄ
          </button>
          <button className={`tab-btn ${activeTab === 'classic_normal' ? 'active classic' : ''}`} onClick={() => handleTabClick('classic_normal')}>
            CỔ ĐIỂN - TRUNG BÌNH
          </button>
          <button className={`tab-btn ${activeTab === 'classic_hard' ? 'active classic' : ''}`} onClick={() => handleTabClick('classic_hard')}>
            CỔ ĐIỂN - KHÓ
          </button>
          <button className={`tab-btn ${activeTab === 'overload' ? 'active overload' : ''}`} onClick={() => handleTabClick('overload')}>
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
            {loadingOnline ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--accent-cyan)', padding: '30px', fontWeight: 'bold' }}>
                  ⏳ Đang kết nối Supabase...
                </td>
              </tr>
            ) : currentList.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  Chưa có kỷ lục nào. Hãy là người đầu tiên!
                </td>
              </tr>
            ) : (
              currentList.map((entry, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 'bold', color: index === 0 ? 'var(--accent-gold)' : index === 1 ? '#e0e0e0' : index === 2 ? '#cd7f32' : 'inherit' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{entry.name}</td>
                  <td style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{entry.score}</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{formatTime(entry.time)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
        <button className="menu-btn btn-back" onClick={handleBack}>
          QUAY LẠI
        </button>
      </div>
    </div>
  );
}
