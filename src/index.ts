type Milliseconds = number;

type Listener = {
  interval: Milliseconds,
  callback: () => void,
  calledLastAt: Milliseconds,
};

type TeardownFunction = () => void;

const MILLISECONDS_PER_SECOND: Milliseconds = 1000;
const HEARTBEAT_INTERVAL: Milliseconds = 10 * MILLISECONDS_PER_SECOND;

const isAlive = typeof window !== 'undefined';
const listeners = new Map<Listener['callback'], Listener>();

let timer: ReturnType<typeof setTimeout> | undefined;

const addListener = (
  interval: Listener['interval'],
  callback: Listener['callback']): TeardownFunction => {
  // TODO: remove check in next breaking release
  if (typeof callback !== 'function') throw new Error('Listener function required');

  const called = Date.now();

  const listener: Listener = { interval, callback, calledLastAt: called };
  listeners.set(callback, listener);

  return () => { listeners.delete(callback); };
};

const heartbeatLoop = () => {
  const now = Date.now();

  for (const [,item] of listeners) {
    // Item may have been deleted during iteration cycle
    if (!item) continue;

    const isOverdue = now - item.calledLastAt > item.interval;
    if (isOverdue) {
      item.callback();
      item.calledLastAt = now;
    }
  }

  timer = setTimeout(heartbeatLoop, HEARTBEAT_INTERVAL);
};

const handleVisibilityChanged = () => {
  if (document.hidden) {
    clearTimeout(timer);
    timer = undefined;
  } else heartbeatLoop();
};

if (isAlive) {
  heartbeatLoop();
  document.addEventListener('visibilitychange', handleVisibilityChanged, { passive: true });
}

export default addListener;
