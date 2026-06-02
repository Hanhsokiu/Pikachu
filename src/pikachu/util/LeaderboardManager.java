package pikachu.util;

import java.io.*;
import java.util.*;

public class LeaderboardManager {
    private static final String FILE_NAME = "leaderboard.txt";
    private static final Map<String, List<RankEntry>> rankings = new HashMap<>();

    static {
        loadFromFile();
    }

    public static synchronized void loadFromFile() {
        rankings.clear();
        File file = new File(FILE_NAME);
        if (!file.exists()) return;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(file), "UTF-8"))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\|");
                if (parts.length == 4) {
                    String category = parts[0].trim();
                    String name = parts[1].trim();
                    int score = Integer.parseInt(parts[2].trim());
                    int time = Integer.parseInt(parts[3].trim());

                    rankings.computeIfAbsent(category, k -> new ArrayList<>())
                            .add(new RankEntry(name, score, time));
                }
            }
            // Sắp xếp mọi danh mục sau khi load
            for (List<RankEntry> list : rankings.values()) {
                Collections.sort(list);
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi load bảng xếp hạng: " + e.getMessage());
        }
    }

    public static synchronized void saveToFile() {
        try (PrintWriter pw = new PrintWriter(new OutputStreamWriter(new FileOutputStream(FILE_NAME), "UTF-8"))) {
            for (Map.Entry<String, List<RankEntry>> entry : rankings.entrySet()) {
                String category = entry.getKey();
                for (RankEntry r : entry.getValue()) {
                    pw.println(category + "|" + r.getName() + "|" + r.getScore() + "|" + r.getTime());
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi lưu bảng xếp hạng: " + e.getMessage());
        }
    }

    public static synchronized boolean nameExists(String category, String name) {
        List<RankEntry> list = rankings.get(category);
        if (list == null) return false;
        for (RankEntry entry : list) {
            if (entry.getName().equalsIgnoreCase(name)) {
                return true;
            }
        }
        return false;
    }

    public static synchronized void addEntry(String category, String name, int score, int time) {
        rankings.computeIfAbsent(category, k -> new ArrayList<>())
                .add(new RankEntry(name, score, time));
        Collections.sort(rankings.get(category));
        saveToFile();
    }

    public static synchronized List<RankEntry> getRankings(String category) {
        List<RankEntry> list = rankings.get(category);
        if (list == null) return new ArrayList<>();
        return new ArrayList<>(list); // Trả về bản sao
    }
}
