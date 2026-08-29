import { AIVaultService } from "./aiVaultService";

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private recognition: any | null = null;
  private accumulatedTranscript = "";
  private isListening = false;

  async startRecording(
    onTranscript?: (transcript: string, isFinal: boolean) => void,
    onAudioLevel?: (level: number) => void
  ): Promise<void> {
    this.accumulatedTranscript = "";
    this.isListening = true;

    // 1. Initialize Web Speech API for live, instant zero-latency speech-to-text
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let interimText = '';
          let finalText = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              finalText += transcript;
            } else {
              interimText += transcript;
            }
          }

          if (finalText) {
            this.accumulatedTranscript = this.accumulatedTranscript
              ? `${this.accumulatedTranscript.trim()} ${finalText.trim()}`
              : finalText.trim();
          }

          const fullCurrent = (this.accumulatedTranscript + ' ' + interimText).trim();
          if (onTranscript && fullCurrent) {
            onTranscript(fullCurrent, Boolean(finalText));
          }
        };

        rec.onerror = (err: any) => {
          console.warn('Web Speech API notice:', err.error);
        };

        rec.onend = () => {
          if (this.isListening && this.recognition) {
            try {
              this.recognition.start();
            } catch {}
          }
        };

        rec.start();
        this.recognition = rec;
      } catch (err) {
        console.warn('SpeechRecognition start failed, will rely on MediaRecorder:', err);
      }
    }

    // 2. Initialize MediaStream + Analyser for visual waveform & AI audio backup
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
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
          if (!this.analyzer || !this.isListening) return;
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
    } catch (micErr) {
      console.warn('Microphone stream access notice:', micErr);
    }
  }

  async stopRecording(): Promise<string> {
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // If Web Speech already produced a clean transcript, return it immediately
    if (this.accumulatedTranscript.trim()) {
      this.cleanupMedia();
      return this.accumulatedTranscript.trim();
    }

    // Fallback: Transcribe audio buffer via Gemini API
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        this.cleanupMedia();
        resolve(this.accumulatedTranscript.trim());
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const rawBase64 = await this.blobToBase64(audioBlob);
          const base64Data = rawBase64.split(",")[1] || rawBase64;
          
          const text = await this.transcribeAudio(base64Data, mimeType);
          this.cleanupMedia();
          resolve(text || this.accumulatedTranscript.trim());
        } catch (e) {
          console.warn("Audio transcription fallback error:", e);
          this.cleanupMedia();
          resolve(this.accumulatedTranscript.trim());
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        this.cleanupMedia();
        resolve(this.accumulatedTranscript.trim());
      }
    });
  }

  private cleanupMedia(): void {
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      try {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      } catch {}
    }
    this.mediaRecorder = null;
    try {
      this.audioContext?.close();
    } catch {}
    this.audioContext = null;
    this.analyzer = null;
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

