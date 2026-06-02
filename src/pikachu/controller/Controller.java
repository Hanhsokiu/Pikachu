package pikachu.controller;

import java.awt.Point;
import java.util.ArrayList;
import java.util.Random;
import java.util.List;

public class Controller {
    protected final int row;
    protected final int col;
    protected final int difficulty; // 0: Dễ, 1: Thường, 2: Khó
    protected int[][] matrix;

    private boolean isOverloadMode;
    private long[][] spawnTime;
    private int[][] specialType; // 0: normal, 1: Energy, 2: Bomb, 3: Freeze, 4: Corrupted

    public Controller(int row, int col, int difficulty) {
        this(row, col, difficulty, false);
    }

    public Controller(int row, int col, int difficulty, boolean isOverloadMode) {
        this.row = row;
        this.col = col;
        this.difficulty = difficulty;
        this.isOverloadMode = isOverloadMode;
        this.spawnTime = new long[row][col];
        this.specialType = new int[row][col];
        createMatrix();
    }

    public void showMatrix() {
        System.out.println("=== MATRIX ===");
        for (int i = 0; i < row; i++) {
            for (int j = 0; j < col; j++) {
                System.out.printf("%3d", matrix[i][j]);
            }
            System.out.println();
        }
    }

    private void createMatrix() {
        matrix = new int[row][col];

        // Khởi tạo biên bằng 0 (ô trống)
        for (int i = 0; i < col; i++) {
            matrix[0][i] = matrix[row - 1][i] = 0;
        }
        for (int i = 0; i < row; i++) {
            matrix[i][0] = matrix[i][col - 1] = 0;
        }

        // Chọn số loại icon tùy theo độ khó
        int imgCount;
        if (difficulty == 0) {
            imgCount = 5; // Chế độ dễ: 5 loại hình
        } else if (difficulty == 1) {
            imgCount = 15; // Chế độ thường: 15 loại hình
        } else {
            imgCount = 21; // Chế độ khó: tất cả 21 loại hình
        }

        Random rand = new Random();

        // Lấy tất cả các vị trí chơi được (không tính viền)
        ArrayList<Point> availablePositions = new ArrayList<>();
        for (int i = 1; i < row - 1; i++) {
            for (int j = 1; j < col - 1; j++) {
                availablePositions.add(new Point(i, j));
            }
        }

        // Sinh danh sách các cặp quân Pikachu
        int pairsNeeded = availablePositions.size() / 2;
        ArrayList<Integer> pairs = new ArrayList<>();
        for (int i = 0; i < pairsNeeded; i++) {
            int imageIndex = rand.nextInt(imgCount) + 1;
            pairs.add(imageIndex);
            pairs.add(imageIndex);
        }

        // Phân phối ngẫu nhiên các cặp quân vào ma trận
        long now = System.currentTimeMillis();
        for (int imageIndex : pairs) {
            if (availablePositions.isEmpty()) break;
            int posIndex = rand.nextInt(availablePositions.size());
            Point p = availablePositions.remove(posIndex);
            matrix[p.x][p.y] = imageIndex;
            if (spawnTime != null) {
                spawnTime[p.x][p.y] = now;
                specialType[p.x][p.y] = 0;
            }
        }

        // Đảm bảo ban đầu có ít nhất 1 nước đi thắng
        if (pairsNeeded > 1 && !hasAvailableMoves()) {
            shuffleMatrix();
        }
    }

    /**
     * Quét ma trận để kiểm tra xem có còn nước đi hợp lệ nào không.
     */
    public boolean hasAvailableMoves() {
        for (int r1 = 1; r1 < row - 1; r1++) {
            for (int c1 = 1; c1 < col - 1; c1++) {
                if (matrix[r1][c1] == 0) continue;
                for (int r2 = 1; r2 < row - 1; r2++) {
                    for (int c2 = 1; c2 < col - 1; c2++) {
                        if (r1 == r2 && c1 == c2) continue;
                        if (matrix[r2][c2] == matrix[r1][c1]) {
                            List<Point> path = getConnectionPath(new Point(r1, c1), new Point(r2, c2));
                            if (!path.isEmpty()) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Đảo ngẫu nhiên các quân còn lại trên ma trận cho tới khi tạo ra ít nhất 1 nước đi thắng
     */
    public void shuffleMatrix() {
        // Thu thập các quân bài và vị trí tương ứng còn lại trên lưới
        ArrayList<Integer> values = new ArrayList<>();
        ArrayList<Point> positions = new ArrayList<>();

        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] != 0) {
                    values.add(matrix[r][c]);
                    positions.add(new Point(r, c));
                }
            }
        }

        if (values.size() <= 2) {
            return; // Chỉ còn 2 quân cuối cùng thì không cần đảo hoặc tự động giải
        }

        Random rand = new Random();
        boolean success = false;

        // Thử đảo tối đa 100 lần để tìm một tổ hợp có nước đi
        for (int attempt = 0; attempt < 100; attempt++) {
            // Xáo trộn ngẫu nhiên mảng giá trị (Fisher-Yates shuffle)
            for (int i = values.size() - 1; i > 0; i--) {
                int index = rand.nextInt(i + 1);
                int temp = values.get(index);
                values.set(index, values.get(i));
                values.set(i, temp);
            }

            // Gán lại vào các vị trí trống trên lưới game
            for (int i = 0; i < positions.size(); i++) {
                Point p = positions.get(i);
                matrix[p.x][p.y] = values.get(i);
            }

            // Kiểm tra xem có nước đi ăn được nào không
            if (hasAvailableMoves()) {
                success = true;
                break;
            }
        }

        // Nếu qua 100 lần thử vẫn không tạo được nước đi hợp lệ (rất hiếm gặp), làm một lượt xáo trộn ngẫu nhiên cuối cùng
        if (!success) {
            for (int i = values.size() - 1; i > 0; i--) {
                int index = rand.nextInt(i + 1);
                int temp = values.get(index);
                values.set(index, values.get(i));
                values.set(i, temp);
            }
            for (int i = 0; i < positions.size(); i++) {
                Point p = positions.get(i);
                matrix[p.x][p.y] = values.get(i);
            }
        }
    }

    public int[][] getMatrix() {
        return matrix;
    }

    /**
     * Tính toán tổng chiều dài đường đi (khoảng cách di chuyển theo lưới)
     */
    private int getPathLength(List<Point> path) {
        if (path == null || path.size() < 2) {
            return Integer.MAX_VALUE;
        }
        int length = 0;
        for (int i = 0; i < path.size() - 1; i++) {
            Point p1 = path.get(i);
            Point p2 = path.get(i + 1);
            length += Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
        }
        return length;
    }

    /**
     * So sánh hai đường đi:
     * - Trả về true nếu pathA tốt hơn pathB (ngắn hơn hoặc có ít góc cua hơn khi chiều dài bằng nhau)
     */
    private boolean isBetterPath(List<Point> pathA, List<Point> pathB) {
        if (pathB == null || pathB.isEmpty()) return true;
        if (pathA == null || pathA.isEmpty()) return false;

        int lenA = getPathLength(pathA);
        int lenB = getPathLength(pathB);
        if (lenA != lenB) {
            return lenA < lenB;
        }
        // Nếu cùng độ dài, ưu tiên đường có ít điểm/ít góc cua hơn (size nhỏ hơn)
        return pathA.size() < pathB.size();
    }

    /**
     * Kiểm tra và trả về đường nối TỐI ƯU (NGẮN NHẤT) giữa 2 điểm
     */
    public List<Point> getConnectionPath(Point p1, Point p2) {
        List<Point> bestPath = new ArrayList<>();

        if (p1.equals(p2) || matrix[p1.x][p1.y] != matrix[p2.x][p2.y] || matrix[p1.x][p1.y] == 0) {
            return bestPath;
        }

        // 1. Kiểm tra đường thẳng ngang (cùng hàng)
        if (p1.x == p2.x && checkLineX(p1.y, p2.y, p1.x)) {
            List<Point> path = new ArrayList<>();
            path.add(p1);
            path.add(p2);
            if (isBetterPath(path, bestPath)) {
                bestPath = path;
            }
        }

        // 2. Kiểm tra đường thẳng dọc (cùng cột)
        if (p1.y == p2.y && checkLineY(p1.x, p2.x, p1.y)) {
            List<Point> path = new ArrayList<>();
            path.add(p1);
            path.add(p2);
            if (isBetterPath(path, bestPath)) {
                bestPath = path;
            }
        }

        // 3. Kiểm tra đường chữ L (1 góc)
        Point corner1 = new Point(p1.x, p2.y);
        if (isCellEmpty(corner1.x, corner1.y) && checkLineX(p1.y, p2.y, p1.x) && checkLineY(p1.x, p2.x, p2.y)) {
            List<Point> path = new ArrayList<>();
            path.add(p1);
            path.add(corner1);
            path.add(p2);
            if (isBetterPath(path, bestPath)) {
                bestPath = path;
            }
        }

        Point corner2 = new Point(p2.x, p1.y);
        if (isCellEmpty(corner2.x, corner2.y) && checkLineY(p1.x, p2.x, p1.y) && checkLineX(p1.y, p2.y, p2.x)) {
            List<Point> path = new ArrayList<>();
            path.add(p1);
            path.add(corner2);
            path.add(p2);
            if (isBetterPath(path, bestPath)) {
                bestPath = path;
            }
        }

        // 4. Kiểm tra đường chữ U/Z qua cột trung gian (quét dọc)
        for (int y = 0; y < col; y++) {
            if (y == p1.y || y == p2.y) {
                continue;
            }

            if (isCellEmpty(p1.x, y) && isCellEmpty(p2.x, y)) {
                if (checkLineX(p1.y, y, p1.x) && checkLineX(p2.y, y, p2.x) && checkLineY(p1.x, p2.x, y)) {
                    List<Point> path = new ArrayList<>();
                    path.add(p1);
                    path.add(new Point(p1.x, y));
                    path.add(new Point(p2.x, y));
                    path.add(p2);
                    if (isBetterPath(path, bestPath)) {
                        bestPath = path;
                    }
                }
            }
        }

        // 5. Kiểm tra đường chữ U/Z qua hàng trung gian (quét ngang)
        for (int x = 0; x < row; x++) {
            if (x == p1.x || x == p2.x) {
                continue;
            }

            if (isCellEmpty(x, p1.y) && isCellEmpty(x, p2.y)) {
                if (checkLineY(p1.x, x, p1.y) && checkLineY(p2.x, x, p2.y) && checkLineX(p1.y, p2.y, x)) {
                    List<Point> path = new ArrayList<>();
                    path.add(p1);
                    path.add(new Point(x, p1.y));
                    path.add(new Point(x, p2.y));
                    path.add(p2);
                    if (isBetterPath(path, bestPath)) {
                        bestPath = path;
                    }
                }
            }
        }

        return bestPath;
    }

    /**
     * Kiểm tra xem ô có trống không (bao gồm cả rìa biên)
     */
    protected boolean isCellEmpty(int x, int y) {
        if (x == 0 || x == row - 1 || y == 0 || y == col - 1) {
            return true; // Rìa biên luôn luôn được xem là trống để có thể đi qua
        }
        if (x >= 0 && x < row && y >= 0 && y < col) {
            return matrix[x][y] == 0;
        }
        return false;
    }

    /**
     * Kiểm tra đường ngang từ y1 đến y2 tại hàng x
     */
    protected boolean checkLineX(int y1, int y2, int x) {
        if (x < 0 || x >= row) return false;

        int minY = Math.min(y1, y2);
        int maxY = Math.max(y1, y2);

        for (int y = minY + 1; y < maxY; y++) {
            if (y >= 0 && y < col) {
                if (matrix[x][y] != 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Kiểm tra đường dọc từ x1 đến x2 tại cột y
     */
    protected boolean checkLineY(int x1, int x2, int y) {
        if (y < 0 || y >= col) return false;

        int minX = Math.min(x1, x2);
        int maxX = Math.max(x1, x2);

        for (int x = minX + 1; x < maxX; x++) {
            if (x >= 0 && x < row) {
                if (matrix[x][y] != 0) {
                    return false;
                }
            }
        }
        return true;
    }
}