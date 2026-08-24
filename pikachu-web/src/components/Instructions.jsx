import React, { useState } from 'react';
import { pikachuAudio } from '../utils/pikachuAudio';

/* ── Mini illustration components ───────────────────────── */

function ClassicIllustration() {
  const tiles = [
    ['🐱','🐶','🐸','🐱'],
    ['🦊','🐼','🐶','🦊'],
    ['🐸','🌟','🐼','🌟'],
    ['🦋','🐻','🦋','🐻'],
  ];
  return (
    <div style={{ display:'flex', gap:'0', width:'100%', height:'100%' }}>

      {/* Step 1 */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 8px', borderRight:'1px solid rgba(255,255,255,0.07)', gap:'8px' }}>
        <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1px', color:'rgba(200,215,240,0.5)', textTransform:'uppercase' }}>Bước 1</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'3px' }}>
          {tiles.map((row,r) => row.map((t,c) => {
            const isHighlight = (r===0&&c===0)||(r===2&&c===1)||(r===2&&c===3);
            return (
              <div key={`${r}-${c}`} style={{
                width:'22px', height:'22px', borderRadius:'4px',
                background: isHighlight ? 'rgba(255,200,0,0.25)' : 'rgba(255,255,255,0.07)',
                border: isHighlight ? '1.5px solid #ffcc00' : '1px solid rgba(255,255,255,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'11px',
                boxShadow: isHighlight ? '0 0 6px rgba(255,200,0,0.4)' : 'none',
              }}>{t}</div>
            );
          }))}
        </div>
        <div style={{ fontSize:'11px', color:'rgba(200,215,240,0.7)', textAlign:'center', fontWeight:600 }}>
          Chọn 2 ô giống nhau
        </div>
      </div>

      {/* Step 2 */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 8px', borderRight:'1px solid rgba(255,255,255,0.07)', gap:'8px' }}>
        <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1px', color:'rgba(200,215,240,0.5)', textTransform:'uppercase' }}>Bước 2</div>
        <svg width="80" height="56" viewBox="0 0 80 56">
          {/* Tile A */}
          <rect x="4" y="4" width="22" height="22" rx="4" fill="rgba(255,200,0,0.2)" stroke="#ffcc00" strokeWidth="1.5"/>
          <text x="15" y="20" textAnchor="middle" fontSize="12">🌟</text>
          {/* Tile B */}
          <rect x="54" y="30" width="22" height="22" rx="4" fill="rgba(255,200,0,0.2)" stroke="#ffcc00" strokeWidth="1.5"/>
          <text x="65" y="46" textAnchor="middle" fontSize="12">🌟</text>
          {/* L-shaped path */}
          <polyline points="15,26 15,41 65,41" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter:'drop-shadow(0 0 4px #00e5ff)' }}/>
          {/* Arrow head */}
          <polygon points="65,36 65,46 70,41" fill="#00e5ff"/>
        </svg>
        <div style={{ fontSize:'11px', color:'rgba(200,215,240,0.7)', textAlign:'center', fontWeight:600 }}>
          Đường nối ≤ 2 góc cua
        </div>
      </div>

      {/* Step 3 */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 8px', gap:'8px' }}>
        <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1px', color:'rgba(200,215,240,0.5)', textTransform:'uppercase' }}>Bước 3</div>
        <div style={{ position:'relative', width:'60px', height:'60px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {/* Sparkle burst */}
          {[0,45,90,135,180,225,270,315].map((deg,i) => (
            <div key={i} style={{
              position:'absolute', width:'3px', height:'14px',
              background:'linear-gradient(to top, transparent, #ffcc00)',
              borderRadius:'2px',
              transform:`rotate(${deg}deg) translateY(-24px)`,
              opacity: 0.7,
            }}/>
          ))}
          <div style={{ fontSize:'22px', fontWeight:900, color:'#69f0ae', textShadow:'0 0 12px rgba(105,240,174,0.6)', zIndex:1 }}>
            +10
          </div>
        </div>
        <div style={{ fontSize:'11px', color:'#69f0ae', textAlign:'center', fontWeight:700 }}>
          ✓ Ghép thành công!
        </div>
      </div>

    </div>
  );
}

function OverloadIllustration() {
  return (
    <div style={{ display:'flex', gap:'0', width:'100%', height:'100%' }}>

      {/* Pressure bar */}
      <div style={{ flex:1.2, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 12px', borderRight:'1px solid rgba(255,255,255,0.07)', gap:'8px' }}>
        <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1px', color:'rgba(200,215,240,0.5)', textTransform:'uppercase', marginBottom:'2px' }}>⚡ ÁP LỰC</div>
        <div style={{ width:'100%', height:'16px', borderRadius:'8px', background:'rgba(255,255,255,0.08)', overflow:'hidden', position:'relative', border:'1px solid rgba(255,255,255,0.1)' }}>
          <div style={{
            width:'65%', height:'100%', borderRadius:'8px',
            background:'linear-gradient(90deg, #69f0ae 0%, #ffcc00 55%, #ff5252 100%)',
            boxShadow:'0 0 8px rgba(105,240,174,0.3)',
          }}/>
        </div>
        <div style={{ width:'100%', display:'flex', justifyContent:'space-between', fontSize:'9px', color:'rgba(200,215,240,0.4)', fontWeight:600 }}>
          <span style={{color:'#69f0ae'}}>100%</span>
          <span style={{color:'#ffcc00'}}>50%</span>
          <span style={{color:'#ff5252'}}>0%</span>
        </div>
        <div style={{ marginTop:'4px', display:'flex', flexDirection:'column', gap:'4px', width:'100%' }}>
          <div style={{ fontSize:'10px', color:'rgba(200,215,240,0.6)', textAlign:'center' }}>
            Ghép cờ <span style={{color:'#69f0ae', fontWeight:700}}>+3%</span> → <span style={{color:'#00e5ff', fontWeight:700}}>+5%</span> → Combo <span style={{color:'#ffcc00', fontWeight:700}}>+8%</span>
          </div>
          <div style={{ fontSize:'10px', color:'#ff5252', fontWeight:700, textAlign:'center' }}>
            💀 Về 0% → THUA!
          </div>
        </div>
      </div>

      {/* Special tiles */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 8px', borderRight:'1px solid rgba(255,255,255,0.07)', gap:'6px' }}>
        <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1px', color:'rgba(200,215,240,0.5)', textTransform:'uppercase' }}>✨ TILE ĐẶC BIỆT</div>
        {[
          { icon:'⚡', label:'Energy', desc:'+15% áp lực', c:'#69f0ae', bg:'rgba(0,200,83,0.15)', border:'rgba(0,200,83,0.4)' },
          { icon:'❄️', label:'Freeze', desc:'Đóng băng 5s', c:'#00e5ff', bg:'rgba(0,229,255,0.12)', border:'rgba(0,229,255,0.4)' },
          { icon:'💣', label:'Bomb', desc:'Xóa vùng 3×3', c:'#ff5252', bg:'rgba(255,82,82,0.12)', border:'rgba(255,82,82,0.4)' },
        ].map(t => (
          <div key={t.label} style={{
            display:'flex', alignItems:'center', gap:'8px', width:'100%',
            background:t.bg, border:`1px solid ${t.border}`,
            borderRadius:'6px', padding:'5px 8px',
          }}>
            <span style={{ fontSize:'14px' }}>{t.icon}</span>
            <div>
              <div style={{ fontSize:'11px', fontWeight:700, color:t.c }}>{t.label}</div>
              <div style={{ fontSize:'10px', color:'rgba(200,215,240,0.6)' }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Virus spread */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 8px', gap:'8px' }}>
        <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1px', color:'rgba(200,215,240,0.5)', textTransform:'uppercase' }}>🦠 VIRUS</div>
        <div style={{ position:'relative', width:'72px', height:'72px' }}>
          {/* 3x3 grid */}
          {[0,1,2].map(r => [0,1,2].map(c => {
            const center = r===1&&c===1;
            const adjacent = (r===0&&c===1)||(r===2&&c===1)||(r===1&&c===0)||(r===1&&c===2);
            return (
              <div key={`${r}-${c}`} style={{
                position:'absolute',
                left: c*24+'px', top: r*24+'px',
                width:'21px', height:'21px', borderRadius:'4px',
                background: center ? 'rgba(160,32,240,0.3)' : adjacent ? 'rgba(255,140,0,0.2)' : 'rgba(255,255,255,0.06)',
                border: center ? '1.5px solid #ce93d8' : adjacent ? '1.5px solid #ff9800' : '1px solid rgba(255,255,255,0.08)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px',
              }}>
                {center ? '☠️' : adjacent ? '⚠️' : ''}
              </div>
            );
          }))}
          {/* Arrows */}
          {[
            { style:{ top:'-8px', left:'29px' }, r:'0deg', char:'▲' },
            { style:{ bottom:'-10px', left:'29px' }, r:'0deg', char:'▼' },
            { style:{ left:'-10px', top:'28px' }, r:'0deg', char:'◀' },
            { style:{ right:'-10px', top:'28px' }, r:'0deg', char:'▶' },
          ].map((a,i) => (
            <span key={i} style={{ position:'absolute', ...a.style, fontSize:'10px', color:'#ff9800', lineHeight:1 }}>{a.char}</span>
          ))}
        </div>
        <div style={{ fontSize:'10px', color:'rgba(200,215,240,0.6)', textAlign:'center', lineHeight:1.4 }}>
          <span style={{color:'#ff9800',fontWeight:700}}>Cam</span> nhiễm →{' '}
          <span style={{color:'#ce93d8',fontWeight:700}}>Tím</span> độc<br/>
          <span style={{color:'#ff5252',fontSize:'9px'}}>−15đ, −15% áp lực!</span>
        </div>
      </div>

    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

export default function Instructions({ onBack }) {
  const [activeTab, setActiveTab] = useState('classic');

  const handleTabClick = (tab) => { pikachuAudio.playSound('click'); setActiveTab(tab); };
  const handleBack    = ()    => { pikachuAudio.playSound('click'); onBack(); };

  return (
    <div className="panel instructions-screen">

      {/* Header */}
      <div className="instructions-header">
        <h2 className="title-main" style={{ fontSize:'24px', marginBottom:'12px', letterSpacing:'2px' }}>
          📖 HƯỚNG DẪN CHƠI
        </h2>
        <div className="tab-bar">
          <button className={`tab-btn ${activeTab==='classic'  ? 'active classic'  : ''}`} onClick={() => handleTabClick('classic')}>
            ⚡ CHẾ ĐỘ CỔ ĐIỂN
          </button>
          <button className={`tab-btn ${activeTab==='overload' ? 'active overload' : ''}`} onClick={() => handleTabClick('overload')}>
            🔥 CHẾ ĐỘ OVERLOAD
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="scroll-content">

        {/* ===== CLASSIC ===== */}
        {activeTab === 'classic' && (
          <div className="instr-body">

            <div className="instr-mode-banner classic-banner">
              <div className="instr-banner-left">
                <div className="instr-banner-title">⚡ CLASSIC MODE</div>
                <div className="instr-banner-sub">Dọn sạch bàn cờ — Chiến thắng tối thượng!</div>
              </div>
              <div className="instr-banner-stats">
                <span>🎴 Tối đa 21 loại</span>
                <span>⏱ 200–400 giây</span>
                <span>🔀 1–5 lần đổi</span>
              </div>
            </div>

            {/* Inline JSX illustration */}
            <div className="instr-illustration instr-illustration-jsx">
              <ClassicIllustration />
              <div className="instr-img-caption">
                🎮 3 bước đơn giản: Chọn — Nối — Ghi điểm!
              </div>
            </div>

            <div className="instr-cards-grid">
              <div className="instr-card">
                <div className="instr-card-icon">🎯</div>
                <div className="instr-card-body">
                  <div className="instr-card-title">Mục tiêu</div>
                  <div className="instr-card-text">Ghép cặp và xóa <strong>toàn bộ</strong> quân cờ trên lưới trước khi hết giờ.</div>
                </div>
              </div>
              <div className="instr-card">
                <div className="instr-card-icon">🔗</div>
                <div className="instr-card-body">
                  <div className="instr-card-title">Quy tắc nối</div>
                  <div className="instr-card-text">Đường nối <strong>≤ 2 góc cua</strong>. Được đi vòng ngoài viền lưới.</div>
                </div>
              </div>
              <div className="instr-card">
                <div className="instr-card-icon">📊</div>
                <div className="instr-card-body">
                  <div className="instr-card-title">Tính điểm</div>
                  <div className="instr-card-text">Đúng <span className="tag green">+10</span> &nbsp; Sai <span className="tag red">−5</span></div>
                </div>
              </div>
              <div className="instr-card">
                <div className="instr-card-icon">🔀</div>
                <div className="instr-card-body">
                  <div className="instr-card-title">Đổi hình</div>
                  <div className="instr-card-text">Bí nước đi → nhấn <strong>Đổi hình</strong>. Hết nước đi tự xáo trộn miễn phí.</div>
                </div>
              </div>
            </div>

            <div className="instr-card instr-card-wide">
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <span style={{ fontSize:'18px' }}>⚙️</span>
                <span className="instr-card-title" style={{ margin:0 }}>CÁC MỨC ĐỘ</span>
              </div>
              <div className="instr-difficulty-row">
                <span className="diff-badge easy">🌿 DỄ — 5 loại · 400 giây · 5 lần đổi</span>
                <span className="diff-badge normal">🔥 TRUNG BÌNH — 15 loại · 300 giây · 3 lần đổi</span>
                <span className="diff-badge hard">💀 KHÓ — 21 loại · 200 giây · 1 lần đổi</span>
              </div>
            </div>

          </div>
        )}

        {/* ===== OVERLOAD ===== */}
        {activeTab === 'overload' && (
          <div className="instr-body">

            <div className="instr-mode-banner overload-banner">
              <div className="instr-banner-left">
                <div className="instr-banner-title">🔥 OVERLOAD MODE</div>
                <div className="instr-banner-sub">Sinh tồn — Giữ áp lực trên 0% để tồn tại!</div>
              </div>
              <div className="instr-banner-stats">
                <span>⚡ Áp lực giảm liên tục</span>
                <span>🌊 Wave tăng 10–20s</span>
                <span>💀 0% = Thua ngay</span>
              </div>
            </div>

            {/* Inline JSX illustration */}
            <div className="instr-illustration instr-illustration-jsx">
              <OverloadIllustration />
              <div className="instr-img-caption">
                ⚡ Giữ thanh xanh — Dùng tile đặc biệt — Chặn virus lây lan!
              </div>
            </div>

            <div className="instr-cards-grid">
              <div className="instr-card">
                <div className="instr-card-icon">⚡</div>
                <div className="instr-card-body">
                  <div className="instr-card-title">Thanh Áp lực</div>
                  <div className="instr-card-text">
                    Ghép cờ hồi: <span className="tag green">+3%</span> thường · <span className="tag cyan">+5%</span> xa &gt;4 ô · <span className="tag gold">+8%</span> Combo
                  </div>
                </div>
              </div>
              <div className="instr-card">
                <div className="instr-card-icon">🦠</div>
                <div className="instr-card-body">
                  <div className="instr-card-title">Virus lây lan</div>
                  <div className="instr-card-text">
                    <span className="tag orange">Cam</span> chưa nhiễm → <span className="tag purple">Tím</span> nhiễm: <strong>−15đ, −15%!</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="instr-card instr-card-wide">
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                <span style={{ fontSize:'18px' }}>📈</span>
                <span className="instr-card-title" style={{ margin:0 }}>3 GIAI ĐOẠN TĂNG KHÓ</span>
              </div>
              <div className="instr-phase-row">
                <div className="phase-item phase-1">
                  <strong>Giai đoạn 1</strong>
                  <span>0 – 90 giây</span>
                  <small>Wave mỗi 20s · 2 cặp</small>
                </div>
                <div className="phase-arrow">▶</div>
                <div className="phase-item phase-2">
                  <strong>Giai đoạn 2</strong>
                  <span>90 – 180 giây</span>
                  <small>Wave mỗi 15s · 3 cặp</small>
                </div>
                <div className="phase-arrow">▶</div>
                <div className="phase-item phase-3">
                  <strong>Giai đoạn 3</strong>
                  <span>180+ giây</span>
                  <small>Wave mỗi 10s · 4 cặp</small>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      <div style={{ display:'flex', justifyContent:'center', marginTop:'10px', flexShrink:0 }}>
        <button className="menu-btn btn-back" onClick={handleBack} style={{ width:'200px' }}>
          ← QUAY LẠI
        </button>
      </div>

    </div>
  );
}
