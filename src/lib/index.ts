import { Interface } from './ts/components/Interface';
import { Montagem } from './ts/components/Assembly';
import { Bot } from './ts/bot/logic/Bot';

type GameMode = 'singleplayer' | 'hotseat' | 'online';
type OnlineStatus = 'disconnected' | 'waiting' | 'connected';

export class GameController {
    private casasValidas: { i: number; j: number }[] = [];
    private jogo: Interface;
    private montagem: Montagem;
    private bot: Bot | null = null;
    private selectedCell: { i: number, j: number } | null = null;
    private playerColor: 'w' | 'b' = 'w';
    private moveHistory: { white: string, black: string }[] = [];
    private currentMoveIndex: number = 0;
    private gameMode: GameMode = 'singleplayer';
    private onlineStatus: OnlineStatus = 'disconnected';
    private socket: WebSocket | null = null;
    private roomId: string | null = null;
    constructor() {
        // Primeiro inicializa a UI para criar os controles
        this.initializeUI();

        // Depois inicializa o jogo com as configurações padrão
        this.jogo = new Interface();
        this.montagem = new Montagem(this.jogo);
        this.bot = new Bot(this.jogo["chess"], 'facil', 'b');

        this.initializeGame();
    }

    private initializeUI(): void {
        if (!document.getElementById('game-controls')) {
            const controls = `
                    <div class="game-wrapper">
        <div class="game-container">
            <!-- Painel do Histórico -->
            <div class="history-panel">
                <h3>Histórico de Movimentos</h3>
                <div id="moves-list"></div>
                <div class="move-buttons">
                    <button id="undo-move" class="secondary">Desfazer</button>
                    <button id="redo-move" class="secondary">Refazer</button>
                </div>
            </div>

            <!-- Tabuleiro e Status -->
            <div class="board-container">
                <div class="game-status" id="game-status">Chess</div>
                <div id="tabuleiro-container"></div>
            </div>

            <!-- Painel de Controles -->
            <div class="control-panel">
                <div class="control-group">
                    <h4>Modo de Jogo</h4>
                    <select id="game-mode">
                        <option value="singleplayer">Singleplayer</option>
                        <option value="hotseat">Hotseat (2 jogadores)</option>
                        <option value="online">Online Multiplayer</option>
                    </select>
                </div>

                <div class="control-group" id="singleplayer-options">
                    <h4>Opções Singleplayer</h4>
                    <select id="bot-level">
                        <option value="facil">Fácil</option>
                        <option value="medio">Médio</option>
                        <option value="dificil">Difícil</option>
                    </select>
                    <select id="player-color">
                        <option value="w">Brancas</option>
                        <option value="b">Pretas</option>
                    </select>
                </div>

                <div class="control-group" id="online-options" style="display:none;">
                    <h4>Opções Online</h4>
                    <input type="text" id="room-id" placeholder="ID da Sala">
                    <button id="create-room" class="secondary">Criar Sala</button>
                    <button id="join-room" class="secondary">Entrar na Sala</button>
                    <div id="online-status">Desconectado</div>
                </div>

                <button id="start-game">Iniciar Jogo</button>
                <button id="restart-game" style="display:none;">Reiniciar Jogo</button>
            </div>
        </div>
    </div>
            `;

            const container = document.getElementById('tabuleiro-container');
            if (container) {
                container.insertAdjacentHTML('beforebegin', controls);

                // Event listeners
                document.getElementById('game-mode')?.addEventListener('change', (e) => this.onGameModeChange(e));
                document.getElementById('start-game')?.addEventListener('click', () => this.startGame());
                document.getElementById('restart-game')?.addEventListener('click', () => this.resetGame());
                document.getElementById('create-room')?.addEventListener('click', () => this.createRoom());
                document.getElementById('join-room')?.addEventListener('click', () => this.joinRoom());
            }
        }
    }

    private onGameModeChange(e: Event): void {
        const mode = (e.target as HTMLSelectElement).value as GameMode;
        this.gameMode = mode;

        const spOptions = document.getElementById('singleplayer-options') as HTMLElement;
        const onlineOptions = document.getElementById('online-options') as HTMLElement;

        if (mode === 'singleplayer') {
            spOptions.style.display = 'block';
            onlineOptions.style.display = 'none';
        } else if (mode === 'hotseat') {
            spOptions.style.display = 'none';
            onlineOptions.style.display = 'none';
        } else if (mode === 'online') {
            spOptions.style.display = 'none';
            onlineOptions.style.display = 'block';
        }
    }

    private undoMove(): void {
        if (this.currentMoveIndex >= 0) {
            // Implemente a lógica para desfazer o movimento
            // Você precisará modificar seu histórico de movimentos
            this.currentMoveIndex--;
            this.updateMoveHistory();
            this.resetGameToCurrentMove();
        }
    }

    private redoMove(): void {
        if (this.currentMoveIndex < this.moveHistory.length - 1) {
            // Implemente a lógica para refazer o movimento
            this.currentMoveIndex++;
            this.updateMoveHistory();
            this.resetGameToCurrentMove();
        }
    }

    private resetGameToCurrentMove(): void {
        // Reinicie o jogo e aplique todos os movimentos até currentMoveIndex
        this.resetGame();
        for (let i = 0; i <= this.currentMoveIndex; i++) {
            const move = this.moveHistory[i];
            // Aplique os movimentos brancos e pretos
        }
    }

    private createRoom(): void {
        this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        (document.getElementById('room-id') as HTMLInputElement).value = this.roomId;
        this.connectToServer();
    }

    private joinRoom(): void {
        this.roomId = (document.getElementById('room-id') as HTMLInputElement).value.trim();
        if (!this.roomId) {
            alert('Por favor, insira o ID da sala');
            return;
        }
        this.connectToServer();
    }

    private connectToServer(): void {

        this.socket = new WebSocket('ws://localhost:8080');

        this.socket.onopen = () => {
            this.updateOnlineStatus('waiting');
            this.socket?.send(JSON.stringify({
                type: 'join',
                room: this.roomId
            }));

            // Inicia o jogo imediatamente após conectar
            if (!document.getElementById('tabuleiro')) {
                this.startGame();
            }
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'color') {
                this.playerColor = data.color as 'w' | 'b';
                this.updateOnlineStatus('connected');
            }
            else if (data.type === 'move') {
                try {
                    const result = this.jogo.vitoria();
                    if (result) {
                        this.showGameResult(result);
                    }
                    // Processa o movimento recebido
                    const [from, to] = data.move.split('-');
                    const fromSquare = this.jogo.coordsToSquare(parseInt(from[1]), parseInt(from[3]));
                    const toSquare = this.jogo.coordsToSquare(parseInt(to[1]), parseInt(to[3]));

                    this.jogo["chess"].move({
                        from: fromSquare,
                        to: toSquare,
                        promotion: 'q'
                    });

                    this.montagem.atualizarJogo();

                } catch (e) {
                    console.error('Erro ao processar movimento:', e);
                }
            }
        };
    }

    private updateOnlineStatus(status: OnlineStatus): void {
        this.onlineStatus = status;
        const statusElement = document.getElementById('online-status') as HTMLElement;

        if (status === 'disconnected') {
            statusElement.textContent = 'Desconectado';
            statusElement.style.color = 'red';
        } else if (status === 'waiting') {
            statusElement.textContent = 'Aguardando oponente...';
            statusElement.style.color = 'orange';
        } else if (status === 'connected') {
            statusElement.textContent = `Conectado (${this.playerColor === 'w' ? 'Brancas' : 'Pretas'})`;
            statusElement.style.color = 'green';
        }
    }



    private updateGameControls(): void {
        const startBtn = document.getElementById('start-game') as HTMLButtonElement;
        const restartBtn = document.getElementById('restart-game') as HTMLButtonElement;

        startBtn.style.display = 'none';
        restartBtn.style.display = 'inline-block';
    }

    private resetGame(): void {
        this.resetSelection();
        this.jogo = new Interface();
        this.montagem = new Montagem(this.jogo);

        if (this.gameMode === 'singleplayer' && this.playerColor === 'b') {
            this.turnoBot();
        }

        this.renderBoard();
    }

    private initializeGame(): void {
        this.renderBoard();
        (window as any).select = (i: number, j: number) => this.handleCellClick(i, j);
    }

    private startGame(): void {
        // Limpa seleções anteriores
        this.resetSelection();

        // Configurações comuns
        this.jogo = new Interface();
        this.montagem = new Montagem(this.jogo);
        this.moveHistory = [];
        this.currentMoveIndex = 0;
        this.updateMoveHistory();

        // Configurações específicas por modo
        if (this.gameMode === 'singleplayer') {
            const levelSelect = document.getElementById('bot-level') as HTMLSelectElement;
            const colorSelect = document.getElementById('player-color') as HTMLSelectElement;

            const nivel = levelSelect.value as 'facil' | 'medio' | 'dificil';
            this.playerColor = colorSelect.value as 'w' | 'b';
            const botColor = this.playerColor === 'w' ? 'b' : 'w';

            this.bot = new Bot(this.jogo["chess"], nivel, botColor);

            // Se jogador escolheu pretas, o bot começa
            if (this.playerColor === 'b') {
                this.turnoBot();
            }
        } else if (this.gameMode === 'hotseat') {
            this.bot = null;
            this.playerColor = 'w'; // Primeiro jogador sempre brancas
        } else if (this.gameMode === 'online') {
            this.bot = null;
            // No modo online, o bot não é usado
            // A cor será definida pelo servidor quando a conexão for estabelecida
        }

        this.renderBoard();
        this.updateGameControls();
    }
    private renderBoard(): void {
        const container = document.getElementById('tabuleiro-container');
        if (container) {
            container.innerHTML = this.montagem.gerarTabuleiro();
        }
    }

    private handleCellClick(i: number, j: number): void {
        // Verifica se é a vez do jogador
        if (this.gameMode === 'online') {
            if ((this.jogo.vez === 'w' && this.playerColor !== 'w') ||
                (this.jogo.vez === 'b' && this.playerColor !== 'b')) {
                return;
            }
        } else if (this.gameMode === 'singleplayer') {
            if (this.jogo.vez !== this.playerColor) {
                return;
            }
        }

        // Restante do método permanece igual
        if (!this.selectedCell) {
            // Primeiro clique: seleciona peça
            const peca = this.jogo.getPeca(i, j);
            if (peca && peca.color === this.jogo.vez) {
                this.selectedCell = { i, j };
                this.highlightCell(i, j, "rgba(0, 0, 0, 0.4)");
                this.casasValidas = this.calcularCasasValidas(i, j);
                this.montagem.mostrarCasasValidas(this.casasValidas);
            }
        } else {
            // Segundo clique: move a peça
            if (this.casasValidas.some(casa => casa.i === i && casa.j === j)) {
                const fromI = this.selectedCell.i;
                const fromJ = this.selectedCell.j;

                this.montagem.animarMovimento(fromI, fromJ, i, j);

                setTimeout(() => {
                    if (this.jogo.moverPeca(fromI, fromJ, i, j)) {
                        const result = this.jogo.vitoria();
                        if (result) {
                            this.showGameResult(result);
                            return;
                        }

                        const moveNotation = this.jogo["chess"].history().slice(-1)[0];
                        this.recordMove(moveNotation);

                        if (this.gameMode === 'online') {
                            // Envia o movimento para o servidor no modo online
                            this.socket?.send(JSON.stringify({
                                type: 'move',
                                move: `i${fromI}j${fromJ}-i${i}j${j}`,
                                room: this.roomId
                            }));
                        } else if (this.gameMode === 'singleplayer') {
                            this.turnoBot();
                        }
                    }
                }, 300);

                this.resetSelection();
            } else {
                this.resetSelection();
            }
        }
    }

    private showGameResult(result: 'Branco' | 'Preto' | 'Empate'): void {
        let message = '';
        if (result === 'Empate') {
            message = 'O jogo terminou em empate!';
        } else {
            message = `Vitória do ${result}!`;
        }

        alert(message);
        this.resetGame();
    }
    private calcularCasasValidas(i: number, j: number): { i: number; j: number }[] {
        const casas: { i: number; j: number }[] = [];
        const square = this.jogo.coordsToSquare(i, j);
        const moves = this.jogo["chess"].moves({ square, verbose: true });

        moves.forEach((move: { to: any; }) => {
            const [toI, toJ] = this.jogo.squareToCoords(move.to);
            casas.push({ i: toI, j: toJ });
        });

        return casas;
    }
    private recordMove(moveNotation: string, isRemoteMove: boolean = false): void {
        // Se for um movimento remoto (do oponente), não adicione ao histórico diretamente
        if (isRemoteMove) return;

        const isWhiteMove = this.jogo["chess"].turn() === 'b'; // O turno mudou após o movimento

        if (isWhiteMove) {
            this.moveHistory.push({ white: moveNotation, black: '' });
            this.currentMoveIndex = this.moveHistory.length - 1;
        } else {
            if (this.moveHistory.length === 0) {
                this.moveHistory.push({ white: '', black: moveNotation });
            } else {
                this.moveHistory[this.currentMoveIndex].black = moveNotation;
            }
        }

        this.updateMoveHistory();
    }

    private updateMoveHistory(): void {
        const movesList = document.getElementById('moves-list');
        if (!movesList) return;

        // Limpa o conteúdo atual
        movesList.innerHTML = '';

        // Determina o índice de início para mostrar apenas os últimos 10 movimentos
        const startIndex = Math.max(0, this.moveHistory.length - 10);

        // Adiciona uma mensagem se houver movimentos ocultos
        if (this.moveHistory.length > 10) {
            const hiddenMoves = document.createElement('div');
            hiddenMoves.className = 'hidden-moves';
            hiddenMoves.textContent = `... ${this.moveHistory.length - 10} movimentos anteriores ...`;
            movesList.appendChild(hiddenMoves);
        }

        // Mostra apenas os últimos 10 movimentos
        for (let i = startIndex; i < this.moveHistory.length; i++) {
            const movePair = this.moveHistory[i];
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';

            const moveNumber = document.createElement('span');
            moveNumber.className = 'move-number';
            moveNumber.textContent = `${i + 1}.`;

            const whiteMove = document.createElement('span');
            whiteMove.className = 'white-move';
            whiteMove.textContent = movePair.white || '';

            const blackMove = document.createElement('span');
            blackMove.className = 'black-move';
            blackMove.textContent = movePair.black || '';

            moveEntry.appendChild(moveNumber);
            moveEntry.appendChild(whiteMove);
            if (movePair.black) {
                moveEntry.appendChild(blackMove);
            }

            movesList.appendChild(moveEntry);
        }

        // Adiciona estilos para a barra de rolagem quando necessário
        if (this.moveHistory.length > 10) {
            movesList.style.overflowY = 'auto';
            movesList.style.maxHeight = '300px'; // Ajuste conforme necessário
        } else {
            movesList.style.overflowY = 'visible';
            movesList.style.maxHeight = 'none';
        }

        // Rolagem automática para o final
        movesList.scrollTop = movesList.scrollHeight;
    }
    private turnoBot(): void {
        if (this.bot?.deveJogar()) {
            setTimeout(() => {
                const movimento = this.bot?.fazerMovimento();
                if (movimento) {
                    this.recordMove(movimento.san);
                    this.montagem.atualizarJogo();

                    const result = this.jogo.vitoria();
                    if (result) {
                        this.showGameResult(result);
                        return;
                    }
                }
            }, 500);
        }
    }
    private highlightCell(i: number, j: number, color: string): void {
        const cell = document.getElementById(`i${i}j${j}`);
        if (cell) cell.style.backgroundColor = color;
    }

    private resetSelection(): void {
        this.montagem.limparMarcadores();
        this.casasValidas = [];
        if (this.selectedCell) {
            this.highlightCell(this.selectedCell.i, this.selectedCell.j, "");
            this.selectedCell = null;
        }
    }
}


if (typeof document !== 'undefined') {
  // Inicia o jogo quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new GameController();
});
  }
