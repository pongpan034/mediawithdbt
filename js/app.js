/**
 * DBT Quiz Show - Main Application Engine & Game Controller
 * รายวิชา: สื่อสร้างสรรค์ธุรกิจดิจิทัล (Creative Digital Business Media)
 */

class DBTQuizApp {
    constructor() {
        // App State
        this.currentView = 'lobby'; // 'lobby', 'quiz', 'result', 'teacher', 'bigscreen'
        this.selectedStudent = null;
        this.selectedCategory = 'all'; // 'all', 'shot_size', 'camera_angle'
        this.questionCountLimit = 10; // 5, 10, or 'all'
        
        // Quiz Session State
        this.activeQuestions = [];
        this.currentQuestionIndex = 0;
        this.timer = null;
        this.timeLeft = 0;
        this.maxTime = 15;
        this.isAnsweringLocked = false;

        // Anti-Cheat & Screen Switching State
        this.tabSwitchCount = 0;
        this.maxAllowedTabSwitches = 3;
        this.isDisqualified = false;
        this.isWarningModalOpen = false;
        
        // Scoring & Stats
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.sessionStartTime = 0;
        this.userAnswers = []; // Records for analytics

        // DOM Element Cache
        this.dom = {};
    }

    init() {
        this.cacheDom();
        this.bindEvents();
        this.loadSavedStudentInfo();
        this.checkUrlParameters();
        this.renderCategoryOptions();
    }

    cacheDom() {
        this.dom = {
            // Views
            viewLobby: document.getElementById('view-lobby'),
            viewQuiz: document.getElementById('view-quiz'),
            viewResult: document.getElementById('view-result'),
            viewTeacher: document.getElementById('view-teacher'),
            viewBigScreen: document.getElementById('view-bigscreen'),

            // Modals
            modalTeacherPin: document.getElementById('modal-teacher-pin'),
            modalImageZoom: document.getElementById('modal-image-zoom'),
            modalQuestionEdit: document.getElementById('modal-question-edit'),
            modalRosterBulk: document.getElementById('modal-roster-bulk'),
            modalTabWarning: document.getElementById('modal-tab-warning'),
            tabWarningStrikeBadge: document.getElementById('tab-warning-strike-badge'),
            tabWarningDesc: document.getElementById('tab-warning-desc'),
            btnTabWarningAcknowledge: document.getElementById('btn-tab-warning-acknowledge'),

            // Lobby student inputs
            inputStudentName: document.getElementById('input-student-name'),
            inputStudentGroup: document.getElementById('input-student-group'),
            inputStudentId: document.getElementById('input-student-id'),
            btnStartQuiz: document.getElementById('btn-start-quiz'),
            muteToggleBtn: document.getElementById('btn-toggle-mute'),

            // Quiz elements
            quizProgressText: document.getElementById('quiz-progress-text'),
            quizProgressBar: document.getElementById('quiz-progress-bar'),
            quizScoreDisplay: document.getElementById('quiz-score-display'),
            quizComboBadge: document.getElementById('quiz-combo-badge'),
            quizTimerText: document.getElementById('quiz-timer-text'),
            quizTimerBar: document.getElementById('quiz-timer-bar'),
            quizImage: document.getElementById('quiz-image'),
            quizImageSkeleton: document.getElementById('quiz-image-skeleton'),
            quizQuestionTitle: document.getElementById('quiz-question-title'),
            quizOptionsContainer: document.getElementById('quiz-options-container'),
            quizFeedbackCard: document.getElementById('quiz-feedback-card'),
            quizFeedbackTitle: document.getElementById('quiz-feedback-title'),
            quizFeedbackDesc: document.getElementById('quiz-feedback-desc'),
            btnNextQuestion: document.getElementById('btn-next-question'),
            btnZoomImage: document.getElementById('btn-zoom-image'),

            // Result elements
            resultScore: document.getElementById('result-score'),
            resultPercentage: document.getElementById('result-percentage'),
            resultRankBadge: document.getElementById('result-rank-badge'),
            resultRankTitle: document.getElementById('result-rank-title'),
            resultTimeUsed: document.getElementById('result-time-used'),
            resultCorrectSummary: document.getElementById('result-correct-summary'),
            resultTabSwitches: document.getElementById('result-tab-switches'),
            resultStudentInfo: document.getElementById('result-student-info'),
            resultReviewList: document.getElementById('result-review-list'),

            // Teacher elements
            teacherPinInput: document.getElementById('teacher-pin-input'),
            teacherPinError: document.getElementById('teacher-pin-error'),
            btnVerifyPin: document.getElementById('btn-verify-pin'),
            teacherTabAnalytics: document.getElementById('teacher-tab-analytics'),
            teacherTabQuestions: document.getElementById('teacher-tab-questions'),
            teacherTabRoster: document.getElementById('teacher-tab-roster'),
            teacherTabScores: document.getElementById('teacher-tab-scores'),
            teacherTabContent: document.getElementById('teacher-tab-content'),

            // Zoom image modal
            zoomedImg: document.getElementById('zoomed-image'),
            zoomedCaption: document.getElementById('zoomed-caption')
        };
    }

    loadSavedStudentInfo() {
        try {
            const saved = localStorage.getItem('dbt_last_student_info');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.name && this.dom.inputStudentName) this.dom.inputStudentName.value = parsed.name;
                if (parsed.group && this.dom.inputStudentGroup) this.dom.inputStudentGroup.value = parsed.group;
                if (parsed.id && this.dom.inputStudentId) this.dom.inputStudentId.value = parsed.id;
            }
        } catch (e) {
            console.warn('Cannot load saved student info', e);
        }
    }

    bindEvents() {
        // Anti-Cheat Screen / Tab Switch Detector
        const onVisibilityOrFocusChange = () => {
            if (this.currentView === 'quiz' && !this.isWarningModalOpen) {
                if (document.hidden || !document.hasFocus()) {
                    this.handleTabSwitch();
                }
            }
        };

        document.addEventListener('visibilitychange', onVisibilityOrFocusChange);
        window.addEventListener('blur', onVisibilityOrFocusChange);
        window.addEventListener('pagehide', onVisibilityOrFocusChange);

        // Acknowledge Warning Button
        if (this.dom.btnTabWarningAcknowledge) {
            this.dom.btnTabWarningAcknowledge.addEventListener('click', () => {
                this.handleCloseTabWarning();
            });
        }

        // Navigation / View Switching
        document.querySelectorAll('[data-view-target]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-view-target');
                if (target === 'teacher') {
                    this.openTeacherPinModal();
                } else {
                    this.switchView(target);
                }
            });
        });

        // Mute sound toggle
        if (this.dom.muteToggleBtn) {
            this.dom.muteToggleBtn.addEventListener('click', () => {
                const isMuted = quizAudio.toggleMute();
                this.updateMuteIcon(isMuted);
            });
            this.updateMuteIcon(quizAudio.isMuted);
        }

        // Category selection cards
        document.querySelectorAll('.category-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-card-btn').forEach(b => b.classList.remove('ring-4', 'ring-purple-500', 'bg-purple-900/40'));
                const card = e.currentTarget;
                card.classList.add('ring-4', 'ring-purple-500', 'bg-purple-900/40');
                this.selectedCategory = card.getAttribute('data-category');
            });
        });

        // Question count buttons
        document.querySelectorAll('.qcount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.qcount-btn').forEach(b => b.classList.remove('bg-purple-600', 'text-white'));
                const b = e.currentTarget;
                b.classList.add('bg-purple-600', 'text-white');
                const countVal = b.getAttribute('data-count');
                this.questionCountLimit = countVal === 'all' ? 'all' : parseInt(countVal, 10);
            });
        });

        // Start Quiz button
        if (this.dom.btnStartQuiz) {
            this.dom.btnStartQuiz.addEventListener('click', () => {
                this.handleStartQuiz();
            });
        }

        // Next Question button
        if (this.dom.btnNextQuestion) {
            this.dom.btnNextQuestion.addEventListener('click', () => {
                this.goToNextQuestion();
            });
        }

        // Zoom image button
        if (this.dom.btnZoomImage) {
            this.dom.btnZoomImage.addEventListener('click', () => {
                this.openImageZoom();
            });
        }

        // Close Zoom modal
        const closeZoomBtn = document.getElementById('btn-close-zoom');
        if (closeZoomBtn) {
            closeZoomBtn.addEventListener('click', () => {
                this.dom.modalImageZoom.classList.add('hidden');
            });
        }

        // Teacher PIN Verification
        if (this.dom.btnVerifyPin) {
            this.dom.btnVerifyPin.addEventListener('click', () => {
                this.handleVerifyTeacherPin();
            });
        }

        // Teacher Numpad buttons
        document.querySelectorAll('.numpad-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.currentTarget.getAttribute('data-num');
                if (key === 'CLEAR') {
                    this.dom.teacherPinInput.value = '';
                } else if (key === 'BACK') {
                    this.dom.teacherPinInput.value = this.dom.teacherPinInput.value.slice(0, -1);
                } else {
                    if (this.dom.teacherPinInput.value.length < 6) {
                        this.dom.teacherPinInput.value += key;
                    }
                }
            });
        });

        // Teacher PIN input Enter key
        if (this.dom.teacherPinInput) {
            this.dom.teacherPinInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleVerifyTeacherPin();
                }
            });
        }

        // Close Teacher Modal
        const closeTeacherPinBtn = document.getElementById('btn-close-teacher-pin');
        if (closeTeacherPinBtn) {
            closeTeacherPinBtn.addEventListener('click', () => {
                this.dom.modalTeacherPin.classList.add('hidden');
            });
        }

        // Keyboard Shortcuts for Quiz (1, 2, 3, 4, Space, Enter)
        window.addEventListener('keydown', (e) => {
            if (this.currentView === 'quiz') {
                if (['1', '2', '3', '4'].includes(e.key) && !this.isAnsweringLocked) {
                    const idx = parseInt(e.key, 10) - 1;
                    this.handleAnswerSelection(idx);
                } else if ((e.key === 'Enter' || e.key === ' ') && this.isAnsweringLocked) {
                    this.goToNextQuestion();
                }
            }
        });
    }

    checkUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'teacher') {
            this.openTeacherPinModal();
        } else if (params.get('mode') === 'bigscreen') {
            this.switchView('bigscreen');
            this.renderBigScreenLeaderboard();
        }
    }

    updateMuteIcon(isMuted) {
        if (!this.dom.muteToggleBtn) return;
        if (isMuted) {
            this.dom.muteToggleBtn.innerHTML = `
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <span class="text-xs text-red-400 font-medium">ปิดเสียง</span>
            `;
        } else {
            this.dom.muteToggleBtn.innerHTML = `
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span class="text-xs text-emerald-400 font-medium">เปิดเสียง</span>
            `;
        }
    }

    renderRosterDropdown() {
        if (!this.dom.studentSelect) return;
        const students = rosterManager.getStudents();
        
        let html = `<option value="" disabled selected>-- แตะเพื่อเลือกชื่อและรหัสนักศึกษา --</option>`;
        students.forEach(s => {
            const nicknameStr = s.nickname ? ` (${s.nickname})` : '';
            html += `<option value="${s.id}">${s.id} - ${s.name}${nicknameStr}</option>`;
        });
        html += `<option value="CUSTOM">➕ กรอกชื่อ-รหัสนักศึกษาใหม่เอง (ไม่อยู่ในรายชื่อ)</option>`;
        this.dom.studentSelect.innerHTML = html;
    }

    renderCategoryOptions() {
        const questions = quizData.getQuestions();
        const shotSizeCount = questions.filter(q => q.category === 'shot_size').length;
        const camAngleCount = questions.filter(q => q.category === 'camera_angle').length;

        const elShotSizeCount = document.getElementById('count-shotsize');
        const elCamAngleCount = document.getElementById('count-camangle');
        const elTotalCount = document.getElementById('count-all');

        if (elShotSizeCount) elShotSizeCount.innerText = `${shotSizeCount} ข้อ`;
        if (elCamAngleCount) elCamAngleCount.innerText = `${camAngleCount} ข้อ`;
        if (elTotalCount) elTotalCount.innerText = `${questions.length} ข้อ`;
    }

    switchView(viewName) {
        this.currentView = viewName;
        const views = [this.dom.viewLobby, this.dom.viewQuiz, this.dom.viewResult, this.dom.viewTeacher, this.dom.viewBigScreen];
        
        views.forEach(v => {
            if (v) v.classList.add('hidden');
        });

        if (viewName === 'lobby') {
            if (this.dom.viewLobby) this.dom.viewLobby.classList.remove('hidden');
            this.loadSavedStudentInfo();
            this.renderCategoryOptions();
        } else if (viewName === 'quiz') {
            if (this.dom.viewQuiz) this.dom.viewQuiz.classList.remove('hidden');
        } else if (viewName === 'result') {
            if (this.dom.viewResult) this.dom.viewResult.classList.remove('hidden');
        } else if (viewName === 'teacher') {
            if (this.dom.viewTeacher) this.dom.viewTeacher.classList.remove('hidden');
            this.renderTeacherDashboard();
        } else if (viewName === 'bigscreen') {
            if (this.dom.viewBigScreen) this.dom.viewBigScreen.classList.remove('hidden');
            this.renderBigScreenLeaderboard();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // QUIZ GAME ENGINE
    // ==========================================

    handleStartQuiz() {
        // Validate Student Inputs (ชื่อ-นามสกุล, กลุ่มเรียน, รหัสนักศึกษา)
        const name = this.dom.inputStudentName ? this.dom.inputStudentName.value.trim() : '';
        const group = this.dom.inputStudentGroup ? this.dom.inputStudentGroup.value.trim() : '';
        const id = this.dom.inputStudentId ? this.dom.inputStudentId.value.trim() : '';

        if (!name) {
            alert('กรุณากรอกชื่อ - นามสกุล ของคุณก่อนเริ่มทำแบบทดสอบ');
            if (this.dom.inputStudentName) this.dom.inputStudentName.focus();
            return;
        }

        if (!group) {
            alert('กรุณากรอกกลุ่มเรียน / ห้องเรียน ของคุณ');
            if (this.dom.inputStudentGroup) this.dom.inputStudentGroup.focus();
            return;
        }

        if (!id) {
            alert('กรุณากรอกรหัสนักศึกษาของคุณ');
            if (this.dom.inputStudentId) this.dom.inputStudentId.focus();
            return;
        }

        // Save into localStorage for convenient next sessions
        try {
            localStorage.setItem('dbt_last_student_info', JSON.stringify({ name, group, id }));
        } catch (e) {}

        this.selectedStudent = {
            id: id,
            name: name,
            group: group,
            nickname: group
        };

        // Initialize Audio on user interaction
        quizAudio.init();

        // Prepare Questions
        let allQuestions = quizData.getQuestions();
        if (this.selectedCategory !== 'all') {
            allQuestions = allQuestions.filter(q => q.category === this.selectedCategory);
        }

        if (allQuestions.length === 0) {
            alert('ไม่พบข้อสอบในหมวดที่เลือก กรุณาเลือกหมวดอื่น');
            return;
        }

        // Shuffle questions
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

        // Limit question count if requested
        if (this.questionCountLimit !== 'all') {
            this.activeQuestions = shuffled.slice(0, Math.min(this.questionCountLimit, shuffled.length));
        } else {
            this.activeQuestions = shuffled;
        }

        // Reset game stats & anti-cheat counter
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.tabSwitchCount = 0;
        this.isDisqualified = false;
        this.isWarningModalOpen = false;
        this.userAnswers = [];
        this.sessionStartTime = Date.now();

        // Switch to Quiz View & Render First Question
        this.switchView('quiz');
        this.renderQuestion();
    }

    // ==========================================
    // ANTI-CHEAT SCREEN SWITCHING SYSTEM
    // ==========================================

    handleTabSwitch() {
        if (this.currentView !== 'quiz' || this.isWarningModalOpen) return;
        this.isWarningModalOpen = true;
        this.tabSwitchCount++;

        // Play warning audio alarm & Vibrate device on mobile
        quizAudio.playWarningAlarm();
        if (navigator.vibrate) {
            navigator.vibrate([300, 150, 300, 150, 400]);
        }

        if (this.dom.tabWarningStrikeBadge) {
            this.dom.tabWarningStrikeBadge.innerText = `คำเตือน: ตรวจพบการสลับหน้าจอ (ครั้งที่ ${this.tabSwitchCount}/${this.maxAllowedTabSwitches})`;
        }

        if (this.tabSwitchCount >= this.maxAllowedTabSwitches) {
            this.isDisqualified = true;
            if (this.dom.tabWarningDesc) {
                this.dom.tabWarningDesc.innerHTML = `
                    <span class="text-rose-400 font-bold block text-base mb-1">🚫 ยุติการสอบอัตโนมัติ!</span>
                    คุณสลับหน้าจอหรือเปิดแอปอื่นครบกำหนด <strong>${this.maxAllowedTabSwitches} ครั้ง</strong><br/>
                    ระบบได้ทำการบันทึกข้อมูลและส่งคะแนนเท่าที่ทำได้ไปยังอาจารย์ผู้สอนทันที
                `;
            }
            if (this.dom.btnTabWarningAcknowledge) {
                this.dom.btnTabWarningAcknowledge.innerText = '📊 ดูผลคะแนนของคุณ';
            }
        } else {
            const remaining = this.maxAllowedTabSwitches - this.tabSwitchCount;
            if (this.dom.tabWarningDesc) {
                this.dom.tabWarningDesc.innerHTML = `
                    ระบบตรวจพบว่าคุณสลับแท็บ ย่อเบราว์เซอร์ หรือเปิดแอปพลิเคชันอื่นระหว่างทำแบบทดสอบ<br/>
                    <span class="text-amber-300 font-bold block mt-1.5">⚠️ สลับหน้าจอได้อีก ${remaining} ครั้ง (หากครบ ${this.maxAllowedTabSwitches} ครั้งจะถูกยุติการสอบทันที)</span>
                `;
            }
            if (this.dom.btnTabWarningAcknowledge) {
                this.dom.btnTabWarningAcknowledge.innerText = '✓ รับทราบและกลับสู่การสอบ';
            }
        }

        if (this.dom.modalTabWarning) {
            this.dom.modalTabWarning.classList.remove('hidden');
        }
    }

    handleCloseTabWarning() {
        this.isWarningModalOpen = false;
        if (this.dom.modalTabWarning) {
            this.dom.modalTabWarning.classList.add('hidden');
        }

        // If strike limit exceeded, finish quiz immediately
        if (this.tabSwitchCount >= this.maxAllowedTabSwitches) {
            this.handleFinishQuiz();
        }
    }

    renderQuestion() {
        if (this.currentQuestionIndex >= this.activeQuestions.length) {
            this.handleFinishQuiz();
            return;
        }

        const q = this.activeQuestions[this.currentQuestionIndex];
        this.isAnsweringLocked = false;

        // Update Progress UI
        const currentNum = this.currentQuestionIndex + 1;
        const totalNum = this.activeQuestions.length;
        this.dom.quizProgressText.innerText = `ข้อที่ ${currentNum} / ${totalNum}`;
        const pct = Math.round((this.currentQuestionIndex / totalNum) * 100);
        this.dom.quizProgressBar.style.width = `${pct}%`;

        // Update Score & Combo UI
        this.dom.quizScoreDisplay.innerText = this.score.toLocaleString();
        if (this.combo > 1) {
            this.dom.quizComboBadge.classList.remove('hidden');
            this.dom.quizComboBadge.innerText = `🔥 Combo x${this.combo}`;
        } else {
            this.dom.quizComboBadge.classList.add('hidden');
        }

        // Question Category Badge & Title
        const catBadge = q.category === 'shot_size' ? '📐 ขนาดภาพ (Shot Size)' : '🎬 มุมกล้อง (Camera Angle)';
        const catElem = document.getElementById('quiz-category-badge');
        if (catElem) catElem.innerText = catBadge;

        this.dom.quizQuestionTitle.innerText = q.title;

        // Image Handling
        const formattedUrl = teacherController.formatImageUrl(q.imageUrl);
        this.dom.quizImage.classList.add('opacity-0');
        this.dom.quizImageSkeleton.classList.remove('hidden');

        this.dom.quizImage.onload = () => {
            this.dom.quizImage.classList.remove('opacity-0');
            this.dom.quizImageSkeleton.classList.add('hidden');
        };
        this.dom.quizImage.onerror = () => {
            // Fallback to placeholder if URL broken
            this.dom.quizImage.src = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80';
            this.dom.quizImage.classList.remove('opacity-0');
            this.dom.quizImageSkeleton.classList.add('hidden');
        };
        this.dom.quizImage.src = formattedUrl;

        // Render Options (Kahoot / Cyber style buttons with Keyboard keys 1-4)
        const optionThemes = [
            { bg: 'bg-red-900/60 hover:bg-red-800/80 border-red-500/50', keyBg: 'bg-red-600 text-white', icon: '🔺' },
            { bg: 'bg-blue-900/60 hover:bg-blue-800/80 border-blue-500/50', keyBg: 'bg-blue-600 text-white', icon: '🔷' },
            { bg: 'bg-amber-900/60 hover:bg-amber-800/80 border-amber-500/50', keyBg: 'bg-amber-600 text-white', icon: '🟡' },
            { bg: 'bg-emerald-900/60 hover:bg-emerald-800/80 border-emerald-500/50', keyBg: 'bg-emerald-600 text-white', icon: '🟩' }
        ];

        let optionsHtml = '';
        q.options.forEach((opt, index) => {
            const theme = optionThemes[index % optionThemes.length];
            optionsHtml += `
                <button type="button" 
                        data-option-index="${index}"
                        class="quiz-option-btn w-full p-4 md:p-5 rounded-2xl border-2 ${theme.bg} ${theme.border} text-left flex items-center justify-between transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg group">
                    <div class="flex items-center space-x-3 md:space-x-4">
                        <span class="w-8 h-8 md:w-10 md:h-10 rounded-xl ${theme.keyBg} font-black flex items-center justify-center text-sm md:text-base shadow-md group-hover:rotate-6 transition-transform">
                            ${index + 1}
                        </span>
                        <span class="text-white font-medium text-sm md:text-lg leading-snug">
                            ${opt}
                        </span>
                    </div>
                    <span class="text-xl opacity-70">${theme.icon}</span>
                </button>
            `;
        });
        this.dom.quizOptionsContainer.innerHTML = optionsHtml;

        // Bind click events on option buttons
        document.querySelectorAll('.quiz-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-option-index'), 10);
                this.handleAnswerSelection(idx);
            });
        });

        // Hide Feedback card
        this.dom.quizFeedbackCard.classList.add('hidden');

        // Start Question Timer
        this.startTimer(q.timeLimit || 15);
    }

    startTimer(seconds) {
        clearInterval(this.timer);
        this.maxTime = seconds;
        this.timeLeft = seconds;
        this.updateTimerUi();

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerUi();

            if (this.timeLeft <= 5 && this.timeLeft > 0) {
                quizAudio.playUrgentTick();
            } else if (this.timeLeft > 5) {
                quizAudio.playTick();
            }

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.handleTimeout();
            }
        }, 1000);
    }

    updateTimerUi() {
        this.dom.quizTimerText.innerText = `${this.timeLeft}s`;
        const percentage = Math.max(0, (this.timeLeft / this.maxTime) * 100);
        this.dom.quizTimerBar.style.width = `${percentage}%`;

        // Dynamic Timer Color (Green -> Yellow -> Red)
        if (percentage > 50) {
            this.dom.quizTimerBar.className = 'h-full transition-all duration-1000 bg-gradient-to-r from-emerald-500 to-teal-400';
            this.dom.quizTimerText.className = 'text-emerald-400 font-black text-2xl md:text-3xl font-mono';
        } else if (percentage > 25) {
            this.dom.quizTimerBar.className = 'h-full transition-all duration-1000 bg-gradient-to-r from-amber-500 to-yellow-400';
            this.dom.quizTimerText.className = 'text-amber-400 font-black text-2xl md:text-3xl font-mono animate-pulse';
        } else {
            this.dom.quizTimerBar.className = 'h-full transition-all duration-1000 bg-gradient-to-r from-red-600 to-rose-500 animate-pulse';
            this.dom.quizTimerText.className = 'text-rose-500 font-black text-2xl md:text-3xl font-mono animate-bounce';
        }
    }

    handleAnswerSelection(selectedIndex) {
        if (this.isAnsweringLocked) return;
        this.isAnsweringLocked = true;
        clearInterval(this.timer);

        const q = this.activeQuestions[this.currentQuestionIndex];
        const isCorrect = (selectedIndex === q.correctIndex);
        const timeUsed = this.maxTime - this.timeLeft;

        // Calculate score with Speed Bonus and Combo multiplier
        let pointsEarned = 0;
        if (isCorrect) {
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            this.correctCount++;

            const basePoints = 100;
            const speedBonus = Math.round((this.timeLeft / this.maxTime) * 50); // up to +50 bonus
            const comboBonus = (this.combo - 1) * 20; // +20 per combo level
            pointsEarned = basePoints + speedBonus + comboBonus;
            this.score += pointsEarned;

            quizAudio.playCorrect();
        } else {
            this.combo = 0;
            quizAudio.playWrong();
        }

        // Record for student review and teacher analytics
        this.userAnswers.push({
            questionId: q.id,
            category: q.category,
            title: q.title,
            imageUrl: q.imageUrl,
            options: q.options,
            selectedIndex: selectedIndex,
            selectedOption: q.options[selectedIndex],
            correctIndex: q.correctIndex,
            correctOption: q.options[q.correctIndex],
            isCorrect: isCorrect,
            timeUsed: timeUsed,
            pointsEarned: pointsEarned,
            explanation: q.explanation
        });

        // Update Option UI Styles (Green for correct, Red for chosen wrong)
        const optionButtons = document.querySelectorAll('.quiz-option-btn');
        optionButtons.forEach((btn, idx) => {
            btn.disabled = true;
            btn.classList.remove('hover:scale-[1.02]', 'hover:bg-red-800/80', 'hover:bg-blue-800/80', 'hover:bg-amber-800/80', 'hover:bg-emerald-800/80');

            if (idx === q.correctIndex) {
                btn.className = 'quiz-option-btn w-full p-4 md:p-5 rounded-2xl border-4 border-emerald-400 bg-emerald-900/90 text-left flex items-center justify-between shadow-2xl scale-[1.03] ring-4 ring-emerald-500/50 transition-all';
            } else if (idx === selectedIndex && !isCorrect) {
                btn.className = 'quiz-option-btn w-full p-4 md:p-5 rounded-2xl border-4 border-rose-500 bg-rose-950/90 text-left flex items-center justify-between shadow-xl opacity-80 line-through';
            } else {
                btn.classList.add('opacity-30');
            }
        });

        // Reveal Feedback Card
        this.showFeedbackCard(isCorrect, pointsEarned, q.explanation);
    }

    handleTimeout() {
        if (this.isAnsweringLocked) return;
        this.isAnsweringLocked = true;

        const q = this.activeQuestions[this.currentQuestionIndex];
        this.combo = 0;
        quizAudio.playTimeout();

        // Record timeout answer
        this.userAnswers.push({
            questionId: q.id,
            category: q.category,
            title: q.title,
            imageUrl: q.imageUrl,
            options: q.options,
            selectedIndex: -1,
            selectedOption: 'หมดเวลา (ไม่ได้ตอบ)',
            correctIndex: q.correctIndex,
            correctOption: q.options[q.correctIndex],
            isCorrect: false,
            timeUsed: this.maxTime,
            pointsEarned: 0,
            explanation: q.explanation
        });

        // Highlight correct option
        const optionButtons = document.querySelectorAll('.quiz-option-btn');
        optionButtons.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === q.correctIndex) {
                btn.className = 'quiz-option-btn w-full p-4 md:p-5 rounded-2xl border-4 border-emerald-400 bg-emerald-900/90 text-left flex items-center justify-between shadow-2xl scale-[1.03] ring-4 ring-emerald-500/50';
            } else {
                btn.classList.add('opacity-30');
            }
        });

        this.showFeedbackCard(false, 0, q.explanation, true);
    }

    showFeedbackCard(isCorrect, points, explanation, isTimeout = false) {
        this.dom.quizFeedbackCard.classList.remove('hidden');

        if (isCorrect) {
            this.dom.quizFeedbackTitle.innerHTML = `
                <span class="text-emerald-400 flex items-center space-x-2 font-black text-xl md:text-2xl">
                    <span>🎉 ยอดเยี่ยม ถูกต้อง!</span>
                    <span class="text-amber-300 text-base font-bold bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40">+${points} คะแนน</span>
                </span>
            `;
        } else if (isTimeout) {
            this.dom.quizFeedbackTitle.innerHTML = `
                <span class="text-rose-400 flex items-center space-x-2 font-black text-xl md:text-2xl">
                    <span>⏰ หมดเวลา!</span>
                    <span class="text-gray-400 text-sm font-normal">ตอบไม่ทันเวลา</span>
                </span>
            `;
        } else {
            this.dom.quizFeedbackTitle.innerHTML = `
                <span class="text-rose-400 flex items-center space-x-2 font-black text-xl md:text-2xl">
                    <span>❌ ตอบยังไม่ถูกต้อง</span>
                    <span class="text-gray-400 text-sm font-normal">+0 คะแนน</span>
                </span>
            `;
        }

        this.dom.quizFeedbackDesc.innerText = explanation || 'ศึกษาและจดจำมุมกล้อง/ขนาดภาพในข้อนี้ไว้เพื่อใช้ในการสอบและสร้างสรรค์ผลงานสื่อจริง';
    }

    goToNextQuestion() {
        this.currentQuestionIndex++;
        this.renderQuestion();
    }

    // ==========================================
    // RESULT SUMMARY
    // ==========================================

    handleFinishQuiz() {
        clearInterval(this.timer);

        const totalQuestions = this.activeQuestions.length;
        const percentage = Math.round((this.correctCount / totalQuestions) * 100);
        const totalTimeUsed = Math.round((Date.now() - this.sessionStartTime) / 1000);
        const maxPossibleScore = totalQuestions * 170; // 100 base + 50 speed + 20 combo

        // Rank Badge Calculation
        let grade = 'C';
        let rankTitle = 'พยายามอีกนิด พัฒนาต่อได้';
        let rankBadgeClass = 'bg-gray-800 text-gray-300 border-gray-600';

        if (percentage >= 90) {
            grade = 'S';
            rankTitle = '👑 ระดับเทพผู้กำกับ (Master Filmmaker)';
            rankBadgeClass = 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300 shadow-yellow-500/50';
        } else if (percentage >= 75) {
            grade = 'A';
            rankTitle = '⭐ มือโปรด้านมุมกล้องและขนาดภาพ (Pro Director)';
            rankBadgeClass = 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white border-purple-400 shadow-purple-500/50';
        } else if (percentage >= 60) {
            grade = 'B';
            rankTitle = '👍 ผ่านเกณฑ์มาตรฐาน มีความเข้าใจที่ดี';
            rankBadgeClass = 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-teal-400 shadow-teal-500/50';
        }

        // Mode Title
        let modeTitle = 'รวมทุกหัวข้อ (Mixed Challenge)';
        if (this.selectedCategory === 'shot_size') modeTitle = 'ขนาดภาพ (Shot Sizes)';
        if (this.selectedCategory === 'camera_angle') modeTitle = 'มุมกล้อง (Camera Angles)';

        // Prepare Result Record
        const resultRecord = {
            id: 'res-' + Date.now(),
            studentId: this.selectedStudent.id,
            studentName: this.selectedStudent.name,
            studentGroup: this.selectedStudent.group || '-',
            score: this.score,
            maxPossibleScore: maxPossibleScore,
            correctCount: this.correctCount,
            totalQuestions: totalQuestions,
            percentage: percentage,
            grade: grade,
            rankTitle: rankTitle,
            totalTimeUsed: totalTimeUsed,
            tabSwitchCount: this.tabSwitchCount,
            isDisqualified: this.isDisqualified,
            modeCategory: this.selectedCategory,
            modeTitle: modeTitle,
            answers: this.userAnswers,
            timestamp: new Date().toISOString()
        };

        // Save to Teacher Results Database
        quizData.saveResult(resultRecord);

        // Render Results UI
        this.dom.resultScore.innerText = this.score.toLocaleString();
        this.dom.resultPercentage.innerText = `${percentage}%`;
        this.dom.resultRankBadge.innerText = grade;
        this.dom.resultRankBadge.className = `w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 flex items-center justify-center font-black text-3xl md:text-4xl shadow-xl ${rankBadgeClass}`;
        this.dom.resultRankTitle.innerText = rankTitle;
        this.dom.resultTimeUsed.innerText = `${totalTimeUsed} วินาที`;
        this.dom.resultCorrectSummary.innerText = `${this.correctCount} / ${totalQuestions} ข้อ`;
        this.dom.resultStudentInfo.innerText = `${this.selectedStudent.id} - ${this.selectedStudent.name} (กลุ่ม: ${this.selectedStudent.group || '-'})`;

        if (this.dom.resultTabSwitches) {
            if (this.tabSwitchCount === 0) {
                this.dom.resultTabSwitches.innerText = '0 ครั้ง (ปกติ)';
                this.dom.resultTabSwitches.className = 'text-xl sm:text-2xl font-black text-emerald-400 font-mono';
            } else if (this.tabSwitchCount < this.maxAllowedTabSwitches) {
                this.dom.resultTabSwitches.innerText = `${this.tabSwitchCount} ครั้ง ⚠️`;
                this.dom.resultTabSwitches.className = 'text-xl sm:text-2xl font-black text-amber-400 font-mono';
            } else {
                this.dom.resultTabSwitches.innerText = `${this.tabSwitchCount} ครั้ง (ตัดสิทธิ์)`;
                this.dom.resultTabSwitches.className = 'text-xl sm:text-2xl font-black text-rose-500 font-mono';
            }
        }

        // Render Detailed Review List
        let reviewHtml = '';
        this.userAnswers.forEach((ans, idx) => {
            const isOk = ans.isCorrect;
            const badge = isOk 
                ? '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-500 text-emerald-400">✓ ถูกต้อง (+'+ans.pointsEarned+')</span>'
                : '<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-950 border border-rose-500 text-rose-400">✗ ตอบผิด</span>';

            const formattedImg = teacherController.formatImageUrl(ans.imageUrl);

            reviewHtml += `
                <div class="p-4 md:p-5 rounded-2xl border ${isOk ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-rose-500/30 bg-rose-950/20'} space-y-3">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="w-6 h-6 rounded-full bg-purple-900/60 text-purple-300 font-bold text-xs flex items-center justify-center">${idx + 1}</span>
                            <h4 class="font-bold text-white text-sm md:text-base">${ans.title}</h4>
                        </div>
                        ${badge}
                    </div>

                    <div class="flex flex-col sm:flex-row gap-4 items-start">
                        <img src="${formattedImg}" class="w-full sm:w-36 h-28 object-cover rounded-xl border border-gray-700 shadow-md" alt="Question Image" />
                        <div class="space-y-1 text-xs md:text-sm flex-1">
                            <p class="text-gray-300">คำตอบของคุณ: <span class="font-bold ${isOk ? 'text-emerald-400' : 'text-rose-400'}">${ans.selectedOption}</span></p>
                            ${!isOk ? `<p class="text-gray-300">เฉลยที่ถูกต้อง: <span class="font-bold text-emerald-400">${ans.correctOption}</span></p>` : ''}
                            <div class="mt-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-200">
                                <span class="font-bold">💡 หลักการจำ:</span> ${ans.explanation}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        this.dom.resultReviewList.innerHTML = reviewHtml;

        // Switch to Result View
        this.switchView('result');

        // Confetti effect & Victory sound if high score
        if (percentage >= 70) {
            quizAudio.playVictory();
            this.fireConfetti();
        }
    }

    fireConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 300);
        }
    }

    openImageZoom() {
        const q = this.activeQuestions[this.currentQuestionIndex];
        if (!q) return;

        const formatted = teacherController.formatImageUrl(q.imageUrl);
        this.dom.zoomedImg.src = formatted;
        this.dom.zoomedCaption.innerText = q.title;
        this.dom.modalImageZoom.classList.remove('hidden');
    }

    // ==========================================
    // TEACHER DASHBOARD
    // ==========================================

    openTeacherPinModal() {
        this.dom.teacherPinInput.value = '';
        this.dom.teacherPinError.classList.add('hidden');
        this.dom.modalTeacherPin.classList.remove('hidden');
        setTimeout(() => this.dom.teacherPinInput.focus(), 150);
    }

    handleVerifyTeacherPin() {
        const entered = this.dom.teacherPinInput.value.trim();
        if (teacherController.verifyPin(entered)) {
            this.dom.modalTeacherPin.classList.add('hidden');
            this.switchView('teacher');
        } else {
            this.dom.teacherPinError.classList.remove('hidden');
            this.dom.teacherPinInput.value = '';
            quizAudio.playWrong();
        }
    }

    renderTeacherDashboard() {
        this.bindTeacherTabs();
        this.renderTeacherAnalyticsTab();
    }

    bindTeacherTabs() {
        const tabs = [
            { id: 'tab-btn-analytics', target: 'analytics', render: () => this.renderTeacherAnalyticsTab() },
            { id: 'tab-btn-questions', target: 'questions', render: () => this.renderTeacherQuestionsTab() },
            { id: 'tab-btn-roster', target: 'roster', render: () => this.renderTeacherRosterTab() },
            { id: 'tab-btn-scores', target: 'scores', render: () => this.renderTeacherScoresTab() },
            { id: 'tab-btn-settings', target: 'settings', render: () => this.renderTeacherSettingsTab() }
        ];

        tabs.forEach(tab => {
            const btn = document.getElementById(tab.id);
            if (btn) {
                btn.onclick = () => {
                    tabs.forEach(t => {
                        const b = document.getElementById(t.id);
                        if (b) b.className = 'teacher-tab-btn px-4 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all';
                    });
                    btn.className = 'teacher-tab-btn px-4 py-2.5 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-600/30 transition-all';
                    tab.render();
                };
            }
        });

        // Bind Export & Print buttons
        const btnExportExcel = document.getElementById('btn-teacher-export-excel');
        if (btnExportExcel) {
            btnExportExcel.onclick = () => teacherController.exportToExcel();
        }

        const btnPrintReport = document.getElementById('btn-teacher-print');
        if (btnPrintReport) {
            btnPrintReport.onclick = () => teacherController.printReport();
        }

        const btnTeacherLogout = document.getElementById('btn-teacher-logout');
        if (btnTeacherLogout) {
            btnTeacherLogout.onclick = () => this.switchView('lobby');
        }
    }

    renderTeacherAnalyticsTab() {
        const stats = teacherController.calculateAnalytics();
        const content = this.dom.teacherTabContent;
        if (!content) return;

        let mistakesHtml = '';
        if (!stats.sortedMistakes || stats.sortedMistakes.length === 0) {
            mistakesHtml = `
                <div class="p-8 text-center text-gray-400 bg-gray-900/50 rounded-2xl border border-gray-800">
                    <p class="text-lg">ยังไม่มีข้อมูลการตอบแบบทดสอบของนักศึกษา</p>
                    <p class="text-sm text-gray-500 mt-1">ให้นักศึกษาเริ่มทำควิซเพื่อดูสถิติและข้อที่ตอบผิดมากที่สุดแบบเรียลไทม์</p>
                </div>
            `;
        } else {
            mistakesHtml = stats.sortedMistakes.map((m, idx) => {
                const formattedImg = teacherController.formatImageUrl(m.imageUrl);
                return `
                    <div class="p-5 rounded-2xl bg-gray-900/60 border ${m.wrongRate > 50 ? 'border-rose-500/50 bg-rose-950/10' : 'border-gray-800'} space-y-4">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div class="flex items-center space-x-3">
                                <span class="w-8 h-8 rounded-xl ${m.wrongRate > 50 ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-300'} font-black text-sm flex items-center justify-center">
                                    #${idx + 1}
                                </span>
                                <div>
                                    <h4 class="font-bold text-white text-base">${m.title}</h4>
                                    <span class="text-xs px-2.5 py-0.5 rounded-full ${m.category === 'shot_size' ? 'bg-blue-900/60 text-blue-300' : 'bg-purple-900/60 text-purple-300'}">
                                        ${m.category === 'shot_size' ? 'ขนาดภาพ (Shot Size)' : 'มุมกล้อง (Camera Angle)'}
                                    </span>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="text-xl font-black ${m.wrongRate > 50 ? 'text-rose-400' : 'text-amber-400'}">ผิด ${m.wrongRate}%</span>
                                <span class="text-xs text-gray-400 block">(${m.wrongCount} จาก ${m.totalCount} คน)</span>
                            </div>
                        </div>

                        <!-- Mistake Bar -->
                        <div class="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" style="width: ${m.wrongRate}%"></div>
                        </div>

                        <div class="flex flex-col sm:flex-row gap-4 items-start pt-2">
                            <img src="${formattedImg}" class="w-full sm:w-32 h-24 object-cover rounded-xl border border-gray-700" alt="Preview" />
                            <div class="space-y-1 text-xs md:text-sm flex-1">
                                <p class="text-emerald-400 font-bold">✓ เฉลยที่ถูกต้อง: ${m.correctOption}</p>
                                <div class="mt-2 text-gray-400">
                                    <span class="font-bold text-rose-300">ตัวเลือกที่นักเรียนเข้าใจผิดเลือกตอบบ่อย:</span>
                                    <ul class="list-disc list-inside mt-1 space-y-0.5">
                                        ${Object.entries(m.wrongChoices).map(([choice, count]) => `
                                            <li>${choice} (${count} คน)</li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Summary Metrics Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="p-5 rounded-2xl bg-gray-900/80 border border-purple-500/30">
                        <span class="text-xs text-purple-400 uppercase font-bold tracking-wider">จำนวนผู้เข้าทำ</span>
                        <div class="text-3xl font-black text-white mt-1">${stats.uniqueStudents} <span class="text-sm font-normal text-gray-400">คน (${stats.totalAttempts} ครั้ง)</span></div>
                    </div>
                    <div class="p-5 rounded-2xl bg-gray-900/80 border border-emerald-500/30">
                        <span class="text-xs text-emerald-400 uppercase font-bold tracking-wider">คะแนนเฉลี่ย</span>
                        <div class="text-3xl font-black text-white mt-1">${stats.averagePercentage}% <span class="text-sm font-normal text-gray-400">(${stats.averageScore} คะแนน)</span></div>
                    </div>
                    <div class="p-5 rounded-2xl bg-gray-900/80 border border-blue-500/30">
                        <span class="text-xs text-blue-400 uppercase font-bold tracking-wider">ความแม่นยำ: ขนาดภาพ</span>
                        <div class="text-3xl font-black text-white mt-1">${stats.categoryStats.shot_size.percentage}%</div>
                    </div>
                    <div class="p-5 rounded-2xl bg-gray-900/80 border border-amber-500/30">
                        <span class="text-xs text-amber-400 uppercase font-bold tracking-wider">ความแม่นยำ: มุมกล้อง</span>
                        <div class="text-3xl font-black text-white mt-1">${stats.categoryStats.camera_angle.percentage}%</div>
                    </div>
                </div>

                <!-- Misconception Breakdown Header -->
                <div class="flex items-center justify-between pt-4">
                    <div>
                        <h3 class="text-xl font-bold text-white flex items-center space-x-2">
                            <span>🔍 วิเคราะห์จุดที่นักเรียนสับสน / ตอบผิดมากที่สุด</span>
                        </h3>
                        <p class="text-xs md:text-sm text-gray-400">ใช้เพื่อเน้นย้ำหรือสรุปความรู้ทบทวนท้ายคาบเรียน</p>
                    </div>
                </div>

                <div class="space-y-4">
                    ${mistakesHtml}
                </div>
            </div>
        `;
    }

    renderTeacherQuestionsTab() {
        const questions = quizData.getQuestions();
        const content = this.dom.teacherTabContent;
        if (!content) return;

        let qHtml = questions.map((q, idx) => {
            const formattedImg = teacherController.formatImageUrl(q.imageUrl);
            return `
                <div class="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col md:flex-row gap-5 items-start justify-between">
                    <div class="flex flex-col sm:flex-row gap-4 items-start flex-1">
                        <img src="${formattedImg}" class="w-full sm:w-36 h-28 object-cover rounded-xl border border-gray-700 shadow-md" alt="Question Image" />
                        <div class="space-y-2 flex-1">
                            <div class="flex items-center space-x-2">
                                <span class="w-6 h-6 rounded-md bg-purple-600 text-white font-bold text-xs flex items-center justify-center">${idx + 1}</span>
                                <span class="text-xs px-2.5 py-0.5 rounded-full ${q.category === 'shot_size' ? 'bg-blue-900/60 text-blue-300' : 'bg-purple-900/60 text-purple-300'}">
                                    ${q.category === 'shot_size' ? 'ขนาดภาพ (Shot Size)' : 'มุมกล้อง (Camera Angle)'}
                                </span>
                                <span class="text-xs text-gray-400">⏱ ${q.timeLimit || 15}s</span>
                            </div>
                            <h4 class="font-bold text-white text-base">${q.title}</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                                ${q.options.map((opt, oIdx) => `
                                    <div class="p-1.5 rounded-lg ${oIdx === q.correctIndex ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold' : 'bg-gray-800/60 text-gray-400'}">
                                        ${oIdx + 1}. ${opt} ${oIdx === q.correctIndex ? '✓ (เฉลย)' : ''}
                                    </div>
                                `).join('')}
                            </div>
                            <p class="text-xs text-purple-300/80 bg-purple-950/40 p-2 rounded-lg">💡 ${q.explanation}</p>
                        </div>
                    </div>
                    <div class="flex md:flex-col gap-2 w-full md:w-auto">
                        <button type="button" onclick="app.openEditQuestionModal('${q.id}')" class="flex-1 md:flex-none px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-500/40">
                            ✏️ แก้ไข
                        </button>
                        <button type="button" onclick="app.handleDeleteQuestion('${q.id}')" class="flex-1 md:flex-none px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-500/40">
                            🗑️ ลบ
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h3 class="text-xl font-bold text-white">คลังข้อสอบ (${questions.length} ข้อ)</h3>
                        <p class="text-xs text-gray-400">เพิ่ม/แก้ไขโจทย์ แปะลิงก์รูปภาพ หรือแปลงลิงก์ Google Drive อัตโนมัติ</p>
                    </div>
                    <div class="flex space-x-2">
                        <button type="button" onclick="app.openAddQuestionModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-2">
                            <span>➕ เพิ่มคำถามใหม่</span>
                        </button>
                        <button type="button" onclick="app.handleResetQuestions()" class="px-3 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold border border-gray-700">
                            🔄 คืนค่าเริ่มต้น
                        </button>
                    </div>
                </div>

                <div class="space-y-4">
                    ${qHtml}
                </div>
            </div>
        `;
    }

    renderTeacherRosterTab() {
        const students = rosterManager.getStudents();
        const content = this.dom.teacherTabContent;
        if (!content) return;

        let rosterHtml = students.map((s, idx) => `
            <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors text-sm">
                <td class="py-3 px-4 text-center text-gray-400">${idx + 1}</td>
                <td class="py-3 px-4 font-mono font-bold text-purple-300">${s.id}</td>
                <td class="py-3 px-4 text-white">${s.name}</td>
                <td class="py-3 px-4 text-gray-300">${s.nickname || '-'}</td>
                <td class="py-3 px-4 text-right">
                    <button type="button" onclick="app.handleDeleteStudent('${s.id}')" class="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs border border-rose-500/30">
                        ลบ
                    </button>
                </td>
            </tr>
        `).join('');

        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h3 class="text-xl font-bold text-white">รายชื่อนักศึกษา (${students.length} คน)</h3>
                        <p class="text-xs text-gray-400">รายชื่อนี้จะแสดงใน Dropdown ให้ผู้เรียนเลือกตอนเริ่มทำควิซโดยไม่ต้องจำรหัสผ่าน</p>
                    </div>
                    <div class="flex space-x-2">
                        <button type="button" onclick="app.openRosterBulkModal()" class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg flex items-center space-x-2">
                            <span>📋 คัดลอก-วางรายชื่อจำนวนมาก (Bulk)</span>
                        </button>
                        <button type="button" onclick="app.handleResetRoster()" class="px-3 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold border border-gray-700">
                            🔄 คืนค่าเริ่มต้น
                        </button>
                    </div>
                </div>

                <!-- Add Single Student Bar -->
                <div class="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col sm:flex-row gap-3">
                    <input type="text" id="new-student-id" placeholder="รหัสนักศึกษา เช่น 6601099" class="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm flex-1" />
                    <input type="text" id="new-student-name" placeholder="ชื่อ-นามสกุล" class="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm flex-1" />
                    <input type="text" id="new-student-nick" placeholder="ชื่อเล่น (ถ้ามี)" class="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm w-full sm:w-32" />
                    <button type="button" onclick="app.handleAddSingleStudent()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl whitespace-nowrap">
                        ➕ เพิ่มนักศึกษา
                    </button>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/40">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-gray-800/80 text-gray-300 text-xs uppercase font-bold border-b border-gray-700">
                                <th class="py-3 px-4 text-center w-16">ลำดับ</th>
                                <th class="py-3 px-4">รหัสนักศึกษา</th>
                                <th class="py-3 px-4">ชื่อ-นามสกุล</th>
                                <th class="py-3 px-4">ชื่อเล่น</th>
                                <th class="py-3 px-4 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rosterHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderTeacherScoresTab() {
        const results = quizData.getResults();
        const content = this.dom.teacherTabContent;
        if (!content) return;

        let tableRows = '';
        if (results.length === 0) {
            tableRows = `<tr><td colspan="10" class="text-center py-8 text-gray-500">ยังไม่มีประวัติการส่งคะแนนในระบบ</td></tr>`;
        } else {
            tableRows = results.map((r, idx) => `
                <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors text-sm">
                    <td class="py-3 px-4 text-center text-gray-400">${idx + 1}</td>
                    <td class="py-3 px-4 font-mono font-bold text-purple-300">${r.studentId}</td>
                    <td class="py-3 px-4 text-white font-medium">${r.studentName}</td>
                    <td class="py-3 px-4 text-gray-300 text-xs">${r.studentGroup || '-'}</td>
                    <td class="py-3 px-4 text-gray-300 text-xs">${r.modeTitle || '-'}</td>
                    <td class="py-3 px-4 text-center">
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${r.percentage >= 60 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'}">
                            ${r.percentage}% (${r.score} คะแนน)
                        </span>
                    </td>
                    <td class="py-3 px-4 text-center font-bold">${r.grade}</td>
                    <td class="py-3 px-4 text-center text-gray-400 text-xs">${r.totalTimeUsed}s</td>
                    <td class="py-3 px-4 text-center text-xs font-bold ${r.tabSwitchCount > 0 ? 'text-amber-400' : 'text-emerald-400'}">
                        ${r.tabSwitchCount ? `${r.tabSwitchCount} ครั้ง ⚠️` : '0 ครั้ง'}
                    </td>
                    <td class="py-3 px-4 text-center text-xs text-gray-400">${r.timestamp ? new Date(r.timestamp).toLocaleTimeString('th-TH') : '-'}</td>
                </tr>
            `).join('');
        }

        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h3 class="text-xl font-bold text-white">ตารางคะแนนทั้งหมด (${results.length} รายการ)</h3>
                        <p class="text-xs text-gray-400">สามารถส่งออกเป็นไฟล์ Excel หรือพิมพ์ใบรายงานคะแนนส่งงานได้ทันที</p>
                    </div>
                    <div class="flex space-x-2">
                        <button type="button" onclick="teacherController.exportToExcel()" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg flex items-center space-x-2">
                            <span>📊 ส่งออก Excel (.xlsx)</span>
                        </button>
                        <button type="button" onclick="teacherController.printReport()" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg flex items-center space-x-2">
                            <span>🖨️ สั่งพิมพ์รายงาน (A4)</span>
                        </button>
                        <button type="button" onclick="app.handleClearResults()" class="px-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-sm font-bold border border-rose-500/30">
                            🗑️ ล้างประวัติ
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/40">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-gray-800/80 text-gray-300 text-xs uppercase font-bold border-b border-gray-700">
                                <th class="py-3 px-4 text-center w-12">ลำดับ</th>
                                <th class="py-3 px-4">รหัสนักศึกษา</th>
                                <th class="py-3 px-4">ชื่อ-นามสกุล</th>
                                <th class="py-3 px-4">กลุ่มเรียน</th>
                                <th class="py-3 px-4">โหมด</th>
                                <th class="py-3 px-4 text-center">คะแนน</th>
                                <th class="py-3 px-4 text-center">เกรด</th>
                                <th class="py-3 px-4 text-center">เวลา</th>
                                <th class="py-3 px-4 text-center">สลับจอ</th>
                                <th class="py-3 px-4 text-center">เวลาที่ส่ง</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderTeacherSettingsTab() {
        const content = this.dom.teacherTabContent;
        if (!content) return;

        content.innerHTML = `
            <div class="max-w-xl mx-auto space-y-6">
                <div class="p-6 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-4">
                    <h3 class="text-lg font-bold text-white flex items-center space-x-2">
                        <span>🔒 เปลี่ยนรหัส PIN ผู้สอน (6 หลัก)</span>
                    </h3>
                    <p class="text-xs text-gray-400">รหัส PIN ปัจจุบันคือ: <strong class="text-purple-400 font-mono">${teacherController.getPin()}</strong></p>
                    <div class="space-y-2">
                        <label class="text-xs text-gray-300">ระบุรหัส PIN 6 หลักใหม่</label>
                        <input type="password" id="new-teacher-pin" maxlength="6" placeholder="เช่น 654321" class="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono text-center tracking-widest text-lg" />
                    </div>
                    <button type="button" onclick="app.handleChangePin()" class="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg">
                        บันทึก PIN ใหม่
                    </button>
                </div>
            </div>
        `;
    }

    // ==========================================
    // QUESTION EDIT / ADD MODAL
    // ==========================================

    openAddQuestionModal() {
        this.editingQuestionId = null;
        document.getElementById('edit-modal-title').innerText = 'เพิ่มคำถามใหม่';
        document.getElementById('q-edit-category').value = 'shot_size';
        document.getElementById('q-edit-title').value = '';
        document.getElementById('q-edit-imageurl').value = '';
        document.getElementById('q-edit-opt0').value = '';
        document.getElementById('q-edit-opt1').value = '';
        document.getElementById('q-edit-opt2').value = '';
        document.getElementById('q-edit-opt3').value = '';
        document.getElementById('q-edit-correct').value = '0';
        document.getElementById('q-edit-timelimit').value = '15';
        document.getElementById('q-edit-explanation').value = '';
        document.getElementById('q-edit-preview-img').src = '';
        document.getElementById('q-edit-preview-box').classList.add('hidden');

        this.dom.modalQuestionEdit.classList.remove('hidden');
    }

    openEditQuestionModal(qId) {
        const questions = quizData.getQuestions();
        const q = questions.find(item => item.id === qId);
        if (!q) return;

        this.editingQuestionId = qId;
        document.getElementById('edit-modal-title').innerText = 'แก้ไขคำถาม';
        document.getElementById('q-edit-category').value = q.category || 'shot_size';
        document.getElementById('q-edit-title').value = q.title || '';
        document.getElementById('q-edit-imageurl').value = q.imageUrl || '';
        document.getElementById('q-edit-opt0').value = q.options[0] || '';
        document.getElementById('q-edit-opt1').value = q.options[1] || '';
        document.getElementById('q-edit-opt2').value = q.options[2] || '';
        document.getElementById('q-edit-opt3').value = q.options[3] || '';
        document.getElementById('q-edit-correct').value = String(q.correctIndex || 0);
        document.getElementById('q-edit-timelimit').value = String(q.timeLimit || 15);
        document.getElementById('q-edit-explanation').value = q.explanation || '';

        const formatted = teacherController.formatImageUrl(q.imageUrl);
        document.getElementById('q-edit-preview-img').src = formatted;
        document.getElementById('q-edit-preview-box').classList.remove('hidden');

        this.dom.modalQuestionEdit.classList.remove('hidden');
    }

    handleSaveQuestion() {
        const category = document.getElementById('q-edit-category').value;
        const title = document.getElementById('q-edit-title').value.trim();
        const imageUrl = document.getElementById('q-edit-imageurl').value.trim();
        const opt0 = document.getElementById('q-edit-opt0').value.trim();
        const opt1 = document.getElementById('q-edit-opt1').value.trim();
        const opt2 = document.getElementById('q-edit-opt2').value.trim();
        const opt3 = document.getElementById('q-edit-opt3').value.trim();
        const correctIndex = parseInt(document.getElementById('q-edit-correct').value, 10);
        const timeLimit = parseInt(document.getElementById('q-edit-timelimit').value, 10) || 15;
        const explanation = document.getElementById('q-edit-explanation').value.trim();

        if (!title || !imageUrl || !opt0 || !opt1 || !opt2 || !opt3) {
            alert('กรุณากรอกข้อมูลโจทย์ ลิงก์รูปภาพ และตัวเลือกทั้ง 4 ข้อให้ครบถ้วน');
            return;
        }

        const data = {
            category,
            title,
            imageUrl,
            options: [opt0, opt1, opt2, opt3],
            correctIndex,
            timeLimit,
            explanation
        };

        if (this.editingQuestionId) {
            quizData.updateQuestion(this.editingQuestionId, data);
        } else {
            quizData.addQuestion(data);
        }

        this.dom.modalQuestionEdit.classList.add('hidden');
        this.renderTeacherQuestionsTab();
    }

    handleDeleteQuestion(qId) {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำถามข้อนี้?')) {
            quizData.deleteQuestion(qId);
            this.renderTeacherQuestionsTab();
        }
    }

    handleResetQuestions() {
        if (confirm('คุณต้องการคืนค่าคลังข้อสอบทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่? (ข้อสอบที่คุณเพิ่มเองจะถูกรีเซ็ต)')) {
            quizData.resetToDefault();
            this.renderTeacherQuestionsTab();
        }
    }

    // ==========================================
    // ROSTER ACTIONS
    // ==========================================

    handleAddSingleStudent() {
        const id = document.getElementById('new-student-id').value.trim();
        const name = document.getElementById('new-student-name').value.trim();
        const nick = document.getElementById('new-student-nick').value.trim();

        if (!id || !name) {
            alert('กรุณากรอกรหัสนักศึกษาและชื่อ-นามสกุล');
            return;
        }

        rosterManager.addStudent({ id, name, nickname: nick });
        this.renderTeacherRosterTab();
        this.renderRosterDropdown();
    }

    handleDeleteStudent(studentId) {
        if (confirm(`คุณต้องการลบรหัสนักศึกษา ${studentId} ใช่หรือไม่?`)) {
            rosterManager.deleteStudent(studentId);
            this.renderTeacherRosterTab();
            this.renderRosterDropdown();
        }
    }

    handleResetRoster() {
        if (confirm('คุณต้องการรีเซ็ตรายชื่อนักศึกษากลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
            rosterManager.resetToDefault();
            this.renderTeacherRosterTab();
            this.renderRosterDropdown();
        }
    }

    openRosterBulkModal() {
        this.dom.modalRosterBulk.classList.remove('hidden');
    }

    handleSaveRosterBulk() {
        const text = document.getElementById('roster-bulk-textarea').value;
        if (!text.trim()) {
            alert('กรุณากรอกรายชื่อ');
            return;
        }
        rosterManager.bulkImport(text);
        this.dom.modalRosterBulk.classList.add('hidden');
        this.renderTeacherRosterTab();
        this.renderRosterDropdown();
    }

    handleClearResults() {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการส่งคะแนนทั้งหมด? (ไม่สามารถกู้คืนได้)')) {
            quizData.clearResults();
            this.renderTeacherScoresTab();
        }
    }

    handleChangePin() {
        const newPin = document.getElementById('new-teacher-pin').value.trim();
        if (/^\d{6}$/.test(newPin)) {
            teacherController.setPin(newPin);
            alert('เปลี่ยนรหัส PIN 6 หลักสำเร็จแล้ว');
            this.renderTeacherSettingsTab();
        } else {
            alert('รหัส PIN ต้องเป็นตัวเลข 6 หลักเท่านั้น');
        }
    }

    // ==========================================
    // CLASSROOM BIG SCREEN MODE
    // ==========================================

    renderBigScreenLeaderboard() {
        const results = quizData.getResults();
        const podiumContainer = document.getElementById('bigscreen-podium');
        const listContainer = document.getElementById('bigscreen-list');
        if (!podiumContainer || !listContainer) return;

        // Group by studentId and take highest score
        const bestScoresMap = new Map();
        results.forEach(r => {
            if (!bestScoresMap.has(r.studentId) || bestScoresMap.get(r.studentId).score < r.score) {
                bestScoresMap.set(r.studentId, r);
            }
        });

        const sorted = Array.from(bestScoresMap.values()).sort((a, b) => b.score - a.score);

        // Top 3 Podium
        const first = sorted[0];
        const second = sorted[1];
        const third = sorted[2];

        podiumContainer.innerHTML = `
            <!-- 2nd Place -->
            <div class="flex flex-col items-center">
                ${second ? `
                    <div class="text-center mb-2">
                        <span class="text-xl md:text-2xl font-bold text-gray-300 block">${second.studentName}</span>
                        <span class="text-xs text-gray-400 block">${second.studentGroup ? `[${second.studentGroup}]` : ''} (${second.studentId})</span>
                        <span class="text-sm font-mono text-purple-300 font-bold mt-1 inline-block">${second.score} คะแนน (${second.percentage}%)</span>
                    </div>
                ` : '<div class="h-12"></div>'}
                <div class="w-28 md:w-36 h-36 md:h-44 bg-gradient-to-t from-gray-700 to-gray-500 rounded-t-3xl flex items-center justify-center border-t-4 border-gray-300 shadow-2xl shadow-gray-500/20">
                    <span class="text-4xl md:text-5xl font-black text-gray-900">2</span>
                </div>
            </div>

            <!-- 1st Place -->
            <div class="flex flex-col items-center">
                ${first ? `
                    <div class="text-center mb-2 animate-bounce">
                        <span class="text-2xl md:text-3xl font-black text-amber-300 block">👑 ${first.studentName}</span>
                        <span class="text-xs text-amber-200/80 block">${first.studentGroup ? `[${first.studentGroup}]` : ''} (${first.studentId})</span>
                        <span class="text-base font-mono text-amber-200 font-bold bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/50 mt-1 inline-block">${first.score} คะแนน (${first.percentage}%)</span>
                    </div>
                ` : '<div class="h-16"></div>'}
                <div class="w-32 md:w-44 h-48 md:h-60 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-t-3xl flex items-center justify-center border-t-4 border-yellow-200 shadow-2xl shadow-yellow-500/40 relative">
                    <span class="text-5xl md:text-6xl font-black text-amber-950">1</span>
                </div>
            </div>

            <!-- 3rd Place -->
            <div class="flex flex-col items-center">
                ${third ? `
                    <div class="text-center mb-2">
                        <span class="text-xl md:text-2xl font-bold text-amber-600 block">${third.studentName}</span>
                        <span class="text-xs text-gray-400 block">${third.studentGroup ? `[${third.studentGroup}]` : ''} (${third.studentId})</span>
                        <span class="text-sm font-mono text-amber-400 font-bold mt-1 inline-block">${third.score} คะแนน (${third.percentage}%)</span>
                    </div>
                ` : '<div class="h-12"></div>'}
                <div class="w-28 md:w-36 h-28 md:h-36 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-3xl flex items-center justify-center border-t-4 border-amber-500 shadow-2xl shadow-amber-700/20">
                    <span class="text-4xl md:text-5xl font-black text-amber-950">3</span>
                </div>
            </div>
        `;

        // 4th - 10th Place List
        const rest = sorted.slice(3, 10);
        if (rest.length === 0) {
            listContainer.innerHTML = '';
        } else {
            listContainer.innerHTML = rest.map((r, i) => `
                <div class="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="w-8 h-8 rounded-lg bg-gray-800 font-bold text-sm text-gray-300 flex items-center justify-center">${i + 4}</span>
                        <div>
                            <span class="font-bold text-white text-base">${r.studentName}</span>
                            <span class="text-xs text-gray-400 font-mono ml-1.5">${r.studentGroup ? `[${r.studentGroup}]` : ''} (${r.studentId})</span>
                        </div>
                    </div>
                    <span class="font-mono font-bold text-purple-400">${r.score} คะแนน</span>
                </div>
            `).join('');
        }
    }
}

// Global App Instance
const app = new DBTQuizApp();
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
