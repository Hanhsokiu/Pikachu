package pikachu.view;

import javax.swing.JComponent;
import java.awt.*;

public class ModernProgressBar extends JComponent {
    private double targetValue = 100.0;
    private double currentValue = 100.0;
    private double maxValue = 100.0;
    private javax.swing.Timer animTimer;

    public ModernProgressBar(double max) {
        this.maxValue = max;
        this.currentValue = max;
        this.targetValue = max;
        setPreferredSize(new Dimension(100, 16));
        
        // Bộ đếm thời gian cập nhật mượt mà 60 FPS
        animTimer = new javax.swing.Timer(16, e -> {
            if (Math.abs(currentValue - targetValue) > 0.05) {
                // Di chuyển dần dần bằng nội suy tuyến tính (Linear Interpolation)
                currentValue += (targetValue - currentValue) * 0.08;
                repaint();
            } else if (currentValue != targetValue) {
                currentValue = targetValue;
                repaint();
            }
        });
        animTimer.start();
    }

    public void setValue(double val) {
        this.targetValue = Math.max(0, Math.min(maxValue, val));
    }

    public void setMaxValue(double max) {
        this.maxValue = max;
        repaint();
    }

    // Dummy method để tránh lỗi biên dịch khi có code gọi setForeground
    @Override
    public void setForeground(Color fg) {
        super.setForeground(fg);
        repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int w = getWidth();
        int h = getHeight();
        int arc = h; // Dạng viên thuốc bo tròn 100%

        // 1. Vẽ nền thanh trượt (Track) có bóng mờ tối
        g2.setColor(new Color(20, 24, 33, 200));
        g2.fillRoundRect(0, 0, w, h, arc, arc);

        g2.setColor(new Color(48, 58, 78));
        g2.setStroke(new BasicStroke(1.2f));
        g2.drawRoundRect(0, 0, w - 1, h - 1, arc, arc);

        // 2. Tính toán độ rộng của thanh năng lượng dựa trên giá trị currentValue trơn tru
        double pct = currentValue / maxValue;
        int barW = (int) (w * pct);

        if (barW > 0) {
            // Đảm bảo vẽ tròn đầy đặn
            if (barW < h) {
                barW = h;
            }
            if (barW > w) {
                barW = w;
            }

            // Màu dải màu gradient từ năng lượng cao đến thấp
            Color colorStart, colorEnd;
            if (pct <= 0.25) {
                // Điện đỏ (Electric Red)
                colorStart = new Color(255, 23, 68);
                colorEnd = new Color(180, 0, 30);
            } else if (pct <= 0.55) {
                // Cam Neon
                colorStart = new Color(255, 145, 0);
                colorEnd = new Color(200, 80, 0);
            } else {
                // Xanh lục Neon sáng
                colorStart = new Color(0, 230, 118);
                colorEnd = new Color(0, 160, 60);
            }

            // Đổ màu Gradient tuyến tính tinh tế
            GradientPaint gp = new GradientPaint(0, 0, colorStart, barW, 0, colorEnd);
            g2.setPaint(gp);
            g2.fillRoundRect(0, 0, barW, h, arc, arc);

            // 3. Phủ một lớp ánh kính bóng bẩy ở nửa trên (Glossy glass overlay)
            g2.setPaint(new GradientPaint(0, 0, new Color(255, 255, 255, 75), 0, h / 2, new Color(255, 255, 255, 0)));
            g2.fillRoundRect(0, 0, barW, h / 2, arc, arc);
        }
    }
}
