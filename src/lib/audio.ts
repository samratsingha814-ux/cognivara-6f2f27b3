type WebkitWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/webm",
] as const;

export function getPreferredAudioMimeType(): string {
  return MIME_TYPE_CANDIDATES.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) ?? "";
}

export async function convertAudioBlobToWav(blob: Blob): Promise<Blob> {
  const AudioContextCtor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error("This browser cannot convert recorded audio for upload.");
  }

  const audioContext = new AudioContextCtor();

  try {
    const inputBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(inputBuffer.slice(0));
    const wavBuffer = audioBufferToWav(audioBuffer);

    return new Blob([wavBuffer], { type: "audio/wav" });
  } catch {
    throw new Error("The recorded audio could not be prepared for upload. Please try again.");
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
