import React from 'react';
import ScheduleRow from '../scheduleRow/scheduleRow';
import './ScheduleTable.css';
const ScheduleTable = ({ schedule }) => {
  if (!schedule) return null;

  return (
    <div className="schedule-table-container">
      <table className="schedule-table">
        <thead>
          <tr>
            <th className="time-column">Время</th>
            {schedule.days[0].lessons.map((day, index) => (
              <th key={index} className="day-header">
                <div className="weekday">{day.weekday}</div>
                <div className="date">{day.date}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedule.days.slice(1).map((row, rowIndex) => (
            <ScheduleRow key={rowIndex} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;