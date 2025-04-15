import { useEffect, useState } from "react";
import axios from "axios";

export const useGetSchedule = (params) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSchedule = async () => {
      if (!params || !params.id) return; 
      try { 
          setLoading(true);
          const { type = 'group', id, week } = params;
          
          const res = await axios.get(`http://localhost:3000/api/schedule/${type}/${id}`, {
              params: { week }
          });
          
          setSchedule(res.data);
          setError(null);
      } catch (err) {
          console.error('Ошибка загрузки расписания:', err);
          setError(err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchSchedule();
  }, [params?.type, params?.id, params?.week]); 

  return { schedule, loading, error };
};