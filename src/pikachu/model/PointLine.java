package pikachu.model;

import java.awt.Point;

/**
 * Class đại diện cho đường nối giữa 2 điểm
 * (Hiện tại không còn được sử dụng vì đã chuyển sang dùng List<Point> để lưu path)
 */
public class PointLine {
    public Point p1;
    public Point p2;

    public PointLine(Point p1, Point p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    @Override
    public String toString() {
        return "PointLine[(" + p1.x + "," + p1.y + ") -> (" + p2.x + "," + p2.y + ")]";
    }
}