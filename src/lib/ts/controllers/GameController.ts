import type { IGameController } from './interfaces/IGameController';
import type { GameMode, PlayerColor, GameResult, CellPosition, GameSettings } from '../models/types/ChessTypes';
import { Game } from '../models/Game';
import { MoveHistory } from '../models/MoveHistory';
import { Player } from '../models/Player';
import { BotService } from '../services/bot/logic/BotService';
import { BoardView } from '../views/BoardView';
import { UIController } from './UIController';
import { AudioService } from '../services/AudioService';
import { DangerZoneManager } from '../services/DangerZoneManager';

export class GameController implements IGameController {
    private _game: Game;
    public _moveHistory: MoveHistory;
    private _players: Player[];
    private _botService: BotService | null = null;
    private _boardView: BoardView;
    private _uiController: UIController;
    private _dangerZoneManager: DangerZoneManager;

    private _selectedCell: CellPosition | null = null;
    private _validMoves: CellPosition[] = [];
    private _gameMode: GameMode = 'singleplayer';
    private _playerColor: PlayerColor = 'w';
    private _isProcessingMove = false;

    constructor() {
        this._game = new Game();
        this._game.setKingCaughtCallback((winner) => {
            const result = winner === 'w' ? 'Branco' : 'Preto';
            this._uiController.showGameResult(result);
        });
        this._moveHistory = new MoveHistory();
        this._players = [new Player('w'), new Player('b')];
        this._boardView = new BoardView(this._game);
        this._uiController = new UIController(this);
        
        this._dangerZoneManager = new DangerZoneManager(
            this._game,
            () => this._boardView.updateBoard() // Atualiza o tabuleiro quando uma zona é adicionada
        );
        this._uiController.initializeUI();

        this.initialize();
    }

    private initialize(): void {
        this._boardView.render();
        window.handleChessClick = (i, j) => this.handleCellClick(i, j);
    }

    public async startGame(settings: GameSettings): Promise<void> {
        this._gameMode = settings.mode;
        this._playerColor = settings.playerColor || 'w';
        this._game.reset();
        this._moveHistory.clear();
        this._dangerZoneManager.startDangerZoneTimer();

        await AudioService.loadSounds();
        this.clearSelection();

        const botColor = this._playerColor === 'w' ? 'b' : 'w';
        this._botService = new BotService(
            this._game,
            settings.botLevel || 'facil',
            botColor
        );

        this._uiController.updateGameControls();
        this._boardView.render();

        if (this._playerColor === 'b') {
            await this.delay(300);
            await this.botTurn();
        }
    }

    public async handleCellClick(i: number, j: number): Promise<void> {
        if (this._isProcessingMove ||
            (this._gameMode === 'singleplayer' &&
                this._game.getCurrentTurn() !== this._playerColor)) {
            return;
        }

        this._isProcessingMove = true;

        try {
            if (!this._selectedCell) {
                await this.handlePieceSelection(i, j);
            } else {
                await this.handleMoveAttempt(i, j);
            }
        } finally {
            this._isProcessingMove = false;
        }
    }

    private async handlePieceSelection(i: number, j: number): Promise<void> {
        const piece = this._game.getPiece(i, j);
        if (piece && piece.color === this._game.getCurrentTurn()) {
            this._selectedCell = { i, j };
            this._validMoves = this._game.getValidMoves(i, j);
            this._boardView.highlightCell(i, j, "select");
            this._boardView.showValidMoves(this._validMoves);
        }
    }

    private async handleMoveAttempt(i: number, j: number): Promise<void> {
        if (!this._selectedCell) return;

        const isValidMove = this._validMoves.some(move => move.i === i && move.j === j);
        if (isValidMove) {
            const from = this._selectedCell;
            const to = { i, j };

            const moveSuccess = await this.executeMove(from, to);

            if (moveSuccess) {
                const result = this._game.checkGameResult();
                if (result) {
                    this._uiController.showGameResult(result);
                    return;
                }

                if (this._gameMode === 'singleplayer') {
                    await this.botTurn();
                }
            }
        }
        this.clearSelection();
    }

    private async executeMove(from: CellPosition, to: CellPosition): Promise<boolean> {
        try {
            await Promise.all([
                this._boardView.animateMove(from, to),
                this.delay(100)
            ]);

            const pieceAtDestination = this._game.getPiece(to.i, to.j);
            const moveSuccess = this._game.movePiece(from, to);

            if (await moveSuccess) {
                if (pieceAtDestination) {
                    AudioService.play('capture');
                } else {
                    AudioService.play('move');
                }

                this._boardView.updateBoard();
                this.recordMove();

                const currentTurn = this._game.getCurrentTurn();
                const opponentColor = currentTurn === 'w' ? 'b' : 'w';
                if (this._game.isKingInDanger(opponentColor)) {
                    AudioService.play('check');
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('Error executing move:', error);
            return false;
        }
    }

    private async botTurn(): Promise<void> {
        if (!this._botService || this._gameMode !== 'singleplayer') {
            return;
        }

        const botColor = this._playerColor === 'w' ? 'b' : 'w';
        if (this._game.isKingInDanger(botColor)) {
            console.log("Rei do bot está em perigo!");
        }

        const move = await this._botService.fazerMovimento();
        if (move) {
            const from = this._game.squareToCoords(move.from);
            const to = this._game.squareToCoords(move.to);
            await this.executeMove(from, to);

            const result = this._game.checkGameResult();
            if (result) {
                this._uiController.showGameResult(result);
            }
        }
    }

    public checkGameEnd(): void {
        if (this._game.isKingInDanger('w')) {
            console.log("Rei branco está em zona de perigo!");
        }
        if (this._game.isKingInDanger('b')) {
            console.log("Rei preto está em zona de perigo!");
        }
    }

    private recordMove(): void {
        const lastMove = this._game.getLastMove();
        const isWhiteMove = this._game.getCurrentTurn() === 'b';
        this._moveHistory.addMove(lastMove, isWhiteMove);
        this._uiController.updateMoveHistory();
    }

    public async resetGame(): Promise<void> {
        this._game.reset();
        this._moveHistory.clear();
        this.clearSelection();
        this._boardView.render();
        this._dangerZoneManager.clearDangerZones();
        this._dangerZoneManager.stopDangerZoneTimer();
        
        if (this._gameMode === 'singleplayer' && this._playerColor === 'b') {
            await this.botTurn();
        }
    }

    private clearSelection(): void {
        if (this._selectedCell) {
            this._boardView.highlightCell(this._selectedCell.i, this._selectedCell.j, "");
            this._selectedCell = null;
        }
        this._boardView.clearValidMoves();
        this._validMoves = [];
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Getters and setters
    public getCurrentTurn(): PlayerColor { return this._game.getCurrentTurn(); }
    public getGameResult(): GameResult { return this._game.checkGameResult(); }
    public get gameMode(): GameMode { return this._gameMode; }
    public get playerColor(): PlayerColor { return this._playerColor; }
    public set playerColor(color: PlayerColor) { this._playerColor = color; }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const gameController = new GameController();
        (window as any).gameController = gameController;
    });
}

declare global {
    interface Window {
        handleChessClick: (i: number, j: number) => void;
    }
}