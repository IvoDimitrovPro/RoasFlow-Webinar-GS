import CallList from '@/components/CallList';

const PreviousPage = () => {
  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold">Recordings</h1>
      <p className="text-sm text-gray-400">
        Recording files are retained for two weeks before being automatically
        deleted.
      </p>

      <CallList type="recordings" />
    </section>
  );
};

export default PreviousPage;
