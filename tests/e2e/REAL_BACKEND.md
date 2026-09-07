# Real backend journeys

`real-backend.spec.ts` uses real HTTP endpoints without request interception. It creates persistent Apps, knowledge spaces, documents and conversations. Run it against a disposable backend data directory, never a production instance.

Start the backend with a dedicated `APP_HOME` and the `dev` profile. Build with the Maven `offline-models` profile so the document ingestion and vector search journey can use the local BGE embedding model. Start the frontend with `VITE_PROXY_TARGET` pointing to that backend.

Set `E2E_USERNAME` and `E2E_PASSWORD` in the local shell to a test account, then run:

```sh
pnpm exec playwright test real-backend
```

The Playwright configuration runs desktop and mobile projects serially. Keep other tests using the same account stopped because login can replace its session. Test records use unique names and remain in the disposable data directory for inspection. Credentials must not be committed.

Coverage includes App creation and publication, rejecting non-object App configuration before writes, document ingestion, preview, publication and vector search, and idempotent conversation creation with a persisted generation failure delivered over SSE. The generation test deliberately selects an unavailable model; it does not verify successful inference from an external model provider.

`model-provider.spec.ts` verifies successful real inference and persisted assistant messages. Configure the test backend provider first, set `E2E_MODEL_PROVIDER` (for example `DEEPSEEK`) and `E2E_MODEL_NAME` (for example `deepseek-v4-flash`), then run `pnpm exec playwright test model-provider`.

This performs billable provider requests. For database-backed startup configuration, set `shiyu.ai.tenant-id` to the tenant owning the test platform. Keep the API key in the isolated backend configuration, never in test source.
