import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import type { CellPosition, DangerZone, GameResult, PieceData, PlayerColor } from './types/ChessTypes';

export class Game {
    private chess: Chess;
    private redoStack: Move[] = [];
    private _dangerZones: DangerZone[] = [];
    private _dangerZoneTimers: Map<string, number> = new Map();
    private _lastDangerSide: 'w' | 'b' = 'b';
    private _dangerZoneQueue: CellPosition[] = [];
    private _winner: PlayerColor | null = null; // Adicione esta propriedade
    private kingCaughtCallback: ((winner: PlayerColor) => void) | null = null;

    constructor() {
        this.chess = new Chess();
    }

      public setKingCaughtCallback(callback: (winner: PlayerColor) => void): void {
        this.kingCaughtCallback = callback;
    }

    public addDangerZone(position: CellPosition): void {
        const key = `${position.i},${position.j}`;
        
        if (this._dangerZones.some(z => `${z.position.i},${z.position.j}` === key)) {
            return;
        }

        const piece = this.getPiece(position.i, position.j);
        
        this._dangerZones.push({
            position,
            timestamp: Date.now(),
            active: true
        });

        const timer = window.setTimeout(() => {
            // Verifica se ainda é um rei na posição
            const currentPiece = this.getPiece(position.i, position.j);
            if (currentPiece?.type === 'k') {
                this._winner = currentPiece.color === 'w' ? 'b' : 'w';
                if (this.kingCaughtCallback) {
                    this.kingCaughtCallback(this._winner);
                }
            } else {
                this.removePieceAt(position);
            }
            this.removeDangerZone(position);
        }, 10000);

        this._dangerZoneTimers.set(key, timer);
    }
    private handleDangerZoneExpiration(position: CellPosition): void {
        const piece = this.getPiece(position.i, position.j);

        // Se for um rei e ainda estiver na zona de perigo, define o vencedor
        if (piece && piece.type === 'k') {
            this._winner = piece.color === 'w' ? 'b' : 'w'; // O oposto ganha
            this.removeDangerZone(position); // Remove a zona de perigo
            return;
        }

        // Para outras peças, remove a peça normalmente
        this.removePieceAt(position);
        this.removeDangerZone(position);
    }
    // Adicione este método para verificar se o rei está em perigo
    public isKingInDanger(color: PlayerColor): boolean {
        // Encontra a posição do rei
        let kingPos: CellPosition | null = null;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.getPiece(i, j);
                if (piece && piece.type === 'k' && piece.color === color) {
                    kingPos = { i, j };
                    break;
                }
            }
            if (kingPos) break;
        }

        return kingPos ? this.isSquareDangerous(kingPos.i, kingPos.j) : false;
    }

    public removeDangerZone(position: CellPosition): void {
        const key = `${position.i},${position.j}`;
        const timer = this._dangerZoneTimers.get(key);
        if (timer) clearTimeout(timer);

        this._dangerZones = this._dangerZones.filter(z =>
            `${z.position.i},${z.position.j}` !== key
        );
        this._dangerZoneTimers.delete(key);
        this.removePieceAt(position);
    }


    public getDangerZones(): DangerZone[] {
        return [...this._dangerZones];
    }

    public clearDangerZones(): void {
        this._dangerZoneTimers.forEach(timer => clearTimeout(timer));
        this._dangerZoneTimers.clear();
        this._dangerZones = [];
        this._dangerZoneQueue = [];
    }

    public processDangerQueue(): void {
        if (this._dangerZoneQueue.length > 0) {
            const position = this._dangerZoneQueue.shift()!;
            this.addDangerZone(position);
        }
    }

    public isSquareDangerous(i: number, j: number): boolean {
        return this._dangerZones.some(z =>
            z.position.i === i && z.position.j === j
        );
    }


    public queueDangerZone(position: CellPosition): void {
        this._dangerZoneQueue.push(position);
    }


    private removePieceAt(position: CellPosition): boolean {
        const square = this.coordsToSquare(position.i, position.j);
        const piece = this.chess.get(square as Square);

        if (!piece) {
            return true;
        }

        try {
            const tempChess = new Chess(this.chess.fen());
            tempChess.remove(square as Square);

            if (this.isBoardValid(tempChess.fen())) {
                this.chess.load(tempChess.fen());
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao remover peça:', error);
            return false;
        }
    }

    private isBoardValid(fen: string): boolean {
        try {
            const tempChess = new Chess(fen);

            // Verifica se ambos os reis estão presentes
            const pieces = tempChess.board().flat();
            const hasWhiteKing = pieces.some(p => p?.type === 'k' && p.color === 'w');
            const hasBlackKing = pieces.some(p => p?.type === 'k' && p.color === 'b');

            return hasWhiteKing && hasBlackKing;
        } catch {
            return false;
        }
    }

    // Métodos principais do jogo
    public getBoard(): (number | null)[][] {
        return this.chess.board().map(row =>
            row.map(piece => piece ? this.pieceToId(piece) : null)
        );
    }

    public getPieceTypeAt(i: number, j: number): string | null {
        const square = this.coordsToSquare(i, j);
        const piece = this.chess.get(square as Square);
        return piece ? piece.type : null;
    }

    public getPiece(i: number, j: number): PieceData | null {
        const square = this.coordsToSquare(i, j);
        const piece = this.chess.get(square as Square);
        return piece ? {
            id: this.pieceToId(piece),
            color: piece.color
        } : null;
    }

    public async movePiece(from: CellPosition, to: CellPosition): Promise<boolean> {
        try {
            const move = this.chess.move({
                from: this.coordsToSquare(from.i, from.j),
                to: this.coordsToSquare(to.i, to.j),
                promotion: 'q'
            });
            return !!move;
        } catch {
            return false;
        }
    }

    public getValidMoves(i: number, j: number): CellPosition[] {
        const square = this.coordsToSquare(i, j);
        const moves = this.chess.moves({ square: square as Square, verbose: true });
        return moves.map(move => this.squareToCoords(move.to));
    }

    public reset(): void {
        this.clearDangerZones();
        this.chess.reset();
        this.redoStack = [];
    }

    public getCurrentTurn(): PlayerColor {
        return this.chess.turn();
    }

    public checkGameResult(): GameResult {
    // 1. Verifica se houve vitória por zona de perigo
    if (this._winner) {
        return this._winner === 'w' ? 'Branco' : 'Preto';
    }

    // 2. Verifica regras normais de xadrez
    if (this.chess.isCheckmate()) {
        return this.chess.turn() === 'w' ? 'Preto' : 'Branco';
    } else if (this.chess.isDraw()) {
        return 'Empate';
    }
    
    return false;
}
    public getLastMove(): string {
        const history = this.chess.history();
        return history[history.length - 1];
    }

    // Métodos de conversão
    public squareToCoords(square: string): CellPosition {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const rank = parseInt(square[1]);
        return {
            i: 8 - rank,
            j: files.indexOf(square[0])
        };
    }

    public coordsToSquare(i: number, j: number): string {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        return `${files[j]}${8 - i}`;
    }

    private pieceToId(piece: { type: PieceSymbol; color: 'b' | 'w' }): number {
        const typeMap: Record<PieceSymbol, number> = {
            'k': 1, 'q': 2, 'r': 3, 'b': 4, 'n': 5, 'p': 6
        };
        return piece.color === 'w' ? typeMap[piece.type] : typeMap[piece.type] + 6;
    }

    // Acesso à instância do chess.js
    public get chessInstance(): Chess {
        return this.chess;
    }
}