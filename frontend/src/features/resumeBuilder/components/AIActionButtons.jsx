import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { runResumeAiAction } from '../services/resumeBuilderService';
import { resolveApiError } from '../../../utils/apiError';
import { runAiTextAction, stripHtml } from '../utils/resumeEditorUtils';

const ACTION_KEYS = {
  improve: 'aiActions.improve',
  suggest: 'aiActions.suggest',
  grammar: 'aiActions.grammar',
  shorter: 'aiActions.shorter',
};

export default function AIActionButtons({
  actions = ['improve', 'suggest', 'grammar', 'shorter'],
  content = '',
  context = '',
  onResult,
}) {
  const { t } = useTranslation('resumeBuilder');
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (action) => {
    const plainContent = stripHtml(content);

    if (!plainContent && action !== 'suggest') {
      toast.info(t('toasts.aiAddTextFirst'));
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
        toast.info(t('toasts.aiUnavailable'));
        return;
      }

      toast.error(resolveApiError(error, t('toasts.aiActionFailed')));
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
          {loadingAction === action
            ? t('aiActions.working')
            : t(ACTION_KEYS[action] || action, { defaultValue: action })}
        </button>
      ))}
    </div>
  );
}
