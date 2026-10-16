export type ManagedChild = {
  on(event: 'exit', listener: (code: number | null, signal: string | null) => void): unknown;
  on(event: 'error', listener: (error: Error) => void): unknown;
  kill(signal: 'SIGTERM' | 'SIGKILL'): boolean;
};

// A worker failure must not leave a seemingly healthy web-only service running.
export function supervise(children: ManagedChild[], exit: (code: number) => void, graceMs = 25000) {
  const live = new Set(children);
  let stopping = false;
  let result = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    if (timer) clearTimeout(timer);
    exit(result);
  }
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    result = code;
    if (!live.size) return finish();
    timer = setTimeout(() => {
      result = 1;
      for (const child of live) child.kill('SIGKILL');
      finish();
    }, graceMs);
    for (const child of live) child.kill('SIGTERM');
  }
  for (const child of children) {
    child.on('exit', () => {
      live.delete(child);
      if (!stopping) stop(1);
      if (stopping && !live.size) finish();
    });
    child.on('error', () => {
      live.delete(child);
      stop(1);
      if (!live.size) finish();
    });
  }
  return stop;
}
