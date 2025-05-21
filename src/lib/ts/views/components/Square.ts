export class SquareView {
    public static create(i: number, j: number, content: string = ''): string {
        const isDark = (i + j) % 2 !== 0;
        const cellClass = isDark ? 'red' : 'light';
        return `
            <td id='i${i}j${j}' class='chess-square ${cellClass}' onclick='select(${i},${j})'>
                ${content}
            </td>
        `;
    }
}