import { Outlet } from 'react-router-dom';
import { InterviewMediaProvider } from '../../features/interviewPrep/context/InterviewMediaContext';
import { INTERVIEW_FORMATS } from '../../features/interviewPrep/constants/interviewPrepConstants';

/**
 * Shared layout for mock + panel interview routes.
 * Passes interviewFormat/basePath via Outlet context (BrowserRouter-safe;
 * useMatches requires a data router and would crash here).
 */
export default function MockInterviewLayout({
  interviewFormat = INTERVIEW_FORMATS.STANDARD,
  basePath = '/interview-prep/mock',
}) {
  return (
    <InterviewMediaProvider>
      <Outlet context={{ interviewFormat, basePath }} />
    </InterviewMediaProvider>
  );
}
