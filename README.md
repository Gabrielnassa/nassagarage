# NASSA GARAGE — Site oficial

Site da Nassa Garage: builds, ferramentas de cálculo e o BMW 335i E90 em 3D.
HTML + CSS + JavaScript puro, com Three.js para os modelos 3D.
Estrutura plana (todos os arquivos na raiz) para facilitar o upload no GitHub.

## Arquivos

- index.html — página principal
- style.css — estilos
- main.js — scripts (preloader, nav, 3D, montagem, relógios, FlowCalc)
- logo.png / favicon.png — identidade
- e90-parts.glb — o carro em 26 peças (animação de montagem)
- wheel-359m.glb / engine-n54.glb / turbo.glb — peças da seção Components
- flowcalc.html — FlowCalc como página avulsa

## Rodar localmente

python3 -m http.server  →  http://localhost:8000
(abrir com dois cliques não carrega os modelos 3D)

## Publicar no GitHub Pages

Settings → Pages → Deploy from a branch → main / (root) → Save

— Desenvolvido por Nassa Tech
