export function extractS3Key(url: string) {
  const path = new URL(url).pathname;
  return decodeURIComponent(path).slice(1); // remove leading '/'
}
