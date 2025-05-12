import { WebSocketServer } from 'ws';
import http from 'http';



// Cria servidor HTTP para lidar com requisições não-WebSocket
// @ts-ignore
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Servidor de xadrez multiplayer - Conecte via WebSocket');
});

const wss = new WebSocketServer({ 
    server,
    // @ts-ignore
    verifyClient: (info, done) => {
        // Permite todas as origens (apenas para desenvolvimento!)
        done(true);
    }
});
const rooms = {};

wss.on('connection', (ws) => {
    /**
     * @type {string | number | null}
     */
    let currentRoom = null;
    let playerColor = null;
    
    // Tratamento de erros
    ws.on('error', (error) => {
        console.error('Erro na conexão:', error);
    });

    ws.on('message', (message) => {
        try {
            const messageStr = message.toString();
            const data = JSON.parse(messageStr);
            
            if (!data.type) {
                throw new Error('Tipo de mensagem não especificado');
            }

            if (data.type === 'join') {
                handleJoin(ws, data);
            } else if (data.type === 'move') {
                handleMove(ws, data);
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Mensagem inválida'
            }));
        }
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });

    // Funções auxiliares
    /**
     * @param {import("ws").default} ws
     * @param {{ room: string; }} data
     */
    function handleJoin(ws, data) {
        const roomId = data.room || 'default';
        
        // @ts-ignore
        if (!rooms[roomId]) {
            // @ts-ignore
            rooms[roomId] = { players: [] };
        }
        
        // @ts-ignore
        const room = rooms[roomId];
        
        if (room.players.length >= 2) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Sala cheia'
            }));
            return;
        }
        
        room.players.push(ws);
        currentRoom = roomId;
        playerColor = room.players.length === 1 ? 'w' : 'b';
        
        ws.send(JSON.stringify({
            type: 'color',
            color: playerColor
        }));
        
        if (room.players.length === 2) {
            broadcast(room, { type: 'start' });
        }
    }

    /**
     * @param {import("ws").default | null | undefined} ws
     * @param {{ move: any; }} data
     */
    function handleMove(ws, data) {
        // @ts-ignore
        if (!currentRoom || !rooms[currentRoom]) return;
        
        // @ts-ignore
        const room = rooms[currentRoom];
        if (!data.move) {
            // @ts-ignore
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Movimento não especificado'
            }));
            return;
        }
        
        // Envia o movimento para todos na sala, exceto o remetente
        broadcast(room, {
            type: 'move',
            move: data.move  // Envia a notação completa (ex: "i1j2-i3j4")
        // @ts-ignore
        }, ws);
    }

    /**
     * @param {import("ws").default} ws
     */
    function handleDisconnect(ws) {
        // @ts-ignore
        if (!currentRoom || !rooms[currentRoom]) return;
        
        // @ts-ignore
        const room = rooms[currentRoom];
        room.players = room.players.filter((/** @type {any} */ p) => p !== ws);
        
        if (room.players.length === 1) {
            room.players[0].send(JSON.stringify({
                type: 'error',
                message: 'Oponente desconectado'
            }));
        } else if (room.players.length === 0) {
            // @ts-ignore
            delete rooms[currentRoom];
        }
    }

    /**
     * @param {{ players: any[]; }} room
     * @param {{ type: string; move?: any; }} message
     */
    function broadcast(room, message, excludeWs = null) {
        room.players.forEach((/** @type {{ readyState: number; send: (arg0: string) => void; } | null} */ player) => {
            if (player !== excludeWs && player.readyState === 1) {
                player.send(JSON.stringify(message));
            }
        });
    }
});

server.listen(8080, () => {
    console.log('Servidor rodando em http://localhost:8080');
});