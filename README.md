# pi-telegram

![pi-telegram screenshot](screenshot.png)

> Full pi build session: [View the session transcript](https://pi.dev/session/#14acfe07b7844c8abec55ed9fbddc17f), which captures the full pi session in which `pi-telegram` was built.

Telegram DM bridge for pi.

## Install

From git:

```bash
pi install git:github.com/badlogic/pi-telegram
```

Or for a single run:

```bash
pi -e git:github.com/badlogic/pi-telegram
```

## Configure

### Telegram

1. Open [@BotFather](https://t.me/BotFather)
2. Run `/newbot`
3. Pick a name and username
4. Copy the bot token

### pi

Start pi, then run:

```bash
/telegram-setup
```

Paste the bot token when prompted.

The extension stores config in:

```text
~/.pi/agent/telegram.json
```

## Connect a pi session

The Telegram bridge is session-local. Connect it only in the pi session that should own the bot:

```bash
/telegram-connect
```

To stop polling in the current session:

```bash
/telegram-disconnect
```

Check status:

```bash
/telegram-status
```

## Pair your Telegram account

After token setup and `/telegram-connect`:

1. Open the DM with your bot in Telegram
2. Send `/start`

The first DM user becomes the allowed Telegram user for the bridge. The extension only accepts messages from that user.

## Usage

Chat with your bot in Telegram DMs.

### Send text

Send any message in the bot DM. It is forwarded into pi with a `[telegram]` prefix.

### Send images and files

Send images, albums, or files in the DM.

The extension:
- downloads them to `~/.pi/agent/tmp/telegram`
- includes local file paths in the prompt
- forwards inbound images as image inputs to pi

### Send voice messages

When the `whisper` command is available, the extension transcribes Telegram voice messages locally before forwarding them to pi. The prompt includes both the transcript and the original audio path, so pi can respond immediately while retaining access to the source recording. Other audio attachments are forwarded unchanged for explicit inspection.

Install [OpenAI Whisper](https://github.com/openai/whisper) using your package manager. On NixOS:

```bash
nix profile install nixpkgs#openai-whisper
```

The first transcription downloads the selected model. Later transcriptions reuse the local model cache. Audio is not sent to a transcription service.

The default model is `base`. Override it, or optionally skip automatic language detection, with environment variables:

```bash
export PI_TELEGRAM_WHISPER_MODEL=small
export PI_TELEGRAM_WHISPER_LANGUAGE=en
```

If Whisper is unavailable or transcription fails, the extension still forwards the original audio path and includes the failure in the prompt.

### Send files to Telegram

The `telegram_attach` tool sends local files to the paired chat whenever the bridge is connected.

- During a Telegram-originated turn, it sends the files after the final text reply.
- During a terminal-originated turn, it sends the files immediately.
- The extension does not impose an attachment-count limit. Telegram's API limits still apply.

Examples:
- `summarize this image`
- `read this README and summarize it`
- `write me a markdown file with the plan and send it back`
- `generate a shell script and attach it`

### Stop a run

In Telegram, send:

```text
stop
```

or:

```text
/stop
```

That aborts the active pi turn.

### Send messages while pi is running

Messages sent while pi is working are delivered with pi's `steer` behavior. Pi finishes the current assistant step, includes the new message before its next model call, and keeps working. Attachments follow the same path.

The footer uses `replying` while a Telegram response is active. `incoming` means Telegram messages have arrived but pi has not inserted them into the run yet.

## Streaming

The extension streams assistant text previews back to Telegram while pi is generating.

It tries Telegram draft streaming first with `sendMessageDraft`. If that is not supported for your bot, it falls back to `sendMessage` plus `editMessageText`.

## Notes

- Only one pi session should be connected to the bot at a time
- Replies are sent as normal Telegram messages, not quote-replies
- Long replies are split below Telegram's 4096 character limit
- Outbound files are sent via `telegram_attach`, including from terminal-originated turns
- Temporary Telegram network failures are retried

## License

MIT
