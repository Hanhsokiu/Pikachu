package pikachu.controller;

import java.awt.Point;
import java.util.ArrayList;
import java.util.Random;
import java.util.List;

public class OverloadController extends Controller {
    private final long[][] spawnTime;
    private final int[][] specialType; // 0: normal, 1: Energy, 2: Bomb, 3: Freeze, 4: Corrupted, 5: Unstable (Infected)
    private final Random rand = new Random();
    private int unstableThreshold = 35;
    private int corruptedThreshold = 70;
    private int spreadInterval = 25; // Chu kỳ lây lan sang các ô lân cận (giây)
    private long nextInfectionStartTime = 0; // Thời điểm dịch bệnh tái phát khi bàn cờ sạch bóng lây nhiễm
    private long nextInfectionReplenishTime = 0; // Thời điểm bổ sung ổ dịch khi người chơi tiêu diệt bớt nhưng chưa hết

    public OverloadController(int row, int col) {
        super(row, col, 1, true); // Sử dụng difficulty = 1 (15 loại hình) làm mặc định cho Overload
        this.spawnTime = new long[row][col];
        this.specialType = new int[row][col];
        
        // Khởi tạo bàn cờ sinh tồn hoàn toàn lành mạnh ở giây đầu tiên
        long now = System.currentTimeMillis();
        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] != 0) {
                    spawnTime[r][c] = now;
                    specialType[r][c] = 0;
                }
            }
        }
    }

    public long getSpawnTime(int r, int c) {
        return spawnTime[r][c];
    }

    public void setSpawnTime(int r, int c, long time) {
        spawnTime[r][c] = time;
    }

    public int getSpecialType(int r, int c) {
        return specialType[r][c];
    }

    public void setSpecialType(int r, int c, int type) {
        specialType[r][c] = type;
    }

    public int getUnstableThreshold() {
        return unstableThreshold;
    }

    public void setUnstableThreshold(int unstableThreshold) {
        this.unstableThreshold = unstableThreshold;
    }

    public int getCorruptedThreshold() {
        return corruptedThreshold;
    }

    public void setCorruptedThreshold(int corruptedThreshold) {
        this.corruptedThreshold = corruptedThreshold;
    }

    public int getSpreadInterval() {
        return spreadInterval;
    }

    public void setSpreadInterval(int spreadInterval) {
        this.spreadInterval = spreadInterval;
    }

    /**
     * Cập nhật trạng thái lây nhiễm:
     * 1. Lão hóa và lây lan dịch bệnh từ cờ lây nhiễm (type 5, 4) sang cờ lành bên cạnh.
     * 2. Quản lý việc tái sinh một ổ dịch mới (1 ô nhiễm) sau 10 giây hòa bình nếu bàn cờ sạch dịch.
     */
    public void decayTiles(int spawnCount) {
        long now = System.currentTimeMillis();
        
        // Bản sao tạm thời để lây lan đồng bộ (tránh cờ mới nhiễm lan tiếp ngay lập tức trong 1 chu kỳ)
        int[][] tempSpecial = new int[row][col];
        for (int r = 0; r < row; r++) {
            System.arraycopy(specialType[r], 0, tempSpecial[r], 0, col);
        }

        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] != 0) {
                    int type = specialType[r][c];
                    if (type == 5) { // Unstable (Infected)
                        long age = (now - spawnTime[r][c]) / 1000;
                        
                        // Đột biến thành Corrupted nếu quá tuổi chịu đựng
                        if (age >= corruptedThreshold) {
                            tempSpecial[r][c] = 4; // Biến thành cờ độc hại
                            spawnTime[r][c] = now;  // Reset chu kỳ spread cho cờ Corrupted
                        } else if (age > 0 && age % spreadInterval == 0) {
                            spreadFrom(r, c, tempSpecial);
                        }
                    } else if (type == 4) { // Corrupted Tile (vẫn tiếp tục lây lan)
                        long age = (now - spawnTime[r][c]) / 1000;
                        if (age > 0 && age % spreadInterval == 0) {
                            spreadFrom(r, c, tempSpecial);
                        }
                    }
                }
            }
        }
        
        // Cập nhật lại ma trận cờ đặc biệt chính
        for (int r = 1; r < row - 1; r++) {
            System.arraycopy(tempSpecial[r], 0, specialType[r], 0, col);
        }

        // Đếm số lượng ổ dịch (connected components) hiện có
        int infectedClustersCount = getInfectedClustersCount();

        // Quản lý việc nảy mầm / bổ sung ổ dịch mới khi lưới sạch bóng hoặc bị tiêu diệt bớt cờ nhiễm
        if (infectedClustersCount == 0) {
            nextInfectionReplenishTime = 0; // Hủy bổ sung khi sạch bóng dịch
            if (nextInfectionStartTime == 0) {
                nextInfectionStartTime = now + 10000; // 10 giây hòa bình tuyệt đối
            } else if (now >= nextInfectionStartTime) {
                spawnNewInfection(spawnCount);
                nextInfectionStartTime = 0;
            }
        } else if (infectedClustersCount < spawnCount) {
            nextInfectionStartTime = 0; // Không yên bình tuyệt đối
            if (nextInfectionReplenishTime == 0) {
                nextInfectionReplenishTime = now + 10000; // 10 giây hồi sinh ổ dịch bị khuyết
            } else if (now >= nextInfectionReplenishTime) {
                spawnNewInfection(spawnCount - infectedClustersCount);
                nextInfectionReplenishTime = 0;
            }
        } else {
            nextInfectionStartTime = 0;
            nextInfectionReplenishTime = 0;
        }
    }

    /**
     * Đếm số lượng các cụm lây nhiễm (ổ dịch) độc lập bằng DFS
     */
    public int getInfectedClustersCount() {
        boolean[][] visited = new boolean[row][col];
        int count = 0;
        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] != 0 && (specialType[r][c] == 4 || specialType[r][c] == 5)) {
                    if (!visited[r][c]) {
                        count++;
                        dfsMark(r, c, visited);
                    }
                }
            }
        }
        return count;
    }

    private void dfsMark(int r, int c, boolean[][] visited) {
        visited[r][c] = true;
        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};
        for (int i = 0; i < 4; i++) {
            int nr = r + dr[i];
            int nc = c + dc[i];
            if (nr >= 1 && nr < row - 1 && nc >= 1 && nc < col - 1) {
                if (matrix[nr][nc] != 0 && (specialType[nr][nc] == 4 || specialType[nr][nc] == 5)) {
                    if (!visited[nr][nc]) {
                        dfsMark(nr, nc, visited);
                    }
                }
            }
        }
    }

    /**
     * Lây lan virus từ ô (r, c) sang tất cả các ô cờ thường lành mạnh xung quanh (4 hướng)
     */
    private void spreadFrom(int r, int c, int[][] tempSpecial) {
        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};
        for (int i = 0; i < 4; i++) {
            int nr = r + dr[i];
            int nc = c + dc[i];
            if (nr >= 1 && nr < row - 1 && nc >= 1 && nc < col - 1) {
                // Chỉ lây lan sang ô Pikachu lành tính (matrix != 0 và type == 0)
                if (matrix[nr][nc] != 0 && specialType[nr][nc] == 0 && tempSpecial[nr][nc] == 0) {
                    tempSpecial[nr][nc] = 5; // Type 5: Unstable (Infected)
                    spawnTime[nr][nc] = System.currentTimeMillis();
                }
            }
        }
    }

    /**
     * Sinh một ô lây lây nhiễm ngẫu nhiên để khởi đầu một chu kỳ bùng dịch mới.
     * Ưu tiên sinh ở những ô cách xa các cụm lây nhiễm hiện tại để đảm bảo ổ dịch mới độc lập.
     */
    public void spawnNewInfection(int count) {
        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        for (int step = 0; step < count; step++) {
            List<Point> farTiles = new ArrayList<>();
            List<Point> adjacentTiles = new ArrayList<>();

            for (int r = 1; r < row - 1; r++) {
                for (int c = 1; c < col - 1; c++) {
                    if (matrix[r][c] != 0 && specialType[r][c] == 0) {
                        boolean isAdjacent = false;
                        for (int i = 0; i < 4; i++) {
                            int nr = r + dr[i];
                            int nc = c + dc[i];
                            if (nr >= 1 && nr < row - 1 && nc >= 1 && nc < col - 1) {
                                if (matrix[nr][nc] != 0 && (specialType[nr][nc] == 4 || specialType[nr][nc] == 5)) {
                                    isAdjacent = true;
                                    break;
                                }
                            }
                        }
                        if (isAdjacent) {
                            adjacentTiles.add(new Point(r, c));
                        } else {
                            farTiles.add(new Point(r, c));
                        }
                    }
                }
            }

            List<Point> candidates = farTiles.isEmpty() ? adjacentTiles : farTiles;
            if (!candidates.isEmpty()) {
                java.util.Collections.shuffle(candidates);
                Point p = candidates.get(0);
                specialType[p.x][p.y] = 5; // Bắt đầu ổ dịch: Type 5
                spawnTime[p.x][p.y] = System.currentTimeMillis();
            } else {
                break; // Hết ô cờ lành tính để lây lan
            }
        }
    }

    /**
     * Thanh tẩy toàn bộ các quân cờ đang ở trạng thái Unstable (type 5) trên lưới cờ
     * đưa chúng về cờ thường lành tính (type 0)
     */
    public int cleanseUnstableTiles() {
        int cleansedCount = 0;
        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] != 0 && specialType[r][c] == 5) {
                    specialType[r][c] = 0;
                    spawnTime[r][c] = System.currentTimeMillis();
                    cleansedCount++;
                }
            }
        }
        return cleansedCount;
    }

    /**
     * Sinh một làn sóng cờ mới (pairCount cặp quân mới = pairCount * 2 ô) vào các vùng trống tối ưu nhất
     */
    public boolean spawnOverloadWave(int pairCount) {
        int tileCount = pairCount * 2;
        // 1. Thu thập tất cả các ô trống trên lưới chơi (không tính viền)
        List<Point> emptyCells = new ArrayList<>();
        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] == 0) {
                    emptyCells.add(new Point(r, c));
                }
            }
        }

        // Nếu không đủ ô trống hoặc bàn cờ quá đầy (dưới 24 ô trống), dừng sinh wave mới
        if (emptyCells.size() < 24 || emptyCells.size() < tileCount) {
            return false; 
        }

        // 2. Chia ô trống và chọn ngẫu nhiên các ô trống
        java.util.Collections.shuffle(emptyCells);
        List<Point> spawnPoints = new ArrayList<>();
        for (int i = 0; i < tileCount; i++) {
            spawnPoints.add(emptyCells.get(i));
        }

        // 3. Chọn các loại icon ngẫu nhiên để sinh cặp cờ
        int[] icons = new int[pairCount];
        for (int i = 0; i < pairCount; i++) {
            icons[i] = rand.nextInt(15) + 1; // 15 loại icon
        }

        // Thử sinh cờ đảm bảo bàn cờ luôn có ít nhất 1 nước đi thắng
        int[][] backupMatrix = new int[row][col];
        for (int r = 0; r < row; r++) {
            System.arraycopy(matrix[r], 0, backupMatrix[r], 0, col);
        }

        long now = System.currentTimeMillis();
        boolean validSpawnFound = false;

        // Thử tối đa 10 lần sinh ngẫu nhiên để tìm tổ hợp có nước đi
        for (int attempt = 0; attempt < 10; attempt++) {
            // Gán các cặp cờ vào các ô trống
            for (int i = 0; i < pairCount; i++) {
                Point p1 = spawnPoints.get(i * 2);
                Point p2 = spawnPoints.get(i * 2 + 1);
                
                matrix[p1.x][p1.y] = icons[i];
                matrix[p2.x][p2.y] = icons[i];
                
                spawnTime[p1.x][p1.y] = now;
                spawnTime[p2.x][p2.y] = now;
                
                // 8% cơ hội xuất hiện Special Tile (Energy: 1, Bomb: 2, Freeze: 3)
                int randSpecial = rand.nextInt(100);
                if (randSpecial < 3) {
                    specialType[p1.x][p1.y] = 1; // Energy
                    specialType[p2.x][p2.y] = 1;
                } else if (randSpecial < 6) {
                    specialType[p1.x][p1.y] = 2; // Bomb
                    specialType[p2.x][p2.y] = 2;
                } else if (randSpecial < 8) {
                    specialType[p1.x][p1.y] = 3; // Freeze
                    specialType[p2.x][p2.y] = 3;
                } else {
                    specialType[p1.x][p1.y] = 0; // Normal
                    specialType[p2.x][p2.y] = 0;
                }
            }

            // Kiểm tra xem bàn cờ có nước đi khả thi không
            if (hasAvailableMoves()) {
                validSpawnFound = true;
                break;
            } else {
                // Rollback và đổi vị trí hoặc icon
                for (int r = 0; r < row; r++) {
                    System.arraycopy(backupMatrix[r], 0, matrix[r], 0, col);
                }
                java.util.Collections.shuffle(emptyCells);
                spawnPoints.clear();
                for (int i = 0; i < tileCount; i++) {
                    spawnPoints.add(emptyCells.get(i));
                }
                for (int i = 0; i < pairCount; i++) {
                    icons[i] = rand.nextInt(15) + 1;
                }
            }
        }

        // Nếu sau 10 lần thử vẫn không tìm được (rất hiếm), sinh ngẫu nhiên và tự động xáo trộn cờ bàn chơi
        if (!validSpawnFound) {
            for (int i = 0; i < pairCount; i++) {
                Point p1 = spawnPoints.get(i * 2);
                Point p2 = spawnPoints.get(i * 2 + 1);
                matrix[p1.x][p1.y] = icons[i];
                matrix[p2.x][p2.y] = icons[i];
                spawnTime[p1.x][p1.y] = now;
                spawnTime[p2.x][p2.y] = now;
                specialType[p1.x][p1.y] = 0;
                specialType[p2.x][p2.y] = 0;
            }
            shuffleMatrix();
        }

        return true;
    }

    public int getEmptyCellsCount() {
        int count = 0;
        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] == 0) {
                    count++;
                }
            }
        }
        return count;
    }

    public int getCorruptedCount() {
        int count = 0;
        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] != 0 && specialType[r][c] == 4) {
                    count++;
                }
            }
        }
        return count;
    }

    public int getUnstableCount() {
        int count = 0;
        for (int r = 1; r < row - 1; r++) {
            for (int c = 1; c < col - 1; c++) {
                if (matrix[r][c] != 0 && specialType[r][c] == 5) {
                    count++;
                }
            }
        }
        return count;
    }
}
