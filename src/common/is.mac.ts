/**
 * Returns whether the current system is a mac or not.
 * Can be used to implement macOS specific behaviour.
 */
export default function (): boolean {
  if (globalThis.process) {
    return globalThis.process.platform === 'darwin';
  } else if (globalThis.navigator) {
    return (
      globalThis.navigator.platform.toLowerCase().indexOf('mac') >= 0 ||
      globalThis.navigator.userAgent.toLowerCase().indexOf('mac') >= 0
    );
  }

  return false;
}
