import { Interface } from "./Interface";

export class Montagem {
    private jogo: Interface;
    private readonly pecaSvgIds = ["", "wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"];
    private readonly svgPath = "./assets/images/chessboard-sprite-staunty.svg";
    
    constructor(jogo: Interface) {
        this.jogo = jogo;
    }
    gerarTabuleiro() {
        let table = "<table id='tabuleiro'>";
        let isDark = false;
        for (let i = 0; i < 8; i++) {
            table += "<tr>";
            for (let j = 0; j < 8; j++) {
                const peca = this.jogo.getPeca(i, j);
                const cellClass = isDark ? "dark" : "light";
                const conteudo = peca ? this.criarSvgPeca(peca.id) : "";
                table += `
                    <td id='i${i}j${j}' class='chess-square ${cellClass}' onclick='select(${i},${j})'>
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

    // Mostra marcadores nas casas válidas
    mostrarCasasValidas(casas: { i: number; j: number }[]): void {
        this.limparMarcadores(); // Remove marcadores antigos

        casas.forEach(({ i, j }) => {
            const celula = document.getElementById(`i${i}j${j}`);
            if (celula) {
                const marcador = document.createElement("div");
                marcador.className = "marcador-valido";
                celula.appendChild(marcador);
            }
        });
    }

    limparMarcadores(): void {
        document.querySelectorAll(".marcador-valido").forEach(m => m.remove());
    }

    animarMovimento(fromI: number, fromJ: number, toI: number, toJ: number): void {
        const fromCell = document.getElementById(`i${fromI}j${fromJ}`);
        const toCell = document.getElementById(`i${toI}j${toJ}`);
        
        if (!fromCell || !toCell) return;
      
        // Calcula a diferença de posição
        const fromRect = fromCell.getBoundingClientRect();
        const toRect = toCell.getBoundingClientRect();
        const dx = fromRect.left - toRect.left;
        const dy = fromRect.top - toRect.top;
      
        // Clona a peça para animar
        const piece = fromCell.querySelector('.peca');
        if (!piece) return;
        
        const animatedPiece = piece.cloneNode(true) as HTMLElement;
        animatedPiece.classList.add('chess-move-animation');
        
        // Aplica variação aleatória
        this.applyRandomMovement(animatedPiece, dx, dy);
      
        // Posiciona a peça animada
        document.body.appendChild(animatedPiece);
        animatedPiece.style.position = 'absolute';
        animatedPiece.style.left = `${fromRect.left}px`;
        animatedPiece.style.top = `${fromRect.top}px`;
      
        // Remove após animação
        animatedPiece.addEventListener('animationend', () => {
          animatedPiece.remove();
          // Atualiza a peça no destino
          toCell.innerHTML = fromCell.innerHTML;
          fromCell.innerHTML = '';
        });
      }

       applyRandomMovement(element: any, dx: any, dy:any) {
        const randX = Math.random();
        const randY = Math.random();
        
        element.style.setProperty('--dx', `${dx}px`);
        element.style.setProperty('--dy', `${dy}px`);
        element.style.setProperty('--rand-x', randX);
        element.style.setProperty('--rand-y', randY);
      }
      

    atualizarJogo(): void {
        const tabuleiro = document.getElementById('tabuleiro') as HTMLTableElement;
        if (!tabuleiro) return;
    
        const tabData = this.jogo.getTabuleiro();
    
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const celula = tabuleiro.rows[i].cells[j];
                const idPeca = tabData[i][j];
                celula.innerHTML = idPeca !== null ? this.criarSvgPeca(idPeca) : "";
            }
        }
    }

    public criarSvgPeca(idPeca: number): string {
        const idSvg = this.pecaSvgIds[idPeca];
        return `
            <svg id="peca-${idPeca}" width="40" height="40" viewBox="0 0 45 45">
                <use xlink:href="${this.svgPath}#${idSvg}" transform="scale(0.78) translate(9, 7)" />
            </svg>
        `;
    }
}