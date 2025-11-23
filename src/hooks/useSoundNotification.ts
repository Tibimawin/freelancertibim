import { useCallback, useRef } from 'react';

type SoundType = 'critical' | 'warning' | 'info' | 'success';

export const useSoundNotification = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabledRef.current) return;

    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [getAudioContext]);

  const playSound = useCallback((soundType: SoundType) => {
    switch (soundType) {
      case 'critical':
        // Som de alerta crítico - três beeps rápidos e agudos
        playTone(880, 0.15);
        setTimeout(() => playTone(880, 0.15), 200);
        setTimeout(() => playTone(880, 0.15), 400);
        break;

      case 'warning':
        // Som de aviso - dois beeps médios
        playTone(659, 0.2);
        setTimeout(() => playTone(523, 0.2), 250);
        break;

      case 'info':
        // Som de informação - beep suave único
        playTone(523, 0.25, 'sine');
        break;

      case 'success':
        // Som de sucesso - beep ascendente
        playTone(523, 0.15);
        setTimeout(() => playTone(659, 0.2), 150);
        break;

      default:
        playTone(440, 0.2);
    }
  }, [playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    
    // Salvar preferência no localStorage
    localStorage.setItem('admin-sound-notifications', enabled ? 'enabled' : 'disabled');
  }, []);

  const isEnabled = useCallback(() => {
    const stored = localStorage.getItem('admin-sound-notifications');
    if (stored === null) return true; // Habilitado por padrão
    return stored === 'enabled';
  }, []);

  // Inicializar estado do localStorage
  if (enabledRef.current && !isEnabled()) {
    enabledRef.current = false;
  }

  return {
    playSound,
    setEnabled,
    isEnabled: isEnabled(),
  };
};
