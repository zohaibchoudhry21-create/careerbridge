import { useState } from 'react';
import { toast } from 'react-toastify';
import { runResumeAiAction } from '../services/resumeBuilderService';
import { runAiTextAction, stripHtml } from '../utils/resumeEditorUtils';

const ACTION_LABELS = {
  improve: 'Improve Writing',
  suggest: 'Suggest Content',
  grammar: 'Grammar Check',
  shorter: 'Shorter',
};

export default function AIActionButtons({
  actions = ['improve', 'suggest', 'grammar', 'shorter'],
  content = '',
  context = '',
  onResult,
  showRobotOn = ['improve', 'suggest'],
}) {
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (action) => {
    const plainContent = stripHtml(content);

    if (!plainContent && action !== 'suggest') {
      toast.info('Add some text before using AI.');
      return;
    }

    setLoadingAction(action);

    try {
      const response = await runResumeAiAction({
        action,
        content: plainContent,
        context: context || plainContent,
      });

      onResult(response.result);
    } catch (error) {
      const status = error?.response?.status;

      if (status === 503 || status === 502) {
        onResult(runAiTextAction(content, action));
        toast.info('AI service unavailable — applied basic improvement.');
        return;
      }

      toast.error(error?.response?.data?.message || 'AI action failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          disabled={Boolean(loadingAction)}
          onClick={() => handleAction(action)}
          className="rounded-full border border-outline-variant px-sm py-1 font-label-sm text-on-surface-variant hover:border-secondary/40 hover:text-secondary disabled:opacity-60"
        >
          {showRobotOn.includes(action) ? '🤖 ' : ''}
          {loadingAction === action ? 'Working...' : ACTION_LABELS[action] || action}
        </button>
      ))}
    </div>
  );
}
