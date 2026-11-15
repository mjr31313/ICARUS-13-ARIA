// Robust Speech Synthesis & Recognition Service using Web Speech API with zero external dependencies
// Handles browser voice selection, natural speech cleaning, interrupt, mute, and error fallbacks

export interface SpeechRecognitionSupport {
  isSupported: boolean;
  isSynthesizerSupported: boolean;
}

export function checkSpeechSupport(): SpeechRecognitionSupport {
  const isSpeechRecSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    );

  const isSynthesizerSupported = typeof window !== 'undefined' && Boolean(window.speechSynthesis);

  return {
    isSupported: isSpeechRecSupported,
    isSynthesizerSupported
  };
}

class SpeechController {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isMuted: boolean = false;
  private activePlaybackId: string | null = null;
  private playbackListeners: ((activeId: string | null, isSpeaking: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Pre-warm voices
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  public subscribePlayback(fn: (activeId: string | null, isSpeaking: boolean) => void) {
    this.playbackListeners.push(fn);
    return () => {
      this.playbackListeners = this.playbackListeners.filter((l) => l !== fn);
    };
  }

  private notifyPlayback(activeId: string | null, isSpeaking: boolean) {
    this.activePlaybackId = activeId;
    this.playbackListeners.forEach((fn) => fn(activeId, isSpeaking));
  }

  /**
   * Cleans formatted clinical text (stripping markdown bold, hashes, brackets, source tags)
   * so text-to-speech sounds natural, professional, and conversational.
   */
  public cleanTextForSpeech(rawText: string): string {
    return rawText
      .replace(/\[.*?\]/g, '') // Remove [Source] or [System] tags
      .replace(/[#*_`]/g, '')   // Remove markdown symbols
      .replace(/\n+/g, '. ')   // Convert newlines to sentence pauses
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Speak clinical text aloud with an identifiable playback ID.
   * Cancels any currently playing speech to ensure single-voice playback.
   */
  public speak(
    id: string,
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: unknown) => void
  ): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onError) onError('Speech synthesis not supported in this browser.');
      return false;
    }

    this.stopSpeaking();

    const naturalText = this.cleanTextForSpeech(text);
    if (!naturalText) {
      if (onEnd) onEnd();
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(naturalText);
    this.activeUtterance = utterance;

    // Pick a natural British or American English neutral voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Serena') || v.name.includes('Google'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    utterance.onstart = () => {
      this.notifyPlayback(id, true);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.notifyPlayback(null, false);
      this.activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.notifyPlayback(null, false);
      this.activeUtterance = null;
      if (onError) onError(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
    this.notifyPlayback(null, false);
  }

  public isCurrentlySpeaking(id?: string): boolean {
    if (!this.activePlaybackId) return false;
    if (id) return this.activePlaybackId === id;
    return true;
  }

  public getActivePlaybackId(): string | null {
    return this.activePlaybackId;
  }
}

export const speechController = new SpeechController();
