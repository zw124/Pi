# PI Translate

A minimal mobile-first live translation site.

## Run

```bash
cp .env.example .env
# add your Deepgram key
npm start
```

Open `http://localhost:3000`.

## Notes

- Homepage is intentionally tiny.
- Translation screen is built for phones first.
- The audio pipeline is wired through a small server proxy so the Deepgram key stays off the client.
