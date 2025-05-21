import { GameController } from './GameController';
import type { GameSettings, PlayerColor, GameResult } from '../models/types/ChessTypes';
import { HistoryView } from '../views/HistoryView';

export class UIController {
    private static readonly BOT_LEVELS = ['facil', 'medio', 'dificil'] as const;
    private static readonly PLAYER_COLORS = ['w', 'b'] as const;

    constructor(private readonly gameController: GameController) {}

    public initializeUI(): void {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.getElementById('start-game')?.addEventListener('click', async () => {
            await this.handleStartGame();
        });

        document.getElementById('restart-game')?.addEventListener('click', async () => {
            await this.gameController.resetGame();
        });
    }

    private async handleStartGame(): Promise<void> {
        try {
            const settings = this.getGameSettings();
            await this.gameController.startGame(settings);
            this.updateGameControls();
        } catch (error) {
            this.showError('Falha ao iniciar o jogo');
            console.error('Start game error:', error);
        }
    }

    private getGameSettings(): GameSettings {
        const botLevel = this.getValidatedSelectValue('bot-level', UIController.BOT_LEVELS);
        const playerColor = this.getValidatedSelectValue('player-color', UIController.PLAYER_COLORS);
        
        return {
            mode: 'singleplayer',
            botLevel,
            playerColor
        };
    }

    private getValidatedSelectValue<T extends string>(
        elementId: string, 
        validValues: readonly T[]
    ): T {
        const element = document.getElementById(elementId) as HTMLSelectElement;
        const value = element.value as T;
        return validValues.includes(value) ? value : validValues[0];
    }

    public async showError(message: string): Promise<void> {
        console.error(message);
        // Pode ser substituído por um sistema de notificação mais sofisticado
        alert(message);
    }

    public updateGameControls(): void {
        const startBtn = document.getElementById('start-game') as HTMLButtonElement | null;
        const restartBtn = document.getElementById('restart-game') as HTMLButtonElement | null;

        if (startBtn) startBtn.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'inline-block';
    }

    public updateMoveHistory(): void {
        const moves = this.gameController._moveHistory.getMoves();
        const currentIndex = this.gameController._moveHistory.getCurrentIndex();
        HistoryView.update(moves, currentIndex);
    }

    public showGameResult(result: GameResult): void {
        const message = result === 'Empate' 
            ? 'O jogo terminou em empate!' 
            : `Vitória das ${result}!`;
        
        alert(message);
    }
}