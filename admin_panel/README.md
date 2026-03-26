# Inqoura Admin Panel

Run locally from the project root:

```bash
node admin_panel/server.mjs
```

Open:

```text
http://127.0.0.1:4173
```

This panel uses Firebase Auth + Firestore directly from the browser.
It expects your signed-in user document in `users/{uid}` to have:

```json
{
  "role": "admin"
}
```
