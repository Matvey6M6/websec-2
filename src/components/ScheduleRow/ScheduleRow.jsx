import React from 'react';
import ScheduleCell from '../scheduleCell/scheduleCell';

const ScheduleRow = ({ row }) => {
  return (
    <tr>
      {row.lessons.map((cell, index) => (
        <ScheduleCell key={index} cell={cell} />
      ))}
    </tr>
  );
};

export default ScheduleRow;