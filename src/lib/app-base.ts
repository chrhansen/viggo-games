const REPO_BASE_PATH = "/viggo-games";

export const appBasePath =
  typeof window !== "undefined" &&
  (window.location.pathname === REPO_BASE_PATH ||
    window.location.pathname.startsWith(`${REPO_BASE_PATH}/`))
    ? REPO_BASE_PATH
    : "";

export const withBasePath = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${appBasePath}${normalizedPath}`;
};
