import React, { useState } from 'react';
import { pikachuAudio } from '../utils/pikachuAudio';

export default function Instructions({ onBack }) {
  const [activeTab, setActiveTab] = useState('classic');

  const classicText = `HƯỚNG DẪN CHẾ ĐỘ CỔ ĐIỂN (CLASSIC MODE)

1. Mục tiêu tối thượng:
   Ghép cặp và xóa sạch toàn bộ các quân Pikachu giống nhau trên lưới để giành chiến thắng.

2. Quy tắc nối cờ Pikachu:
   - Hai quân cờ giống nhau chỉ được xóa nếu có thể kết nối với nhau bằng một đường đi.
   - Đường đi kết nối tối đa chỉ được chứa 3 đoạn thẳng thẳng đứng/ngang (không quá 2 góc cua).
   - Đường nối có thể đi vòng ra bên ngoài viền của lưới chơi.

3. Lựa chọn chế độ chơi:
   ● Dễ : 5 loại Pikachu • Thời gian 400 giây • Hỗ trợ 5 lần đổi hình.
   ● Trung bình : 15 loại Pikachu • Thời gian 300 giây • Hỗ trợ 3 lần đổi hình.
   ● Khó : 21 loại Pikachu • Thời gian 200 giây • Hỗ trợ 1 lần đổi hình.

4. Các tính năng trợ giúp & Quy tắc điểm:
   ● Nút Đổi hình: Xáo trộn ngẫu nhiên vị trí các cờ khi bị bí nước đi (giới hạn theo chế độ).
   ● Tự động xáo trộn: Khi lưới hết sạch nước đi hợp lệ mà cờ vẫn còn, game sẽ tự xáo trộn miễn phí.
   ● Cách tính điểm: Ghép đúng cặp được cộng 10 điểm. Ghép sai bị trừ 5 điểm.
   ● Đồng hồ thời gian: Thời gian chạy thực tế theo giây, không cộng thêm giây khi ghép đúng.`;

  const overloadText = `HƯỚNG DẪN CHẾ ĐỘ SINH TỒN OVERLOAD (SURVIVAL MODE)

1. Quy tắc cốt lõi mới:
   Đây là chế độ puzzle chiến thuật sinh tồn tốc độ cao. Bạn KHÔNG cần phải dọn sạch bàn cờ.
   Mục tiêu duy nhất là giữ bàn cờ không bị tràn và sinh tồn càng lâu càng tốt để ghi điểm kỷ lục!

2. Hệ thống Áp lực (Pressure System):
   - Thanh năng lượng hiển thị mức độ áp lực hiện tại (Pressure), luôn suy hao tự động mỗi giây.
   - Nếu bạn dừng ghép cờ quá lâu (nhàn rỗi), áp lực sẽ bị tụt cực kỳ nhanh (Phạt nhàn rỗi)!
   - Khớp cặp cờ giúp hồi lại Pressure. Khớp cờ thường hồi 3% Pressure, cự ly xa (>4 ô) hồi 5%, và Combo hồi 8%.
   - Mỗi ô nhiễm độc màu Tím (Corrupted) trên bàn cờ để càng lâu sẽ làm thanh Pressure tụt càng dồn dập (Dưới 10s: trừ 1%/s; 10-20s: trừ 3%/s; Trên 20s: trừ 6%/s!).
   ✕ Nếu Pressure chạm mức 0%, hệ thống sụp đổ ngay lập tức và bạn THUA CUỘC!

3. Độ khó tăng dần theo 3 Giai đoạn (Dynamic Scaling):
   ● Giai đoạn 1 (0 - 90 giây) - Khởi động: Wave mới sau mỗi 20 giây (sinh 2 cặp). Áp lực giảm chậm. Phạt nhàn rỗi sau 10 giây. Chu kỳ lây lan virus là 18 giây.
   ● Giai đoạn 2 (90 - 180 giây) - Tăng tốc: Wave mới sau mỗi 15 giây (sinh 3 cặp). Áp lực giảm nhanh hơn. Phạt nhàn rỗi sau 8 giây. Chu kỳ lây lan virus là 14 giây.
   ● Giai đoạn 3 (Trên 180 giây) - Quá tải: Wave mới dồn dập sau mỗi 10 giây (sinh 4 cặp). Áp lực giảm cực nhanh. Phạt nhàn rỗi sau 6 giây. Chu kỳ lây lan virus là 10 giây.

4. Các quân cờ chiến thuật đặc biệt (Special Tiles):
   ● Energy Tile (Hào quang Xanh Lá): Hồi 15% Pressure và thanh tẩy toàn bộ các quân cờ đang nhấp nháy cam (Unstable) trên bàn cờ trở về trạng thái lành tính.
   ● Freeze Tile (Hào quang Xanh Cyan): Đóng băng thời gian, ngăn áp lực sụt giảm và tạm dừng lây lan/lão hóa virus trong 5 giây.
   ● Bomb Tile (Hào quang Đỏ): Kích nổ dọn sạch vùng 3x3 xung quanh hoàn toàn an toàn (không bị phạt điểm, không trừ áp lực).

5. Cơ chế Lão hóa & Lây lan dịch bệnh:
   - Cờ để quá lâu trên lưới sẽ nhấp nháy viền màu Cam (Unstable) báo hiệu bị nhiễm virus.
   - Virus từ ô Unstable/Corrupted sẽ tự động lây lan đồng loạt ra cả 4 hướng (trên, dưới, trái, phải) theo chu kỳ.
   - Nếu để quá hạn, cờ Unstable chuyển sang viền màu Tím độc hại (Corrupted). Khớp cặp cờ Corrupted sẽ bị TRỪ 15 ĐIỂM và TRỪ 15% PRESSURE!
   - Ngăn chặn trick cô lập: Trò chơi duy trì tối thiểu 1 ổ dịch ở Giai đoạn 1 và 2 ổ dịch ở Giai đoạn 2 & 3. Nếu người chơi tiêu diệt bớt (chỉ giữ lại 1 ổ), hệ thống sẽ đếm ngược 10 giây và tự động bổ sung ổ dịch mới cách xa ổ cũ.`;

  const handleTabClick = (tab) => {
    pikachuAudio.playSound('click');
    setActiveTab(tab);
  };

  const handleBack = () => {
    pikachuAudio.playSound('click');
    onBack();
  };

  return (
    <div className="panel instructions-screen">
      <div className="instructions-header">
        <h2 className="title-main" style={{ fontSize: '32px' }}>HƯỚNG DẪN CHƠI</h2>
        <div className="tab-bar">
          <button 
            className={`tab-btn ${activeTab === 'classic' ? 'active classic' : ''}`}
            onClick={() => handleTabClick('classic')}
          >
            CHẾ ĐỘ CỔ ĐIỂN
          </button>
          <button 
            className={`tab-btn ${activeTab === 'overload' ? 'active overload' : ''}`}
            onClick={() => handleTabClick('overload')}
          >
            CHẾ ĐỘ OVERLOAD
          </button>
        </div>
      </div>
      
      <div className="scroll-content">
        {activeTab === 'classic' ? classicText : overloadText}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="menu-btn btn-back" onClick={handleBack}>
          QUAY LẠI
        </button>
      </div>
    </div>
  );
}
