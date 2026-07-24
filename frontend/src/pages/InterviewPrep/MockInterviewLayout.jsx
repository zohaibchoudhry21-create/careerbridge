import { Outlet } from 'react-router-dom';
import { InterviewMediaProvider } from '../../features/interviewPrep/context/InterviewMediaContext';

export default function MockInterviewLayout() {
  return (
    <InterviewMediaProvider>
      <Outlet />
    </InterviewMediaProvider>
  );
}
