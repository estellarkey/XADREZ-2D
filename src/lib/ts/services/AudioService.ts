export class AudioService {
    private static sounds: Record<string, HTMLAudioElement> = {};
    private static basePath = '/sounds/';
    private static activeSounds: Set<string> = new Set(); // Controla sons ativos

    public static async loadSounds(): Promise<void> {
        try {
            const soundFiles = {
                'move': 'move.mp3',
                'capture': 'capture.mp3',
                'check': 'check.mp3',
                'danger': 'danger-zone.mp3'
            };

            for (const [name, file] of Object.entries(soundFiles)) {
                this.sounds[name] = new Audio(`${this.basePath}${file}`);
                this.sounds[name].volume = 0.5;
                this.sounds[name].preload = 'auto';
                
                // Adiciona evento para remover do conjunto quando terminar
                this.sounds[name].addEventListener('ended', () => {
                    this.activeSounds.delete(name);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar sons:", error);
        }
    }

    public static play(soundName: string, loop: boolean = false): void {
        if (!this.sounds[soundName]) {
            console.warn(`Som ${soundName} não encontrado`);
            return;
        }

        // Se já está tocando, não toca novamente
        if (this.activeSounds.has(soundName)) {
            return;
        }

        try {
            this.activeSounds.add(soundName);
            
            if (!loop) {
                const clone = this.sounds[soundName].cloneNode(true) as HTMLAudioElement;
                clone.volume = this.sounds[soundName].volume;
                clone.loop = false;
                
                // Garante que será removido quando terminar
                clone.addEventListener('ended', () => {
                    this.activeSounds.delete(soundName);
                });
                
                clone.play().catch(e => {
                    console.error("Erro ao reproduzir som:", e);
                    this.activeSounds.delete(soundName);
                });
            } else {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].loop = true;
                this.sounds[soundName].play().catch(e => {
                    console.error("Erro ao reproduzir som:", e);
                    this.activeSounds.delete(soundName);
                });
            }
        } catch (error) {
            console.error("Erro ao reproduzir som:", error);
            this.activeSounds.delete(soundName);
        }
    }

    public static setVolume(volume: number): void {
        Object.values(this.sounds).forEach(audio => {
            audio.volume = volume;
        });
    }
}