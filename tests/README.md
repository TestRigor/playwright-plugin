## Development

```bash
npm install
npm run check            # lint + format + build + unit tests
npm run test:manual      # live gRPC integration tests (requires service + config)
npm run test:manual:one  # single manual test by name (-t flag)
```

The following environment variables are for local development and testing only — users should not need them:

| Variable                 | Default                            |
| -------------------------| ---------------------------------- |
| `TESTRIGOR_GRPC_URI`     | `selenium-extension.testrigor.com` |
| `TESTRIGOR_GRPC_PORT`    | `443`                              |
| `TESTRIGOR_GRPC_USE_TLS` | auto (TLS enabled for port 443)    |

Manual integration tests load settings from `tests/resources/application.properties` (copy from `application.properties.example`). Override the path with `CONFIG_FILE` or `config.file`.