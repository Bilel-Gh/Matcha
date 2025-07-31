// Sound Service for playing notification sounds
export type NotificationSoundType = 'message' | 'like' | 'match' | 'visit' | 'report';

class SoundService {
  private audioContext: AudioContext | null = null;
  private soundCache: Map<NotificationSoundType, AudioBuffer> = new Map();
  private isEnabled: boolean = true;
  private volume: number = 0.5;
  private isInitialized: boolean = false;
  private userHasInteracted: boolean = false;
  private initializationAttempted: boolean = false;

  // Sound URLs - you can replace these with actual audio files
  private soundUrls: Record<NotificationSoundType, string> = {
    message: '/sounds/message.mp3',
    like: '/sounds/like.mp3',
    match: '/sounds/match.mp3',
    visit: '/sounds/visit.mp3',
    report: '/sounds/report.mp3'
  };

  // Fallback: generate synthetic sounds using Web Audio API
  private syntheticSounds: Record<NotificationSoundType, () => void> = {
    message: () => this.playTone(800, 0.2, 'sine'),
    like: () => this.playChord([523, 659, 784], 0.3, 'sine'), // C major chord
    match: () => this.playSequence([523, 659, 784, 1047], 0.15, 'sine'), // Ascending scale
    visit: () => this.playTone(440, 0.1, 'triangle'),
    report: () => this.playTone(220, 0.5, 'sawtooth') // Lower, more serious tone
  };

  constructor() {
    this.loadSettings();
    this.setupUserInteractionDetection();
  }

  private setupUserInteractionDetection() {
    // Listen for first user interaction to enable audio
    const enableAudio = () => {
      this.userHasInteracted = true;
      // Ne pas initialiser immédiatement - attendre qu'on en ait besoin
      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio, { once: true, passive: true });
    document.addEventListener('keydown', enableAudio, { once: true, passive: true });
    document.addEventListener('touchstart', enableAudio, { once: true, passive: true });
  }

  private async initAudioContext(): Promise<boolean> {
    // Ne jamais tenter d'initialiser sans interaction utilisateur
    if (!this.userHasInteracted || this.initializationAttempted) {
      return false;
    }

    this.initializationAttempted = true;

    try {
      // Vérifier que l'API est disponible
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        return false;
      }

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Si le contexte est suspendu, ne pas essayer de le reprendre ici
      // Le faire seulement quand on veut jouer un son
      this.isInitialized = true;
      return true;

    } catch (error) {
      // Échec silencieux - pas d'audio
      this.isInitialized = false;
      return false;
    }
  }

  private loadSettings() {
    // Load user preferences from localStorage
    const enabled = localStorage.getItem('notifications-sound-enabled');
    const volume = localStorage.getItem('notifications-sound-volume');

    this.isEnabled = enabled !== 'false'; // Default to true
    this.volume = volume ? parseFloat(volume) : 0.5;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('notifications-sound-enabled', enabled.toString());
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    localStorage.setItem('notifications-sound-volume', this.volume.toString());
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public getVolume(): number {
    return this.volume;
  }

  private async loadAudioFile(url: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return null; // File doesn't exist, will fallback to synthetic
      }
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      // Silent fallback to synthetic sounds
      return null;
    }
  }

  private playAudioBuffer(buffer: AudioBuffer) {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();
    } catch (error) {
      // Silently fail if audio can't be played
    }
  }

  // Generate synthetic tones for fallback
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      const currentTime = this.audioContext.currentTime;
      const volume = Math.max(0.01, this.volume * 0.3); // Ensure minimum volume

      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      // Clean up after sound finishes
      setTimeout(() => {
        try {
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
      }, (duration + 0.1) * 1000);
    } catch (error) {
      // Silently fail
    }
  }

  private playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.isEnabled) return;

    frequencies.forEach((freq, index) => {
      // Slight delay between notes to create chord effect
      setTimeout(() => {
        this.playTone(freq, duration, type);
      }, index * 10);
    });
  }

  private playSequence(frequencies: number[], noteDuration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.isEnabled) return;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, noteDuration, type);
      }, index * noteDuration * 1000);
    });
  }

  public async playNotificationSound(type: NotificationSoundType): Promise<void> {
    // Vérifications préliminaires - sortir immédiatement si pas possible
    if (!this.isEnabled || !this.userHasInteracted) {
      return;
    }

    // Initialiser le contexte audio seulement maintenant si nécessaire
    if (!this.isInitialized && !this.initializationAttempted) {
      const success = await this.initAudioContext();
      if (!success) {
        return;
      }
    }

    // Si toujours pas de contexte audio, sortir silencieusement
    if (!this.audioContext) {
      return;
    }

    // Essayer de reprendre le contexte s'il est suspendu
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        // Si impossible de reprendre, sortir silencieusement
        return;
      }
    }

    // Essayer de jouer le fichier audio d'abord
    if (!this.soundCache.has(type)) {
      const buffer = await this.loadAudioFile(this.soundUrls[type]);
      if (buffer) {
        this.soundCache.set(type, buffer);
        this.playAudioBuffer(buffer);
        return;
      } else {
        // Marquer comme vérifié mais échec
        this.soundCache.set(type, null as any);
      }
    }

    const cachedBuffer = this.soundCache.get(type);
    if (cachedBuffer && cachedBuffer !== null) {
      this.playAudioBuffer(cachedBuffer);
    } else {
      // Fallback vers son synthétique
      try {
        this.syntheticSounds[type]();
      } catch (error) {
        // Échec silencieux
      }
    }
  }

  // Force initialization for testing (after user interaction)
  public async forceInit(): Promise<boolean> {
    if (!this.userHasInteracted) {
      this.userHasInteracted = true;
    }
    return await this.initAudioContext();
  }

  // Test all sounds (requires user interaction first)
  public async testAllSounds(): Promise<void> {
    // Ensure initialization first
    const success = await this.forceInit();
    if (!success) return;

    const types: NotificationSoundType[] = ['message', 'like', 'match', 'visit', 'report'];

    for (let i = 0; i < types.length; i++) {
      setTimeout(() => {
        this.playNotificationSound(types[i]);
      }, i * 500); // Play each sound 500ms apart
    }
  }

  // Debug method to test audio context (sans logs pour éviter pollution console)
  public debugAudioContext() {
    return {
      audioContext: !!this.audioContext,
      state: this.audioContext?.state,
      isEnabled: this.isEnabled,
      volume: this.volume,
      cacheSize: this.soundCache.size,
      userHasInteracted: this.userHasInteracted,
      isInitialized: this.isInitialized
    };
  }

  // Test synthetic sound directly
  public async testSynthetic(type: NotificationSoundType): Promise<void> {
    const success = await this.forceInit();
    if (success && this.syntheticSounds[type]) {
      this.syntheticSounds[type]();
    }
  }

  // Quick access methods
  public playMessageSound() {
    this.playNotificationSound('message');
  }

  public playLikeSound() {
    this.playNotificationSound('like');
  }

  public playMatchSound() {
    this.playNotificationSound('match');
  }

  public playVisitSound() {
    this.playNotificationSound('visit');
  }

  public playReportSound() {
    this.playNotificationSound('report');
  }
}

export default new SoundService();
