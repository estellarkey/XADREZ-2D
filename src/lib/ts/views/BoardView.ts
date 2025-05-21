import type { CellPosition } from '../models/types/ChessTypes';
import { AnimationService } from '../services/AnimationService';
import { PieceView } from './components/Piece';
import { Game } from '../models/Game';

export class BoardView {
    private _game: Game;

    constructor(game: Game) {
        this._game = game;
    }

    public async render(): Promise<void> {
        const boardHTML = this.generateBoard();
        const container = document.getElementById('tabuleiro-container');
        if (container) {
            container.innerHTML = boardHTML;
        }
    }

    private generateBoard(): string {
        let table = "<table id='tabuleiro'>";
        let isDark = false;
        
        for (let i = 0; i < 8; i++) {
            table += "<tr>";
            for (let j = 0; j < 8; j++) {   
                const piece = this._game.getPiece(i, j);
                const cellClass = isDark ? "dark" : "light";
                const conteudo = piece ? PieceView.createSvg(piece.id) : '';
                table += `
                   <td id='i${i}j${j}' class='chess-square ${cellClass}' onclick='window.handleChessClick(${i},${j})'>
                        ${conteudo}
                    </td>
                `;
                isDark = !isDark;
            }
            table += "</tr>";
            isDark = !isDark;
        }
        return table + "</table>";
    }
   
     public updateBoard(): void {
        const tabuleiro = document.getElementById('tabuleiro') as HTMLTableElement;
        if (!tabuleiro) return;

        const tabData = this._game.getBoard();
        const dangerZones = this._game.getDangerZones();
        const now = Date.now();

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const celula = tabuleiro.rows[i].cells[j];
                const idPiece = tabData[i][j];
                celula.innerHTML = idPiece !== null ? PieceView.createSvg(idPiece) : '';
                
                // Remove todas as classes de perigo anteriores
                celula.classList.remove(
                    'danger-zone', 
                    'new-danger-zone',
                    'danger-empty',
                    'danger-with-piece'
                );
                
                // Verifica se é uma zona de perigo
                const dangerZone = dangerZones.find(zone => 
                    zone.position.i === i && zone.position.j === j
                );
                
                if (dangerZone) {
                    const elapsed = now - dangerZone.timestamp;
                    const remainingTime = 10000 - elapsed; // 10 segundos total
                    
                    // Determina se a célula está vazia ou com peça
                    const isEmpty = idPiece === null;
                    
                    // Adiciona classe base
                    celula.classList.add('danger-zone');
                    
                    // Adiciona classe específica para célula vazia ou com peça
                    celula.classList.add(isEmpty ? 'danger-empty' : 'danger-with-piece');
                    
                    // Adiciona classe para novas zonas (primeiros 2 segundos)
                    if (elapsed < 2000) {
                        celula.classList.add('new-danger-zone');
                    }
                    
                    // Calcula intensidade baseada no tempo restante
                    const intensity = 0.3 + (0.7 * (remainingTime / 10000));    
                    celula.style.setProperty('--danger-intensity', intensity.toString());
                }
            }
        }
    }
    
   public highlightCell(i: number, j: number, color: string): void {
    const cell = document.getElementById(`i${i}j${j}`);
    if (cell) {
        // Substitua por borda ou outro indicador visual se desejar
        cell.style.boxShadow = color ? 'inset 0 0 10px rgba(0,0,0,0.5)' : 'none';
        // Remova completamente a linha que altera backgroundColor
    }
}

    public async showValidMoves(positions: CellPosition[]): Promise<void> {
        positions.forEach(pos => {
            const cell = document.getElementById(`i${pos.i}j${pos.j}`);
            if (cell) {
                const marker = document.createElement('div');
                marker.className = 'valid-move-marker';
                cell.appendChild(marker);
            }
        });
    }

    public async clearValidMoves(): Promise<void> {
        document.querySelectorAll('.valid-move-marker').forEach(marker => marker.remove());
    }

    public async animateMove(from: CellPosition, to: CellPosition): Promise<void> {
        const fromCell = document.getElementById(`i${from.i}j${from.j}`);
        const toCell = document.getElementById(`i${to.i}j${to.j}`);
        
        if (fromCell && toCell) {
            await AnimationService.animatePieceDirectly(fromCell, toCell);
        }
    }
}   