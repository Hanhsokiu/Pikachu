import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Kiểm tra URL hợp lệ trước khi tạo client
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const canConnect = isValidUrl(supabaseUrl) && supabaseAnonKey.length > 10;

let supabase = null;
if (canConnect) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Supabase createClient failed:', err.message);
    supabase = null;
  }
}

export { supabase };

if (!supabase) {
  console.warn('Supabase not configured. Running in Offline (Local Fallback) mode.');
}


// Check if online mode is active
export const isOnline = () => {
  return supabase !== null;
};

// --- AUTHENTICATION HELPERS ---

export const signUpUser = async (email, password, displayName) => {
  if (!isOnline()) throw new Error("Offline Mode: Không có kết nối mạng.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });
  if (error) throw error;
  return data;
};

export const signInUser = async (email, password) => {
  if (!isOnline()) throw new Error("Offline Mode: Không có kết nối mạng.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  if (!isOnline()) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  if (!isOnline()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthChange = (callback) => {
  if (!isOnline()) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return () => subscription.unsubscribe();
};

// --- LEADERBOARD HELPERS ---

export const fetchOnlineLeaderboard = async (category) => {
  if (!isOnline()) return [];
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('category', category)
      .order('score', { ascending: false })
      .order('elapsed_time', { ascending: true })
      .limit(100);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Lỗi tải bảng xếp hạng online:", err);
    return [];
  }
};

export const addOnlineScore = async (playerName, score, elapsedTime, category) => {
  if (!isOnline()) return false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('leaderboard')
      .insert({
        player_name: playerName,
        score,
        elapsed_time: elapsedTime,
        category,
        user_id: user?.id || null
      });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Lỗi gửi điểm online:", err);
    return false;
  }
};

// --- ACHIEVEMENTS SYSTEM (UNIFIED ONLINE/OFFLINE) ---

export const ALL_ACHIEVEMENTS = [
  { id: 'first_win', name: 'Người Mới Bắt Đầu', desc: 'Thắng một ván chơi Classic bất kỳ.', icon: '🏆' },
  { id: 'combo_5', name: 'Chiến Thần Tốc Độ', desc: 'Đạt Combo x5 trong chế độ Overload.', icon: '⚡' },
  { id: 'survive_120', name: 'Kẻ Sống Sót', desc: 'Sinh tồn được 120 giây trong Overload.', icon: '🛡️' },
  { id: 'score_500', name: 'Vua Pikachu', desc: 'Đạt trên 500 điểm ở chế độ bất kỳ.', icon: '👑' },
  { id: 'cleanse_all', name: 'Kẻ Dọn Dẹp', desc: 'Dọn sạch toàn bộ bàn cờ trong Overload.', icon: '🧹' }
];

export const getLocalAchievements = () => {
  try {
    const saved = localStorage.getItem('pikachu_achievements');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

export const saveLocalAchievements = (list) => {
  localStorage.setItem('pikachu_achievements', JSON.stringify(list));
};

export const fetchAchievements = async () => {
  const localList = getLocalAchievements();
  if (!isOnline()) {
    return localList;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localList;

    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id');
      
    if (error) throw error;
    
    const onlineIds = data.map(item => item.achievement_id);
    // Trộn lẫn thành tựu cục bộ và online để đồng bộ hóa
    const merged = Array.from(new Set([...localList, ...onlineIds]));
    
    // Nếu có thành tựu local chưa được đẩy lên, đồng bộ hóa lên database
    const toSync = localList.filter(id => !onlineIds.includes(id));
    for (const id of toSync) {
      await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: id })
        .maybeSingle(); // Bỏ qua nếu đã tồn tại
    }
    
    saveLocalAchievements(merged);
    return merged;
  } catch (err) {
    console.error("Lỗi đồng bộ thành tựu:", err);
    return localList;
  }
};

export const unlockAchievement = async (achievementId) => {
  // 1. Cập nhật cục bộ
  const localList = getLocalAchievements();
  if (localList.includes(achievementId)) return false; // Đã mở khóa trước đó
  
  const newList = [...localList, achievementId];
  saveLocalAchievements(newList);
  
  // 2. Cập nhật online nếu đã đăng nhập
  if (isOnline()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievementId
          });
      }
    } catch (err) {
      console.error("Lỗi lưu thành tựu online:", err);
    }
  }
  return true; // Trả về true để thông báo UI mở khóa thành tựu mới!
};
