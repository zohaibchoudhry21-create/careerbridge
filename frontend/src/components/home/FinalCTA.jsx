import Button from '../ui/Button';

export default function FinalCTA() {
  return (
    <section className="py-xl text-center page-container-narrow reveal-zoom is-visible">
      <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-6">
        Start building your AI-powered career today.
      </h2>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
        Stop wasting hours formatting documents. Let our OS handle the logistics so you can focus on
        the interviews.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button
          type="button"
          variant="primary"
          className="anim-bounce-loop w-full rounded-2xl px-8 py-4 text-lg shadow-level-2 sm:w-auto"
        >
          Get Started Free
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full rounded-2xl px-8 py-4 text-lg sm:w-auto"
        >
          Upload Your CV
        </Button>
      </div>
    </section>
  );
}
