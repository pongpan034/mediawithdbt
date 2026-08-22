/**
 * DBT Quiz Show - แผงควบคุมของอาจารย์ผู้สอน (Teacher Management & Analytics)
 * ระบบวิเคราะห์สถิติ, จัดการคลังคำถาม, จัดการรายชื่อ, ส่งออก Excel และพิมพ์รายงานคะแนน
 */

class TeacherController {
    constructor() {
        this.pinKey = 'dbt_teacher_pin';
        this.defaultPin = '123456';
        this.currentTab = 'analytics'; // 'analytics', 'questions', 'roster', 'scores'
        this.editingQuestionId = null;
    }

    getPin() {
        return localStorage.getItem(this.pinKey) || this.defaultPin;
    }

    setPin(newPin) {
        if (/^\d{6}$/.test(newPin)) {
            localStorage.setItem(this.pinKey, newPin);
            return true;
        }
        return false;
    }

    verifyPin(enteredPin) {
        return enteredPin === this.getPin();
    }

    // แปลงลิงก์รูปภาพ เช่น Google Drive ให้แสดงผลได้ตรงๆ
    formatImageUrl(url) {
        if (!url) return '';
        const trimmed = url.trim();

        // Check if Google Drive file link: drive.google.com/file/d/ID/view... or id=ID
        const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) {
            const fileId = driveMatch[1];
            return `https://lh3.googleusercontent.com/d/${fileId}`;
        }

        // Dropbox link
        if (trimmed.includes('dropbox.com') && trimmed.includes('dl=0')) {
            return trimmed.replace('dl=0', 'raw=1');
        }

        return trimmed;
    }

    // ประมวลผลสถิติข้อที่นักเรียนตอบผิดมากที่สุด (Misconception Analytics)
    calculateAnalytics() {
        const results = quizData.getResults();
        const questions = quizData.getQuestions();

        const stats = {
            totalAttempts: results.length,
            uniqueStudents: new Set(results.map(r => r.studentId)).size,
            averageScore: 0,
            averagePercentage: 0,
            averageTimeSec: 0,
            questionMistakes: {}, // qId -> { wrongCount, totalCount, question, wrongChoices: {} }
            categoryStats: {
                shot_size: { correct: 0, total: 0, percentage: 0 },
                camera_angle: { correct: 0, total: 0, percentage: 0 }
            }
        };

        if (results.length === 0) {
            return stats;
        }

        let totalScoreSum = 0;
        let totalPercentSum = 0;
        let totalTimeSum = 0;

        // Initialize question mistakes map
        questions.forEach(q => {
            stats.questionMistakes[q.id] = {
                id: q.id,
                title: q.title,
                category: q.category,
                imageUrl: q.imageUrl,
                correctIndex: q.correctIndex,
                correctOption: q.options[q.correctIndex],
                options: q.options,
                totalCount: 0,
                wrongCount: 0,
                wrongChoices: {}
            };
        });

        results.forEach(res => {
            totalScoreSum += (res.score || 0);
            totalPercentSum += (res.percentage || 0);
            totalTimeSum += (res.totalTimeUsed || 0);

            if (res.answers && Array.isArray(res.answers)) {
                res.answers.forEach(ans => {
                    const qStats = stats.questionMistakes[ans.questionId];
                    if (qStats) {
                        qStats.totalCount++;
                        if (!ans.isCorrect) {
                            qStats.wrongCount++;
                            const chosenOption = ans.selectedOption || 'ไม่ตอบ/หมดเวลา';
                            qStats.wrongChoices[chosenOption] = (qStats.wrongChoices[chosenOption] || 0) + 1;
                        }
                    }

                    // Category stats
                    const cat = ans.category || 'shot_size';
                    if (stats.categoryStats[cat]) {
                        stats.categoryStats[cat].total++;
                        if (ans.isCorrect) {
                            stats.categoryStats[cat].correct++;
                        }
                    }
                });
            }
        });

        stats.averageScore = Math.round(totalScoreSum / results.length);
        stats.averagePercentage = Math.round(totalPercentSum / results.length);
        stats.averageTimeSec = Math.round(totalTimeSum / results.length);

        if (stats.categoryStats.shot_size.total > 0) {
            stats.categoryStats.shot_size.percentage = Math.round(
                (stats.categoryStats.shot_size.correct / stats.categoryStats.shot_size.total) * 100
            );
        }
        if (stats.categoryStats.camera_angle.total > 0) {
            stats.categoryStats.camera_angle.percentage = Math.round(
                (stats.categoryStats.camera_angle.correct / stats.categoryStats.camera_angle.total) * 100
            );
        }

        // Sort questions by wrong count descending
        stats.sortedMistakes = Object.values(stats.questionMistakes)
            .filter(q => q.totalCount > 0)
            .map(q => ({
                ...q,
                wrongRate: Math.round((q.wrongCount / q.totalCount) * 100)
            }))
            .sort((a, b) => b.wrongRate - a.wrongRate);

        return stats;
    }

    // ส่งออกคะแนนเป็นไฟล์ Excel (.xlsx) ด้วย SheetJS
    exportToExcel() {
        const results = quizData.getResults();
        if (results.length === 0) {
            alert('ยังไม่มีข้อมูลการส่งคะแนนของนักศึกษา');
            return;
        }

        if (typeof XLSX === 'undefined') {
            alert('กำลังโหลดโมดูล Excel กรุณาลองใหม่อีกครั้ง');
            return;
        }

        const formattedData = results.map((r, index) => {
            return {
                'ลำดับ': index + 1,
                'รหัสนักศึกษา': r.studentId,
                'ชื่อ-นามสกุล': r.studentName,
                'โหมดแบบทดสอบ': r.modeTitle || 'ทั่วไป',
                'คะแนนที่ได้': r.score,
                'คะแนนเต็ม': r.maxPossibleScore || 1000,
                'คิดเป็นร้อยละ': `${r.percentage}%`,
                'เกรด/ระดับ': r.grade || 'N/A',
                'จำนวนข้อที่ถูก': `${r.correctCount}/${r.totalQuestions}`,
                'เวลาที่ใช้รวม (วินาที)': r.totalTimeUsed,
                'วันที่-เวลาที่ทำ': r.timestamp ? new Date(r.timestamp).toLocaleString('th-TH') : '-'
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Auto-fit column widths
        const colWidths = [
            { wch: 8 },  // ลำดับ
            { wch: 15 }, // รหัสนักศึกษา
            { wch: 26 }, // ชื่อ-นามสกุล
            { wch: 20 }, // โหมด
            { wch: 12 }, // คะแนน
            { wch: 12 }, // เต็ม
            { wch: 14 }, // ร้อยละ
            { wch: 12 }, // ระดับ
            { wch: 16 }, // ข้อถูก
            { wch: 22 }, // เวลา
            { wch: 22 }  // วันที่
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ผลคะแนน DBT Quiz');

        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
        const fileName = `DBT_Quiz_ScoreReport_${dateStr}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    }

    // สั่งพิมพ์รายงานผลคะแนน A4 ทางการ (Print Report)
    printReport() {
        const stats = this.calculateAnalytics();
        const results = quizData.getResults();

        // Populate print section data
        const printDateElem = document.getElementById('print-report-date');
        if (printDateElem) {
            printDateElem.innerText = new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        const totalStudentsElem = document.getElementById('print-total-students');
        if (totalStudentsElem) totalStudentsElem.innerText = stats.uniqueStudents;

        const avgScoreElem = document.getElementById('print-avg-score');
        if (avgScoreElem) avgScoreElem.innerText = `${stats.averagePercentage}% (${stats.averageScore} คะแนน)`;

        const shotSizePctElem = document.getElementById('print-shotsize-pct');
        if (shotSizePctElem) shotSizePctElem.innerText = `${stats.categoryStats.shot_size.percentage}%`;

        const camAnglePctElem = document.getElementById('print-camangle-pct');
        if (camAnglePctElem) camAnglePctElem.innerText = `${stats.categoryStats.camera_angle.percentage}%`;

        // Render printable table rows
        const tableBody = document.getElementById('print-table-body');
        if (tableBody) {
            if (results.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4">ยังไม่มีข้อมูลการส่งแบบทดสอบ</td></tr>`;
            } else {
                tableBody.innerHTML = results.map((r, i) => `
                    <tr class="border-b border-gray-300">
                        <td class="py-2 px-3 text-center">${i + 1}</td>
                        <td class="py-2 px-3 font-mono font-bold">${r.studentId}</td>
                        <td class="py-2 px-3">${r.studentName}</td>
                        <td class="py-2 px-3 text-center">${r.correctCount}/${r.totalQuestions}</td>
                        <td class="py-2 px-3 text-center font-bold">${r.percentage}%</td>
                        <td class="py-2 px-3 text-center">${r.totalTimeUsed} วินาที</td>
                        <td class="py-2 px-3 text-center text-xs">${r.timestamp ? new Date(r.timestamp).toLocaleTimeString('th-TH') : '-'}</td>
                    </tr>
                `).join('');
            }
        }

        // Render printable top mistakes
        const mistakeListElem = document.getElementById('print-mistakes-list');
        if (mistakeListElem) {
            if (!stats.sortedMistakes || stats.sortedMistakes.length === 0) {
                mistakeListElem.innerHTML = `<li class="text-gray-600">ยังไม่มีข้อมูลสถิติข้อผิดพลาด</li>`;
            } else {
                mistakeListElem.innerHTML = stats.sortedMistakes.slice(0, 5).map((m, idx) => `
                    <li class="mb-2">
                        <span class="font-bold text-red-700">${idx + 1}. [ผิด ${m.wrongRate}% - ${m.wrongCount}/${m.totalCount} คน]</span> 
                        ${m.title} <br/>
                        <span class="text-gray-700 text-xs">เฉลยที่ถูกต้อง: <strong>${m.correctOption}</strong></span>
                    </li>
                `).join('');
            }
        }

        // Trigger browser print dialog
        window.print();
    }
}

const teacherController = new TeacherController();
