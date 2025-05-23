<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";

    // Variáveis do jogo de xadrez
    let gameController;
    let thoughtText: HTMLDivElement;

    const chessThoughts = [
        "Cuidado com a zona de perigo!",
        "O bispo domina a diagonal!",
        "Proteja seu rei a todo custo!",
        "Cavalos atacam em L!",
        "Controle o centro do tabuleiro!",
        "Não subestime os peões!",
        "Roque para segurança do rei!",
        "A rainha é a peça mais poderosa!",
    ];

    // Variáveis do player de música
    const musicas = [
        {
            titulo: "Elementos do Fogo e Água",
            src: "./music/Lauv - Steal The Show (From ＂Elemental＂).mp3",
        },
        {
            titulo: "God is Good",
            src: "./music/Forrest Frank - GOD IS GOOD (Official Lyric Video).mp3",
        },
        {
            titulo: "Free mind",
            src: "./music/Tems - Free Mind.mp3",
        },
        {
            titulo: "Nós Dois - Pedro Valença",
            src: "./music/Pedro Valença - Nós Dois (Vídeo Oficial).mp3",
        },
        {
            titulo: "Best Part",
            src: "./music/Daniel Caesar & H.E.R. - Best Part, a Visual.mp3",
        },
    ];

    let musicaAtual = 0;
    let isDragging = false;
    let startAngle = 0;
    let currentRotation = 0;
    let lastAngle = 0;
    let rotationVelocity = 0;
    let lastTimestamp = 0;
    let autoRotationInterval: string | number | NodeJS.Timeout | undefined;
    let isPlaying = false;
    let totalRotation = 0;
    let rotationSinceLastChange = 0;
    let player: HTMLAudioElement | null;
    let disco: HTMLElement;
    let musicaTitulo: HTMLElement | null;

    // Funções do player de música
    function carregarMusica() {
        if (player && musicaTitulo) {
            player.src = musicas[musicaAtual].src;
            musicaTitulo.textContent = musicas[musicaAtual].titulo;
            player
                .play()
                .then(() => {
                    isPlaying = true;
                    iniciarRotacaoAutomatica();
                })
                .catch((e) => console.log("Autoplay prevented:", e));
        }
    }

    function proximaMusica() {
        musicaAtual = (musicaAtual + 1) % musicas.length;
        carregarMusica();
        currentRotation += 72;

        if (disco) {
            disco.style.transform = `rotate(${currentRotation}deg)`;
        }

        rotationSinceLastChange = 0;
    }

    function musicaAnterior() {
        musicaAtual = (musicaAtual - 1 + musicas.length) % musicas.length;
        carregarMusica();
        currentRotation -= 72;
        disco.style.transform = `rotate(${currentRotation}deg)`;
        rotationSinceLastChange = 0;
    }

    function togglePlayPause() {
        if (isPlaying) {
            if (player) {
                player.pause();
            }
            clearInterval(autoRotationInterval);
        } else {
            if (player) {
                player.play();
            }
            iniciarRotacaoAutomatica();
        }
        isPlaying = !isPlaying;
    }

    function iniciarRotacaoAutomatica() {
        clearInterval(autoRotationInterval);
        autoRotationInterval = setInterval(() => {
            if (!isDragging && isPlaying) {
                currentRotation += 0.3;
                disco.style.transform = `rotate(${currentRotation}deg)`;
            }
        }, 30);
    }

    function setupPlayer() {
        if (!browser) return;

        disco = document.getElementById("disco") as HTMLElement;
        player = document.getElementById("player") as HTMLAudioElement;
        musicaTitulo = document.getElementById("musica-titulo");

        // Event listeners do player
        if (disco) {
            disco.addEventListener("mousedown", (e) => {
                isDragging = true;
                const rect = disco.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                startAngle =
                    (Math.atan2(e.clientY - centerY, e.clientX - centerX) *
                        180) /
                    Math.PI;
                lastAngle = startAngle;
                lastTimestamp = performance.now();
                rotationSinceLastChange = 0;
                e.preventDefault();
            });
        }

        document.addEventListener("mousemove", (e) => {
            if (!isDragging || !disco) return;

            const rect = disco.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle =
                (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) /
                Math.PI;

            const deltaAngle = angle - lastAngle;

            if (deltaAngle > 180) {
                lastAngle += 360;
            } else if (deltaAngle < -180) {
                lastAngle -= 360;
            }

            const now = performance.now();
            const deltaTime = now - lastTimestamp;

            if (deltaTime > 0) {
                rotationVelocity = (angle - lastAngle) / deltaTime;
                lastAngle = angle;
                lastTimestamp = now;
            }

            const rotationDelta = angle - startAngle;
            currentRotation += rotationDelta;
            rotationSinceLastChange += rotationDelta;
            startAngle = angle;

            disco.style.transform = `rotate(${currentRotation}deg)`;

            if (Math.abs(rotationSinceLastChange) > 60) {
                if (rotationSinceLastChange > 0) {
                    proximaMusica();
                } else {
                    musicaAnterior();
                }
            }
        });

        document.addEventListener("mouseup", (e) => {
            if (!isDragging) return;
            isDragging = false;

            if (Math.abs(rotationSinceLastChange) <= 60 && !isPlaying) {
                togglePlayPause();
            }

            if (isPlaying) {
                iniciarRotacaoAutomatica();
            }
        });

        if (disco) {
            disco.addEventListener("click", (e) => {
                if (!isDragging || Math.abs(rotationSinceLastChange) < 5) {
                    togglePlayPause();
                }
            });
        }

        if (player) {
            player.addEventListener("ended", () => {
                proximaMusica();
            });
        }

        // Inicia a primeira música
        carregarMusica();
    }

    // Funções do jogo de xadrez
    function changeThought() {
        const randomIndex = Math.floor(Math.random() * chessThoughts.length);
        if (thoughtText) {
            thoughtText.textContent = chessThoughts[randomIndex];
        }
        setTimeout(changeThought, 8000);
    }

    onMount(async () => {
        if (browser) {
            // Inicializa o jogo de xadrez
            const module = await import("$lib/ts/controllers/GameController");
            gameController = new module.GameController();

            // Inicia o ciclo de mudança de pensamento
            setTimeout(changeThought, 8000);

            // Inicializa o player de música
            setupPlayer();
        }
    });
</script>

<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css"
/>
<!-- Font Awesome -->
<link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
/>
<!--contoles do chess-->
<div class="chess-app">
    <div class="chess-main-container">
        <div class="chess-content-wrapper">
            <!-- Área do tabuleiro e movimentos -->
            <div class="chess-board-area">
                <!-- Lista de movimentos horizontal -->
                <div class="chess-board-area2">
                    <div class="moves-container">
                        <div class="moves-scroll-wrapper">
                            <div
                                id="moves-list"
                                class="moves-list-horizontal"
                            ></div>
                        </div>
                    </div>
                </div>
                <!-- Tabuleiro com coordenadas -->
                <div class="board-with-coordinates">
                <div class="vertical-coordinates">
                {#each Array.from({ length: 8 }, (_, i) => 8 - i) as number}
                    <div>{number}</div>
                {/each}
                </div>

                    <div class="board-wrapper">
                        <div id="tabuleiro-container"></div>
                    </div>
                </div>

                <div class="horizontal-coordinates">
                    <div>a</div>
                    <div>b</div>
                    <div>c</div>
                    <div>d</div>
                    <div>e</div>
                    <div>f</div>
                    <div>g</div>
                    <div>h</div>
                </div>
            </div>

            <!-- Controles no lado direito -->
            <div class="chess-controls">
                <div class="control-group">
                    <label for="bot-level"
                        ><i class="fas fa-robot"></i> Nível</label
                    >
                    <select id="bot-level">
                        <option value="facil">Fácil</option>
                        <option value="medio">Médio</option>
                        <option value="dificil">Difícil</option>
                    </select>
                </div>

                <div class="control-group">
                    <label for="player-color"
                        ><i class="fas fa-chess"></i> Jogar como</label
                    >
                    <select id="player-color">
                        <option value="w">Brancas</option>
                        <option value="b">Pretas</option>
                    </select>
                </div>

                <div class="action-buttons">
                    <button id="start-game" class="chess-btn primary">
                        <i class="fas fa-play"></i> Iniciar
                    </button>
                    <button id="restart-game" class="chess-btn secondary">
                        <i class="fas fa-redo"></i> Reiniciar
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!--robô-->

<div class="robot">
    <div class="thought-bubble">
        <div class="thought-text" bind:this={thoughtText}>
            Cuidado com a zona de perigo!
        </div>
    </div>
    <div class="face">
        <div class="eyes">
            <div class="eye"></div>
            <div class="eye"></div>
        </div>
        <div class="mouth"></div>
    </div>
    <div class="arms">
        <div class="arm left"></div>
        <div class="arm right"></div>
    </div>
    <div class="body"></div>
    <div class="shadow"></div>
</div>
<!--Disco-->

<div class="disco-container">
    <div class="indicador"></div>
    <div class="disco" id="disco">
        <div class="disco-centro"></div>
    </div>
    <div class="info">
        <div class="titulo" id="musica-titulo">Elementos do Fogo e Água</div>
    </div>
</div>

<audio id="player" loop></audio>
