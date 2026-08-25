package pikachu.view;

import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import javax.swing.border.*;

import pikachu.controller.Controller;
import pikachu.util.Sound;

public class MainFrame extends JFrame implements ActionListener, Runnable {

    // --- Game state ---
    private int row = 8;
    private int col = 8;
    private int difficulty = 1;
    private int maxShuffles = 3;
    private int remainingShuffles = 3;
    private int maxTime = 300;
    private int time = maxTime;

    // --- Game components ---
    private ButtonEvent graphicsPanel;
    private JPanel gamePanelWrapper;   // CENTER of game screen, holds ButtonEvent
    private JPanel mainPanel;          // The permanent game screen (BorderLayout: game + control)

    // --- HUD controls (created once) ---
    private JLabel lbScore;
    private ModernProgressBar progressTime;
    private JLabel lbTimeText;
    private JLabel lbShuffles;
    private JButton btnShuffle;
    private JButton btnMute;
    private JButton btnNewGame;
    private JButton btnHome;

    // --- Overload Mode HUD Controls ---
    private JLabel lbTimeTitle;
    private JLabel lbWaveTitle;
    private JLabel lbNextWave;
    private JLabel lbSurvivalTitle;
    private JLabel lbSurvivalTime;
    private JLabel lbComboTitle;
    private JLabel lbComboText;
    private boolean isOverloadMode = false;
    private OverloadButtonEvent overloadGraphicsPanel;
    private JPanel rankPanel;
    private String currentRankCategory = "classic_easy";
    
    // --- Rule tabs references ---
    private JButton btnClassicRulesRef;
    private JButton btnOverloadRulesRef;

    // --- Card layout ---
    private CardLayout cardLayout;
    private JPanel cardPanel;

    // --- Timer thread ---
    private volatile boolean running = false;
    private volatile boolean isPaused = false;
    private Thread timeThread;
    private long startTime;

    private final Sound sound = new Sound();

    // ==================== CONSTRUCTOR ====================
    public MainFrame() {
        setTitle("Pikachu Classic - Trở Thành Bậc Thầy");
        setResizable(false);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        cardLayout = new CardLayout();
        cardPanel  = new JPanel(cardLayout);

        // Build each screen — GAME screen created ONCE here
        cardPanel.add(createHomeScreen(),         "HOME");
        cardPanel.add(createDifficultyScreen(),   "DIFFICULTY");
        cardPanel.add(createInstructionsScreen(), "INSTRUCTIONS");
        cardPanel.add(createOverloadMenuScreen(), "OVERLOAD_MENU"); // Đăng ký menu Overload mới
        rankPanel = createRankScreen();
        cardPanel.add(rankPanel,                  "RANK");
        cardPanel.add(createGameScreen(),         "GAME");  // permanent, never removed

        add(cardPanel);
        cardLayout.show(cardPanel, "HOME");

        setSize(700, 540);
        setLocationRelativeTo(null);
        setVisible(true);

        sound.playLoop("background.wav");
    }

    // ==================== HOME SCREEN ====================
    private JPanel createHomeScreen() {
        JPanel p = new JPanel();
        p.setBackground(new Color(18, 22, 32));
        p.setLayout(new BoxLayout(p, BoxLayout.Y_AXIS));
        p.setBorder(new EmptyBorder(30, 70, 30, 70));

        JLabel title = label("PIKACHU CLASSIC", new Font("Segoe UI", Font.BOLD, 44), new Color(255, 204, 0));
        JLabel sub   = label("Thử Thách Trí Tuệ & Sự Nhanh Mắt", new Font("Segoe UI", Font.ITALIC, 15), new Color(150, 165, 190));
        title.setAlignmentX(CENTER_ALIGNMENT);
        sub.setAlignmentX(CENTER_ALIGNMENT);

        JLabel logo = scaledIcon("/icon/pikachu.png", 110);
        logo.setAlignmentX(CENTER_ALIGNMENT);

        JButton btnPlay     = menuBtn("CHƠI CỔ ĐIỂN", new Color(39, 120, 44), new Color(55, 148, 60));
        JButton btnOverload = menuBtn("PIKACHU OVERLOAD", new Color(110, 40, 160), new Color(130, 50, 190));
        JButton btnRank     = menuBtn("XẾP HẠNG", new Color(255, 160, 0), new Color(255, 180, 30));
        JButton btnGuide    = menuBtn("HƯỚNG DẪN",  new Color(22, 96, 182),  new Color(28, 118, 210));
        JButton btnExit     = menuBtn("THOÁT GAME",  new Color(183, 33, 33), new Color(210, 48, 48));

        btnPlay .addActionListener(e -> cardLayout.show(cardPanel, "DIFFICULTY"));
        btnOverload.addActionListener(e -> cardLayout.show(cardPanel, "OVERLOAD_MENU"));
        btnRank.addActionListener(e -> showRankScreen());
        btnGuide.addActionListener(e -> showInstructions(false));
        btnExit .addActionListener(e -> System.exit(0));

        p.add(Box.createVerticalGlue());
        p.add(title);  p.add(gap(5));
        p.add(sub);    p.add(gap(15));
        p.add(logo);   p.add(gap(25));
        p.add(btnPlay);  p.add(gap(10));
        p.add(btnOverload); p.add(gap(10));
        p.add(btnRank); p.add(gap(10));
        p.add(btnGuide); p.add(gap(10));
        p.add(btnExit);
        p.add(Box.createVerticalGlue());
        return p;
    }

    // ==================== DIFFICULTY SCREEN ====================
    private JPanel createDifficultyScreen() {
        JPanel p = new JPanel();
        p.setBackground(new Color(18, 22, 32));
        p.setLayout(new BoxLayout(p, BoxLayout.Y_AXIS));
        p.setBorder(new EmptyBorder(25, 70, 25, 70));

        JLabel title = label("CHỌN CHẾ ĐỘ CHƠI", new Font("Segoe UI", Font.BOLD, 30), new Color(255, 204, 0));
        title.setAlignmentX(CENTER_ALIGNMENT);

        JButton bEasy   = menuBtn("DỄ",     new Color(45, 115, 48),  new Color(60, 142, 64));
        JButton bNormal = menuBtn("TRUNG BÌNH", new Color(175, 96, 8),   new Color(210, 118, 12));
        JButton bHard   = menuBtn("KHÓ",   new Color(163, 28, 28),  new Color(195, 42, 42));
        JButton bBack   = menuBtn("QUAY LẠI", new Color(78, 78, 90), new Color(100, 100, 115));

        bEasy  .addActionListener(e -> startNewGame(6,  6,  0, 400, 5));
        bNormal.addActionListener(e -> startNewGame(10, 10, 1, 300, 3));
        bHard  .addActionListener(e -> startNewGame(14, 14, 2, 210, 1));
        bBack  .addActionListener(e -> cardLayout.show(cardPanel, "HOME"));

        // Descriptions
        JLabel dEasy   = subLabel("5 loại hình  •  400 giây  •  5 lần đổi",   new Color(160, 200, 160));
        JLabel dNormal = subLabel("15 loại hình  •  300 giây  •  3 lần đổi",  new Color(210, 185, 130));
        JLabel dHard   = subLabel("21 loại hình  •  200 giây  •  1 lần đổi", new Color(215, 145, 145));

        p.add(Box.createVerticalGlue());
        p.add(title); p.add(gap(30));
        p.add(bEasy);   p.add(gap(3)); p.add(dEasy);   p.add(gap(16));
        p.add(bNormal); p.add(gap(3)); p.add(dNormal); p.add(gap(16));
        p.add(bHard);   p.add(gap(3)); p.add(dHard);   p.add(gap(26));
        p.add(bBack);
        p.add(Box.createVerticalGlue());
        return p;
    }

    // ==================== INSTRUCTIONS SCREEN ====================
    private JPanel createInstructionsScreen() {
        JPanel p = new JPanel(new BorderLayout(10, 14));
        p.setBackground(new Color(18, 22, 32));
        p.setBorder(new EmptyBorder(20, 32, 16, 32));

        JLabel title = label("HƯỚNG DẪN CHƠI", new Font("Segoe UI", Font.BOLD, 28), new Color(255, 204, 0));
        title.setHorizontalAlignment(JLabel.CENTER);

        // Thanh chọn chế độ (Tab Selection Panel)
        JPanel tabSelection = new JPanel(new GridLayout(1, 2, 12, 0));
        tabSelection.setOpaque(false);
        tabSelection.setBorder(new EmptyBorder(10, 0, 8, 0));

        btnClassicRulesRef = new JButton("CHẾ ĐỘ CỔ ĐIỂN");
        btnOverloadRulesRef = new JButton("CHẾ ĐỘ OVERLOAD");

        btnClassicRulesRef.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btnOverloadRulesRef.setFont(new Font("Segoe UI", Font.BOLD, 14));
        btnClassicRulesRef.setForeground(Color.WHITE);
        btnOverloadRulesRef.setForeground(new Color(150, 165, 190));
        btnClassicRulesRef.setBackground(new Color(39, 120, 44)); // Xanh lá cây (Classic)
        btnOverloadRulesRef.setBackground(new Color(40, 50, 65)); // Xám đậm
        btnClassicRulesRef.setFocusPainted(false);
        btnOverloadRulesRef.setFocusPainted(false);
        btnClassicRulesRef.setBorder(BorderFactory.createLineBorder(new Color(60, 75, 95), 1));
        btnOverloadRulesRef.setBorder(BorderFactory.createLineBorder(new Color(60, 75, 95), 1));
        btnClassicRulesRef.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnOverloadRulesRef.setCursor(new Cursor(Cursor.HAND_CURSOR));

        tabSelection.add(btnClassicRulesRef);
        tabSelection.add(btnOverloadRulesRef);

        JPanel northPanel = new JPanel(new BorderLayout(0, 4));
        northPanel.setOpaque(false);
        northPanel.add(title, BorderLayout.NORTH);
        northPanel.add(tabSelection, BorderLayout.SOUTH);
        p.add(northPanel, BorderLayout.NORTH);

        // Nội dung chi tiết quy tắc chơi
        String classicText = 
            "HƯỚNG DẪN CHẾ ĐỘ CỔ ĐIỂN (CLASSIC MODE)\n\n" +
            "1. Mục tiêu tối thượng:\n" +
            "   Ghép cặp và xóa sạch toàn bộ các quân Pikachu giống nhau trên lưới để giành chiến thắng.\n\n" +
            "2. Quy tắc nối cờ Pikachu:\n" +
            "   - Hai quân cờ giống nhau chỉ được xóa nếu có thể kết nối với nhau bằng một đường đi.\n" +
            "   - Đường đi kết nối tối đa chỉ được chứa 3 đoạn thẳng thẳng đứng/ngang (không quá 2 góc cua).\n" +
            "   - Đường nối có thể đi vòng ra bên ngoài viền của lưới chơi.\n\n" +
            "3. Lựa chọn chế độ chơi:\n" +
            "   ● Dễ         : 5 loại Pikachu  •  Thời gian 400 giây  •  Hỗ trợ 5 lần đổi hình.\n" +
            "   ● Trung bình : 15 loại Pikachu  •  Thời gian 300 giây  •  Hỗ trợ 3 lần đổi hình.\n" +
            "   ● Khó        : 21 loại Pikachu  •  Thời gian 200 giây  •  Hỗ trợ 1 lần đổi hình.\n\n" +
            "4. Các tính năng trợ giúp & Quy tắc điểm:\n" +
            "   ● Nút Đổi hình: Xáo trộn ngẫu nhiên vị trí các cờ khi bị bí nước đi (giới hạn theo chế độ).\n" +
            "   ● Tự động xáo trộn: Khi lưới hết sạch nước đi hợp lệ mà cờ vẫn còn, game sẽ tự xáo trộn miễn phí.\n" +
            "   ● Cách tính điểm: Ghép đúng cặp được cộng 10 điểm. Ghép sai bị trừ 5 điểm.\n" +
            "   ● Đồng hồ thời gian: Thời gian chạy thực tế theo giây, không cộng thêm giây khi ghép đúng.";

        String overloadText =
            "HƯỚNG DẪN CHẾ ĐỘ SINH TỒN OVERLOAD (SURVIVAL MODE)\n\n" +
            "1. Quy tắc cốt lõi mới:\n" +
            "   Đây là chế độ puzzle chiến thuật sinh tồn tốc độ cao. Bạn KHÔNG cần phải dọn sạch bàn cờ.\n" +
            "   Mục tiêu duy nhất là giữ bàn cờ không bị tràn và sinh tồn càng lâu càng tốt để ghi điểm kỷ lục!\n\n" +
            "2. Hệ thống Áp lực (Pressure System):\n" +
            "   - Thanh năng lượng hiển thị mức độ áp lực hiện tại (Pressure), luôn suy hao tự động mỗi giây.\n" +
            "   - Nếu bạn dừng ghép cờ quá lâu (nhàn rỗi), áp lực sẽ bị tụt cực kỳ nhanh (Phạt nhàn rỗi)!\n" +
            "   - Khớp cặp cờ giúp hồi lại Pressure. Khớp cờ thường hồi 3% Pressure, cự ly xa (>4 ô) hồi 5%, và Combo hồi 8%.\n" +
            "   - Mỗi ô nhiễm độc màu Tím (Corrupted) trên bàn cờ để càng lâu sẽ làm thanh Pressure tụt càng dồn dập (Dưới 10s: trừ 1%/s; 10-20s: trừ 3%/s; Trên 20s: trừ 6%/s!).\n" +
            "   ✕ Nếu Pressure chạm mức 0%, hệ thống sụp đổ ngay lập tức và bạn THUA CUỘC!\n\n" +
            "3. Độ khó tăng dần theo 3 Giai đoạn (Dynamic Scaling):\n" +
            "   ● Giai đoạn 1 (0 - 90 giây) - Khởi động: Wave mới sau mỗi 20 giây (sinh 2 cặp). Áp lực giảm chậm. Phạt nhàn rỗi sau 10 giây. Chu kỳ lây lan virus là 18 giây.\n" +
            "   ● Giai đoạn 2 (90 - 180 giây) - Tăng tốc: Wave mới sau mỗi 15 giây (sinh 3 cặp). Áp lực giảm nhanh hơn. Phạt nhàn rỗi sau 8 giây. Chu kỳ lây lan virus là 14 giây.\n" +
            "   ● Giai đoạn 3 (Trên 180 giây) - Quá tải: Wave mới dồn dập sau mỗi 10 giây (sinh 4 cặp). Áp lực giảm cực nhanh. Phạt nhàn rỗi sau 6 giây. Chu kỳ lây lan virus là 10 giây.\n\n" +
            "4. Các quân cờ chiến thuật đặc biệt (Special Tiles):\n" +
            "   ● Energy Tile (Hào quang Xanh Lá): Hồi 15% Pressure và thanh tẩy toàn bộ các quân cờ đang nhấp nháy cam (Unstable) trên bàn cờ trở về trạng thái lành tính.\n" +
            "   ● Freeze Tile (Hào quang Xanh Cyan): Đóng băng thời gian, ngăn áp lực sụt giảm và tạm dừng lây lan/lão hóa virus trong 5 giây.\n" +
            "   ● Bomb Tile (Hào quang Đỏ): Kích nổ dọn sạch vùng 3x3 xung quanh hoàn toàn an toàn (không bị phạt điểm, không trừ áp lực).\n\n" +
            "5. Cơ chế Lão hóa & Lây lan dịch bệnh:\n" +
            "   - Cờ để quá lâu trên lưới sẽ nhấp nháy viền màu Cam (Unstable) báo hiệu bị nhiễm virus.\n" +
            "   - Virus từ ô Unstable/Corrupted sẽ tự động lây lan đồng loạt ra cả 4 hướng (trên, dưới, trái, phải) theo chu kỳ.\n" +
            "   - Nếu để quá hạn, cờ Unstable chuyển sang viền màu Tím độc hại (Corrupted). Khớp cặp cờ Corrupted sẽ bị TRỪ 15 ĐIỂM và TRỪ 15% PRESSURE!\n" +
            "   - Ngăn chặn trick cô lập: Trò chơi duy trì tối thiểu 1 ổ dịch ở Giai đoạn 1 và 2 ổ dịch ở Giai đoạn 2 & 3. Nếu người chơi tiêu diệt bớt (chỉ giữ lại 1 ổ), hệ thống sẽ đếm ngược 10 giây và tự động bổ sung ổ dịch mới cách xa ổ cũ.";

        JTextArea txt = new JTextArea(classicText);
        txt.setBackground(new Color(26, 31, 43));
        txt.setForeground(new Color(210, 218, 232));
        txt.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        txt.setEditable(false);
        txt.setLineWrap(true);
        txt.setWrapStyleWord(true);
        txt.setMargin(new Insets(16, 20, 16, 20));

        JScrollPane scroll = new JScrollPane(txt);
        scroll.setBorder(BorderFactory.createLineBorder(new Color(50, 60, 80), 1));
        p.add(scroll, BorderLayout.CENTER);

        // Sự kiện chuyển Tab hướng dẫn
        btnClassicRulesRef.addActionListener(e -> {
            txt.setText(classicText);
            txt.setCaretPosition(0);
            btnClassicRulesRef.setBackground(new Color(39, 120, 44));
            btnClassicRulesRef.setForeground(Color.WHITE);
            btnOverloadRulesRef.setBackground(new Color(40, 50, 65));
            btnOverloadRulesRef.setForeground(new Color(150, 165, 190));
            sound.playSound("click.wav");
        });

        btnOverloadRulesRef.addActionListener(e -> {
            txt.setText(overloadText);
            txt.setCaretPosition(0);
            btnOverloadRulesRef.setBackground(new Color(110, 40, 160)); // Màu tím Overload
            btnOverloadRulesRef.setForeground(Color.WHITE);
            btnClassicRulesRef.setBackground(new Color(40, 50, 65));
            btnClassicRulesRef.setForeground(new Color(150, 165, 190));
            sound.playSound("click.wav");
        });

        JButton btnBack = menuBtn("QUAY LẠI", new Color(78, 78, 90), new Color(100, 100, 115));
        btnBack.setPreferredSize(new Dimension(290, 46));
        btnBack.addActionListener(e -> {
            // Reset về mặc định trước khi ra trang chủ
            txt.setText(classicText);
            btnClassicRulesRef.setBackground(new Color(39, 120, 44));
            btnClassicRulesRef.setForeground(Color.WHITE);
            btnOverloadRulesRef.setBackground(new Color(40, 50, 65));
            btnOverloadRulesRef.setForeground(new Color(150, 165, 190));
            cardLayout.show(cardPanel, "HOME");
        });
        JPanel row = new JPanel(); row.setOpaque(false); row.add(btnBack);
        p.add(row, BorderLayout.SOUTH);
        return p;
    }

    // ==================== GAME SCREEN (created ONCE) ====================
    private JPanel createGameScreen() {
        // gamePanelWrapper: LEFT area, will hold ButtonEvent centered
        gamePanelWrapper = new JPanel(new GridBagLayout());
        gamePanelWrapper.setBackground(new Color(26, 31, 42));

        // controlPanel: RIGHT sidebar, all HUD components created here
        JPanel ctrl = createControlPanel();

        mainPanel = new JPanel(new BorderLayout());
        mainPanel.setBackground(new Color(18, 22, 32));
        mainPanel.add(gamePanelWrapper, BorderLayout.CENTER);
        mainPanel.add(ctrl, BorderLayout.EAST);
        return mainPanel;
    }

    // ==================== CONTROL PANEL (right sidebar) ====================
    private JPanel createControlPanel() {
        // Score
        lbScore = new JLabel("0");
        lbScore.setFont(new Font("Segoe UI", Font.BOLD, 26));
        lbScore.setForeground(new Color(255, 204, 0));

        // Progress bar for time
        progressTime = new ModernProgressBar(100);
        progressTime.setValue(100);
        progressTime.setPreferredSize(new Dimension(95, 14));

        lbTimeText = new JLabel("00:00");
        lbTimeText.setFont(new Font("Consolas", Font.BOLD, 15));
        lbTimeText.setForeground(new Color(0, 230, 118));
        lbTimeText.setPreferredSize(new Dimension(50, 20));

        JPanel timePanel = new JPanel(new BorderLayout(8, 0));
        timePanel.setOpaque(false);
        timePanel.add(progressTime, BorderLayout.CENTER);
        timePanel.add(lbTimeText, BorderLayout.EAST);

        // Shuffle count
        lbShuffles = new JLabel("Đổi hình (" + remainingShuffles + ")");
        lbShuffles.setFont(new Font("Segoe UI", Font.BOLD, 14));
        lbShuffles.setForeground(new Color(0, 229, 255));

        // Info grid using GridBagLayout
        JPanel infoGrid = new JPanel(new GridBagLayout());
        infoGrid.setOpaque(false);
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(6, 4, 6, 8);
        gbc.anchor = GridBagConstraints.WEST;

        // Điểm số
        JLabel lbScoreTitle = new JLabel("Điểm số:");
        lbScoreTitle.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lbScoreTitle.setForeground(new Color(175, 188, 210));
        gbc.gridx = 0; gbc.gridy = 0;
        infoGrid.add(lbScoreTitle, gbc);
        gbc.gridx = 1;
        infoGrid.add(lbScore, gbc);

        // Thời gian / Pressure
        lbTimeTitle = new JLabel("Thời gian:");
        lbTimeTitle.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lbTimeTitle.setForeground(new Color(175, 188, 210));
        gbc.gridx = 0; gbc.gridy = 1;
        gbc.weightx = 0.0;
        gbc.fill = GridBagConstraints.NONE;
        infoGrid.add(lbTimeTitle, gbc);
        
        gbc.gridx = 1;
        gbc.weightx = 1.0;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        infoGrid.add(timePanel, gbc);
        
        // Reset constraints
        gbc.weightx = 0.0;
        gbc.fill = GridBagConstraints.NONE;

        // Kế tiếp (Next Wave)
        lbWaveTitle = new JLabel("Kế tiếp:");
        lbWaveTitle.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lbWaveTitle.setForeground(new Color(175, 188, 210));
        gbc.gridx = 0; gbc.gridy = 2;
        infoGrid.add(lbWaveTitle, gbc);
        lbWaveTitle.setVisible(false);

        lbNextWave = new JLabel("15s");
        lbNextWave.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lbNextWave.setForeground(new Color(255, 145, 0));
        gbc.gridx = 1; gbc.gridy = 2;
        infoGrid.add(lbNextWave, gbc);
        lbNextWave.setVisible(false);

        // Sinh tồn
        lbSurvivalTitle = new JLabel("Sinh tồn:");
        lbSurvivalTitle.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lbSurvivalTitle.setForeground(new Color(175, 188, 210));
        gbc.gridx = 0; gbc.gridy = 3;
        infoGrid.add(lbSurvivalTitle, gbc);
        lbSurvivalTitle.setVisible(false);

        lbSurvivalTime = new JLabel("00:00");
        lbSurvivalTime.setFont(new Font("Consolas", Font.BOLD, 14));
        lbSurvivalTime.setForeground(new Color(0, 229, 255));
        gbc.gridx = 1; gbc.gridy = 3;
        infoGrid.add(lbSurvivalTime, gbc);
        lbSurvivalTime.setVisible(false);

        // Combo
        lbComboTitle = new JLabel("Combo:");
        lbComboTitle.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lbComboTitle.setForeground(new Color(175, 188, 210));
        gbc.gridx = 0; gbc.gridy = 4;
        infoGrid.add(lbComboTitle, gbc);
        lbComboTitle.setVisible(false);

        lbComboText = new JLabel("x0");
        lbComboText.setFont(new Font("Segoe UI", Font.BOLD, 14));
        lbComboText.setForeground(new Color(255, 23, 68));
        gbc.gridx = 1; gbc.gridy = 4;
        infoGrid.add(lbComboText, gbc);
        lbComboText.setVisible(false);

        // Trợ giúp
        JLabel lbHelpTitle = new JLabel("Trợ giúp:");
        lbHelpTitle.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lbHelpTitle.setForeground(new Color(175, 188, 210));
        gbc.gridx = 0; gbc.gridy = 5;
        infoGrid.add(lbHelpTitle, gbc);
        gbc.gridx = 1;
        infoGrid.add(lbShuffles, gbc);

        // Action buttons
        btnShuffle = ctrlBtn("ĐỔI HÌNH",       new Color(0, 128, 140),  new Color(0, 158, 175));
        btnMute    = ctrlBtn("ÂM THANH: BẬT",    new Color(40, 50, 65),   new Color(55, 65, 80));
        btnNewGame = ctrlBtn("TRÒ CHƠI MỚI",    new Color(175, 68, 8),   new Color(210, 88, 14));
        btnHome    = ctrlBtn("VỀ TRANG CHỦ",    new Color(72, 72, 84),   new Color(95, 95, 110));

        btnShuffle.addActionListener(this);
        btnMute.addActionListener(this);
        btnNewGame.addActionListener(this);
        btnHome   .addActionListener(this);

        // Pikachu logo decoration
        JLabel logo = scaledIcon("/icon/pikachu.png", 100);
        logo.setAlignmentX(CENTER_ALIGNMENT);

        // Assemble inner content with BoxLayout
        JPanel inner = new JPanel();
        inner.setLayout(new BoxLayout(inner, BoxLayout.Y_AXIS));
        inner.setOpaque(false);
        inner.setBorder(new EmptyBorder(12, 10, 12, 10));

        infoGrid.setAlignmentX(CENTER_ALIGNMENT);
        inner.add(infoGrid);
        inner.add(gap(16));
        btnShuffle.setAlignmentX(CENTER_ALIGNMENT); inner.add(btnShuffle); inner.add(gap(8));
        btnMute.setAlignmentX(CENTER_ALIGNMENT);    inner.add(btnMute);    inner.add(gap(8));
        btnNewGame.setAlignmentX(CENTER_ALIGNMENT); inner.add(btnNewGame); inner.add(gap(8));
        btnHome   .setAlignmentX(CENTER_ALIGNMENT); inner.add(btnHome);
        inner.add(gap(16));
        inner.add(logo);
        inner.add(Box.createVerticalGlue());

        // Title at top
        JLabel titleBar = new JLabel("BẢNG ĐIỀU KHIỂN", JLabel.CENTER);
        titleBar.setFont(new Font("Segoe UI", Font.BOLD, 13));
        titleBar.setForeground(new Color(255, 204, 0));
        titleBar.setOpaque(true);
        titleBar.setBackground(new Color(18, 22, 32));
        titleBar.setBorder(new EmptyBorder(10, 0, 8, 0));

        // Outer panel
        JPanel outer = new JPanel(new BorderLayout());
        outer.setBackground(new Color(22, 27, 38));
        outer.setBorder(BorderFactory.createMatteBorder(0, 2, 0, 0, new Color(48, 58, 78)));
        outer.setPreferredSize(new Dimension(215, 0));
        outer.add(titleBar, BorderLayout.NORTH);
        outer.add(inner,    BorderLayout.CENTER);
        return outer;
    }

    // ==================== START NEW GAME ====================
    public void startNewGame(int r, int c, int diff, int gameTime, int shuffles) {
        // Stop old timer (safe - volatile flag)
        running = false;

        // Update settings
        this.row = r;  this.col = c;  this.difficulty = diff;
        this.maxTime = gameTime;  this.time = gameTime;
        this.maxShuffles = shuffles;  this.remainingShuffles = shuffles;
        this.isPaused = false;

        // Swap in new ButtonEvent (gamePanelWrapper stays in cardPanel permanently)
        gamePanelWrapper.removeAll();
        graphicsPanel = new ButtonEvent(this, row, col, difficulty);
        gamePanelWrapper.add(graphicsPanel, new GridBagConstraints());
        gamePanelWrapper.revalidate();
        gamePanelWrapper.repaint();

        // Update settings
        this.isOverloadMode = false;
        lbTimeTitle.setText("Thời gian:");
        lbWaveTitle.setVisible(false);
        lbNextWave.setVisible(false);
        lbSurvivalTitle.setVisible(false);
        lbSurvivalTime.setVisible(false);
        lbComboTitle.setVisible(false);
        lbComboText.setVisible(false);
        lbTimeText.setVisible(true); // Hiển thị đồng hồ số trong chế độ Cổ điển

        this.row = r;  this.col = c;  this.difficulty = diff;
        this.maxTime = gameTime;  this.time = gameTime;
        this.maxShuffles = shuffles;  this.remainingShuffles = shuffles;
        this.isPaused = false;

        // Swap in new ButtonEvent (gamePanelWrapper stays in cardPanel permanently)
        gamePanelWrapper.removeAll();
        graphicsPanel = new ButtonEvent(this, row, col, difficulty);
        gamePanelWrapper.add(graphicsPanel, new GridBagConstraints());
        gamePanelWrapper.revalidate();
        gamePanelWrapper.repaint();

        // Update HUD labels
        lbScore.setText("0");
        progressTime.setValue(100);
        progressTime.setForeground(new Color(0, 230, 118));
        int mins = time / 60;
        int secs = time % 60;
        lbTimeText.setText(String.format("%02d:%02d", mins, secs));
        lbTimeText.setForeground(new Color(0, 230, 118));
        lbShuffles.setText("Đổi hình (" + remainingShuffles + ")");
        btnShuffle.setEnabled(remainingShuffles > 0);
        updateMuteButtonText();

        // Show GAME card
        cardLayout.show(cardPanel, "GAME");

        // Auto-size window to fit the board + control panel exactly
        pack();
        setLocationRelativeTo(null);

        // Start fresh timer thread
        this.startTime = System.currentTimeMillis();
        running = true;
        timeThread = new Thread(this);
        timeThread.setDaemon(true);
        timeThread.start();
    }

    // ==================== REPLAY (same difficulty) ====================
    public void newGame() {
        running = false;
        if (isOverloadMode) {
            time = maxTime;  isPaused = false;  remainingShuffles = 3;

            gamePanelWrapper.removeAll();
            overloadGraphicsPanel = new OverloadButtonEvent(this, 14, 14);
            gamePanelWrapper.add(overloadGraphicsPanel, new GridBagConstraints());
            gamePanelWrapper.revalidate();
            gamePanelWrapper.repaint();

            lbScore.setText("0");
            progressTime.setValue(100);
            progressTime.setForeground(new Color(0, 230, 118));
            lbTimeText.setText("100%");
            lbTimeText.setVisible(false); // Ẩn phần trăm trong chế độ Overload
            lbTimeText.setForeground(new Color(0, 230, 118));
            lbNextWave.setText("15s");
            lbSurvivalTime.setText("00:00");
            lbComboText.setText("x0");
            lbShuffles.setText("Đổi hình (" + remainingShuffles + ")");
            btnShuffle.setEnabled(remainingShuffles > 0);
            updateMuteButtonText();
        } else {
            time = maxTime;  isPaused = false;  remainingShuffles = maxShuffles;

            gamePanelWrapper.removeAll();
            graphicsPanel = new ButtonEvent(this, row, col, difficulty);
            gamePanelWrapper.add(graphicsPanel, new GridBagConstraints());
            gamePanelWrapper.revalidate();
            gamePanelWrapper.repaint();

            lbScore.setText("0");
            progressTime.setValue(100);
            progressTime.setForeground(new Color(0, 230, 118));
            int mins = time / 60;
            int secs = time % 60;
            lbTimeText.setText(String.format("%02d:%02d", mins, secs));
            lbTimeText.setVisible(true); // Hiển thị đồng hồ số trong chế độ Cổ điển
            lbTimeText.setForeground(new Color(0, 230, 118));
            lbShuffles.setText("Đổi hình (" + remainingShuffles + ")");
            btnShuffle.setEnabled(remainingShuffles > 0);
            updateMuteButtonText();

            this.startTime = System.currentTimeMillis();
            running = true;
            timeThread = new Thread(this);
            timeThread.setDaemon(true);
            timeThread.start();
        }
    }

    // ==================== DIALOG (Win/Lose/Confirm) ====================
    public void showDialogNewGame(String message, String title, int type) {
        isPaused = true;
        int sel = JOptionPane.showOptionDialog(this, message, title,
            JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE,
            null, new String[]{"Chơi lại", "Về Trang Chủ"}, "Chơi lại");

        if (sel == JOptionPane.YES_OPTION) {
            newGame();
        } else {
            goHome();
        }
    }

    private void goHome() {
        running = false;
        if (isOverloadMode && overloadGraphicsPanel != null) {
            overloadGraphicsPanel.stopGameTimers();
        }
        cardLayout.show(cardPanel, "HOME");
        setSize(700, 540);
        setLocationRelativeTo(null);
    }

    // ==================== BUTTON ACTIONS ====================
    @Override
    public void actionPerformed(ActionEvent e) {
        Object src = e.getSource();
        if (src == btnNewGame) {
            showDialogNewGame("Bạn có chắc muốn chơi lại trận này?", "Trò Chơi Mới", 0);

        } else if (src == btnShuffle) {
            if (isOverloadMode) {
                if (remainingShuffles > 0) {
                    remainingShuffles--;
                    lbShuffles.setText("Đổi hình (" + remainingShuffles + ")");
                    if (remainingShuffles == 0) btnShuffle.setEnabled(false);
                    overloadGraphicsPanel.shuffleGrid();
                    sound.playSound("match.wav");
                }
            } else {
                if (remainingShuffles > 0) {
                    remainingShuffles--;
                    lbShuffles.setText("Đổi hình (" + remainingShuffles + ")");
                    if (remainingShuffles == 0) btnShuffle.setEnabled(false);
                    graphicsPanel.shuffleGrid();
                    sound.playSound("match.wav");
                }
            }

        } else if (src == btnMute) {
            sound.toggleMute();
            updateMuteButtonText();

        } else if (src == btnHome) {
            isPaused = true;
            int sel = JOptionPane.showConfirmDialog(this,
                "Thoát game hiện tại và về Trang Chủ?", "Về Trang Chủ",
                JOptionPane.YES_NO_OPTION);
            if (sel == JOptionPane.YES_OPTION) {
                goHome();
            } else {
                isPaused = false;
            }
        }
    }

    private void updateMuteButtonText() {
        if (sound.isMuted()) {
            btnMute.setText("ÂM THANH: TẮT");
            btnMute.setBackground(new Color(90, 40, 40));
        } else {
            btnMute.setText("ÂM THANH: BẬT");
            btnMute.setBackground(new Color(40, 50, 65));
        }
    }

    // ==================== TIMER THREAD ====================
    @Override
    public void run() {
        while (running) {
            try {
                Thread.sleep(1000);
                if (isPaused || !running) continue;
                time--;
                final int t = time;
                SwingUtilities.invokeLater(() -> {
                    int pct = (int)((double)t / maxTime * 100);
                    progressTime.setValue(Math.max(0, pct));
                    
                    int mins = t / 60;
                    int secs = t % 60;
                    lbTimeText.setText(String.format("%02d:%02d", mins, secs));
                    
                    Color color = t <= 20 ? new Color(255, 23, 68)      // Red Accent
                                : t <= 50 ? new Color(255, 145, 0)      // Orange Accent
                                : new Color(0, 230, 118);               // Neon Green Accent
                    progressTime.setForeground(color);
                    lbTimeText.setForeground(color);
                    if (t <= 0) {
                        running = false;
                        sound.playSound("lose.wav");
                        showDialogNewGame("Hết giờ rồi! Bạn có muốn chơi lại không?", "Thua Cuộc", 1);
                    }
                });
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }

    // ==================== PUBLIC HELPERS called by ButtonEvent ====================
    public void updateScore(int score) {
        SwingUtilities.invokeLater(() -> lbScore.setText(String.valueOf(score)));
    }

    public void increaseTime(int amount) {
        time = Math.min(time + amount, maxTime);
    }

    // ==================== UI HELPER METHODS ====================
    private JButton menuBtn(String text, Color base, Color hover) {
        JButton btn = new JButton(text);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 17));
        btn.setForeground(Color.WHITE);
        btn.setBackground(base);
        btn.setFocusPainted(false);
        btn.setBorderPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setPreferredSize(new Dimension(290, 50));
        btn.setMaximumSize(new Dimension(290, 50));
        btn.setAlignmentX(CENTER_ALIGNMENT);
        btn.addMouseListener(new MouseAdapter() {
            public void mouseEntered(MouseEvent e) { btn.setBackground(hover); }
            public void mouseExited (MouseEvent e) { btn.setBackground(base);  }
        });
        return btn;
    }

    private JButton ctrlBtn(String text, Color base, Color hover) {
        JButton btn = new JButton(text);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setForeground(Color.WHITE);
        btn.setBackground(base);
        btn.setFocusPainted(false);
        btn.setBorderPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setMaximumSize(new Dimension(190, 36));
        btn.setPreferredSize(new Dimension(190, 36));
        btn.addMouseListener(new MouseAdapter() {
            public void mouseEntered(MouseEvent e) { btn.setBackground(hover); }
            public void mouseExited (MouseEvent e) { btn.setBackground(base);  }
        });
        return btn;
    }

    private JLabel label(String text, Font font, Color color) {
        JLabel lbl = new JLabel(text);
        lbl.setFont(font);
        lbl.setForeground(color);
        return lbl;
    }

    private JLabel subLabel(String text, Color color) {
        JLabel lbl = new JLabel(text);
        lbl.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        lbl.setForeground(color);
        lbl.setAlignmentX(CENTER_ALIGNMENT);
        return lbl;
    }

    private JLabel scaledIcon(String resourcePath, int size) {
        JLabel lbl = new JLabel();
        try {
            java.net.URL u = getClass().getResource(resourcePath);
            if (u != null) {
                lbl.setIcon(new ImageIcon(new ImageIcon(u).getImage()
                    .getScaledInstance(size, size, Image.SCALE_SMOOTH)));
            }
        } catch (Exception ignored) {}
        return lbl;
    }

    private Component gap(int height) {
        return Box.createRigidArea(new Dimension(0, height));
    }

    // ==================== START OVERLOAD GAME ====================
    public void startOverloadGame() {
        // Dừng nhạc/timer cũ
        running = false;

        // Thiết lập cấu hình Overload
        this.isOverloadMode = true;
        this.row = 16;  this.col = 16;
        this.remainingShuffles = 3;
        this.isPaused = false;

        // Cập nhật nhãn và thanh trượt trên HUD
        lbTimeTitle.setText("Pressure:");
        lbWaveTitle.setVisible(true);
        lbNextWave.setVisible(true);
        lbSurvivalTitle.setVisible(true);
        lbSurvivalTime.setVisible(true);
        lbComboTitle.setVisible(true);
        lbComboText.setVisible(true);
        lbTimeText.setVisible(false); // Ẩn phần trăm để dành toàn bộ khoảng trống cho thanh năng lượng

        // Nạp Overload board
        gamePanelWrapper.removeAll();
        overloadGraphicsPanel = new OverloadButtonEvent(this, 14, 14); // 14x14 cờ + 2 viền = 16x16
        gamePanelWrapper.add(overloadGraphicsPanel, new GridBagConstraints());
        gamePanelWrapper.revalidate();
        gamePanelWrapper.repaint();

        // HUD reset
        lbScore.setText("0");
        progressTime.setValue(100);
        progressTime.setForeground(new Color(0, 230, 118));
        lbTimeText.setText("100%");
        lbTimeText.setForeground(new Color(0, 230, 118));
        lbNextWave.setText("15s");
        lbSurvivalTime.setText("00:00");
        lbComboText.setText("x0");
        lbShuffles.setText("Đổi hình (" + remainingShuffles + ")");
        btnShuffle.setEnabled(true);

        // Chuyển sang màn hình chơi
        cardLayout.show(cardPanel, "GAME");

        // Co dãn cửa sổ game 16x16 to lớn rực rỡ
        pack();
        setLocationRelativeTo(null);
    }

    // ==================== HUD UPDATE HELPERS FOR OVERLOAD ====================
    public void updatePressure(int pressure) {
        SwingUtilities.invokeLater(() -> {
            progressTime.setValue(pressure);
            lbTimeText.setText(pressure + "%");
            Color color = pressure <= 20 ? new Color(255, 23, 68)      // Red Accent
                        : pressure <= 50 ? new Color(255, 145, 0)      // Orange Accent
                        : new Color(0, 230, 118);               // Neon Green Accent
            progressTime.setForeground(color);
            lbTimeText.setForeground(color);
        });
    }

    public void updateNextWave(int seconds) {
        SwingUtilities.invokeLater(() -> {
            lbNextWave.setText(seconds + "s");
        });
    }

    public void updateSurvivalTime(int seconds) {
        SwingUtilities.invokeLater(() -> {
            int mins = seconds / 60;
            int secs = seconds % 60;
            lbSurvivalTime.setText(String.format("%02d:%02d", mins, secs));
        });
    }

    public void updateCombo(int combo) {
        SwingUtilities.invokeLater(() -> {
            lbComboText.setText("x" + combo);
            if (combo > 1) {
                lbComboText.setForeground(new Color(255, 145, 0)); // orange
            } else {
                lbComboText.setForeground(new Color(255, 23, 68)); // red
            }
        });
    }

    public boolean isGamePaused() {
        return isPaused;
    }

    public int getMaxTime() { return maxTime; }
    public int getTime() { return time; }
    public long getStartTime() { return startTime; }
    public void setPaused(boolean paused) { this.isPaused = paused; }
    public void updateNextWaveStr(String text) {
        SwingUtilities.invokeLater(() -> {
            lbNextWave.setText(text);
        });
    }

    // ==================== OVERLOAD MENU SCREEN ====================
    private JPanel createOverloadMenuScreen() {
        JPanel p = new JPanel();
        p.setBackground(new Color(18, 22, 32));
        p.setLayout(new BoxLayout(p, BoxLayout.Y_AXIS));
        p.setBorder(new EmptyBorder(30, 70, 30, 70));

        JLabel title = label("PIKACHU OVERLOAD", new Font("Segoe UI", Font.BOLD, 40), new Color(224, 64, 251));
        JLabel sub   = label("Thử Thách Sinh Tồn & Quản Lý Áp Lực", new Font("Segoe UI", Font.ITALIC, 15), new Color(150, 165, 190));
        title.setAlignmentX(CENTER_ALIGNMENT);
        sub.setAlignmentX(CENTER_ALIGNMENT);

        JLabel logo = scaledIcon("/icon/pikachu.png", 110);
        logo.setAlignmentX(CENTER_ALIGNMENT);

        JButton btnPlay     = menuBtn("BẮT ĐẦU SINH TỒN", new Color(110, 40, 160), new Color(130, 50, 190));
        JButton btnGuide    = menuBtn("HƯỚNG DẪN CHI TIẾT", new Color(22, 96, 182), new Color(28, 118, 210));
        JButton btnBack     = menuBtn("QUAY LẠI", new Color(78, 78, 90), new Color(100, 100, 115));

        btnPlay .addActionListener(e -> startOverloadGame());
        btnGuide.addActionListener(e -> showInstructions(true)); // Tự động chọn tab Overload
        btnBack .addActionListener(e -> cardLayout.show(cardPanel, "HOME"));

        p.add(Box.createVerticalGlue());
        p.add(title);  p.add(gap(5));
        p.add(sub);    p.add(gap(15));
        p.add(logo);   p.add(gap(25));
        p.add(btnPlay);  p.add(gap(12));
        p.add(btnGuide); p.add(gap(12));
        p.add(btnBack);
        p.add(Box.createVerticalGlue());
        return p;
    }

    /**
     * Hiển thị bảng hướng dẫn và tự động chọn tab tương ứng
     */
    public void showInstructions(boolean selectOverload) {
        cardLayout.show(cardPanel, "INSTRUCTIONS");
        if (selectOverload) {
            if (btnOverloadRulesRef != null) {
                btnOverloadRulesRef.doClick();
            }
        } else {
            if (btnClassicRulesRef != null) {
                btnClassicRulesRef.doClick();
            }
        }
    }

    private JPanel createRankScreen() {
        JPanel p = new JPanel(new BorderLayout(10, 14));
        p.setBackground(new Color(18, 22, 32));
        p.setBorder(new EmptyBorder(20, 32, 16, 32));

        JLabel title = label("BẢNG XẾP HẠNG", new Font("Segoe UI", Font.BOLD, 28), new Color(255, 204, 0));
        title.setHorizontalAlignment(JLabel.CENTER);

        // Tab selection panel for rankings
        JPanel tabSelection = new JPanel(new GridLayout(1, 4, 8, 0));
        tabSelection.setOpaque(false);
        tabSelection.setBorder(new EmptyBorder(10, 0, 8, 0));

        JButton btnClassicEasy = new JButton("DỄ");
        JButton btnClassicNormal = new JButton("TRUNG BÌNH");
        JButton btnClassicHard = new JButton("KHÓ");
        JButton btnOverloadRank = new JButton("OVERLOAD");

        Font tabFont = new Font("Segoe UI", Font.BOLD, 12);
        btnClassicEasy.setFont(tabFont);
        btnClassicNormal.setFont(tabFont);
        btnClassicHard.setFont(tabFont);
        btnOverloadRank.setFont(tabFont);

        btnClassicEasy.setFocusPainted(false);
        btnClassicNormal.setFocusPainted(false);
        btnClassicHard.setFocusPainted(false);
        btnOverloadRank.setFocusPainted(false);

        btnClassicEasy.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnClassicNormal.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnClassicHard.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnOverloadRank.setCursor(new Cursor(Cursor.HAND_CURSOR));

        // Create table
        String[] columnNames = {"Thứ hạng", "Người chơi", "Điểm số", "Thời gian"};
        javax.swing.table.DefaultTableModel model = new javax.swing.table.DefaultTableModel(columnNames, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        JTable table = new JTable(model);
        table.setBackground(new Color(26, 31, 43));
        table.setForeground(new Color(210, 218, 232));
        table.setGridColor(new Color(50, 60, 80));
        table.setFont(new Font("Segoe UI", Font.PLAIN, 14));
        table.setRowHeight(25);
        table.getTableHeader().setBackground(new Color(36, 43, 60));
        table.getTableHeader().setForeground(Color.WHITE);
        table.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 13));

        // Center align table contents
        javax.swing.table.DefaultTableCellRenderer centerRenderer = new javax.swing.table.DefaultTableCellRenderer();
        centerRenderer.setHorizontalAlignment(JLabel.CENTER);
        for (int i = 0; i < table.getColumnCount(); i++) {
            table.getColumnModel().getColumn(i).setCellRenderer(centerRenderer);
        }

        JScrollPane scroll = new JScrollPane(table);
        scroll.getViewport().setBackground(new Color(26, 31, 43));
        scroll.setBorder(BorderFactory.createLineBorder(new Color(50, 60, 80), 1));
        p.add(scroll, BorderLayout.CENTER);

        // Helper to color active tab button
        java.util.List<JButton> buttons = java.util.Arrays.asList(btnClassicEasy, btnClassicNormal, btnClassicHard, btnOverloadRank);
        Runnable updateTabSelectionColors = () -> {
            for (JButton b : buttons) {
                b.setBackground(new Color(40, 50, 65));
                b.setForeground(new Color(150, 165, 190));
            }
            JButton active = null;
            if (currentRankCategory.equals("classic_easy")) active = btnClassicEasy;
            else if (currentRankCategory.equals("classic_normal")) active = btnClassicNormal;
            else if (currentRankCategory.equals("classic_hard")) active = btnClassicHard;
            else if (currentRankCategory.equals("overload")) active = btnOverloadRank;
            
            if (active != null) {
                active.setBackground(new Color(39, 120, 44));
                active.setForeground(Color.WHITE);
            }
        };

        // Load data helper
        Runnable loadRankData = () -> {
            model.setRowCount(0);
            pikachu.util.LeaderboardManager.loadFromFile();
            java.util.List<pikachu.util.RankEntry> entries = pikachu.util.LeaderboardManager.getRankings(currentRankCategory);
            int rank = 1;
            for (pikachu.util.RankEntry entry : entries) {
                int mins = entry.getTime() / 60;
                int secs = entry.getTime() % 60;
                String timeStr = String.format("%02d:%02d", mins, secs);
                model.addRow(new Object[]{rank++, entry.getName(), entry.getScore(), timeStr});
            }
            updateTabSelectionColors.run();
        };

        // Actions
        btnClassicEasy.addActionListener(e -> {
            currentRankCategory = "classic_easy";
            sound.playSound("click.wav");
            loadRankData.run();
        });
        btnClassicNormal.addActionListener(e -> {
            currentRankCategory = "classic_normal";
            sound.playSound("click.wav");
            loadRankData.run();
        });
        btnClassicHard.addActionListener(e -> {
            currentRankCategory = "classic_hard";
            sound.playSound("click.wav");
            loadRankData.run();
        });
        btnOverloadRank.addActionListener(e -> {
            currentRankCategory = "overload";
            sound.playSound("click.wav");
            loadRankData.run();
        });

        tabSelection.add(btnClassicEasy);
        tabSelection.add(btnClassicNormal);
        tabSelection.add(btnClassicHard);
        tabSelection.add(btnOverloadRank);

        JPanel northPanel = new JPanel(new BorderLayout(0, 4));
        northPanel.setOpaque(false);
        northPanel.add(title, BorderLayout.NORTH);
        northPanel.add(tabSelection, BorderLayout.SOUTH);
        p.add(northPanel, BorderLayout.NORTH);

        JButton btnBack = menuBtn("QUAY LẠI", new Color(78, 78, 90), new Color(100, 100, 115));
        btnBack.setPreferredSize(new Dimension(290, 46));
        btnBack.addActionListener(e -> {
            cardLayout.show(cardPanel, "HOME");
            setSize(700, 540);
            setLocationRelativeTo(null);
        });
        JPanel rowPanel = new JPanel();
        rowPanel.setOpaque(false);
        rowPanel.add(btnBack);
        p.add(rowPanel, BorderLayout.SOUTH);

        // Put the loadRankData runnable into client properties so we can trigger it from outside
        p.putClientProperty("loadRankData", loadRankData);

        return p;
    }

    public void showRankScreen() {
        if (rankPanel != null) {
            Runnable loadRankData = (Runnable) rankPanel.getClientProperty("loadRankData");
            if (loadRankData != null) {
                loadRankData.run();
            }
        }
        cardLayout.show(cardPanel, "RANK");
        setSize(700, 540);
        setLocationRelativeTo(null);
    }

    // ==================== MAIN ====================
    public static void main(String[] args) {
        try { UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName()); }
        catch (Exception ignored) {}
        SwingUtilities.invokeLater(MainFrame::new);
    }
}