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
        <button
          type="button"
          className="w-full sm:w-auto bg-secondary text-on-secondary font-label-md text-label-md rounded-2xl px-8 py-4 hover:bg-secondary-container transition-colors shadow-level-2 text-lg anim-bounce-loop"
        >
          Get Started Free
        </button>
        <button
          type="button"
          className="w-full sm:w-auto bg-surface text-secondary border-2 border-secondary font-label-md text-label-md rounded-2xl px-8 py-4 hover:bg-surface-container transition-all hover:-translate-y-1 text-lg"
        >
          Upload Your CV
        </button>
      </div>
    </section>
  );
}
