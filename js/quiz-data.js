/**
 * DBT Quiz Show - คลังข้อสอบเริ่มต้น (Curated Default Question Bank)
 * รายวิชา: สื่อสร้างสรรค์ธุรกิจดิจิทัล (Creative Digital Business Media)
 * หัวข้อ: ขนาดภาพ (Shot Sizes) และ มุมกล้อง (Camera Angles)
 */

const SHOT_SIZES_INFO = {
    ELS: { code: 'ELS', nameEn: 'Extreme Long Shot', nameTh: 'ภาพระยะไกลมาก', desc: 'เห็นวิวทิวทัศน์กว้างใหญ่ ตัวละครมีขนาดเล็กมาก เน้นบอกสถานที่ บรรยากาศ และบริบท' },
    LS:  { code: 'LS',  nameEn: 'Long Shot',         nameTh: 'ภาพระยะไกล (เต็มตัว)', desc: 'เห็นร่างกายตั้งแต่หัวจรดเท้าพร้อมสภาพแวดล้อมรอบตัว' },
    MLS: { code: 'MLS', nameEn: 'Medium Long Shot',   nameTh: 'ภาพระยะปานกลางไกล (Knee Shot)', desc: 'ตัดกรอบภาพตั้งแต่หัวเข่าขึ้นไปจนถึงศีรษะ' },
    MS:  { code: 'MS',  nameEn: 'Medium Shot',        nameTh: 'ภาพระยะปานกลาง (Waist Shot)', desc: 'ตัดกรอบภาพตั้งแต่ระดับเอวขึ้นไปจนถึงศีรษะ นิยมในฉากสนทนาและงานข่าว' },
    MCU: { code: 'MCU', nameEn: 'Medium Close-Up',   nameTh: 'ภาพระยะใกล้ปานกลาง (Chest Shot)', desc: 'ตัดกรอบภาพตั้งแต่ระดับหน้าอกขึ้นไป เห็นสีหน้าท่าทางชัดเจนขึ้น' },
    CU:  { code: 'CU',  nameEn: 'Close-Up',           nameTh: 'ภาพระยะใกล้', desc: 'ตัดกรอบภาพตั้งแต่ระดับไหล่/ไหปลาร้าถึงศีรษะ เน้นอารมณ์และสายตาของตัวละคร' },
    BCU: { code: 'BCU', nameEn: 'Big Close-Up',       nameTh: 'ภาพระยะใกล้พิเศษ (Choker)', desc: 'ตัดกรอบภาพตั้งแต่คางถึงหน้าผาก เน้นอารมณ์บีบคั้นรุนแรง ชวนอึดอัด' },
    ECU: { code: 'ECU', nameEn: 'Extreme Close-Up',   nameTh: 'ภาพระยะใกล้มาก', desc: 'เจาะจงเฉพาะจุดสำคัญ เช่น ดวงตา, ริมฝีปาก, นิ้วมือ หรือรายละเอียดวัตถุ' }
};

const CAMERA_ANGLES_INFO = {
    BIRDS_EYE: { code: 'BIRDS_EYE', nameEn: "Bird's Eye View / Aerial Shot", nameTh: 'มุมมองนกมอง / มุมมองทางอากาศ', desc: 'มุมกล้องตั้งฉาก 90 องศาจากด้านบน ให้ภาพรวมแผนผัง ทัศนียภาพกว้าง' },
    HIGH:      { code: 'HIGH',      nameEn: 'High Angle',                  nameTh: 'มุมสูง (กล้องก้มลง)', desc: 'กล้องอยู่สูงกว่าสายตาแล้วก้มลงมา ทำให้ตัวละครดูเล็ก อ่อนแอ ไร้อำนาจ น่าสงสาร' },
    EYE_LEVEL: { code: 'EYE_LEVEL', nameEn: 'Eye Level Angle',             nameTh: 'มุมระดับสายตา', desc: 'กล้องระนาบตรงกับสายตา ให้ความรู้สึกเป็นธรรมชาติ เสมอภาค และเป็นกลาง' },
    LOW:       { code: 'LOW',       nameEn: 'Low Angle',                   nameTh: 'มุมต่ำ (กล้องแหงนขึ้น)', desc: 'กล้องอยู่ต่ำกว่าสายตาแหงนขึ้น ทำให้ตัวละครดูยิ่งใหญ่ ทรงพลัง น่าเกรงขาม มีอำนาจ' },
    WORMS_EYE: { code: 'WORMS_EYE', nameEn: "Worm's Eye View",              nameTh: 'มุมมองหนอนมอง', desc: 'กล้องติดพื้นดินแล้วแหงนขึ้น 90 องศา ให้ความรู้สึกอลังการ โอ่อ่า และเหนือจริง' },
    DUTCH:     { code: 'DUTCH',     nameEn: 'Dutch Angle / Canted Angle',  nameTh: 'มุมเอียง / มุมเฉียง', desc: 'มุมกล้องเอียงข้าง สร้างความรู้สึกตึงเครียด ไม่มั่นคง สับสน หรือจิตใจผิดปกติ' },
    OTS:       { code: 'OTS',       nameEn: 'Over the Shoulder (OTS)',     nameTh: 'มุมมองข้ามไหล่', desc: 'กล้องถ่ายผ่านหลังไหล่คนหนึ่งไปยังอีกคน นิยมในฉากสนทนาระหว่าง 2 คน' },
    POV:       { code: 'POV',       nameEn: 'Point of View (POV)',         nameTh: 'มุมมองสายตาตัวละคร', desc: 'กล้องแทนสายตาของตัวละคร ให้ผู้ชมรู้สึกเสมือนอยู่ในเหตุการณ์จริง' }
};

// ชุดคำถามตัวอย่างเริ่มต้น พร้อมรูปภาพชัดเจนและคำอธิบาย
const DEFAULT_QUESTIONS = [
    // ----------------------------------------------------
    // หมวดที่ 1: ขนาดภาพ (Shot Sizes)
    // ----------------------------------------------------
    {
        id: 'q-ss-01',
        category: 'shot_size',
        title: 'ภาพนี้ใช้ "ขนาดภาพ (Shot Size)" แบบใด?',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        options: [
            'ELS - Extreme Long Shot (ภาพระยะไกลมาก)',
            'MS - Medium Shot (ภาพระยะปานกลาง)',
            'CU - Close-Up (ภาพระยะใกล้)',
            'ECU - Extreme Close-Up (ภาพระยะใกล้มาก)'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: 'เป็น Extreme Long Shot (ELS) เพราะเน้นการโชว์ทัศนียภาพกว้างใหญ่เพื่อบอกบริบทและสถานที่ สเกลตัวแบบมีขนาดเล็กมากเมื่อเทียบกับสิ่งแวดล้อม'
    },
    {
        id: 'q-ss-02',
        category: 'shot_size',
        title: 'ภาพตัวละครยืนเต็มตัวตั้งแต่หัวจรดเท้า จัดเป็นขนาดภาพแบบใด?',
        imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
        options: [
            'MCU - Medium Close-Up',
            'LS - Long Shot (ภาพระยะไกล / เต็มตัว)',
            'BCU - Big Close-Up',
            'ELS - Extreme Long Shot'
        ],
        correctIndex: 1,
        timeLimit: 15,
        explanation: 'Long Shot (LS) หรือ Full Shot จะแสดงรูปร่างของบุคคลตั้งแต่ศีรษะจรดปลายเท้า ให้เห็นอิริยาบถและการแต่งกายชัดเจนควบคู่กับฉากหลัง'
    },
    {
        id: 'q-ss-03',
        category: 'shot_size',
        title: 'ภาพนี้ตัดกรอบตั้งแต่ "ระดับหัวเข่าขึ้นไปจนถึงศีรษะ" เรียกว่าอะไร?',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
        options: [
            'CU - Close-Up',
            'MLS - Medium Long Shot (Knee Shot)',
            'ECU - Extreme Close-Up',
            'ELS - Extreme Long Shot'
        ],
        correctIndex: 1,
        timeLimit: 15,
        explanation: 'Medium Long Shot (MLS) หรือ Knee Shot เป็นขนาดภาพตัดระดับหัวเข่าถึงศีรษะ ให้เห็นทั้งการเคลื่อนไหวของร่างกายและสีหน้าไปพร้อมกัน'
    },
    {
        id: 'q-ss-04',
        category: 'shot_size',
        title: 'ขนาดภาพยอดนิยมในการรายงานข่าวและบทสนทนา ตัดระดับ "เอวถึงศีรษะ" คือข้อใด?',
        imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
        options: [
            'MS - Medium Shot (Waist Shot)',
            'BCU - Big Close-Up',
            'LS - Long Shot',
            'ECU - Extreme Close-Up'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: 'Medium Shot (MS) หรือ Waist Shot ตัดภาพตั้งแต่เอวถึงศีรษะ เป็นขนาดภาพพื้นฐานที่นิยมที่สุดในงานวิดีโอ การสัมภาษณ์ และผู้ประกาศข่าว'
    },
    {
        id: 'q-ss-05',
        category: 'shot_size',
        title: 'ภาพที่ตัดกรอบตั้งแต่ "ระดับหน้าอกขึ้นไป" (Chest Shot) คือขนาดภาพใด?',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
        options: [
            'MLS - Medium Long Shot',
            'MCU - Medium Close-Up',
            'ELS - Extreme Long Shot',
            'ECU - Extreme Close-Up'
        ],
        correctIndex: 1,
        timeLimit: 15,
        explanation: 'Medium Close-Up (MCU) จะจับภาพตั้งแต่ระดับหน้าอกขึ้นไป ช่วยดึงความสนใจมาที่สีหน้าท่าทางและบทสนทนาได้ชัดเจนขึ้น'
    },
    {
        id: 'q-ss-06',
        category: 'shot_size',
        title: 'ภาพเจาะเน้นใบหน้าตั้งแต่ "ระดับไหล่ถึงศีรษะ" เพื่อถ่ายทอดอารมณ์ความรู้สึก คือขนาดภาพใด?',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=80',
        options: [
            'CU - Close-Up (ภาพระยะใกล้)',
            'LS - Long Shot',
            'MS - Medium Shot',
            'ELS - Extreme Long Shot'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: 'Close-Up (CU) เป็นการถ่ายภาพระยะใกล้ตั้งแต่ระดับไหล่ถึงศีรษะ เน้นสีหน้า แววตา และการแสดงอารมณ์ของนักแสดงอย่างเด่นชัด'
    },
    {
        id: 'q-ss-07',
        category: 'shot_size',
        title: 'ภาพเจาะจงเฉพาะ "ดวงตา" หรือชิ้นส่วนเล็กๆ อย่างชัดเจน เรียกว่าขนาดภาพใด?',
        imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1000&q=80',
        options: [
            'MCU - Medium Close-Up',
            'LS - Long Shot',
            'ECU - Extreme Close-Up (ภาพระยะใกล้มาก)',
            'MS - Medium Shot'
        ],
        correctIndex: 2,
        timeLimit: 15,
        explanation: 'Extreme Close-Up (ECU) เป็นการซูมหรือถ่ายเจาะเฉพาะจุดสำคัญ เช่น ดวงตา, นาฬิกา, นิ้วมือ เพื่อเน้นรายละเอียดสูงสุด'
    },
    {
        id: 'q-ss-08',
        category: 'shot_size',
        title: 'ภาพที่ตัดกรอบแน่นมากตั้งแต่ "หน้าผากจรดปลายคาง" (Choker) สร้างความรู้สึกกดดัน คือข้อใด?',
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
        options: [
            'BCU - Big Close-Up',
            'MLS - Medium Long Shot',
            'ELS - Extreme Long Shot',
            'LS - Long Shot'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: 'Big Close-Up (BCU) หรือ Choker จะตัดกรอบตั้งแต่คางถึงหน้าผาก เพื่อบีบอารมณ์ผู้ชมให้รู้สึกตึงเครียดหรือสัมผัสความรู้สึกข้างในของตัวละคร'
    },

    // ----------------------------------------------------
    // หมวดที่ 2: มุมกล้อง (Camera Angles)
    // ----------------------------------------------------
    {
        id: 'q-ca-01',
        category: 'camera_angle',
        title: 'ภาพมุมมองจากด้านบนตรง 90 องศาลงมา (เหมือนมุมมองนกมองจากท้องฟ้า) คือมุมกล้องใด?',
        imageUrl: 'https://drive.google.com/file/d/1t0JaVaVkULyXvvayowoDEFdi1ZZnss81/view?usp=sharing',
        options: [
            "Bird's Eye View / Aerial Shot",
            'Low Angle (มุมต่ำ)',
            'Worm’s Eye View (มุมหนอนมอง)',
            'Dutch Angle (มุมเอียง)'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: "Bird's Eye View (มุมมองนกมอง หรือ Aerial Shot) คือการถ่ายภาพมุมสูงตรง 90 องศาลงมา มักใช้โดรนหรือเครน เพื่อแสดงผังเมืองหรือภาพรวมทั้งหมด"
    },
    {
        id: 'q-ca-02',
        category: 'camera_angle',
        title: 'กล้องอยู่สูงกว่าตัวละครแล้ว "ก้มหน้ากล้องลงมา" ทำให้ตัวละครดูตัวเล็ก ด้อยค่า หรือน่าสงสาร คือมุมกล้องใด?',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
        options: [
            'Low Angle (มุมต่ำ)',
            'High Angle (มุมสูง)',
            'Eye Level (มุมระดับสายตา)',
            'Worm’s Eye View (มุมหนอนมอง)'
        ],
        correctIndex: 1,
        timeLimit: 15,
        explanation: 'High Angle (มุมสูง) จะวางกล้องสูงกว่าแล้วกดมุมก้มลงมา สื่อความหมายเชิงสัญลักษณ์ให้ตัวละครดูอ่อนแอ ตกเป็นเบี้ยล่าง หรือไร้อำนาจ'
    },
    {
        id: 'q-ca-03',
        category: 'camera_angle',
        title: 'มุมกล้องที่วางอยู่ในระนาบเดียวกับสายตา ให้ความรู้สึกเป็นกลาง สมจริง และเป็นธรรมชาติ คือมุมใด?',
        imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1000&q=80',
        options: [
            'Eye Level (มุมระดับสายตา)',
            'High Angle (มุมสูง)',
            'Dutch Angle (มุมเอียง)',
            'Bird’s Eye View'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: 'Eye Level (มุมระดับสายตา) เป็นมุมกล้องพื้นฐานที่วางขนานกับระดับสายตามนุษย์ สื่อถึงความเสมอภาค เป็นกลาง และเป็นธรรมชาติมากที่สุด'
    },
    {
        id: 'q-ca-04',
        category: 'camera_angle',
        title: 'กล้องอยู่ต่ำกว่าระดับสายตาแล้ว "แหงนหน้ากล้องขึ้น" เพื่อทำให้ตัวละครดูยิ่งใหญ่ มีอำนาจ น่าเกรงขาม คือมุมกล้องใด?',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
        options: [
            'High Angle (มุมสูง)',
            'Low Angle (มุมต่ำ)',
            'Over the Shoulder (มุมข้ามไหล่)',
            'Dutch Angle (มุมเอียง)'
        ],
        correctIndex: 1,
        timeLimit: 15,
        explanation: 'Low Angle (มุมต่ำ) จะวางกล้องต่ำแล้วเงยขึ้น ทำให้วัตถุหรือตัวละครดูสูงตระหง่าน มีพลัง อำนาจ หรือความน่าเกรงขาม'
    },
    {
        id: 'q-ca-05',
        category: 'camera_angle',
        title: 'มุมกล้องที่วางกล้องแนบติดพื้นดิน แล้วแหงนหน้ากล้องขึ้นไป 90 องศา ให้ภาพอลังการตระการตา เรียกว่าอะไร?',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        options: [
            "Worm's Eye View (มุมมองหนอนมอง)",
            "Bird's Eye View (มุมมองนกมอง)",
            'Eye Level (มุมระดับสายตา)',
            'High Angle (มุมสูง)'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: "Worm's Eye View (มุมมองหนอนมอง) คือมุมที่กล้องอยู่ติดพื้นดินที่สุดแล้วเงยขึ้น มักใช้ถ่ายตึกสูง ต้นไม้ใหญ่ หรือสิ่งก่อสร้างให้อลังการ"
    },
    {
        id: 'q-ca-06',
        category: 'camera_angle',
        title: 'การเอียงแกนกล้องเฉียง (Canted / Oblique) เพื่อสื่อถึงความตึงเครียด ไม่มั่นคง จิตใจปั่นป่วน คือมุมกล้องใด?',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80',
        options: [
            'Dutch Angle (Canted Angle / มุมเอียง)',
            'Eye Level (มุมระดับสายตา)',
            'Over the Shoulder',
            'High Angle'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: 'Dutch Angle (มุมเอียง) มีการเอียงเส้นขอบฟ้า สร้างความรู้สึกไม่ปลอดภัย สับสน วิตกกังวล หรือโลกกำลังเสียสมดุล'
    },
    {
        id: 'q-ca-07',
        category: 'camera_angle',
        title: 'มุมกล้องที่ถ่ายจากด้านหลังโดยมี "หัวไหล่หรือศีรษะ" ของตัวละครหนึ่งบังอยู่ในเฟรมเพื่อคุยกับอีกคน คือมุมใด?',
        imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1000&q=80',
        options: [
            'Over the Shoulder (OTS / มุมมองข้ามไหล่)',
            'Point of View (POV)',
            "Bird's Eye View",
            'Worm’s Eye View'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: 'Over the Shoulder (OTS) คือมุมมองข้ามหัวไหล่ตัวละคร ช่วยสร้างความเชื่อมโยงในบทสนทนาระหว่าง 2 คนได้เป็นธรรมชาติ'
    },
    {
        id: 'q-ca-08',
        category: 'camera_angle',
        title: 'มุมกล้องที่ "จำลองสายตาของตัวละคร" เสมือนว่าผู้ชมกำลังมองผ่านดวงตาตัวละครนั้นจริง ๆ เรียกว่าอะไร?',
        imageUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=80',
        options: [
            'Point of View (POV / มุมมองสายตาตัวละคร)',
            'Over the Shoulder (OTS)',
            'High Angle',
            'Low Angle'
        ],
        correctIndex: 0,
        timeLimit: 15,
        explanation: 'Point of View (POV) ทำให้ผู้ชมได้รับประสบการณ์เสมือนเป็นตัวละครนั้นจริง ๆ เช่น มองเห็นมือตัวเองกำลังหยิบของ หรือมองเห็นสิ่งที่ตัวละครจ้องอยู่'
    }
];

class QuizDataManager {
    constructor() {
        this.storageKey = 'dbt_quiz_questions_v2';
        this.resultsKey = 'dbt_quiz_results_v1';
    }

    getQuestions() {
        const custom = localStorage.getItem(this.storageKey);
        if (custom) {
            try {
                const parsed = JSON.parse(custom);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.error('Error loading custom questions:', e);
            }
        }
        return [...DEFAULT_QUESTIONS];
    }

    saveQuestions(questions) {
        localStorage.setItem(this.storageKey, JSON.stringify(questions));
    }

    resetToDefault() {
        localStorage.removeItem(this.storageKey);
        return [...DEFAULT_QUESTIONS];
    }

    addQuestion(q) {
        const list = this.getQuestions();
        const newQuestion = {
            id: 'q-' + Date.now(),
            category: q.category || 'shot_size',
            title: q.title,
            imageUrl: q.imageUrl,
            options: q.options,
            correctIndex: parseInt(q.correctIndex, 10),
            timeLimit: parseInt(q.timeLimit, 10) || 15,
            explanation: q.explanation || ''
        };
        list.push(newQuestion);
        this.saveQuestions(list);
        return newQuestion;
    }

    updateQuestion(id, updatedData) {
        const list = this.getQuestions();
        const index = list.findIndex(q => q.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updatedData };
            this.saveQuestions(list);
            return list[index];
        }
        return null;
    }

    deleteQuestion(id) {
        let list = this.getQuestions();
        list = list.filter(q => q.id !== id);
        this.saveQuestions(list);
        return list;
    }

    // จัดการผลลัพธ์คะแนน (Quiz Results Store)
    getResults() {
        const res = localStorage.getItem(this.resultsKey);
        if (res) {
            try {
                return JSON.parse(res);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    saveResult(resultRecord) {
        const results = this.getResults();
        results.unshift(resultRecord);
        localStorage.setItem(this.resultsKey, JSON.stringify(results));
        return results;
    }

    clearResults() {
        localStorage.removeItem(this.resultsKey);
        return [];
    }
}

const quizData = new QuizDataManager();
