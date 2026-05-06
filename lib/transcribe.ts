"use client";

import type {
  AutomaticSpeechRecognitionPipeline,
  ProgressInfo,
} from "@huggingface/transformers";

const MODEL_ID = "Xenova/whisper-base.en";

let cachedPipeline: AutomaticSpeechRecognitionPipeline | null = null;

export type TranscribeStage =
  | "idle"
  | "loading-model"
  | "decoding-audio"
  | "transcribing"
  | "done"
  | "error";

export interface TranscribeProgress {
  stage: TranscribeStage;
  progressPct?: number;
  message?: string;
}

async function getPipeline(
  onProgress: (p: TranscribeProgress) => void,
): Promise<AutomaticSpeechRecognitionPipeline> {
  if (cachedPipeline) return cachedPipeline;

  onProgress({
    stage: "loading-model",
    progressPct: 0,
    message: "Downloading Whisper model (~150MB, one time)...",
  });

  const { pipeline } = await import("@huggingface/transformers");

  cachedPipeline = (await pipeline("automatic-speech-recognition", MODEL_ID, {
    dtype: {
      encoder_model: "fp32",
      decoder_model_merged: "fp32",
    },
    progress_callback: (info: ProgressInfo) => {
      if (info.status === "progress" && "progress" in info) {
        onProgress({
          stage: "loading-model",
          progressPct: Math.round((info.progress as number) ?? 0),
          message: `Downloading model... ${Math.round((info.progress as number) ?? 0)}%`,
        });
      }
    },
  })) as unknown as AutomaticSpeechRecognitionPipeline;

  return cachedPipeline;
}

async function fileToMonoFloat32(file: File): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();

  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioContext = new Ctx({ sampleRate: 16000 });

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    throw new Error(
      "Could not decode audio from this file. Try an .mp3, .wav, .m4a, or audio-only file.",
    );
  }

  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(1);
  const mono = new Float32Array(left.length);
  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }
  return mono;
}

export async function transcribeFile(
  file: File,
  onProgress: (p: TranscribeProgress) => void,
): Promise<string> {
  try {
    const transcriber = await getPipeline(onProgress);

    onProgress({
      stage: "decoding-audio",
      message: "Decoding audio from file...",
    });
    const audio = await fileToMonoFloat32(file);

    onProgress({
      stage: "transcribing",
      message: `Transcribing ${(audio.length / 16000 / 60).toFixed(1)} minutes of audio...`,
    });

    const result = await transcriber(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
    });

    const text = Array.isArray(result)
      ? result.map((r) => r.text).join(" ")
      : result.text;

    onProgress({ stage: "done", message: "Transcription complete." });
    return text.trim();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Transcription failed.";
    onProgress({ stage: "error", message });
    throw err;
  }
}
