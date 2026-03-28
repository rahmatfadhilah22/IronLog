import { useEffect, useRef, useState } from "react";

import { bootstrapDatabase, retryBootstrapDatabase } from "./bootstrap";

type BootstrapState = {
  isReady: boolean;
  error: Error | null;
  retry: () => void;
};

export function useDatabaseBootstrap(): BootstrapState {
  const [state, setState] = useState<Omit<BootstrapState, "retry">>({
    isReady: false,
    error: null,
  });
  const isMountedRef = useRef(false);

  const run = (bootstrapFn: () => Promise<void>) => {
    setState((previousState) => ({
      ...previousState,
      isReady: false,
      error: null,
    }));

    bootstrapFn()
      .then(() => {
        if (isMountedRef.current) {
          setState({ isReady: true, error: null });
        }
      })
      .catch((error: unknown) => {
        if (isMountedRef.current) {
          setState({
            isReady: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });
  };

  useEffect(() => {
    isMountedRef.current = true;
    run(bootstrapDatabase);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    retry: () => {
      run(retryBootstrapDatabase);
    },
  };
}
