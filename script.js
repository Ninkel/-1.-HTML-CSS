(function () {
    'use strict';

    console.log('Script loaded');

    // ===== Константы =====
    const MONTHS_RU = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const MONTHS_RU_GENITIVE = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const WEEKDAYS_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    // ===== Состояние =====
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const state = {
        viewYear: today.getFullYear(),
        viewMonth: today.getMonth(),
        selectedDate: null,
        selectedTime: null
    };

    // ===== DOM элементы =====
    let calendarGrid, monthTitle, timeGrid, prevMonthBtn, nextMonthBtn;

    function initDOM() {
        calendarGrid = document.querySelector('.calendar-grid');
        monthTitle = document.querySelector('.calendar-header h2');
        timeGrid = document.querySelector('.time-grid');
        
        const arrows = document.querySelectorAll('.calendar-arrow');
        prevMonthBtn = arrows[0];
        nextMonthBtn = arrows[1];

        console.log('DOM elements:', {
            calendarGrid: !!calendarGrid,
            monthTitle: !!monthTitle,
            timeGrid: !!timeGrid,
            prevMonthBtn: !!prevMonthBtn,
            nextMonthBtn: !!nextMonthBtn
        });
    }

    // ===== Утилиты =====
    function daysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function weekdayMondayFirst(date) {
        const d = date.getDay();
        return d === 0 ? 6 : d - 1;
    }

    function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    function getBookedSlots(date) {
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const hash = (day * 7 + month * 13 + year) % TIME_SLOTS.length;
        const booked = [];
        for (let i = 0; i < 2; i++) {
            booked.push(TIME_SLOTS[(hash + i * 3) % TIME_SLOTS.length]);
        }
        return booked;
    }

    // ===== Создание нижней панели сводки =====
    function createSummaryPanel() {
        const summary = document.createElement('div');
        summary.className = 'booking-summary';
        summary.id = 'booking-summary';
        summary.innerHTML = `
            <div class="booking-summary-info">
                <span class="booking-summary-date" id="summary-date">—</span>
                <span class="booking-summary-time" id="summary-time">время не выбрано</span>
            </div>
        `;

        const bookingContainer = document.querySelector('.booking-container');
        const actions = document.querySelector('.booking-actions');
        
        if (bookingContainer && actions) {
            bookingContainer.insertBefore(summary, actions);
            console.log('Summary panel created');
        } else {
            console.error('Could not create summary panel');
        }

        // Стили
        const style = document.createElement('style');
        style.textContent = `
            .booking-summary {
                background-color: var(--dark-card);
                border-radius: 12px;
                padding: 18px 22px;
                margin-top: 24px;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                min-height: 56px;
                border: 1px solid rgba(214, 181, 138, 0.15);
            }
            .booking-summary-info {
                display: flex;
                align-items: center;
                gap: 18px;
                flex-wrap: wrap;
            }
            .booking-summary-date {
                font-size: 16px;
                font-weight: 600;
                color: var(--white);
            }
            .booking-summary-time {
                font-size: 14px;
                color: var(--beige);
                padding-left: 18px;
                border-left: 1px solid rgba(255, 255, 255, 0.15);
            }
            .time-slot.selected {
                background-color: var(--beige-light) !important;
                color: var(--black) !important;
                box-shadow: 0 0 0 2px var(--beige);
            }
            .day.selected {
                background-color: var(--beige-light) !important;
                color: var(--black) !important;
                box-shadow: 0 0 0 2px var(--beige);
            }
            @media (max-width: 480px) {
                .booking-summary {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 16px;
                }
                .booking-summary-time {
                    padding-left: 0;
                    border-left: none;
                    padding-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.15);
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== Рендер календаря =====
    function renderCalendar() {
        if (!calendarGrid || !monthTitle) {
            console.error('Calendar elements not found');
            return;
        }

        calendarGrid.innerHTML = '';
        monthTitle.textContent = MONTHS_RU[state.viewMonth] + ' ' + state.viewYear;

        // Заголовки дней недели
        const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        weekdays.forEach(function (wd) {
            const el = document.createElement('div');
            el.className = 'weekday';
            el.textContent = wd;
            calendarGrid.appendChild(el);
        });

        const firstDay = new Date(state.viewYear, state.viewMonth, 1);
        const startOffset = weekdayMondayFirst(firstDay);
        const totalDays = daysInMonth(state.viewYear, state.viewMonth);

        // Пустые ячейки до начала месяца
        const prevMonthDays = daysInMonth(state.viewYear, state.viewMonth - 1);
        for (let i = startOffset - 1; i >= 0; i--) {
            const el = document.createElement('button');
            el.className = 'day muted';
            el.type = 'button';
            el.textContent = prevMonthDays - i;
            el.disabled = true;
            calendarGrid.appendChild(el);
        }

        // Дни текущего месяца
        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(state.viewYear, state.viewMonth, d);
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'day';
            el.textContent = d;

            const isPast = date < today;
            const isSelected = state.selectedDate && isSameDay(date, state.selectedDate);

            if (isPast) {
                el.classList.add('muted');
                el.disabled = true;
            } else {
                el.addEventListener('click', function () {
                    console.log('Day clicked:', d);
                    selectDate(date);
                });
            }

            if (isSelected) {
                el.classList.add('selected');
            }

            calendarGrid.appendChild(el);
        }

        // Добиваем сетку
        const totalCells = startOffset + totalDays;
        const remainder = totalCells % 7;
        if (remainder !== 0) {
            const extra = 7 - remainder;
            for (let i = 1; i <= extra; i++) {
                const el = document.createElement('button');
                el.className = 'day muted';
                el.type = 'button';
                el.textContent = i;
                el.disabled = true;
                calendarGrid.appendChild(el);
            }
        }

        console.log('Calendar rendered:', MONTHS_RU[state.viewMonth], state.viewYear);
    }

    // ===== Рендер слотов времени =====
    function renderTimeSlots() {
        if (!timeGrid) {
            console.error('Time grid not found');
            return;
        }

        timeGrid.innerHTML = '';

        if (!state.selectedDate) {
            timeGrid.innerHTML = '<p style="color:var(--gray);grid-column:1/-1;font-size:13px;">Выберите дату</p>';
            return;
        }

        const booked = getBookedSlots(state.selectedDate);

        TIME_SLOTS.forEach(function (time) {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'time-slot';

            const isBooked = booked.indexOf(time) !== -1;
            const isSelected = state.selectedTime === time;

            if (isBooked) {
                el.classList.add('booked');
                el.innerHTML = time + '<span>Занято</span>';
                el.disabled = true;
            } else {
                el.textContent = time;
                el.addEventListener('click', function () {
                    console.log('Time clicked:', time);
                    selectTime(time);
                });
            }

            if (isSelected && !isBooked) {
                el.classList.add('selected');
            }

            timeGrid.appendChild(el);
        });

        console.log('Time slots rendered');
    }

    // ===== Обновление нижней панели =====
    function renderSummary() {
        const summaryDateEl = document.getElementById('summary-date');
        const summaryTimeEl = document.getElementById('summary-time');

        if (!summaryDateEl || !summaryTimeEl) {
            console.error('Summary elements not found');
            return;
        }

        if (!state.selectedDate) {
            summaryDateEl.textContent = '—';
            summaryTimeEl.textContent = 'время не выбрано';
            return;
        }

        const weekday = WEEKDAYS_RU[state.selectedDate.getDay()];
        const day = state.selectedDate.getDate();
        const month = MONTHS_RU_GENITIVE[state.selectedDate.getMonth()];
        const year = state.selectedDate.getFullYear();

        summaryDateEl.textContent = weekday + ', ' + day + ' ' + month + ' ' + year;

        if (state.selectedTime) {
            summaryTimeEl.textContent = state.selectedTime;
        } else {
            summaryTimeEl.textContent = 'время не выбрано';
        }

        console.log('Summary updated');
    }

    // ===== Действия =====
    function selectDate(date) {
        state.selectedDate = date;
        state.selectedTime = null;
        renderCalendar();
        renderTimeSlots();
        renderSummary();
    }

    function selectTime(time) {
        state.selectedTime = time;
        renderTimeSlots();
        renderSummary();
    }

    function changeMonth(delta) {
        state.viewMonth += delta;
        if (state.viewMonth > 11) {
            state.viewMonth = 0;
            state.viewYear++;
        } else if (state.viewMonth < 0) {
            state.viewMonth = 11;
            state.viewYear--;
        }
        renderCalendar();
    }

    // ===== Инициализация =====
    function init() {
        console.log('Initializing...');
        
        initDOM();
        createSummaryPanel();

        // Выбираем сегодня по умолчанию
        state.selectedDate = new Date(today);
        state.viewYear = today.getFullYear();
        state.viewMonth = today.getMonth();

        // Обработчики
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('Previous month');
                changeMonth(-1);
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('Next month');
                changeMonth(1);
            });
        }

        // Первоначальный рендер
        renderCalendar();
        renderTimeSlots();
        renderSummary();

        console.log('Initialization complete');
    }

    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();