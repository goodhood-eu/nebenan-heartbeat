const HEARTBEAT_INTERVAL = 1000 * 10; // 10sec

const isAlive = typeof window !== 'undefined';

const listeners = {};
let lastIndex = 0;
let heartbeatTid: number | null | undefined = null;

const removeListener = (id: number) => {
  // @ts-ignore
  if (!listeners[id]) return;
  // @ts-ignore
  delete listeners[id];
};

/**
 * @function
 * @param {number} interval
 * @param {function} callback
 * @return {function(): void}
 */
const addListener = (interval: any, callback: any) => {
  if (typeof callback !== 'function') throw new Error('Listener function required');
  lastIndex += 1;

  const id = lastIndex;
  const called = Date.now();

  // @ts-ignore
  listeners[id] = { interval, callback, called };

  return () => removeListener(id);
};

const heartbeatLoop = () => {
  const now = Date.now();

  Object.keys(listeners).forEach((id) => {
    // @ts-ignore
    const item = listeners[id];
    // Item may have been deleted during iteration cycle
    if (item && (now - item.called > item.interval)) {
      item.callback();
      item.called = now;
    }
  });

  heartbeatTid = setTimeout(heartbeatLoop, HEARTBEAT_INTERVAL);
};

const handleVisibilityChanged = () => {
  if (document.hidden) {
    // @ts-ignore
    clearTimeout(heartbeatTid);
    heartbeatTid = null;
  } else heartbeatLoop();
};

if (isAlive) {
  heartbeatLoop();
  document.addEventListener('visibilitychange', handleVisibilityChanged, { passive: true });
}

export default addListener;
