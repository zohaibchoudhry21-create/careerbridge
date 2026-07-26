import { useState } from 'react';
import { toast } from 'react-toastify';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import AppIcon from '../../components/icons/AppIcon';
import Button from '../../components/ui/Button';

export default function AccountManagement() {
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      toast.success('Account deactivated. You can reactivate by signing in again.');
    } catch {
      toast.error('Unable to deactivate account.');
    } finally {
      setDeactivating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmed) {
      toast.error('Please confirm that you understand this action cannot be undone.');
      return;
    }

    setDeleting(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      toast.success('Account deletion requested. This is a frontend placeholder.');
    } catch {
      toast.error('Unable to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      toast.success('Your data export will be ready shortly. (Placeholder)');
    } catch {
      toast.error('Unable to export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      toast.success('You have been signed out. (Placeholder)');
    } catch {
      toast.error('Logout failed. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SettingsPageShell
      title="Account Management"
      description="Manage account status, data export, and sign out options."
      showActions={false}
    >
      <SectionCard
        title="Deactivate Account"
        description="Temporarily disable your account. Your data will be preserved and you can reactivate anytime."
        icon="pause_circle"
        color="warning"
      >
        <Button
          type="button"
          variant="primary"
          onClick={handleDeactivate}
          disabled={deactivating}
          className="min-h-[44px] gap-2 px-4 py-2.5"
        >
          {deactivating ? (
            <>
              <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
              Deactivating...
            </>
          ) : (
            'Deactivate Account'
          )}
        </Button>
      </SectionCard>

      <SectionCard
        title="Delete Account"
        description="Permanently remove your account and all associated data."
        icon="delete_forever"
        color="danger"
        className="border-error/20"
      >
        <div className="rounded-xl border border-error/30 bg-error-container/20 p-4 space-y-4">
          <p className="font-body-md text-on-surface-variant text-sm">
            Warning: This action is permanent. All resumes, preferences, and account history will be
            deleted and cannot be recovered.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={deleteConfirmed}
              onChange={(event) => setDeleteConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-outline-variant text-error focus:ring-error"
            />
            <span className="font-body-md text-sm text-on-surface">
              I understand this action cannot be undone.
            </span>
          </label>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !deleteConfirmed}
            className="min-h-[44px] gap-2 px-4 py-2.5"
          >
            {deleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Export Data"
        description="Download a copy of your profile, resumes, and account activity."
        icon="download"
        color="resume"
      >
        <Button
          type="button"
          variant="primary"
          onClick={handleExport}
          disabled={exporting}
          className="min-h-[44px] gap-2 px-4 py-2.5"
        >
          {exporting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <AppIcon name="download" size="button" />
              Download My Data
            </>
          )}
        </Button>
      </SectionCard>

      <SectionCard
        title="Logout"
        description="Sign out of your account on this device."
        icon="logout"
        color="mode"
      >
        <Button
          type="button"
          variant="secondary"
          onClick={handleLogout}
          disabled={loggingOut}
          className="min-h-[44px] gap-2 px-4 py-2.5"
        >
          {loggingOut ? (
            <>
              <span className="w-4 h-4 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <AppIcon name="logout" size="button" />
              Logout
            </>
          )}
        </Button>
      </SectionCard>
    </SettingsPageShell>
  );
}
