import React from "react";

export const useSvgLoader = (svgPath: string) => {
  const [svgData, setSvgData] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!svgPath) return;

    const loadSvg = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(svgPath);
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.status}`);
        }

        const svgContent = await response.text();
        setSvgData(svgContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load SVG");
        console.error("Error loading SVG:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSvg();
  }, [svgPath]);

  return { svgData, loading, error };
};
