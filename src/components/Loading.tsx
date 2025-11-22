const Loading = () => {
  return (
    <div className="fixed inset-0 bg-black/40 flex flex-col justify-center items-center z-50">
      <p className="mb-4 text-white">Creating Project</p>
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
    </div>
  );
};

export default Loading;
