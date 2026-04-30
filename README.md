# Simple-YouTube

Simple-YouTube is a Chrome extension that makes YouTube quieter by hiding video thumbnails and Shorts thumbnails while keeping text context visible.

The goal is not to block YouTube entirely. The goal is to reduce visual hooks so you can choose videos more intentionally.

## MVP Features

- Hide thumbnails on YouTube video cards.
- Hide thumbnails on Shorts cards while preserving titles where possible.
- Keep video titles, channel names, and channel icons visible where possible.
- Provide a popup toggle to enable or disable Simple-YouTube.
- Store only the local enabled/disabled setting.

## Install for Development

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repository directory.
5. Open YouTube and click the extension icon to toggle Simple-YouTube.

## Development

```powershell
npm install
npm test
```

## Privacy

Simple-YouTube does not collect personal data, browsing history, analytics, or telemetry. See [PRIVACY.md](./PRIVACY.md).

## License

MIT

