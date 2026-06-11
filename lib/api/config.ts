export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? "http://localhost:8090";
}
