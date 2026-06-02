package pikachu.util;

public class RankEntry implements Comparable<RankEntry> {
    private String name;
    private int score;
    private int time; // in seconds

    public RankEntry(String name, int score, int time) {
        this.name = name;
        this.score = score;
        this.time = time;
    }

    public String getName() { return name; }
    public int getScore() { return score; }
    public int getTime() { return time; }

    @Override
    public int compareTo(RankEntry o) {
        // Sắp xếp giảm dần theo điểm số
        if (this.score != o.score) {
            return Integer.compare(o.score, this.score);
        }
        // Bằng điểm nhau thì sắp xếp tăng dần theo thời gian (thời gian ngắn hơn xếp trên)
        return Integer.compare(this.time, o.time);
    }
}
