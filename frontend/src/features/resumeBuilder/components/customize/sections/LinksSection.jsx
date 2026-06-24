import CustomizeSectionCard from '../CustomizeSectionCard';

export default function LinksSection({ onGoToPersonalDetails }) {
  return (
    <CustomizeSectionCard title="Links" description="Manage contact links and social profiles.">
      <p className="text-on-surface-variant text-sm font-body-sm">
        Links are managed in your Personal Details section.
      </p>
      <button
        type="button"
        onClick={onGoToPersonalDetails}
        className="rounded-lg bg-secondary px-md py-sm font-label-md text-on-secondary hover:bg-secondary-container transition-colors"
      >
        Go to Personal Details
      </button>
    </CustomizeSectionCard>
  );
}
