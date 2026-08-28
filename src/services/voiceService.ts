import { AIVaultService } from "./aiVaultService";

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private animationFrameId: number | null = null;

  async startRecording(onAudioLevel?: (level: number) => void): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyzer = this.audioContext.createAnalyser();
      source.connect(this.analyzer);
      this.analyzer.fftSize = 64;

      const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
      const updateLevel = () => {
        if (!this.analyzer) return;
        this.analyzer.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / (dataArray.length || 1);
        if (onAudioLevel) onAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
        this.animationFrameId = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    }

    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.audioChunks.push(event.data);
    };
    this.mediaRecorder.start(250);
  }

  async stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        resolve("");
        return;
      }

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const rawBase64 = await this.blobToBase64(audioBlob);
          const base64Data = rawBase64.split(",")[1] || rawBase64;
          
          const text = await this.transcribeAudio(base64Data, mimeType);
          resolve(text);
        } catch (e) {
          console.warn("Audio transcription fallback error:", e);
          resolve("");
        }
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      try { this.audioContext?.close(); } catch {}
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  private async transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
    const providers = AIVaultService.getProviders();
    const googleProvider = providers.find(p => p.providerType === "google" && p.apiKey) ||
                           providers.find(p => p.apiKey);
    
    if (!googleProvider || !googleProvider.apiKey) {
      return "";
    }

    const apiKey = googleProvider.apiKey.trim();
    const cleanMime = mimeType.split(";")[0] || "audio/webm";
    const model = googleProvider.selectedModel || "gemini-2.0-flash";
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(apiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: base64Data
                }
              },
              {
                text: "Transcribe this audio precisely. Preserve any mathematical formulas, study subjects, problem counts, or duration spoken. Return ONLY the transcribed text without quotes, Markdown code blocks, or preamble."
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) return "";
    const json = await response.json();
    const transcript = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return transcript;
  }
}
