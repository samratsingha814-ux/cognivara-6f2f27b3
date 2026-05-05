type WebkitWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const DEFAULT_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm",
] as const;

const SAFARI_MIME_CANDIDATES = [
  "audio/mp4",
  "audio/aac",
  "audio/webm;codecs=opus",
  "audio/webm",
] as const;

function isSafariOrIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIOS || isSafari;
}

export function getPreferredAudioMimeType(): string {
  const list = isSafariOrIOS() ? SAFARI_MIME_CANDIDATES : DEFAULT_MIME_CANDIDATES;
  return list.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) ?? "";
}

export async function convertAudioBlobToWav(blob: Blob): Promise<Blob> {
  if (!blob || blob.size === 0) {
    throw new Error("No audio was captured. Please try recording again.");
  }

  const AudioContextCtor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AudioContextCtor) {
    // Fall back: send the original blob; backend accepts webm/mp4
    return blob;
  }

  const audioContext = new AudioContextCtor();
  try {
    const inputBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(inputBuffer.slice(0));
    const wavBuffer = audioBufferToWav(audioBuffer);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } catch {
    // Graceful fallback: server can decode the original encoded audio
    return blob;
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}

function audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const sampleCount = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = Array.from({ length: channelCount }, (_, channelIndex) => audioBuffer.getChannelData(channelIndex));
  let offset = 44;

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channelIndex][sampleIndex] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
