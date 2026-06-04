let isMuted = localStorage.getItem('pikachu_muted') === 'true';

// Khởi tạo đối tượng Audio cho nhạc nền
const bgMusic = new Audio('/sounds/background.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5; // Giảm âm lượng nhạc nền xuống vừa phải

const soundExtensions = {
  click: 'mp3',
  match: 'wav',
  win: 'wav',
  wrong: 'wav',
  freeze: 'wav',
  bomb: 'mp3',
  lose: 'wav'
};

export const pikachuAudio = {
  isMuted: () => isMuted,
  
  toggleMute: () => {
    isMuted = !isMuted;
    localStorage.setItem('pikachu_muted', String(isMuted));
    if (isMuted) {
      bgMusic.pause();
    } else {
      bgMusic.play().catch(err => {
        console.warn('BGM play error (requires user interaction first):', err);
      });
    }
    return isMuted;
  },
  
  playBGM: () => {
    if (!isMuted) {
      bgMusic.play().catch(err => {
        console.warn('BGM play error (requires user interaction first):', err);
      });
    }
  },
  
  stopBGM: () => {
    bgMusic.pause();
  },
  
  playSound: (soundName) => {
    if (isMuted) return;
    try {
      const ext = soundExtensions[soundName] || 'mp3';
      const sound = new Audio(`/sounds/${soundName}.${ext}`);
      sound.volume = 0.8;
      sound.play().catch(err => {
        console.warn('Sound effect play error:', err);
      });
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }
};
