import type { CellPosition } from '$lib/ts/models/types/ChessTypes';
import { Game } from '../../../models/Game';

export class BotService {
    private nivel: 'facil' | 'medio' | 'dificil';
    private cor: 'w' | 'b';
    private isProcessing: boolean = false;
    private pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 1000 };
    private centerSquares = ['d4', 'e4', 'd5', 'e5'];
    private developmentSquares = ['c3', 'd3', 'e3', 'f3', 'c6', 'd6', 'e6', 'f6'];
    private recentMoves: {from: string, to: string}[] = [];
    private maxRecentMoves = 4;

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

            // 1. Verificar xeque-mate
            const mateMove = this.findCheckmateMove();
            if (mateMove) return mateMove;

            // 2. Verificar capturas que não resultam em perda material
            const safeCapture = this.findSafeCapture();
            if (safeCapture) return safeCapture;

            // 3. Verificar defesa do rei (prioridade máxima)
            const kingDefenseMove = this.getKingDefenseMove();
            if (kingDefenseMove) return kingDefenseMove;

            // 4. Verificar peças em perigo
            const pieceRescueMove = this.findPieceRescueMove();
            if (pieceRescueMove) return pieceRescueMove;

            // 5. Executar estratégia baseada no nível
            let move;
            switch (this.nivel) {
                case 'facil':
                    move = this.fazerMovimentoFacil();
                    break;
                case 'medio':
                    move = this.fazerMovimentoMedio();
                    break;
                case 'dificil':
                    move = this.fazerMovimentoDificil();
                    break;
                default:
                    move = this.fazerMovimentoFacil();
            }

            // Atualizar histórico de movimentos
            if (move) {
                this.updateRecentMoves(move);
            }

            return move;
        } catch (error) {
            console.error('Erro no BotService:', error);
            return null;
        } finally {
            this.isProcessing = false;
        }
    }

    private updateRecentMoves(move: {from: string, to: string}): void {
        this.recentMoves.unshift(move);
        if (this.recentMoves.length > this.maxRecentMoves) {
            this.recentMoves.pop();
        }
    }

    private findCheckmateMove(): { from: string, to: string, promotion?: string } | null {
        const moves = this.getValidMoves();
        for (const move of moves) {
            const tempGame = new Game();
            tempGame.chessInstance.load(this.game.chessInstance.fen());
            tempGame.chessInstance.move({ from: move.from, to: move.to, promotion: 'q' });
            if (tempGame.chessInstance.isCheckmate()) {
                return move;
            }
        }
        return null;
    }

    private findSafeCapture(): { from: string, to: string, promotion?: string } | null {
        const moves = this.getValidMoves().filter(m => m.captured);
        
        moves.sort((a, b) => 
            this.pieceValues[b.captured as keyof typeof this.pieceValues] - 
            this.pieceValues[a.captured as keyof typeof this.pieceValues]
        );

        for (const move of moves) {
            const fromValue = this.pieceValues[move.piece as keyof typeof this.pieceValues];
            const toValue = this.pieceValues[move.captured as keyof typeof this.pieceValues];
            
            if (toValue >= fromValue) {
                const toPos = this.game.squareToCoords(move.to);
                if (!this.game.isSquareDangerous(toPos.i, toPos.j)) {
                    return move;
                }
            }
        }
        return null;
    }

    private getKingDefenseMove(): { from: string, to: string } | null {
        const kingPos = this.findKingPosition();
        if (!kingPos) return null;

        const kingInDanger = this.game.isSquareDangerous(kingPos.i, kingPos.j);
        const kingMoves = this.getValidMoves().filter(move => {
            const fromPos = this.game.squareToCoords(move.from);
            return fromPos.i === kingPos.i && fromPos.j === kingPos.j;
        });

        if (kingInDanger) {
            const safeKingMoves = kingMoves.filter(move => {
                const toPos = this.game.squareToCoords(move.to);
                return !this.game.isSquareDangerous(toPos.i, toPos.j);
            });

            if (safeKingMoves.length > 0) {
                if (this.isMidGame()) {
                    safeKingMoves.sort((a, b) => {
                        const aPos = this.game.squareToCoords(a.to);
                        const bPos = this.game.squareToCoords(b.to);
                        return this.distanceFromEdge(aPos) - this.distanceFromEdge(bPos);
                    });
                }
                return safeKingMoves[0];
            }

            return this.findBlockOrCaptureMove(kingPos);
        }

        if (kingMoves.length > 0 && this.isEndGame()) {
            kingMoves.sort((a, b) => {
                const aPos = this.game.squareToCoords(a.to);
                const bPos = this.game.squareToCoords(b.to);
                const aSafety = this.getSquareSafety(aPos);
                const bSafety = this.getSquareSafety(bPos);
                return bSafety - aSafety;
            });
            return kingMoves[0];
        }

        return null;
    }

    private findBlockOrCaptureMove(kingPos: CellPosition): { from: string, to: string } | null {
        const attackers = this.findAttackers(kingPos);
        if (attackers.length === 0) return null;

        for (const attacker of attackers) {
            const captureMoves = this.getValidMoves().filter(move => {
                const toPos = this.game.squareToCoords(move.to);
                return toPos.i === attacker.i && toPos.j === attacker.j;
            });

            captureMoves.sort((a, b) => 
                this.pieceValues[a.piece as keyof typeof this.pieceValues] - 
                this.pieceValues[b.piece as keyof typeof this.pieceValues]
            );

            if (captureMoves.length > 0) {
                return captureMoves[0];
            }
        }

        if (attackers.length === 1) {
            const attacker = attackers[0];
            const attackerPiece = this.game.getPiece(attacker.i, attacker.j);
            
            if (['q', 'r', 'b'].includes(attackerPiece?.type || '')) {
                const betweenSquares = this.getSquaresBetween(kingPos, attacker);
                for (const square of betweenSquares) {
                    const blockMoves = this.getValidMoves().filter(move => {
                        const toPos = this.game.squareToCoords(move.to);
                        return toPos.i === square.i && toPos.j === square.j;
                    });

                    if (blockMoves.length > 0) {
                        blockMoves.sort((a, b) => 
                            this.pieceValues[a.piece as keyof typeof this.pieceValues] - 
                            this.pieceValues[b.piece as keyof typeof this.pieceValues]
                        );
                        return blockMoves[0];
                    }
                }
            }
        }

        return null;
    }

    private findPieceRescueMove(): { from: string, to: string } | null {
        const threatenedPieces = this.findThreatenedPieces();
        
        threatenedPieces.sort((a, b) => 
            this.pieceValues[b.piece.type as keyof typeof this.pieceValues] - 
            this.pieceValues[a.piece.type as keyof typeof this.pieceValues]
        );

        for (const { position, piece } of threatenedPieces) {
            const safeMoves = this.getValidMoves().filter(move => {
                const fromPos = this.game.squareToCoords(move.from);
                if (fromPos.i !== position.i || fromPos.j !== position.j) return false;
                
                const toPos = this.game.squareToCoords(move.to);
                return !this.game.isSquareDangerous(toPos.i, toPos.j);
            });

            if (safeMoves.length > 0) {
                safeMoves.sort((a, b) => {
                    const aPos = this.game.squareToCoords(a.to);
                    const bPos = this.game.squareToCoords(b.to);
                    return this.getSquareSafety(aPos) - this.getSquareSafety(bPos);
                });
                return safeMoves[0];
            }

            const defenderMoves = this.findDefenderMoves(position);
            if (defenderMoves) return defenderMoves;
        }

        return null;
    }

    private findDefenderMoves(position: CellPosition): { from: string, to: string } | null {
        const defenders = this.getValidMoves().filter(move => {
            const toPos = this.game.squareToCoords(move.to);
            return toPos.i === position.i && toPos.j === position.j;
        });

        if (defenders.length > 0) {
            defenders.sort((a, b) => 
                this.pieceValues[a.piece as keyof typeof this.pieceValues] - 
                this.pieceValues[b.piece as keyof typeof this.pieceValues]
            );
            return defenders[0];
        }

        return null;
    }

    private findThreatenedPieces(): { position: CellPosition, piece: any }[] {
        const threatened = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.game.getPiece(i, j);
                if (piece && piece.color === this.cor && this.game.isSquareDangerous(i, j)) {
                    threatened.push({ position: { i, j }, piece });
                }
            }
        }
        return threatened;
    }

    private findAttackers(position: CellPosition): CellPosition[] {
        const attackers = [];
        const opponent = this.cor === 'w' ? 'b' : 'w';
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.game.getPiece(i, j);
                if (piece && piece.color === opponent) {
                    const moves = this.game.getValidMoves(i, j);
                    if (moves.some(m => m.i === position.i && m.j === position.j)) {
                        attackers.push({ i, j });
                    }
                }
            }
        }
        return attackers;
    }

    private getSquaresBetween(pos1: CellPosition, pos2: CellPosition): CellPosition[] {
        const squares: CellPosition[] = [];
        const di = Math.sign(pos2.i - pos1.i);
        const dj = Math.sign(pos2.j - pos1.j);
        
        if (di === 0 && dj === 0) return squares;
        
        let i = pos1.i + di;
        let j = pos1.j + dj;
        while (i !== pos2.i || j !== pos2.j) {
            squares.push({ i, j });
            i += di;
            j += dj;
        }
        
        return squares;
    }

    private findKingPosition(): CellPosition | null {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.game.getPiece(i, j);
                if (piece && piece.type === 'k' && piece.color === this.cor) {
                    return { i, j };
                }
            }
        }
        return null;
    }

    private getSquareSafety(pos: CellPosition): number {
        let safety = 0;
        
        if (this.game.isSquareDangerous(pos.i, pos.j)) {
            safety -= 10;
        }
        
        if (this.game.isSquareDefended(pos.i, pos.j, this.cor)) {
            safety += 5;
        }
        
        if (this.isEndGame()) {
            safety += this.distanceFromEdge(pos);
        }
        
        return safety;
    }

    private distanceFromEdge(pos: CellPosition): number {
        return Math.min(pos.i, 7 - pos.i, pos.j, 7 - pos.j);
    }

    private distanceFromCenter(pos: CellPosition): number {
        const center = { i: 3.5, j: 3.5 };
        return Math.sqrt(Math.pow(pos.i - center.i, 2) + Math.pow(pos.j - center.j, 2));
    }

    private isMidGame(): boolean {
        const pieceCount = this.countPieces();
        return pieceCount <= 16 && pieceCount > 8;
    }

    private isEndGame(): boolean {
        return this.countPieces() <= 8;
    }

    private isEarlyGame(): boolean {
        return this.countPieces() > 20;
    }

    private countPieces(): number {
        let count = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.game.getPiece(i, j)) count++;
            }
        }
        return count;
    }

    private fazerMovimentoFacil(): any {
        const moves = this.getValidMoves();
        if (moves.length === 0) return null;

        const goodMoves = moves.filter(move => 
            move.captured || this.moveGivesCheck(move)
        );

        if (goodMoves.length > 0) {
            return goodMoves[Math.floor(Math.random() * goodMoves.length)];
        }

        return moves[Math.floor(Math.random() * moves.length)];
    }

    private fazerMovimentoMedio(): any {
        const moves = this.getValidMoves();
        if (moves.length === 0) return null;

        const evaluatedMoves = moves.map(move => ({
            move,
            score: this.avaliarMovimentoMedio(move)
        }));

        evaluatedMoves.sort((a, b) => b.score - a.score);

        const topMoves = evaluatedMoves.slice(0, 3);
        return topMoves[Math.floor(Math.random() * topMoves.length)].move;
    }

    private fazerMovimentoDificil(): any {
        const moves = this.getValidMoves();
        if (moves.length === 0) return null;

        // Filtrar movimentos repetitivos
        const filteredMoves = this.filterRepetitiveMoves(moves);
        const effectiveMoves = filteredMoves.length > 0 ? filteredMoves : moves;

        const evaluatedMoves = effectiveMoves.map(move => ({
            move,
            score: this.avaliarMovimentoDificil(move)
        }));

        evaluatedMoves.sort((a, b) => b.score - a.score);

        // Introduzir alguma aleatoriedade mesmo no nível difícil
        if (evaluatedMoves.length > 1 && Math.random() < 0.2) {
            const top3 = evaluatedMoves.slice(0, 3);
            return top3[Math.floor(Math.random() * top3.length)].move;
        }

        return evaluatedMoves[0].move;
    }

    private filterRepetitiveMoves(moves: any[]): any[] {
        if (this.recentMoves.length === 0) return moves;

        return moves.filter(move => {
            // Evitar mover a mesma peça consecutivamente
            const lastMove = this.recentMoves[0];
            if (lastMove && lastMove.from === move.from) {
                // Só permitir se for uma captura ou se não houver outras opções
                return move.captured || moves.length === 1;
            }
            return true;
        });
    }

    private avaliarMovimentoMedio(move: any): number {
        let score = 0;

        if (move.captured) {
            score += this.pieceValues[move.captured as keyof typeof this.pieceValues] * 10;
        }

        const toPos = this.game.squareToCoords(move.to);
        if (this.game.isSquareDangerous(toPos.i, toPos.j)) {
            score -= this.pieceValues[move.piece as keyof typeof this.pieceValues] * 5;
        } else if (this.game.isSquareDefended(toPos.i, toPos.j, this.cor)) {
            score += this.pieceValues[move.piece as keyof typeof this.pieceValues] * 2;
        }

        if (this.centerSquares.includes(move.to)) {
            score += 3;
        }

        if (this.isEarlyGame() && this.developmentSquares.includes(move.to)) {
            score += 2;
        }

        if (this.moveGivesCheck(move)) {
            score += 5;
        }

        return score;
    }

    private avaliarMovimentoDificil(move: any): number {
        let score = this.avaliarMovimentoMedio(move);
        const fromPos = this.game.squareToCoords(move.from);
        const toPos = this.game.squareToCoords(move.to);

        // Valor material mais refinado
        if (move.captured) {
            const capturedValue = this.pieceValues[move.captured as keyof typeof this.pieceValues];
            const attackerValue = this.pieceValues[move.piece as keyof typeof this.pieceValues];
            
            // Bônus maior por capturas vantajosas
            if (capturedValue >= attackerValue) {
                score += capturedValue * 15;
            } else {
                score += capturedValue * 8;
            }
        }

        // Segurança avançada da peça
        const pieceValue = this.pieceValues[move.piece as keyof typeof this.pieceValues];
        if (this.game.isSquareDangerous(toPos.i, toPos.j)) {
            score -= pieceValue * 10;
        } else if (this.game.isSquareDefended(toPos.i, toPos.j, this.cor)) {
            score += pieceValue * 4;
        }

        // Desenvolvimento e atividade das peças
        if (['n', 'b', 'r', 'q'].includes(move.piece)) {
            score += this.centerControlBonus(toPos);
            
            const mobility = this.game.getValidMoves(toPos.i, toPos.j).length;
            score += mobility * 0.7;
        }

        // Estrutura de peões
        if (move.piece === 'p') {
            score += this.evaluatePawnStructure(move, fromPos, toPos);
        }

        // Ataque ao rei adversário
        if (this.isKingAttackPosition(toPos)) {
            score += 20;
        }

        // Simulação de uma jogada à frente
        const tempGame = new Game();
        tempGame.chessInstance.load(this.game.chessInstance.fen());
        tempGame.chessInstance.move({ from: move.from, to: move.to, promotion: 'q' });
        
        // Verificar se a peça pode ser capturada
        const opponentColor = this.cor === 'w' ? 'b' : 'w';
        if (tempGame.isSquareDangerous(toPos.i, toPos.j)) {
            score -= pieceValue * 6;
        }

        // Avaliação da posição resultante
        score += this.evaluatePosition(tempGame) * 0.8;

        // Penalizar movimentos repetitivos de torre
        if (move.piece === 'r') {
            const rookMoveCount = this.recentMoves.filter(m => m.from === move.from).length;
            score -= rookMoveCount * 4;
        }

        // Bônus por xeque
        if (this.moveGivesCheck(move)) {
            score += 15;
        }

        // Bônus por ameaças múltiplas
        score += this.countThreats(tempGame, toPos) * 5;

        return score;
    }

    private centerControlBonus(pos: CellPosition): number {
        const centerDistance = this.distanceFromCenter(pos);
        if (centerDistance < 2) return 5;
        if (centerDistance < 3) return 3;
        return 0;
    }

    private isKingAttackPosition(pos: CellPosition): boolean {
        const opponentKingPos = this.findOpponentKingPosition();
        if (!opponentKingPos) return false;
        
        const distance = Math.max(
            Math.abs(pos.i - opponentKingPos.i),
            Math.abs(pos.j - opponentKingPos.j)
        );
        return distance <= 2;
    }

    private findOpponentKingPosition(): CellPosition | null {
        const opponentColor = this.cor === 'w' ? 'b' : 'w';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.game.getPiece(i, j);
                if (piece && piece.type === 'k' && piece.color === opponentColor) {
                    return { i, j };
                }
            }
        }
        return null;
    }

    private evaluatePawnStructure(move: any, fromPos: CellPosition, toPos: CellPosition): number {
        let score = 0;
        
        if (this.game.isSquareDefended(toPos.i, toPos.j, this.cor)) {
            score += 2;
        }
        
        const adjacentFiles = [toPos.j - 1, toPos.j + 1].filter(j => j >= 0 && j < 8);
        for (const j of adjacentFiles) {
            const piece = this.game.getPiece(toPos.i, j);
            if (piece && piece.type === 'p' && piece.color === this.cor) {
                score += 3;
            }
        }
        
        return score;
    }

    private countThreats(game: Game, pos: CellPosition): number {
        let threats = 0;
        const moves = game.getValidMoves(pos.i, pos.j);
        
        for (const target of moves) {
            const piece = game.getPiece(target.i, target.j);
            if (piece && piece.color !== this.cor) {
                threats++;
            }
        }
        
        return threats;
    }

    private evaluatePosition(game: Game): number {
        let score = 0;
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = game.getPiece(i, j);
                if (piece) {
                    const value = this.pieceValues[piece.type as keyof typeof this.pieceValues];
                    score += piece.color === this.cor ? value : -value;
                }
            }
        }
        
        for (const square of this.centerSquares) {
            const pos = game.squareToCoords(square);
            if (game.isSquareDefended(pos.i, pos.j, this.cor)) {
                score += 0.7;
            }
        }
        
        return score;
    }

    private getValidMoves(): any[] {
        const validMoves: { from: string, to: string, piece: string, captured: string | null }[] = [];
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

    private moveGivesCheck(move: any): boolean {
        const tempGame = new Game();
        tempGame.chessInstance.load(this.game.chessInstance.fen());
        tempGame.chessInstance.move({ from: move.from, to: move.to, promotion: 'q' });
        return tempGame.chessInstance.isCheck();
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