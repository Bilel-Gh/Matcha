import React, { useState, useEffect } from 'react';
import soundService, { NotificationSoundType } from '../services/soundService';
import './SoundSettings.css';

interface SoundSettingsProps {
  className?: string;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ className = '' }) => {
  const [isEnabled, setIsEnabled] = useState(soundService.getEnabled());
  const [volume, setVolume] = useState(soundService.getVolume());
  const [testingSound, setTestingSound] = useState<NotificationSoundType | null>(null);

  useEffect(() => {
    // Load initial settings
    setIsEnabled(soundService.getEnabled());
    setVolume(soundService.getVolume());
  }, []);

  const handleToggleEnabled = async () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    soundService.setEnabled(newEnabled);

    if (newEnabled) {
      // Play a test sound when enabling - this counts as user interaction
      try {
        await soundService.forceInit();
        await soundService.playLikeSound();
      } catch (error) {
        // Silently fail if audio can't be played
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    soundService.setVolume(newVolume);
  };

  const handleTestSound = async (type: NotificationSoundType) => {
    if (!isEnabled) return;

    setTestingSound(type);
    try {
      await soundService.forceInit();
    await soundService.playNotificationSound(type);
    } catch (error) {
      // Silently fail if audio can't be played
    }
    setTimeout(() => setTestingSound(null), 500);
  };

  const handleTestAllSounds = async () => {
    if (!isEnabled) return;

    try {
    await soundService.testAllSounds();
    } catch (error) {
      // Silently fail if audio can't be played
    }
  };



  const soundTypes: { type: NotificationSoundType; label: string; description: string }[] = [
    { type: 'message', label: 'Message', description: 'When you receive a new message' },
    { type: 'like', label: 'Like', description: 'When someone likes you' },
    { type: 'match', label: 'Match', description: 'When you get a new match' },
    { type: 'visit', label: 'Visit', description: 'When someone visits your profile' },
    { type: 'report', label: 'Report', description: 'When your account is reported' }
  ];

  return (
    <div className={`sound-settings ${className}`}>
      <div className="sound-settings-header">
        <h3 className="sound-settings-title">🔊 Notification Sounds</h3>
        <p className="sound-settings-description">
          Customize your notification sounds for a better experience
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="sound-setting-row">
        <div className="setting-info">
          <label className="setting-label">Enable Notification Sounds</label>
          <p className="setting-description">Play sounds when you receive notifications</p>
        </div>
        <div className="setting-control">
          <label className="switch">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggleEnabled}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      {/* Volume Control */}
      {isEnabled && (
        <div className="sound-setting-row">
          <div className="setting-info">
            <label className="setting-label">Volume</label>
            <p className="setting-description">Adjust the notification sound volume</p>
          </div>
          <div className="setting-control volume-control">
            <span className="volume-label">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span className="volume-label">🔊</span>
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Sound Tests */}
      {isEnabled && (
        <div className="sound-tests">
          <h4 className="test-section-title">Test Sounds</h4>
          <div className="test-buttons-grid">
            {soundTypes.map(({ type, label, description }) => (
              <button
                key={type}
                onClick={() => handleTestSound(type)}
                disabled={testingSound === type}
                className={`test-sound-btn ${testingSound === type ? 'testing' : ''}`}
                title={description}
              >
                {testingSound === type ? '🔊' : '🎵'} {label}
                {testingSound === type && <span className="testing-indicator">...</span>}
              </button>
            ))}
          </div>

          <button
            onClick={handleTestAllSounds}
            className="test-all-btn"
            disabled={testingSound !== null}
          >
            🎼 Test All Sounds
          </button>
        </div>
      )}
    </div>
  );
};

export default SoundSettings;
