package pikachu;

import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import pikachu.view.MainFrame;

/**
 * Class chính để khởi động game Pikachu
 */
public class Main {
    public static void main(String[] args) {
        // Chạy trên Event Dispatch Thread để đảm bảo thread-safe
        SwingUtilities.invokeLater(() -> {
            try {
                // Sử dụng Look and Feel của hệ thống
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                System.err.println("Không thể set Look and Feel: " + e.getMessage());
            }

            // Khởi tạo MainFrame
            new MainFrame();
        });
    }
}