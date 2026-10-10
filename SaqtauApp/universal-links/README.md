# links.saqtau.ai deployment

Part 11 adds the iOS-side Universal Link configuration, but Apple also requires the website side to be live over HTTPS.

Deploy:

```text
https://links.saqtau.ai/.well-known/apple-app-site-association
https://links.saqtau.ai/family/invite/<token>
```

Requirements for the AASA response:

- HTTPS
- HTTP 200
- no redirect
- `Content-Type: application/json`
- no `.json` extension

The included AASA file is prepared using the currently known identifiers:

```text
Apple Team ID:  5QZMMBZ7R7
Bundle ID:       com.sd3108.Saqtau-AI
Assumed App ID:  5QZMMBZ7R7.com.sd3108.Saqtau-AI
```

Important: Apple's AASA `appID/appIDs` prefix is the **Application Identifier Prefix**, which is often the Team ID but can differ for older/migrated developer accounts. Before production, verify the built app's `application-identifier` entitlement or the App ID in Apple Developer. If the prefix differs, update the AASA `appIDs` entry.

The `family-invite-fallback.html` file is a fallback page for devices where the app is not installed. Route `/family/invite/*` to this page while preserving the original URL path.

The App Store fallback cannot be finalized until an App Store Connect app record exists and has a real App Store URL. When that exists, set `APP_STORE_URL` in the HTML or implement the same redirect server-side.

The REST invite validation/acceptance remains on the existing API:

```http
GET  /api/v1/family/invite-links/{token}/
POST /api/v1/family/invite-links/{token}/accept/
```
