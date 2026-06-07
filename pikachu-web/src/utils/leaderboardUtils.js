// Tách các helper functions ra file riêng để tránh warning react-refresh
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

export function addLeaderboardEntry(category, name, score, time) {
  const all = getLeaderboardEntries();
  if (!all[category]) all[category] = [];
  all[category].push({ name: name.toUpperCase(), score, time });
  all[category].sort((a, b) => b.score !== a.score ? b.score - a.score : a.time - b.time);
  all[category] = all[category].slice(0, 10);
  localStorage.setItem('pikachu_leaderboard', JSON.stringify(all));
}

export function leaderboardNameExists(category, name) {
  const all = getLeaderboardEntries();
  if (!all[category]) return false;
  return all[category].some(e => e.name.trim().toUpperCase() === name.trim().toUpperCase());
}

export { pikachuAudio };
