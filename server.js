import express from 'express';
import axios from 'axios';
import { parse} from 'node-html-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let teachersData = [];
let groupsData = [];

try {
    const groupsJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'groups.json')));
    groupsData = groupsJson.groups || [];
    console.log('Список групп успешно загружен:', groupsData.length);
} catch (err) {
    console.error('Ошибка загрузки групп:', err);
}

try {
    const teachersJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'teachers.json')));
    teachersData = teachersJson.teachers || [];
    console.log('Список преподавателей успешно загружен:', teachersData.length);
} catch (err) {
    console.error('Ошибка загрузки преподавателей:', err);
}

const BASE_URL = 'https://ssau.ru/rasp';

function parseSchedule(html, forTeacher = false) {
    const root = parse(html);
    const schedule = {
        currentWeek: root.querySelector('.week-nav-current_week')?.text.trim() || '1',
        selectedItem: root.querySelector('.info-block__title')?.text.trim() || '',
        days: []
    };

    const weekdayHeaders = root.querySelectorAll('.schedule__head-weekday');
    const dateHeaders = root.querySelectorAll('.schedule__head-date');

    if (weekdayHeaders.length && dateHeaders.length && weekdayHeaders.length === dateHeaders.length) {
        const syntheticDay = {
            date: 'Время',
            lessons: []
        };

        for (let i = 0; i < weekdayHeaders.length; i++) {
            const weekday = weekdayHeaders[i].text.trim();
            const date = dateHeaders[i].text.trim();
            syntheticDay.lessons.push({ weekday, date });
        }

        schedule.days.push(syntheticDay);
    }

    const timeItems = root.querySelectorAll('.schedule__time-item');
    const times = [];
    for (let i = 0; i < timeItems.length; i += 2) {
        const start = timeItems[i]?.text.trim() || '';
        const end = timeItems[i + 1]?.text.trim() || '';
        times.push(`${start} ${end}`.trim());
    }

    const lessonItems = root.querySelectorAll('.schedule__item:not(.schedule__head):not(.schedule__time)');
    const dayCount = weekdayHeaders.length;
    const pairCount = Math.ceil(lessonItems.length / dayCount);

    for (let pairIndex = 0; pairIndex < pairCount; pairIndex++) {
        const row = [];
        const time = times[pairIndex] || '';
        row.push({ time });

        for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
            const lessonIndex = pairIndex * dayCount + dayIndex;
            const item = lessonItems[lessonIndex];

            if (!item) {
                row.push(null);
                continue;
            }

            const discipline = item.querySelector('.schedule__discipline');
            if (!discipline) {
                row.push(null);
                continue;
            }

            const lesson = {
                subject: discipline.text.trim(),
                place: item.querySelector('.schedule__place')?.text.trim() || '',
            };

            if (forTeacher) {
                const groupElement = item.querySelector('.schedule__group');
                if (groupElement) {
                    lesson.groups = {
                        name: groupElement.text.trim(),
                        link: groupElement.getAttribute('href') || null
                    };
                }
            } else {
                lesson.teacher = {
                    name: item.querySelector('.schedule__teacher .caption-text')?.text.trim() || '',
                    link: item.querySelector('.schedule__teacher a')?.getAttribute('href') || null
                };
            }

            row.push(lesson);
        }

        schedule.days.push({
            lessons: row
        });
    }

    return schedule;
}

function createScheduleUrl(type, id, week) {
    const baseUrl = 'https://ssau.ru/rasp';
    const weekParam = week ? `&selectedWeek=${week}` : '';
    return type === 'group' 
        ? `${baseUrl}?groupId=${id}${weekParam}`
        : `${baseUrl}?staffId=${id}${weekParam}`;
}

app.get('/api/schedule/group/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const week = req.query.week || '';
        const url = createScheduleUrl('group', groupId, week);

        const response = await axios.get(url);
        const schedule = parseSchedule(response.data);

        res.json(schedule);
    } catch (error) {
        console.error('Ошибка получения расписания группы:', error);
        res.status(500).json({ 
            error: 'Не удалось получить расписание группы',
            details: error.message
        });
    }
});

app.get('/api/schedule/teacher/:staffId', async (req, res) => {
    try {
        const staffId = req.params.staffId;
        const week = req.query.week || '';
        const url = createScheduleUrl('teacher', staffId, week);

        const response = await axios.get(url);
        const schedule = parseSchedule(response.data, true);

        res.json(schedule);
    } catch (error) {
        console.error('Ошибка получения расписания преподавателя:', error);
        res.status(500).json({ 
            error: 'Не удалось получить расписание преподавателя',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});