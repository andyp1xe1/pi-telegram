import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, parse } from "node:path";

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const WHISPER_MODEL = process.env.PI_TELEGRAM_WHISPER_MODEL?.trim() || "base";
const WHISPER_LANGUAGE = process.env.PI_TELEGRAM_WHISPER_LANGUAGE?.trim();
const WHISPER_TIMEOUT_MS = 5 * 60 * 1000;

export interface AudioTranscriptionResult {
	text?: string;
	error?: string;
}

export async function transcribeAudioFile(
	pi: ExtensionAPI,
	filePath: string,
	tempDir: string,
): Promise<AudioTranscriptionResult> {
	const outputDir = await mkdtemp(join(tempDir, ".whisper-"));
	try {
		const args = [
			filePath,
			"--model",
			WHISPER_MODEL,
			"--output_dir",
			outputDir,
			"--output_format",
			"txt",
			"--fp16",
			"False",
		];
		if (WHISPER_LANGUAGE) args.push("--language", WHISPER_LANGUAGE);

		const result = await pi.exec("whisper", args, { timeout: WHISPER_TIMEOUT_MS });
		if (result.code !== 0) {
			const detail = (result.stderr || result.stdout).trim().slice(-1000);
			return { error: detail || `whisper exited with code ${result.code}` };
		}

		const transcriptPath = join(outputDir, `${parse(filePath).name}.txt`);
		const text = (await readFile(transcriptPath, "utf8")).trim();
		return text.length > 0 ? { text } : { error: "whisper produced an empty transcript" };
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	} finally {
		await rm(outputDir, { recursive: true, force: true });
	}
}
