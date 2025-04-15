import React from 'react';
import './ScheduleCell.css';

const ScheduleCell = ({ cell }) => {
  if (!cell) {
    return <td className="empty-cell">—</td>;
  }

  if (cell.time) {
    return <td className="time-cell">{cell.time}</td>;
  }

  return (
    <td className="lesson-cell">
      <div className="lesson-type">{cell.type}</div>
      <div className="lesson-subject">{cell.subject}</div>
      <div className="lesson-place">{cell.place}</div>
      {cell.teacher && (
        <div className="lesson-teacher">{cell.teacher.name}</div>
      )}
      {cell.groups && (
        <div className="lesson-groups">{cell.groups.name}</div>
      )}
    </td>
  );
};

export default ScheduleCell;