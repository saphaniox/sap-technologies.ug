let available;

// Decorative 3D scenes must not break pages on devices without a GPU context.
export const hasWebGLSupport = () => {
  if (typeof document === "undefined") return false;
  if (available !== undefined) return available;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    available = Boolean(context);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    available = false;
  }
  return available;
};
