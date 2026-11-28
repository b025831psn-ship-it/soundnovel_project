export function startOptions(hasSave) {
  return hasSave ? ['continue', 'new'] : ['new'];
}

export function chooseStart(action, handlers) {
  const handler = handlers[action];
  if (typeof handler !== 'function') throw new RangeError(`Unavailable start action: ${action}`);
  return handler();
}
