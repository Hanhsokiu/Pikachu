package pikachu.view;

import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import javax.swing.*;
import javax.swing.border.LineBorder;
import java.util.List;
import java.util.ArrayList;

import pikachu.controller.OverloadController;
import pikachu.util.Sound;

public class OverloadButtonEvent extends JLayeredPane implements ActionListener {

    private final int row;      // = 16
    private final int col;      // = 16
    private static final int CELL = 50;
    private static final int GAP  = 2;

    private JButton[][] buttons;
    private OverloadController controller;
    private final Color BG = new Color(30, 35, 45); // Màu xám xanh tối sang trọng

    private final MainFrame frame;
    private Point selectedPoint1 = null;
    
    // Trạng thái chơi Overload
    private int score = 0;
    private int remainingItems;
    private int pressure = 100;
    private int freezeTime = 0;
    private int nextWaveTime = 20;
    private int survivalTime = 0;
    private int comboCount = 0;
    private long lastMatchTime = 0;

    private final Sound sound = new Sound();
    private List<Point> currentPath = null;
    private JPanel pathOverlay;
    
    private Timer gameTimer;
    private Timer animationTimer;

    public OverloadButtonEvent(MainFrame frame, int playRow, int playCol) {
        this.frame = frame;
        this.row = playRow + 2; // = 16
        this.col = playCol + 2; // = 16
        this.remainingItems = (playRow * playCol) / 2;

        setLayout(null);
        setBackground(BG);

        int w = col * (CELL + GAP);
        int h = row * (CELL + GAP);
        setPreferredSize(new Dimension(w, h));

        newGame();
    }

    public void newGame() {
        if (gameTimer != null) gameTimer.stop();
        if (animationTimer != null) animationTimer.stop();
        
        removeAll();
        controller = new OverloadController(row, col);
        selectedPoint1 = null;
        score = 0;
        pressure = 100;
        freezeTime = 0;
        nextWaveTime = 20; // Khởi động Stage 1 với đếm ngược 20 giây
        survivalTime = 0;
        comboCount = 0;
        lastMatchTime = System.currentTimeMillis();

        initPathOverlay();
        buildGrid();
        
        // Bắt đầu các luồng Timer của Overload
        startGameLoop();
        
        revalidate();
        repaint();
    }

    private void initPathOverlay() {
        int w = col * (CELL + GAP);
        int h = row * (CELL + GAP);
        pathOverlay = new JPanel() {
            @Override
            public boolean contains(int x, int y) {
                return false; // Truyền sự kiện chuột xuống các nút bên dưới
            }

            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2 = (Graphics2D) g;
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                // 1. Vẽ các hào quang đặc biệt (Aura Glows) quanh các quân cờ
                long now = System.currentTimeMillis();
                for (int r = 1; r < row - 1; r++) {
                    for (int c = 1; c < col - 1; c++) {
                        if (controller.getMatrix()[r][c] != 0) {
                            int x = c * (CELL + GAP);
                            int y = r * (CELL + GAP);
                            int spec = controller.getSpecialType(r, c);

                            if (spec == 1) { // Energy Tile: Hào quang Xanh lá & Phủ nền màu đậm
                                g2.setColor(new Color(0, 230, 118, 220));
                                g2.setStroke(new BasicStroke(4.0f));
                                g2.drawRoundRect(x - 1, y - 1, CELL + 2, CELL + 2, 8, 8);
                                // Tô màu nền đậm và rõ hơn
                                g2.setColor(new Color(0, 230, 118, 85));
                                g2.fillRoundRect(x, y, CELL, CELL, 8, 8);
                            } else if (spec == 2) { // Bomb Tile: Hào quang Đỏ & Phủ nền màu đậm
                                g2.setColor(new Color(255, 23, 68, 220));
                                g2.setStroke(new BasicStroke(4.0f));
                                g2.drawRoundRect(x - 1, y - 1, CELL + 2, CELL + 2, 8, 8);
                                // Tô màu nền đậm và rõ hơn
                                g2.setColor(new Color(255, 23, 68, 85));
                                g2.fillRoundRect(x, y, CELL, CELL, 8, 8);
                                // Vẽ vòng rực đỏ đặc trưng của Bomb
                                g2.setColor(new Color(255, 23, 68, 40));
                                g2.fillOval(x + 5, y + 5, CELL - 10, CELL - 10);
                            } else if (spec == 3) { // Freeze Tile: Hào quang Xanh Cyan & Phủ nền màu đậm
                                g2.setColor(new Color(0, 229, 255, 220));
                                g2.setStroke(new BasicStroke(4.0f));
                                g2.drawRoundRect(x - 1, y - 1, CELL + 2, CELL + 2, 8, 8);
                                // Tô màu nền đậm và rõ hơn
                                g2.setColor(new Color(0, 229, 255, 85));
                                g2.fillRoundRect(x, y, CELL, CELL, 8, 8);
                            } else if (spec == 4) { // Corrupted Tile: Hào quang Tím & Phủ nền màu đậm
                                g2.setColor(new Color(170, 0, 255, 240));
                                g2.setStroke(new BasicStroke(4.5f));
                                g2.drawRoundRect(x - 1, y - 1, CELL + 2, CELL + 2, 8, 8);
                                // Tô màu nền tím đậm rõ nét
                                g2.setColor(new Color(170, 0, 255, 105));
                                g2.fillRoundRect(x, y, CELL, CELL, 8, 8);
                            } else if (spec == 5) { // Unstable Tile (Ổ lây nhiễm): Hào quang Cam & Phủ nền nhấp nháy đậm
                                int alpha = (int)(110 + 70 * Math.sin(System.currentTimeMillis() / 100.0));
                                g2.setColor(new Color(255, 109, 0, Math.max(0, Math.min(255, alpha))));
                                g2.setStroke(new BasicStroke(3.5f));
                                g2.drawRoundRect(x - 1, y - 1, CELL + 2, CELL + 2, 8, 8);
                                // Tô màu nền cam nhấp nháy rõ rệt
                                g2.setColor(new Color(255, 109, 0, Math.max(50, Math.min(255, (int)(alpha * 0.7)))));
                                g2.fillRoundRect(x, y, CELL, CELL, 8, 8);
                            }
                        }
                    }
                }

                // 2. Vẽ đường nối đỏ cam ăn điểm
                if (currentPath == null || currentPath.size() < 2) return;

                g2.setColor(new Color(255, 61, 0));   // Màu cam điện sáng rực
                g2.setStroke(new BasicStroke(4.0f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));

                for (int i = 0; i < currentPath.size() - 1; i++) {
                    Point a = getCellCenter(currentPath.get(i));
                    Point b = getCellCenter(currentPath.get(i + 1));
                    g2.drawLine(a.x, a.y, b.x, b.y);
                }

                // Vẽ chấm tròn sáng ở tâm và các góc cua của đường nối
                g2.setColor(new Color(255, 220, 0));  // Màu vàng neon sáng
                for (Point pt : currentPath) {
                    Point c = getCellCenter(pt);
                    g2.fillOval(c.x - 6, c.y - 6, 12, 12);
                }
            }
        };
        pathOverlay.setOpaque(false);
        pathOverlay.setBounds(0, 0, w, h);
        add(pathOverlay, JLayeredPane.PALETTE_LAYER);
    }

    private void buildGrid() {
        buttons = new JButton[row][col];
        for (int i = 1; i < row - 1; i++) {
            for (int j = 1; j < col - 1; j++) {
                int val = controller.getMatrix()[i][j];
                if (val != 0) {
                    JButton btn = makeButton(i, j);
                    btn.setIcon(getIcon(val));
                    btn.setBounds(j * (CELL + GAP), i * (CELL + GAP), CELL, CELL);
                    buttons[i][j] = btn;
                    add(btn, JLayeredPane.DEFAULT_LAYER);
                }
            }
        }
    }

    private void rebuildGridUI() {
        // Gỡ tất cả JButtons cũ ra khỏi panel
        for (int i = 1; i < row - 1; i++) {
            for (int j = 1; j < col - 1; j++) {
                if (buttons[i][j] != null) {
                    remove(buttons[i][j]);
                    buttons[i][j] = null;
                }
            }
        }
        
        // Xây lại các nút cờ theo trạng thái ma trận mới nhất
        buildGrid();
        revalidate();
        repaint();
    }

    private JButton makeButton(int r, int c) {
        JButton btn = new JButton();
        btn.setActionCommand(r + "," + c);
        btn.setBackground(new Color(245, 245, 250)); // Trắng kem mịn
        btn.setBorder(null);
        btn.setFocusPainted(false);
        btn.addActionListener(this);
        return btn;
    }

    private Icon getIcon(int idx) {
        if (idx == 0) return null;
        try {
            java.net.URL u = getClass().getResource("/icon/" + idx + ".png");
            if (u != null) {
                Image img = new ImageIcon(u).getImage().getScaledInstance(46, 46, Image.SCALE_SMOOTH);
                return new ImageIcon(img);
            }
        } catch (Exception ignored) {}
        return null;
    }

    private void startGameLoop() {
        // Luồng Timer chạy logic đếm giây
        gameTimer = new Timer(1000, e -> {
            if (frame.isGamePaused()) return;
            
            survivalTime++;
            frame.updateSurvivalTime(survivalTime);
            
            // Xác định các thông số độ khó động theo 3 giai đoạn (Stage)
            int waveInterval;
            int pairsToSpawn;
            int unstableAge;
            int corruptedAge;
            int idleThreshold;
            int idlePenalty;
            boolean shouldDecayPressure = true;
            int pressureDecayAmount = 1;
            int spreadInterval;
            int spawnCount;

            if (survivalTime <= 90) {
                // Stage 1 (0 - 90s) - Khởi động thong thả hơn
                waveInterval = 20;
                pairsToSpawn = 2;
                unstableAge = 45;
                corruptedAge = 90;
                idleThreshold = 10;
                idlePenalty = 1;
                shouldDecayPressure = (survivalTime % 2 == 0); // 2 giây giảm 1 Pressure
                pressureDecayAmount = 1;
                spreadInterval = 18;
                spawnCount = 1;
            } else if (survivalTime <= 180) {
                // Stage 2 (90 - 180s) - Tăng thách thức vừa phải
                waveInterval = 15;
                pairsToSpawn = 3;
                unstableAge = 35;
                corruptedAge = 70;
                idleThreshold = 8;
                idlePenalty = 2;
                shouldDecayPressure = true; // Mỗi giây giảm 1 Pressure!
                pressureDecayAmount = 1;
                spreadInterval = 14;
                spawnCount = 2;
            } else {
                // Stage 3 (Trên 180s) - Quá tải kịch tính
                waveInterval = 10;
                pairsToSpawn = 4;
                unstableAge = 25;
                corruptedAge = 50;
                idleThreshold = 6;
                idlePenalty = 3; // Tăng phạt nhàn rỗi lên 3
                shouldDecayPressure = true; // Mỗi giây giảm 2 Pressure!
                pressureDecayAmount = 2;
                spreadInterval = 10;
                spawnCount = 2;
            }

            // Đồng bộ ngưỡng lão hóa động vào Controller
            controller.setUnstableThreshold(unstableAge);
            controller.setCorruptedThreshold(corruptedAge);
            controller.setSpreadInterval(spreadInterval);

            // 1. Quản lý đóng băng thời gian
            if (freezeTime > 0) {
                freezeTime--;
                // Đóng băng thì không giảm pressure
            } else {
                // 2. Giảm Pressure theo thời gian hoặc phạt nhàn rỗi
                long idleTime = (System.currentTimeMillis() - lastMatchTime) / 1000;
                int decayAmount = 0;
                
                if (idleTime > idleThreshold) {
                    decayAmount = idlePenalty; // Phạt nhàn rỗi
                } else if (shouldDecayPressure) {
                    decayAmount = pressureDecayAmount; // Suy hao thông thường
                }
                
                // Phạt từ các ô độc hại (Corrupted - type 4): Càng để lâu càng trừ áp lực dồn dập và mạnh tay!
                int corruptedPenalty = 0;
                long now = System.currentTimeMillis();
                for (int r = 1; r < row - 1; r++) {
                    for (int c = 1; c < col - 1; c++) {
                        if (controller.getMatrix()[r][c] != 0 && controller.getSpecialType(r, c) == 4) {
                            long corruptedDuration = (now - controller.getSpawnTime(r, c)) / 1000;
                            // Càng để lâu phạt áp lực càng tăng tiến:
                            // - Dưới 10s: trừ 1/s
                            // - Từ 10s đến 20s: trừ 3/s
                            // - Trên 20s: trừ 6/s!
                            if (corruptedDuration < 10) {
                                corruptedPenalty += 1;
                            } else if (corruptedDuration < 20) {
                                corruptedPenalty += 3;
                            } else {
                                corruptedPenalty += 6;
                            }
                        }
                    }
                }
                decayAmount += corruptedPenalty;
                
                if (decayAmount > 0) {
                    pressure = Math.max(0, pressure - decayAmount);
                    frame.updatePressure(pressure);
                    
                    if (pressure <= 0) {
                        gameOver();
                        return;
                    }
                }
            }

            // 3. Đếm ngược làn sóng Spawn Wave
            int emptyCells = controller.getEmptyCellsCount();
            if (emptyCells < 24) {
                frame.updateNextWaveStr("ĐẦY");
            } else {
                nextWaveTime--;
                if (nextWaveTime <= 0) {
                    boolean spawned = controller.spawnOverloadWave(pairsToSpawn);
                    if (spawned) {
                        sound.playSound("match.wav");
                        rebuildGridUI();
                    }
                    nextWaveTime = waveInterval;
                }
                frame.updateNextWave(nextWaveTime);
            }

            // 4. Lão hóa và lây lan quân cờ mỗi giây (Bị đóng băng khi Freeze Tile đang hoạt động)
            if (freezeTime == 0) {
                controller.decayTiles(spawnCount);
            }

            // 5. Cập nhật combo timeout
            if (comboCount > 0 && (System.currentTimeMillis() - lastMatchTime) > 3000) {
                comboCount = 0;
                frame.updateCombo(0);
            }
        });
        gameTimer.start();

        // Luồng Timer chạy mượt hoạt cảnh nhấp nháy 6.6 FPS
        animationTimer = new Timer(150, e -> {
            if (pathOverlay != null) {
                pathOverlay.repaint();
            }
        });
        animationTimer.start();
    }

    private void gameOver() {
        if (gameTimer != null) gameTimer.stop();
        if (animationTimer != null) animationTimer.stop();
        
        sound.playSound("lose.wav");
        
        String category = "overload";
        String name = null;
        while (true) {
            name = JOptionPane.showInputDialog(frame,
                "Hệ thống sụp đổ! Bạn đã bị quá tải.\nNhập tên của bạn để lưu vào bảng xếp hạng sinh tồn:",
                "Nhập Tên", JOptionPane.PLAIN_MESSAGE);
            if (name == null) {
                break;
            }
            name = name.trim();
            if (name.isEmpty()) {
                JOptionPane.showMessageDialog(frame, "Tên không được để trống!", "Lỗi", JOptionPane.ERROR_MESSAGE);
                continue;
            }
            if (name.contains("|")) {
                JOptionPane.showMessageDialog(frame, "Tên không được chứa ký tự '|'!", "Lỗi", JOptionPane.ERROR_MESSAGE);
                continue;
            }
            if (pikachu.util.LeaderboardManager.nameExists(category, name)) {
                JOptionPane.showMessageDialog(frame, "Tên đã tồn tại! Vui lòng chọn tên khác.", "Trùng Tên", JOptionPane.WARNING_MESSAGE);
                continue;
            }
            break;
        }
        if (name != null && !name.isEmpty()) {
            pikachu.util.LeaderboardManager.addEntry(category, name, score, survivalTime);
        }
        
        frame.showDialogNewGame(
            "💀 HỆ THỐNG SỤP ĐỔ (PRESSURE = 0)!\nThời gian sinh tồn: " + formatSurvivalTime() + "\nĐiểm số đạt được: " + score + "\nBạn có muốn chơi lại không?",
            "Game Over!", 1
        );
    }

    private String formatSurvivalTime() {
        int mins = survivalTime / 60;
        int secs = survivalTime % 60;
        return String.format("%02d:%02d", mins, secs);
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        sound.playSound("click.wav");
        String[] parts = e.getActionCommand().split(",");
        int r = Integer.parseInt(parts[0]);
        int c = Integer.parseInt(parts[1]);
        Point clicked = new Point(r, c);

        if (selectedPoint1 == null) {
            selectedPoint1 = clicked;
            buttons[r][c].setBorder(new LineBorder(new Color(0, 229, 255), 3));
        } else {
            if (clicked.equals(selectedPoint1)) {
                clearSelection();
                return;
            }
            List<Point> path = controller.getConnectionPath(selectedPoint1, clicked);
            if (!path.isEmpty()) {
                sound.playSound("match.wav");
                Point p1 = selectedPoint1;
                clearSelection();
                doMatch(p1, clicked, path);
            } else {
                sound.playSound("wrong.wav");
                clearSelection();
                // Phạt sai cặp: -3 pressure
                pressure = Math.max(0, pressure - 3);
                frame.updatePressure(pressure);
            }
            selectedPoint1 = null;
        }
    }

    private void clearSelection() {
        if (selectedPoint1 != null) {
            if (buttons[selectedPoint1.x][selectedPoint1.y] != null) {
                buttons[selectedPoint1.x][selectedPoint1.y].setBorder(null);
            }
            selectedPoint1 = null;
        }
    }

    private void doMatch(Point p1, Point p2, List<Point> path) {
        this.currentPath = path;
        if (pathOverlay != null) {
            pathOverlay.repaint();
        }

        new Timer(480, evt -> {
            ((Timer) evt.getSource()).stop();

            this.currentPath = null;
            if (pathOverlay != null) {
                pathOverlay.repaint();
            }

            // Xử lý ăn quân cờ
            int type1 = controller.getSpecialType(p1.x, p1.y);
            int type2 = controller.getSpecialType(p2.x, p2.y);
            
            // Xóa quân cờ khỏi ma trận và ẩn giao diện
            controller.getMatrix()[p1.x][p1.y] = 0;
            controller.getMatrix()[p2.x][p2.y] = 0;
            disableBtn(buttons[p1.x][p1.y]);
            disableBtn(buttons[p2.x][p2.y]);

            // Tính điểm số & Combo
            long now = System.currentTimeMillis();
            if (now - lastMatchTime <= 3000) {
                comboCount++;
            } else {
                comboCount = 1;
            }
            lastMatchTime = now;
            frame.updateCombo(comboCount);

            int comboMultiplier = Math.min(5, comboCount);
            int baseScore = 10;
            
            // Tính khoảng cách di chuyển để cộng thưởng "Match Xa"
            int pathDistance = 0;
            for (int i = 0; i < path.size() - 1; i++) {
                pathDistance += Math.abs(path.get(i).x - path.get(i+1).x) + Math.abs(path.get(i).y - path.get(i+1).y);
            }
            if (pathDistance > 4) {
                baseScore += 10; // Match xa: +20 điểm
            }
            
            score += baseScore * comboMultiplier;
            frame.updateScore(score);

            // Tính năng hồi Pressure (Đã tối ưu hóa cân bằng độ khó)
            int pressureRecover = 3; // Bình thường (giảm từ 8)
            if (pathDistance > 4) pressureRecover = 5; // Match xa (giảm từ 12)
            if (comboCount > 1) pressureRecover = 8; // Combo (giảm từ 20)

            // Xử lý cờ Đặc biệt / Bị lão hóa
            if (type1 == 1 || type2 == 1) { // Energy Tile
                pressureRecover = 15; // Hồi 15% (giảm từ 30%)
                score += 30; // Bonus score
                int cleansed = controller.cleanseUnstableTiles();
                if (cleansed > 0) {
                    sound.playSound("win.wav"); // Phát âm thanh chiến thắng rực rỡ khi thanh tẩy thành công
                }
            }
            if (type1 == 3 || type2 == 3) { // Freeze Tile
                freezeTime = 5; // Đóng băng 5 giây
            }
            if (type1 == 4 || type2 == 4) { // Corrupted Tile: độc hại!
                pressureRecover = -15; // Giảm 15% áp lực (tăng phạt từ -10)
                score -= 15; // Phạt điểm
            }

            if (freezeTime == 0) {
                pressure = Math.min(100, pressure + pressureRecover);
                frame.updatePressure(pressure);
            }

            // Kích nổ Bomb Tile nếu có
            if (type1 == 2) triggerBombExplosion(p1);
            if (type2 == 2) triggerBombExplosion(p2);

            rebuildGridUI(); // Đồng bộ lại giao diện sau nổ bom (nếu có)
            
            // Xóa cờ còn lại để xáo trộn hoặc tự đảo
            remainingItems = 0;
            for (int r = 1; r < row - 1; r++) {
                for (int c = 1; c < col - 1; c++) {
                    if (controller.getMatrix()[r][c] != 0) remainingItems++;
                }
            }
            remainingItems /= 2;

            if (remainingItems == 0) {
                // Hết sạch cờ, Overload mode tự động sinh wave mới ngay lập tức
                nextWaveTime = 1;
            } else if (!controller.hasAvailableMoves()) {
                shuffleGrid();
            }
        }).start();
    }

    private void triggerBombExplosion(Point p) {
        sound.playSound("wrong.wav"); // Âm thanh nổ bom đặc biệt
        int rStart = Math.max(1, p.x - 1);
        int rEnd = Math.min(row - 2, p.x + 1);
        int cStart = Math.max(1, p.y - 1);
        int cEnd = Math.min(col - 2, p.y + 1);
        
        for (int r = rStart; r <= rEnd; r++) {
            for (int c = cStart; c <= cEnd; c++) {
                if (controller.getMatrix()[r][c] != 0) {
                    controller.getMatrix()[r][c] = 0;
                    disableBtn(buttons[r][c]);
                    score += 5; // Điểm nhỏ từ nổ bom
                }
            }
        }
    }

    private void disableBtn(JButton btn) {
        if (btn == null) return;
        btn.setIcon(null);
        btn.setBackground(BG);
        btn.setEnabled(false);
        btn.setBorder(null);
        btn.setVisible(false);
    }

    public void shuffleGrid() {
        controller.shuffleMatrix();
        rebuildGridUI();
        selectedPoint1 = null;
    }

    public int getRemainingItems() { return remainingItems; }

    public void stopGameTimers() {
        if (gameTimer != null) gameTimer.stop();
        if (animationTimer != null) animationTimer.stop();
    }

    private Point getCellCenter(Point gridPt) {
        int total = CELL + GAP;
        return new Point(
            gridPt.y * total + CELL / 2,
            gridPt.x * total + CELL / 2
        );
    }
}
