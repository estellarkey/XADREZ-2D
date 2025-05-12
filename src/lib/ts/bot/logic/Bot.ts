// Bot.ts
import { Chess, Move } from 'chess.js';

export class Bot {
    private chess: Chess;
    private nivel: 'facil' | 'medio' | 'dificil';
    private cor: 'w' | 'b';

    constructor(chessInstance: Chess, nivel: 'facil' | 'medio' | 'dificil' = 'facil', cor: 'w' | 'b' = 'b') {
        this.chess = chessInstance;
        this.nivel = nivel;
        this.cor = cor;
    }

    // Método para definir o nível do bot
    setNivel(nivel: 'facil' | 'medio' | 'dificil'): void {
        this.nivel = nivel;
    }

    // Método para definir a cor do bot
    setCor(cor: 'w' | 'b'): void {
        this.cor = cor;
    }

    // Verifica se é a vez do bot jogar
    deveJogar(): boolean {
        return this.chess.turn() === this.cor;
    }

    // Método principal para fazer um movimento
    fazerMovimento(): Move | null {
        if (!this.deveJogar()) return null;

        switch (this.nivel) {
            case 'facil':
                return this.fazerMovimentoAleatorio();
            case 'medio':
                return this.fazerMovimentoMedio();
            case 'dificil':
                return this.fazerMovimentoDificil();
            default:
                return this.fazerMovimentoAleatorio();
        }
    }

    // Nível fácil: movimento aleatório
    private fazerMovimentoAleatorio(): Move | null {
        const movimentosValidos = this.chess.moves({ verbose: true });
        if (movimentosValidos.length === 0) return null;

        const movimentoAleatorio = movimentosValidos[Math.floor(Math.random() * movimentosValidos.length)];
        return this.chess.move(movimentoAleatorio);
    }

    // Nível médio: evita perder peças e captura quando possível
    private fazerMovimentoMedio(): Move | null {
        const movimentosValidos = this.chess.moves({ verbose: true });
        if (movimentosValidos.length === 0) return null;

        // Prioriza capturas
        const capturas = movimentosValidos.filter(m => m.captured);
        if (capturas.length > 0) {
            // Escolhe a captura mais valiosa (simplificado)
            return this.chess.move(capturas[Math.floor(Math.random() * capturas.length)]);
        }

        // Se não houver capturas, evita movimentos que deixam peças em perigo
        const movimentosSeguros = movimentosValidos.filter(m => {
            this.chess.move(m);
            const emXeque = this.chess.isCheck();
            this.chess.undo();
            return !emXeque;
        });

        const movimentosDisponiveis = movimentosSeguros.length > 0 ? movimentosSeguros : movimentosValidos;
        return this.chess.move(movimentosDisponiveis[Math.floor(Math.random() * movimentosDisponiveis.length)]);
    }

    // Nível difícil: usa avaliação básica de posição
    private fazerMovimentoDificil(): Move | null {
        const movimentosValidos = this.chess.moves({ verbose: true });
        if (movimentosValidos.length === 0) return null;

        // Avalia cada movimento possível
        const movimentosAvaliados = movimentosValidos.map(m => {
            this.chess.move(m);
            const avaliacao = this.avaliarPosicao();
            this.chess.undo();
            return { movimento: m, avaliacao };
        });

        // Ordena pelos melhores movimentos
        movimentosAvaliados.sort((a, b) => {
            return this.cor === 'w' ? b.avaliacao - a.avaliacao : a.avaliacao - b.avaliacao;
        });

        // Escolhe entre os 3 melhores movimentos
        const melhoresMovimentos = movimentosAvaliados.slice(0, 3);
        return this.chess.move(melhoresMovimentos[Math.floor(Math.random() * melhoresMovimentos.length)].movimento);
    }

    // Avaliação simplificada da posição
    private avaliarPosicao(): number {
        const pecas = this.chess.board().flat();
        let avaliacao = 0;

        const valoresPecas: Record<string, number> = {
            'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
        };

        for (const peca of pecas) {
            if (peca) {
                const valor = valoresPecas[peca.type];
                avaliacao += peca.color === 'w' ? valor : -valor;
            }
        }

        return avaliacao;
    }
}