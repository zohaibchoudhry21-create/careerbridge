const STORAGE_KEYS = {
  standard: 'careerbridge.mockInterview.setup.v1',
  panel: 'careerbridge.panelInterview.setup.v1',
};

const resolveKey = (scope) => STORAGE_KEYS[scope] || STORAGE_KEYS.standard;

export const loadInterviewSetupPrefs = (scope = 'standard') => {
  try {
    const raw = localStorage.getItem(resolveKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export const loadPanelSharedVoiceHintDismissed = () =>
  Boolean(loadInterviewSetupPrefs('panel')?.panelSharedVoiceHintDismissed);

export const savePanelSharedVoiceHintDismissed = (dismissed = true) => {
  const prefs = loadInterviewSetupPrefs('panel') || {};
  saveInterviewSetupPrefs({ ...prefs, panelSharedVoiceHintDismissed: dismissed }, 'panel');
};

export const saveInterviewSetupPrefs = (prefs, scope = 'standard') => {
  try {
    localStorage.setItem(resolveKey(scope), JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode
  }
};
