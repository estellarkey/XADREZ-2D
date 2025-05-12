<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    let gameController;
  
    onMount(async () => {
      if (browser) {
        // Importa o módulo
        const module = await import('$lib/index');
        
        // Cria uma instância do GameController
        gameController = new module.GameController();
        
        // Força a atualização do componente
        // (não é necessário se você estiver usando reatividade)
      }
    });
  </script>
  
  <main>
    <div id="tabuleiro-container"></div>
  </main>
  