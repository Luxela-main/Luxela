import { useEffect, useState } from "react";
import type { ComponentType } from "react";

interface UseDynamicComponentOptions {
  loading?: boolean;
  ssr?: boolean;
}

export function useDynamicComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  options: UseDynamicComponentOptions = { ssr: false }
) {
  const [component, setComponent] = useState<ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    if (typeof window === "undefined" && !options.ssr) {
      setIsLoading(false);
      return;
    }
    importFunc()
      .then((mod) => {
        if (mounted) {
          setComponent(mod.default);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          console.error("Error loading component:", err);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [importFunc, options.ssr]);

  return { component, isLoading, error };
}

export default useDynamicComponent;