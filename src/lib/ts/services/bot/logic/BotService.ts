import type { CellPosition } from '$lib/ts/models/types/ChessTypes';
import { Game } from '../../../models/Game';

export class BotService {
    private nivel: 'facil' | 'medio' | 'dificil';
    private cor: 'w' | 'b';
    private isProcessing: boolean = false;
    private pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 1000 }; // Valores das peças

    constructor(
        private game: Game,
        nivel: 'facil' | 'medio' | 'dificil' = 'facil', 
        cor: 'w' | 'b' = 'b'
    ) {
        this.nivel = nivel;
        this.cor = cor;
    }

    public deveJogar(): boolean {
        return this.game.getCurrentTurn() === this.cor && !this.isProcessing;
    }

    public async fazerMovimento(): Promise<{ from: string, to: string, promotion?: string } | null> {
        if (!this.deveJogar()) return null;

        this.isProcessing = true;
        
        try {
            await this.delay(this.calculateDelay());
            
            const moves = this.getValidMoves();
            if (moves.length === 0) return null;

            // Verifica primeiro se o rei está em perigo
            const kingInDangerMove = this.getKingEscapeMove(moves);
            if (kingInDangerMove) {
                return kingInDangerMove;
            }

            let move;
            switch (this.nivel) {
                case 'facil':
                    move = this.fazerMovimentoFacil(moves);
                    break;
                case 'medio':
                    move = this.fazerMovimentoMedio(moves);
                    break;
                case 'dificil':
                    move = this.fazerMovimentoDificil(moves);
                    break;
                default:
                    move = this.fazerMovimentoFacil(moves);
            }

            return move;
        } catch (error) {
            console.error('Erro no BotService:', error);
            return null;
        } finally {
            this.isProcessing = false;
        }
    }

    private getValidMoves(): any[] {
        // Obtém todos os movimentos válidos usando a instância do Game
        const validMoves: { from: string, to: string, piece: string, captured: string | null }[] = [];
        const board = this.game.getBoard();
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.game.getPiece(i, j);
                if (piece && piece.color === this.cor) {
                    const from = this.game.coordsToSquare(i, j);
                    const targets = this.game.getValidMoves(i, j);
                    
                    targets.forEach(target => {
                        const to = this.game.coordsToSquare(target.i, target.j);
                        validMoves.push({
                            from,
                            to,
                            piece: piece.type ?? '',
                            captured: this.getCapturedPiece(target.i, target.j)
                        });
                    });
                }
            }
        }
        
        return validMoves;
    }

    private getCapturedPiece(i: number, j: number): string | null {
        const piece = this.game.getPiece(i, j);
        return piece && piece.color !== this.cor && piece.type ? piece.type : null;
    }

   private getKingEscapeMove(moves: any[]): { from: string, to: string } | null {
    // Encontra a posição do rei
    let kingPos: CellPosition | null = null;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = this.game.getPiece(i, j);
            if (piece && piece.type === 'k' && piece.color === this.cor) {
                kingPos = { i, j };
                break;
            }
        }
        if (kingPos) break;
    }

    if (!kingPos) return null;

    // Verifica se o rei está em zona de perigo
    const kingInDanger = this.game.isSquareDangerous(kingPos.i, kingPos.j);
    if (!kingInDanger) return null;

    // Filtra movimentos seguros para o rei
    const safeKingMoves = moves.filter(move => {
        const fromPos = this.game.squareToCoords(move.from);
        return fromPos.i === kingPos!.i && fromPos.j === kingPos!.j &&
               !this.game.isSquareDangerous(
                   this.game.squareToCoords(move.to).i,
                   this.game.squareToCoords(move.to).j
               );
    });

    if (safeKingMoves.length > 0) {
        return safeKingMoves[0]; // Escolhe o primeiro movimento seguro
    }

    return null;
}

    private distanceFromCenter(pos: CellPosition): number {
        const center = { i: 3.5, j: 3.5 };
        return Math.sqrt(Math.pow(pos.i - center.i, 2) + Math.pow(pos.j - center.j, 2));
    }

    private fazerMovimentoFacil(moves: any[]): any {
        // Movimento aleatório, mas evita colocar peças em perigo
        const safeMoves = moves.filter(move => {
            const toPos = this.game.squareToCoords(move.to);
            return !this.game.isSquareDangerous(toPos.i, toPos.j);
        });

        return safeMoves.length > 0 
            ? safeMoves[Math.floor(Math.random() * safeMoves.length)]
            : moves[Math.floor(Math.random() * moves.length)];
    }

    private fazerMovimentoMedio(moves: any[]): any {
        const evaluatedMoves = moves.map(move => ({
            move,
            score: this.avaliarMovimento(move)
        }));

        // Filtra movimentos ruins
        const goodMoves = evaluatedMoves.filter(m => m.score > -50);
        
        if (goodMoves.length > 0) {
            goodMoves.sort((a, b) => b.score - a.score);
            return goodMoves[0].move;
        }
        
        evaluatedMoves.sort((a, b) => b.score - a.score);
        return evaluatedMoves[0].move;
    }

    private fazerMovimentoDificil(moves: any[]): any {
        const evaluatedMoves = moves.map(move => ({
            move,
            score: this.avaliarMovimentoDificil(move)
        }));

        evaluatedMoves.sort((a, b) => b.score - a.score);
        
        // Escolhe entre os 3 melhores movimentos
        const topMoves = evaluatedMoves.slice(0, 3);
        return topMoves[Math.floor(Math.random() * topMoves.length)].move;
    }

    private avaliarMovimento(move: any): number {
        let score = 0;
        const toPos = this.game.squareToCoords(move.to);

        // 1. Valor da peça capturada
        if (move.captured) {
            score += this.pieceValues[move.captured as keyof typeof this.pieceValues] || 0;
        }

        // 2. Penalidade por mover para zona de perigo
        if (this.game.isSquareDangerous(toPos.i, toPos.j)) {
            score -= this.pieceValues[move.piece  as keyof typeof this.pieceValues] || 0;
        }

        // 3. Bônus por controlar o centro
        score += this.controlBonus(toPos);

        // 4. Penalidade por expor peças valiosas
        if (this.pieceValues[move.piece  as keyof typeof this.pieceValues] > 3) {
            score -= this.exposurePenalty(move);
        }

        return score;
    }

    private avaliarMovimentoDificil(move: any): number {
        let score = this.avaliarMovimento(move);
        const toPos = this.game.squareToCoords(move.to);

        // 1. Bônus por desenvolvimento de peças no início do jogo
        if (this.isEarlyGame()) {
            score += this.developmentBonus(move);
        }

        // 2. Bônus por ameaçar peças adversárias
        score += this.threatBonus(move);

        // 3. Bônus por roque
        if (move.piece === 'k' && Math.abs(move.to.charCodeAt(0) - move.from.charCodeAt(0)) > 1) {
            score += 50;
        }

        return score;
    }

    private isEarlyGame(): boolean {
        // Implemente sua lógica para determinar se está no início do jogo
        return true; // Exemplo simplificado
    }

    private developmentBonus(move: any): number {
        // Bônus por mover peças para posições ativas
        return 0; // Implemente conforme necessário
    }

    private threatBonus(move: any): number {
        // Bônus por criar ameaças
        return 0; // Implemente conforme necessário
    }

    private controlBonus(pos: CellPosition): number {
        // Bônus por controlar casas centrais
        const centerDistance = this.distanceFromCenter(pos);
        return centerDistance < 2.5 ? 1 : 0;
    }

    private exposurePenalty(move: any): number {
        // Penalidade por expor peças valiosas a ataques
        return 0; // Implemente conforme necessário
    }

    private calculateDelay(): number {
        switch (this.nivel) {
            case 'facil': return 300 + Math.random() * 500;
            case 'medio': return 700 + Math.random() * 800;
            case 'dificil': return 1200 + Math.random() * 1500;
            default: return 500;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}