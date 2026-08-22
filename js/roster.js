/**
 * DBT Quiz Show - ระบบจัดการรายชื่อนักศึกษา (Student Roster Manager)
 * รายวิชา: สื่อสร้างสรรค์ธุรกิจดิจิทัล (Creative Digital Business Media)
 */

const DEFAULT_STUDENTS = [
    { id: '6601001', name: 'กิตติศักดิ์ สุขสวัสดิ์', nickname: 'กิต' },
    { id: '6601002', name: 'จิราภรณ์ มณีรัตน์', nickname: 'เจน' },
    { id: '6601003', name: 'ชานนท์ สิทธิโชค', nickname: 'นนท์' },
    { id: '6601004', name: 'ณภัทร วัฒนพาณิชย์', nickname: 'ภัทร' },
    { id: '6601005', name: 'ธนกฤต ศรีมงคล', nickname: 'ท็อป' },
    { id: '6601006', name: 'นภัสสร รัตนวิจิตร', nickname: 'แนน' },
    { id: '6601007', name: 'ปฏิภาณ เกียรติเจริญ', nickname: 'กอล์ฟ' },
    { id: '6601008', name: 'พรปวีณ์ ภัทรเดช', nickname: 'ปุยฝ้าย' },
    { id: '6601009', name: 'วรัญญู พงษ์ศิริ', nickname: 'บอส' },
    { id: '6601010', name: 'ศิริลักษณ์ อัศวนนท์', nickname: 'มิ้นท์' },
    { id: '6601011', name: 'อัครพล ชัยประสิทธิ์', nickname: 'แม็กซ์' },
    { id: '6601012', name: 'อนัญญา ทรัพย์อนันต์', nickname: 'มายด์' }
];

class RosterManager {
    constructor() {
        this.storageKey = 'dbt_quiz_roster_v1';
    }

    getStudents() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.error('Error loading roster:', e);
            }
        }
        return [...DEFAULT_STUDENTS];
    }

    saveStudents(students) {
        localStorage.setItem(this.storageKey, JSON.stringify(students));
    }

    resetToDefault() {
        localStorage.removeItem(this.storageKey);
        return [...DEFAULT_STUDENTS];
    }

    addStudent(student) {
        const list = this.getStudents();
        // Check duplicate ID
        const cleanId = String(student.id).trim();
        const existingIndex = list.findIndex(s => s.id === cleanId);
        if (existingIndex !== -1) {
            list[existingIndex] = {
                id: cleanId,
                name: student.name.trim(),
                nickname: (student.nickname || '').trim()
            };
        } else {
            list.push({
                id: cleanId,
                name: student.name.trim(),
                nickname: (student.nickname || '').trim()
            });
        }
        this.saveStudents(list);
        return list;
    }

    deleteStudent(studentId) {
        let list = this.getStudents();
        list = list.filter(s => s.id !== String(studentId).trim());
        this.saveStudents(list);
        return list;
    }

    bulkImport(text) {
        // Accepts lines in format: "6601001, นายสมชาย ใจดี, กอล์ฟ" or "6601001\tนายสมชาย ใจดี" or "6601001 นายสมชาย ใจดี"
        const lines = text.split(/\r?\n/);
        const imported = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            let id = '', name = '', nickname = '';

            if (trimmed.includes(',') || trimmed.includes('\t')) {
                const parts = trimmed.split(/,|\t/).map(p => p.trim());
                id = parts[0] || '';
                name = parts[1] || '';
                nickname = parts[2] || '';
            } else {
                const parts = trimmed.split(/\s+/);
                id = parts[0] || '';
                name = parts.slice(1).join(' ') || '';
            }

            if (id && name) {
                imported.push({ id, name, nickname });
            }
        });

        if (imported.length > 0) {
            const current = this.getStudents();
            const map = new Map(current.map(s => [s.id, s]));
            imported.forEach(s => map.set(s.id, s));
            const merged = Array.from(map.values());
            this.saveStudents(merged);
            return merged;
        }
        return this.getStudents();
    }
}

const rosterManager = new RosterManager();
