import React, { useEffect, useState } from 'react';
import { useGetSchedule } from './hooks/use-GetSchedule';
import ScheduleTable from './components/scheduleTable/scheduleTable';
import './App.css';

function App() {
  const [search, setSearch] = useState('');
  const [matchedItems, setMatchedItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [weekNumber, setWeekNumber] = useState(null);
  const [data, setData] = useState({ teachers: {}, groups: {} });

  const getWeekNumber = (weekString) => parseInt(weekString) || null;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groups, teachers] = await Promise.all([
          fetch('/groups.json').then(res => res.json()),
          fetch('/teachers.json').then(res => res.json())
        ]);

        const defaultGroupId = "1282690279";
        const defaultGroupName = Object.keys(groups).find(key => groups[key] === defaultGroupId);
        
        if (defaultGroupName) {
          setSelected({ id: defaultGroupId, type: "group", name: defaultGroupName });
        }

        setData({ groups, teachers });
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!search.trim()) return setMatchedItems([]);
    const searchLower = search.toLowerCase();
    const results = [];
    for (const [name, id] of Object.entries(data.groups)) {
      if (name.toLowerCase().includes(searchLower)) results.push({ id, name, type: 'group' });
    }
    for (const [name, id] of Object.entries(data.teachers)) {
      if (name.toLowerCase().includes(searchLower)) results.push({ id, name, type: 'teacher' });
    }

    setMatchedItems(results);
  }, [search, data]);

  const { schedule, loading, error } = useGetSchedule(
    selected && { type: selected.type, id: selected.id, week: weekNumber }
  );

  useEffect(() => {
    if (schedule?.currentWeek) setWeekNumber(getWeekNumber(schedule.currentWeek));
  }, [schedule?.currentWeek]);

  const selectItem = (item) => {
    setSelected(item);
    setSearch(item.name);
    setMatchedItems([]);
  };

  const changeWeek = (delta) => {
    setWeekNumber(prev => prev !== null ? Math.max(1, prev + delta) : null);
  };

  return (
    <div className="schedule-container">
      <div className="header-block">
        <h1 className="schedule-title">Расписание, {selected?.name || "группа"}</h1>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Введите группу или ФИО преподавателя"
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {matchedItems.length > 0 && (
            <div className="search-results">
              {matchedItems.map((item, index) => (
                <div 
                  key={index} 
                  className="search-result-item"
                  onClick={() => selectItem(item)}
                >
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="week-navigation">
          <span className="current-week">{weekNumber !== null ? `${weekNumber} неделя` : 'Загрузка...'}</span>
          <div className="week-buttons">
            <button
              onClick={() => changeWeek(-1)}
              className="week-button prev"
              disabled={!selected || loading || weekNumber === null || weekNumber <= 1}
            >
              ← Предыдущая неделя
            </button>
            <button
              onClick={() => changeWeek(1)}
              className="week-button next"
              disabled={!selected || loading || weekNumber === null}
            >
             Следующая неделя →
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          Ошибка: {error.message}
        </div>
      )}

      {schedule && <ScheduleTable schedule={schedule} />}
    </div>
  );
}

export default App;