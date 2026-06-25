import type { Frame } from 'playwright';

interface RemoteScriptPayload {
  scriptArgs: unknown[];
  scriptBody: string;
}

/**
 * Run a synchronous remote script in the browser frame.
 * Script bodies may reference the `arguments` array (remote driver protocol convention).
 */
export function runSyncScriptInFrame(
  frame: Frame,
  scriptBody: string,
  scriptArgs: unknown[],
): ReturnType<Frame['evaluateHandle']> {
  const payload: RemoteScriptPayload = { scriptArgs, scriptBody };
  return frame.evaluateHandle(({ scriptArgs: remoteArgs, scriptBody: body }) => {
    const execute = new Function('arguments', body) as (args: unknown[]) => unknown;
    return execute(remoteArgs);
  }, payload);
}

/**
 * Run an asynchronous remote script in the browser frame.
 * Script bodies may reference `arguments` and invoke the trailing callback.
 */
export function runAsyncScriptInFrame(
  frame: Frame,
  scriptBody: string,
  scriptArgs: unknown[],
): ReturnType<Frame['evaluateHandle']> {
  const payload: RemoteScriptPayload = { scriptArgs, scriptBody };
  return frame.evaluateHandle(({ scriptArgs: remoteArgs, scriptBody: body }) => {
    const argsWithCallback = remoteArgs.slice();
    return new Promise<unknown>((resolve, reject) => {
      argsWithCallback.push((value: unknown) => resolve(value));
      try {
        const execute = new Function('arguments', body) as (args: unknown[]) => void;
        execute(argsWithCallback);
      } catch (error) {
        reject(error);
      }
    });
  }, payload);
}
