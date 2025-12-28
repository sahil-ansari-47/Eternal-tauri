function Splash() {
  return (
    <div className="h-full w-full flex flex-col gap-15 justify-center items-center z-10">
      <img src="/splash.png" alt="" className="opacity-70" />
      <div className="w-full">
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          New File{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              N
            </kbd>
          </div>
        </div>
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Open File{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              O
            </kbd>
          </div>
        </div>
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Open Terminal{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              `
            </kbd>
          </div>
        </div>
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Open Folder{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              K
            </kbd>{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              O
            </kbd>
          </div>
        </div>
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Close Folder{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              K
            </kbd>{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              F
            </kbd>
          </div>
        </div>
        {/* <iv className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Open New Terminal{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Shift
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              `
            </kbd>
          </div>
      iv> */}
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Open New Window{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Shift
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              N
            </kbd>
          </div>
        </div>
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Open File Explorer{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Shift
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              E
            </kbd>
          </div>
        </div>
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Open Workspace Search{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Shift
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              F
            </kbd>
          </div>
        </div>
        <div className="w-1/3 flex justify-between items-center mx-auto mt-3 px-1 text-[13px] text-zinc-200 dark:text-zinc-400">
          Open Source Control{" "}
          <div>
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              Shift
            </kbd>{" "}
            +{" "}
            <kbd className="text-zinc-500 rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
              G
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Splash;
