import React, { useEffect, useRef, useState } from 'react';
import { pikachuAudio } from '../utils/pikachuAudio';

/* ===== Particle System ===== */
function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => createParticle(canvas));

    function createParticle(c) {
      return {
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6,
        opacity: Math.random() * 0.6 + 0.2,
        color: Math.random() > 0.5 ? '#ffcc00' : '#00e5ff',
        pulse: Math.random() * Math.PI * 2,
      };
    }

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.03;
        const o = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = o;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [canvasRef]);
}

/* ===== Lightning bolt SVG element ===== */
function LightningBolt({ style }) {
  return (
    <svg viewBox="0 0 40 100" style={{ position: 'absolute', opacity: 0.15, ...style }} fill="#ffcc00">
      <polygon points="25,0 10,45 22,45 15,100 35,40 22,40" />
    </svg>
  );
}

/* ===== Single Menu Button ===== */
function MenuButton({ icon, label, onClick, gradient, glow, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      className="home-menu-btn"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: gradient,
        boxShadow: hovered ? `0 0 28px 4px ${glow}, 0 4px 24px rgba(0,0,0,0.5)` : `0 0 12px 1px ${glow}55, 0 4px 16px rgba(0,0,0,0.4)`,
        transform: hovered ? 'translateX(10px) scale(1.03)' : 'translateX(0) scale(1)',
        animationDelay: `${delay}s`,
      }}
    >
      <span className="home-menu-btn-icon">{icon}</span>
      <span className="home-menu-btn-label">{label}</span>
      <span className="home-menu-btn-arrow" style={{ opacity: hovered ? 1 : 0 }}>›</span>
    </button>
  );
}

/* ===== HOME SCREEN COMPONENT ===== */
export default function HomeScreen({ onNavigate, onSettings, onAccount }) {
  const canvasRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  useParticles(canvasRef);

  useEffect(() => {
    // Trigger mount animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const nav = (target) => {
    pikachuAudio.playSound('click');
    onNavigate(target);
  };

  return (
    <div className="home-fullscreen">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="home-particle-canvas" />

      {/* Background decorative bolts */}
      <LightningBolt style={{ left: '3%', top: '10%', width: 28, height: 70, transform: 'rotate(-15deg)' }} />
      <LightningBolt style={{ right: '4%', top: '30%', width: 22, height: 55, transform: 'rotate(10deg)' }} />
      <LightningBolt style={{ left: '8%', bottom: '15%', width: 20, height: 50, transform: 'rotate(20deg)', opacity: 0.08 }} />
      <LightningBolt style={{ right: '10%', bottom: '10%', width: 30, height: 75, transform: 'rotate(-5deg)', opacity: 0.1 }} />

      {/* Hex grid overlay */}
      <div className="home-hex-grid" />

      {/* === LEFT PANEL: Hero artwork === */}
      <div className={`home-hero ${mounted ? 'home-hero--visible' : ''}`}>
        {/* Glow behind pikachu */}
        <div className="home-hero-glow" />

        <img
          src="/icon/pikachu.png"
          alt="Pikachu"
          className="home-hero-img"
        />

        {/* Electric sparks */}
        <div className="home-spark home-spark--1">⚡</div>
        <div className="home-spark home-spark--2">⚡</div>
        <div className="home-spark home-spark--3">✦</div>

        {/* Tagline under pikachu */}
        <div className="home-hero-tagline">
          <span className="home-hero-badge">✦ Trò Chơi Kinh Điển ✦</span>
        </div>
      </div>

      {/* === RIGHT PANEL: Title + Menu === */}
      <div className={`home-menu-panel ${mounted ? 'home-menu-panel--visible' : ''}`}>

        {/* TITLE BLOCK */}
        <div className="home-title-block">
          <div className="home-title-eyebrow">⚡ POKEMON MATCHING GAME ⚡</div>
          <h1 className="home-title-main">
            <span className="home-title-pika">PIKA</span>
            <span className="home-title-chu">CHU</span>
          </h1>
          <div className="home-title-sub">Thử Thách Trí Tuệ &amp; Sự Nhanh Mắt</div>
          <div className="home-title-divider">
            <span />
            <span className="home-title-divider-icon">⬡</span>
            <span />
          </div>
        </div>

        {/* MENU BUTTONS */}
        <nav className="home-nav">
          <MenuButton
            icon="⚡"
            label="CHƠI CỔ ĐIỂN"
            onClick={() => nav('DIFFICULTY')}
            gradient="linear-gradient(135deg, #1a6b20 0%, #27a234 60%, #39d44a 100%)"
            glow="#27a234"
            delay={0.05}
          />
          <MenuButton
            icon="🔥"
            label="PIKACHU OVERLOAD"
            onClick={() => nav('GAME_OVERLOAD')}
            gradient="linear-gradient(135deg, #5a0d8a 0%, #8b1fc9 60%, #b04df0 100%)"
            glow="#a040e0"
            delay={0.1}
          />
          <MenuButton
            icon="🏆"
            label="BẢNG XẾP HẠNG"
            onClick={() => nav('RANK')}
            gradient="linear-gradient(135deg, #8a5a00 0%, #c98200 60%, #ffaa00 100%)"
            glow="#ffaa00"
            delay={0.15}
          />
          <MenuButton
            icon="📖"
            label="HƯỚNG DẪN"
            onClick={() => nav('INSTRUCTIONS')}
            gradient="linear-gradient(135deg, #0d3d8a 0%, #1060c9 60%, #3399ff 100%)"
            glow="#2277ee"
            delay={0.2}
          />
          <MenuButton
            icon="👤"
            label="TÀI KHOẢN &amp; THÀNH TỰU"
            onClick={() => { pikachuAudio.playSound('click'); onAccount(); }}
            gradient="linear-gradient(135deg, #0a3040 0%, #0d5065 60%, #00b8d9 100%)"
            glow="#00b8d9"
            delay={0.25}
          />
          <div className="home-nav-row-small">
            <button className="home-btn-small home-btn-settings"
              onClick={() => { pikachuAudio.playSound('click'); onSettings(); }}>
              ⚙️ Cài Đặt
            </button>
            <button className="home-btn-small home-btn-exit"
              onClick={() => { pikachuAudio.playSound('click'); if (window.confirm('Thoát trò chơi?')) window.close(); }}>
              🚪 Thoát
            </button>
          </div>
        </nav>

        {/* Version badge */}
        <div className="home-version-badge">v2.0 — Classic &amp; Overload Edition</div>
      </div>
    </div>
  );
}
