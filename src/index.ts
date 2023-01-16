type Listener = {
  interval: number,
  callback: () => void,
  called: number
};

type Listeners = { [id: number]: Listener };

const HEARTBEAT_INTERVAL = 1000 * 10; // 10sec
const isAlive = typeof window !== 'undefined';
const listeners:Listeners = {};

let lastIndex = 0;
let heartbeatTid: ReturnType<typeof setTimeout> | undefined;

const removeListener = (id: number) => {
  if (!listeners[id]) return;
  delete listeners[id];
};

const addListener = (
  interval: number,
  callback: (...args: any[]) => ReturnType<typeof removeListener>) => {
  if (typeof callback !== 'function') throw new Error('Listener function required');
  lastIndex += 1;

  const id = lastIndex;
  const called = Date.now();

  listeners[id] = { interval, callback, called };

  return () => removeListener(id);
};

const heartbeatLoop = () => {
  const now = Date.now();

  for (const key of Object.keys(listeners).map(Number)) {
    const item = listeners[key];
    // Item may have been deleted during iteration cycle
    if (item && (now - item.called > item.interval)) {
      item.callback();
      item.called = now;
    }
  }

  heartbeatTid = setTimeout(heartbeatLoop, HEARTBEAT_INTERVAL);
};

const handleVisibilityChanged = () => {
  if (document.hidden) {
    clearTimeout(heartbeatTid);
    heartbeatTid = undefined;
  } else heartbeatLoop();
};

if (isAlive) {
  heartbeatLoop();
  document.addEventListener('visibilitychange', handleVisibilityChanged, { passive: true });
}

export default addListener;
