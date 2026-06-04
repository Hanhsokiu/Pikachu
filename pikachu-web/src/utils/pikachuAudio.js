let bgmVolume = parseFloat(localStorage.getItem('pikachu_bgm_volume') ?? '0.4');
let sfxVolume = parseFloat(localStorage.getItem('pikachu_sfx_volume') ?? '0.8');
let isMuted = localStorage.getItem('pikachu_muted') === 'true';

// Khởi tạo đối tượng Audio cho nhạc nền
const bgMusic = new Audio('/sounds/background.mp3');
bgMusic.loop = true;
bgMusic.volume = isMuted ? 0 : bgmVolume;

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
  getBGMVolume: () => bgmVolume,
  getSFXVolume: () => sfxVolume,
  
  setBGMVolume: (vol) => {
    bgmVolume = vol;
    localStorage.setItem('pikachu_bgm_volume', String(vol));
    if (!isMuted) {
      bgMusic.volume = vol;
    }
  },
  
  setSFXVolume: (vol) => {
    sfxVolume = vol;
    localStorage.setItem('pikachu_sfx_volume', String(vol));
  },
  
  toggleMute: () => {
    isMuted = !isMuted;
    localStorage.setItem('pikachu_muted', String(isMuted));
    if (isMuted) {
      bgMusic.volume = 0;
      bgMusic.pause();
    } else {
      bgMusic.volume = bgmVolume;
      bgMusic.play().catch(err => {
        console.warn('BGM play error (requires user interaction first):', err);
      });
    }
    return isMuted;
  },
  
  playBGM: () => {
    if (!isMuted) {
      bgMusic.volume = bgmVolume;
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
      sound.volume = sfxVolume;
      sound.play().catch(err => {
        console.warn('Sound effect play error:', err);
      });
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }
};
