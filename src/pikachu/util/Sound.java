package pikachu.util;

import javax.sound.sampled.*;
import java.net.URL;

public class Sound {
    private Clip backgroundClip;
    private static boolean isMuted = false;

    /**
     * Tắt/bật tiếng toàn cục
     */
    public void toggleMute() {
        isMuted = !isMuted;
        if (isMuted) {
            pauseLoop();
        } else {
            resumeLoop();
        }
    }

    /**
     * Kiểm tra trạng thái tắt tiếng hiện tại
     */
    public boolean isMuted() {
        return isMuted;
    }

    /**
     * Phát âm thanh một lần
     */
    public void playSound(String soundFile) {
        if (isMuted) return;
        try {
            URL soundURL = getClass().getResource("/sounds/" + soundFile);
            if (soundURL == null) {
                System.err.println("⚠️ Không tìm thấy file âm thanh: " + soundFile);
                return;
            }

            AudioInputStream audioStream = AudioSystem.getAudioInputStream(soundURL);
            Clip clip = AudioSystem.getClip();
            clip.open(audioStream);

            // Tự động đóng clip sau khi phát xong
            clip.addLineListener(event -> {
                if (event.getType() == LineEvent.Type.STOP) {
                    clip.close();
                }
            });

            clip.start();
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi phát âm thanh: " + soundFile);
            e.printStackTrace();
        }
    }

    /**
     * Phát âm thanh lặp lại (dùng cho nhạc nền)
     */
    public void playLoop(String soundFile) {
        try {
            // Dừng nhạc nền cũ nếu đang phát
            if (backgroundClip != null && backgroundClip.isRunning()) {
                backgroundClip.stop();
                backgroundClip.close();
            }

            URL soundURL = getClass().getResource("/sounds/" + soundFile);
            if (soundURL == null) {
                System.err.println("⚠️ Không tìm thấy file âm thanh: " + soundFile);
                return;
            }

            AudioInputStream audioStream = AudioSystem.getAudioInputStream(soundURL);
            backgroundClip = AudioSystem.getClip();
            backgroundClip.open(audioStream);

            // Giảm âm lượng nhạc nền
            if (backgroundClip.isControlSupported(FloatControl.Type.MASTER_GAIN)) {
                FloatControl volumeControl = (FloatControl) backgroundClip.getControl(FloatControl.Type.MASTER_GAIN);
                volumeControl.setValue(-10.0f); // Giảm 10 dB
            }

            if (!isMuted) {
                backgroundClip.loop(Clip.LOOP_CONTINUOUSLY);
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi phát nhạc nền: " + soundFile);
            e.printStackTrace();
        }
    }

    /**
     * Dừng nhạc nền
     */
    public void stopLoop() {
        if (backgroundClip != null && backgroundClip.isRunning()) {
            backgroundClip.stop();
            backgroundClip.close();
            backgroundClip = null;
        }
    }

    /**
     * Tạm dừng nhạc nền
     */
    public void pauseLoop() {
        if (backgroundClip != null && backgroundClip.isRunning()) {
            backgroundClip.stop();
        }
    }

    /**
     * Tiếp tục nhạc nền
     */
    public void resumeLoop() {
        if (backgroundClip != null && !backgroundClip.isRunning()) {
            if (!isMuted) {
                backgroundClip.start();
                backgroundClip.loop(Clip.LOOP_CONTINUOUSLY);
            }
        }
    }
}