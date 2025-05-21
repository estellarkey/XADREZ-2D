import { gsap } from 'gsap';

export class AnimationService {
    public static async animatePieceDirectly(
        fromCell: HTMLElement,
        toCell: HTMLElement
    ): Promise<void> {
        const piece = fromCell.querySelector('.piece') as HTMLElement;
        if (!piece) return;

        // Guarda o estado original da peça
        const originalParent = piece.parentElement;
        const originalStyles = {
            position: piece.style.position,
            top: piece.style.top,
            left: piece.style.left,
            width: piece.style.width,
            height: piece.style.height,
            zIndex: piece.style.zIndex,
            pointerEvents: piece.style.pointerEvents,
            transform: piece.style.transform
        };

        // Obtém o tamanho original da peça
        const pieceRect = piece.getBoundingClientRect();
        
        // Prepara a peça para animação
        const fromRect = fromCell.getBoundingClientRect();
        const toRect = toCell.getBoundingClientRect();
        
        // Calcula o offset para centralizar a peça na célula
        const offsetX = (fromRect.width - pieceRect.width) / 2;
        const offsetY = (fromRect.height - pieceRect.height) / 2;

        // Move a peça para o body temporariamente
        document.body.appendChild(piece);
        
        // Configuração inicial mantendo o tamanho original
        gsap.set(piece, {
            position: 'fixed',
            left: fromRect.left + offsetX,
            top: fromRect.top + offsetY,
            width: pieceRect.width,
            height: pieceRect.height,
            zIndex: 1000,
            pointerEvents: 'none',
            transform: 'none' // Remove qualquer transformação anterior
        });

        // Animação GSAP mantendo o tamanho
        await gsap.to(piece, {
            left: toRect.left + offsetX,
            top: toRect.top + offsetY,
            duration: 0.5,
            ease: 'power2.out'
        });

        // Restaura a peça ao estado original
        toCell.appendChild(piece);
        gsap.set(piece, {
            ...originalStyles,
            left: '',
            top: ''
        });
    }
}