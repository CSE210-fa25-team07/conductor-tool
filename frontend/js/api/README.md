# API Layer

Functions that call the backend. One file per feature.

## Files

- `directoryApi.js` – Directory team (real API stubs; throw until Auth team provides shared client)
- `directory/` – Mock API wrapper + mock data used during development

## Notes

- The shared HTTP client (`apiClient.js`) will be supplied by the Auth/Login subteam once authentication is wired up.
- Until then, the real API modules simply throw an error so consumers know the integration work is pending.
- Keep using the mock API (`directory/directoryApiMock.js`) for local development and prototypes.
