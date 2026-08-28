// Replaced by the static build; Sites serves the same assets from the root.
declare const __PUBLIC_BASE__: string;

export function publicAsset(file: string, base = typeof __PUBLIC_BASE__ === "string" ? __PUBLIC_BASE__ : "/") {
  return `${base.replace(/\/?$/, "/")}${file.replace(/^\/+/, "")}`;
}
