/**
 * DBT Quiz Show - Audio Engine (Web Audio API Synthesizer)
 * สร้างเสียงสังเคราะห์คุณภาพสูงโดยตรงในเบราว์เซอร์ ไม่ต้องพึ่งพาไฟล์เสียงภายนอก
 */

class QuizAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem('dbt_quiz_muted') === 'true';
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('dbt_quiz_muted', this.isMuted);
        return this.isMuted;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2, detune = 0) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.detune.setValueAtTime(detune, this.ctx.currentTime);

            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error('Audio play error:', e);
        }
    }

    // เสียงนับถอยหลังปกติ
    playTick() {
        if (this.isMuted) return;
        this.playTone(800, 'triangle', 0.05, 0.08);
    }

    // เสียงนับถอยหลังช่วงใกล้หมดเวลา (ตื่นเต้น / เร่งเร้า)
    playUrgentTick() {
        if (this.isMuted) return;
        this.playTone(1200, 'square', 0.08, 0.12);
    }

    // เสียงคลิกเลือกตัวเลือก
    playSelect() {
        if (this.isMuted) return;
        this.playTone(520, 'sine', 0.08, 0.15);
    }

    // เสียงตอบถูกต้อง (Chime แจ่มใส 4 โน้ต)
    playCorrect() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.2, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.3);
        });
    }

    // เสียงตอบผิด (Buzzer หม่น 2 จังหวะ)
    playWrong() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [311.13, 277.18]; // Eb4 -> Db4 (Low dissonant)
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15);
            gain.gain.setValueAtTime(0.15, now + idx * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 0.25);
        });
    }

    // เสียงจบเกม ได้ผลลัพธ์ระดับยอดเยี่ยม (Fanfare ชนะ)
    playVictory() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const melody = [
            { f: 523.25, t: 0.0, d: 0.15 },
            { f: 523.25, t: 0.15, d: 0.15 },
            { f: 523.25, t: 0.30, d: 0.15 },
            { f: 659.25, t: 0.45, d: 0.35 },
            { f: 783.99, t: 0.80, d: 0.2 },
            { f: 1046.50, t: 1.00, d: 0.6 }
        ];

        melody.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, now + note.t);
            gain.gain.setValueAtTime(0.22, now + note.t);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + note.t);
            osc.stop(now + note.t + note.d);
        });
    }

    // เสียงเวลาหมด (Time's Up)
    playTimeout() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

const quizAudio = new QuizAudioEngine();
