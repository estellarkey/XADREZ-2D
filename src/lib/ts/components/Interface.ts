// Interface.ts - Versão simplificada
import { Chess, Move, type PieceSymbol, type Square } from 'chess.js';
import { Montagem } from "./Assembly";

export class Interface {
    private chess: Chess;
    private montagem: Montagem;

    constructor() {
        this.chess = new Chess();
        this.montagem = new Montagem(this);
    }

    getTabuleiro(): (number | null)[][] {
        return this.chess.board().map(row => 
            row.map(piece => piece ? this.pieceToId(piece) : null)
        );
    }

    public squareToCoords(square: Square): [number, number] {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const file = square[0];
        const rank = parseInt(square[1]);
        return [8 - rank, files.indexOf(file)];
    }

    private pieceToId(piece: { type: PieceSymbol; color: 'b' | 'w' }): number {
        const typeMap: Record<PieceSymbol, number> = {
            'k': 1, 'q': 2, 'r': 3, 'b': 4, 'n': 5, 'p': 6
        };
        return piece.color === 'w' ? typeMap[piece.type] : typeMap[piece.type] + 6;
    }

    getPeca(i: number, j: number): { id: number, color: 'w' | 'b' } | null {
        const square = this.coordsToSquare(i, j);
        const piece = this.chess.get(square);
        return piece ? { id: this.pieceToId(piece), color: piece.color } : null;
    }

    public coordsToSquare(i: number, j: number): Square {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        return `${files[j]}${8 - i}` as Square;
    }

    moverPeca(fromI: number, fromJ: number, toI: number, toJ: number): boolean {
        const from = this.coordsToSquare(fromI, fromJ);
        const to = this.coordsToSquare(toI, toJ);
        
        try {
            const move = this.chess.move({ from, to, promotion: 'q' });
            if (move) {
                this.montagem.atualizarJogo();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    get vez(): 'w' | 'b' {
        return this.chess.turn();
    }

    vitoria(): false | 'Branco' | 'Preto' | 'Empate' {
        if (this.chess.isCheckmate()) {
            return this.chess.turn() === 'w' ? 'Preto' : 'Branco';
        } else if (this.chess.isDraw()) {
            return 'Empate';
        }
        return false;
    }
}