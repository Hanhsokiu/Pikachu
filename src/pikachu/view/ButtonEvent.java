package pikachu.view;

import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import javax.swing.*;
import javax.swing.border.LineBorder;
import java.util.List;

import pikachu.controller.Controller;
import pikachu.util.Sound;

// ─────────────────────────────────────────────────────────
//  Panel chính chứa bàn cờ Pikachu
// ─────────────────────────────────────────────────────────
public class ButtonEvent extends JLayeredPane implements ActionListener {

    // Tham số lưới (bao gồm hàng/cột viền trống)
    private final int row;      // = playRow + 2
    private final int col;      // = playCol + 2
    private final int difficulty;

    private static final int CELL = 50;   // kích thước mỗi ô (pixel)
    private static final int GAP  = 2;    // khoảng cách giữa các ô

    private JButton[][] buttons;
    private Controller  controller;
    private final Color BG = new Color(38, 46, 60);

    private final MainFrame frame;
    private Point   selectedPoint1 = null;
    private int     score          = 0;
    private int     remainingItems;

    private final Sound       sound          = new Sound();
    private       List<Point> currentPath    = null;
    private       JPanel      pathOverlay;

    // ─── Constructor ───────────────────────────────────────
    public ButtonEvent(MainFrame frame, int playRow, int playCol, int difficulty) {
        this.frame      = frame;
        this.difficulty = difficulty;
        this.row        = playRow + 2;   // +2 viền trống mỗi chiều
        this.col        = playCol + 2;
        this.remainingItems = (playRow * playCol) / 2;

        setLayout(null);
        setBackground(BG);

        // preferredSize = toàn bộ vùng lưới (kể cả hàng/cột viền)
        // Hàng i=0..row-1, cột j=0..col-1 đều có "ô ảo" tại vị trí i*(CELL+GAP), j*(CELL+GAP)
        int w = col * (CELL + GAP);
        int h = row * (CELL + GAP);
        setPreferredSize(new Dimension(w, h));

        newGame();
    }

    // ─── Khởi tạo / reset game ─────────────────────────────
    public void newGame() {
        removeAll();
        controller    = new Controller(row, col, difficulty);
        selectedPoint1 = null;
        score          = 0;
        remainingItems = ((row - 2) * (col - 2)) / 2;
        initPathOverlay();
        buildGrid();
        revalidate();
        repaint();
    }

    private void initPathOverlay() {
        int w = col * (CELL + GAP);
        int h = row * (CELL + GAP);
        pathOverlay = new JPanel() {
            @Override
            public boolean contains(int x, int y) {
                return false; // Bỏ qua bắt sự kiện chuột để truyền xuống nút bên dưới
            }

            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                if (currentPath == null || currentPath.size() < 2) return;

                Graphics2D g2 = (Graphics2D) g;
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(new Color(255, 61, 0));   // Màu cam điện sáng rực rỡ
                g2.setStroke(new BasicStroke(4.0f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND)); // Đường dày 4px sắc nét

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
                JButton btn = makeButton(i, j);
                btn.setIcon(getIcon(controller.getMatrix()[i][j]));
                // vị trí tuyệt đối: hàng/cột i,j ánh xạ thẳng vào pixel
                btn.setBounds(j * (CELL + GAP), i * (CELL + GAP), CELL, CELL);
                buttons[i][j] = btn;
                add(btn, JLayeredPane.DEFAULT_LAYER);
            }
        }
    }

    private JButton makeButton(int r, int c) {
        JButton btn = new JButton();
        btn.setActionCommand(r + "," + c);
        btn.setBackground(new Color(242, 242, 248));
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

    // ─── Click handler ─────────────────────────────────────
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
                clearSelection(); // Xóa viền chọn màu xanh của nút thứ nhất ngay lập tức
                doMatch(p1, clicked, path);
            } else {
                sound.playSound("wrong.wav");
                clearSelection();
                score = Math.max(0, score - 5);
                frame.updateScore(score);
            }
            selectedPoint1 = null;
        }
    }

    private void clearSelection() {
        if (selectedPoint1 != null) {
            buttons[selectedPoint1.x][selectedPoint1.y].setBorder(null);
            selectedPoint1 = null;
        }
    }

    // ─── Xử lý khớp thành công ─────────────────────────────
    private void doMatch(Point p1, Point p2, List<Point> path) {
        // Vẽ đường nối
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

            controller.getMatrix()[p1.x][p1.y] = 0;
            controller.getMatrix()[p2.x][p2.y] = 0;
            disableBtn(buttons[p1.x][p1.y]);
            disableBtn(buttons[p2.x][p2.y]);

            score += 10;
            remainingItems--;
            frame.updateScore(score);
            repaint();

            if (remainingItems == 0) {
                sound.playSound("win.wav");
                new Timer(400, we -> {
                    ((Timer) we.getSource()).stop();
                    
                    frame.setPaused(true);
                    String category = "classic_easy";
                    if (difficulty == 1) category = "classic_normal";
                    else if (difficulty == 2) category = "classic_hard";
                    
                    String name = null;
                    while (true) {
                        name = JOptionPane.showInputDialog(frame,
                            "Chúc mừng! Bạn đã thắng chế độ Cổ Điển.\nNhập tên của bạn để lưu vào bảng xếp hạng:",
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
                        int timePlayed = (int)((System.currentTimeMillis() - frame.getStartTime()) / 1000);
                        pikachu.util.LeaderboardManager.addEntry(category, name, score, timePlayed);
                    }
                    
                    frame.showDialogNewGame(
                        "Bạn đã chiến thắng!\nBạn có muốn chơi lại không?",
                        "Chiến Thắng!", 1);
                }).start();
            } else if (!controller.hasAvailableMoves()) {
                // Auto-shuffle khi hết nước đi
                JOptionPane.showMessageDialog(frame,
                    "Không còn nước đi!\nHệ thống sẽ tự động đảo lại bàn cờ.",
                    "Tự Động Đảo", JOptionPane.INFORMATION_MESSAGE);
                shuffleGrid();
            }
        }).start();
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
        for (int i = 1; i < row - 1; i++) {
            for (int j = 1; j < col - 1; j++) {
                int val = controller.getMatrix()[i][j];
                if (buttons[i][j] != null && val != 0) {
                    buttons[i][j].setIcon(getIcon(val));
                    buttons[i][j].setEnabled(true);
                    buttons[i][j].setBackground(new Color(242, 242, 248));
                    buttons[i][j].setBorder(null);
                    buttons[i][j].setVisible(true);
                }
            }
        }
        selectedPoint1 = null;
        repaint();
    }

    public int getRemainingItems() { return remainingItems; }



    private Point getCellCenter(Point gridPt) {
        int total = CELL + GAP;
        return new Point(
            gridPt.y * total + CELL / 2,
            gridPt.x * total + CELL / 2
        );
    }
}