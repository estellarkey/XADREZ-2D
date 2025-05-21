export class AudioService {
    private static sounds: Record<string, HTMLAudioElement> = {};
    private static basePath = '/sounds/';
    private static activeSounds: Set<string> = new Set();
    
    // Controle exclusivo para tocar 'danger' apenas uma vez
    private static dangerPlayedOnce = false;

    public static async loadSounds(): Promise<void> {
        try {
            const soundFiles = {
                'move': 'move.mp3',
                'capture': 'capture.mp3',
                'check': 'check.mp3',
                'danger': 'danger-zone.mp3'
            };

            for (const [name, file] of Object.entries(soundFiles)) {
                const audio = new Audio(`${this.basePath}${file}`);
                audio.volume = 0.5;
                audio.preload = 'auto';

                audio.addEventListener('ended', () => {
                    this.activeSounds.delete(name);
                    console.log(`[AudioService] FINALIZADO: '${name}'`);
                });

                this.sounds[name] = audio;
            }

            console.log('[AudioService] Sons carregados');
        } catch (error) {
            console.error("Erro ao carregar sons:", error);
        }
    }

    public static play(soundName: string, loop: boolean = false): void {
        if (soundName === 'danger') {
            if (this.dangerPlayedOnce) {
                console.log(`[AudioService] BLOQUEADO: som 'danger' já foi tocado uma vez`);
                return;
            }
            this.dangerPlayedOnce = true;
        }

        const audio = this.sounds[soundName];
        if (!audio) {
            console.warn(`Som '${soundName}' não encontrado`);
            return;
        }

        const instance = loop ? audio : audio.cloneNode(true) as HTMLAudioElement;
        instance.volume = audio.volume;
        instance.loop = loop;
        instance.currentTime = 0;

        this.activeSounds.add(soundName);
        console.log(`[AudioService] TOCANDO: '${soundName}' @ ${new Date().toISOString()}`);

        if (soundName === 'danger') {
            console.trace(`[AudioService] Stack trace para o som 'danger'`);
        }

        instance.addEventListener('ended', () => {
            this.activeSounds.delete(soundName);
            console.log(`[AudioService] FINALIZADO: '${soundName}'`);
        });

        instance.play().catch(err => {
            console.error(`Erro ao tocar o som '${soundName}':`, err);
            this.activeSounds.delete(soundName);
        });
    }

    public static setVolume(volume: number): void {
        Object.values(this.sounds).forEach(audio => {
            audio.volume = volume;
        });
    }
}
