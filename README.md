# VTES Torneios

App web para gerenciar torneios de Vampire: The Eternal Struggle (VTES): jogadores, clãs, decklists,
mesas com ordem de assento (presa/predador), cronômetro com alarme e classificação — tudo salvo
localmente no aparelho (IndexedDB), sem depender de servidor.

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser público), por exemplo `vtes-torneios`.
2. Envie todos os arquivos desta pasta para a raiz do repositório (`index.html`, `app.js`,
   `manifest.webmanifest`, `sw.js`, os três `.png`).
3. No repositório, vá em **Settings → Pages**.
4. Em "Source", selecione a branch `main` (ou `master`) e a pasta `/ (root)`. Salve.
5. Aguarde 1-2 minutos. O GitHub vai te dar uma URL como:
   `https://SEU-USUARIO.github.io/vtes-torneios/`
6. Abra essa URL no celular — é a mesma app, agora com domínio próprio, manifest de verdade e
   cache offline básico (service worker).
7. Use essa URL no PWABuilder (pwabuilder.com) para gerar o `.apk` — como agora o manifest é um
   arquivo real hospedado (não mais embutido via data URI), a detecção automática deve funcionar
   sem precisar editar nada manualmente.

## Estrutura dos arquivos

- `index.html` — página principal
- `app.js` — toda a lógica do app
- `manifest.webmanifest` — manifesto PWA (nome, ícones, cores)
- `sw.js` — service worker (cache básico para uso offline)
- `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` — ícones do app
