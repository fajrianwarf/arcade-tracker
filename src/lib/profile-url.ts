export class SourceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
const hosts = new Set([
  "skills.google",
  "www.skills.google",
  "cloudskillsboost.google",
  "www.cloudskillsboost.google",
]);
export function normalizeProfile(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SourceError(
      "invalid_url",
      "Enter a full HTTPS public Google Skills profile URL.",
    );
  }
  const match = url.pathname.match(
    /^\/public_profiles\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/?$/i,
  );
  if (
    url.protocol !== "https:" ||
    !hosts.has(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    !match
  )
    throw new SourceError(
      "invalid_url",
      "Use your public Google Skills profile URL, not a Google Cloud Console URL.",
    );
  return `https://www.skills.google/public_profiles/${match[1].toLowerCase()}`;
}
