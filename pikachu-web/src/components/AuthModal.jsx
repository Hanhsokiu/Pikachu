import React, { useState, useEffect } from 'react';
import { pikachuAudio } from '../utils/pikachuAudio';
import { 
  isOnline, 
  signUpUser, 
  signInUser, 
  signOutUser, 
  getCurrentUser, 
  fetchAchievements, 
  ALL_ACHIEVEMENTS 
} from '../utils/supabaseClient';

export default function AuthModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('login'); // login, register, profile
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  // Tải trạng thái đăng nhập và danh mục thành tựu
  useEffect(() => {
    const initAuth = async () => {
      if (!isOnline()) return;
      
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setActiveTab('profile');
          const achs = await fetchAchievements();
          setUnlockedAchievements(achs);
        }
      } catch (err) {
        console.error("Lỗi lấy phiên đăng nhập:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleAction = async (e) => {
    e.preventDefault();
    if (!isOnline()) {
      setError("Tính năng này cần cấu hình kết nối Supabase.");
      return;
    }

    setError('');
    setLoading(true);
    pikachuAudio.playSound('click');

    try {
      if (activeTab === 'login') {
        const data = await signInUser(email, password);
        setUser(data.user);
        setActiveTab('profile');
        const achs = await fetchAchievements();
        setUnlockedAchievements(achs);
      } else if (activeTab === 'register') {
        if (!displayName.trim()) {
          setError("Vui lòng điền tên hiển thị.");
          setLoading(false);
          return;
        }
        const data = await signUpUser(email, password, displayName.trim());
        alert("Đăng ký thành công! Vui lòng kiểm tra email xác nhận (nếu có cấu hình) hoặc đăng nhập ngay.");
        setActiveTab('login');
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    pikachuAudio.playSound('click');
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setActiveTab('login');
      setUnlockedAchievements([]);
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    pikachuAudio.playSound('click');
    onClose();
  };

  const isUserUnlocked = (id) => unlockedAchievements.includes(id);

  // Render nếu chưa cấu hình Supabase
  if (!isOnline()) {
    const localAchs = () => {
      try {
        const saved = localStorage.getItem('pikachu_achievements');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    };
    const unlockedLocal = localAchs();

    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal">
          <h3 className="auth-title">🏆 THÀNH TỰU CỦA BẠN</h3>
          <p className="auth-info-text" style={{ fontSize: '13px', color: 'var(--accent-orange)' }}>
            Đang chạy chế độ Offline (Cục bộ). Kết nối Supabase để đồng bộ hóa tài khoản trực tuyến.
          </p>

          <div className="achievement-list">
            {ALL_ACHIEVEMENTS.map(ach => {
              const unlocked = unlockedLocal.includes(ach.id);
              return (
                <div key={ach.id} className={`achievement-item ${unlocked ? 'unlocked' : ''}`}>
                  <span className="achievement-icon">{ach.icon}</span>
                  <div className="achievement-info">
                    <span className="achievement-name">{ach.name}</span>
                    <span className="achievement-desc">{ach.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="auth-btn-primary" onClick={handleClose} style={{ marginTop: '20px' }}>
            ĐỒNG Ý
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        {activeTab !== 'profile' ? (
          <>
            <h3 className="auth-title">{activeTab === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}</h3>
            
            <div className="auth-tabs">
              <button 
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  pikachuAudio.playSound('click');
                  setActiveTab('login');
                  setError('');
                }}
              >
                Đăng nhập
              </button>
              <button 
                className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  pikachuAudio.playSound('click');
                  setActiveTab('register');
                  setError('');
                }}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleAction}>
              {activeTab === 'register' && (
                <input 
                  type="text" 
                  placeholder="Tên hiển thị (Viết hoa không dấu)" 
                  className="auth-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.toUpperCase())}
                  required
                />
              )}
              <input 
                type="email" 
                placeholder="Email của bạn" 
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input 
                type="password" 
                placeholder="Mật khẩu (Tối thiểu 6 ký tự)" 
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? 'Đang kết nối...' : activeTab === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ TÀI KHOẢN'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h3 className="auth-title" style={{ marginBottom: '5px' }}>TÀI KHOẢN</h3>
            <p className="auth-info-text" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
              Chào mừng, <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{user?.user_metadata?.display_name || user?.email}</span>
            </p>

            <h4 style={{ fontSize: '14px', color: 'var(--accent-gold)', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '5px' }}>
              🏆 THÀNH TỰU ({unlockedAchievements.length}/{ALL_ACHIEVEMENTS.length})
            </h4>

            <div className="achievement-list">
              {ALL_ACHIEVEMENTS.map(ach => {
                const unlocked = isUserUnlocked(ach.id);
                return (
                  <div key={ach.id} className={`achievement-item ${unlocked ? 'unlocked' : ''}`}>
                    <span className="achievement-icon">{ach.icon}</span>
                    <div className="achievement-info">
                      <span className="achievement-name">{ach.name}</span>
                      <span className="achievement-desc">{ach.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="auth-btn-primary" onClick={handleLogout} style={{ marginTop: '20px', background: '#5a2828', color: '#fff', boxShadow: 'none' }}>
              ĐĂNG XUẤT
            </button>
          </>
        )}

        <button 
          className="auth-btn-primary" 
          onClick={handleClose} 
          style={{ marginTop: '10px', background: '#323c50', color: '#fff', boxShadow: 'none' }}
        >
          QUAY LẠI
        </button>
      </div>
    </div>
  );
}
