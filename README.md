# NASSA GARAGE — Site oficial

Site da Nassa Garage: builds documentadas com dados, ferramentas de cálculo e o BMW 335i E90 em 3D.
HTML + CSS + JavaScript puro, com Three.js para os modelos 3D.
Estrutura plana (todos os arquivos na raiz) para facilitar o upload no GitHub.

## Direção de design

Pôster de filme de motorsport: preto profundo, azul Estoril como único acento, tipografia
condensada gigante (Saira Condensed / Saira Extra Condensed), texto em Barlow e dados em
JetBrains Mono. Grão de filme por cima, movimento contido e revelações em cascata.

## Seções

1. Hero — emblema, título em pôster, chamadas para o build e para o FlowCalc
2. Sobre — manifesto da marca em três blocos
3. The Machine — 335i com ficha técnica e stats
4. Blueprint — o carro em wireframe 3D (montagem por peças; clique para remontar)
5. Components — roda 359M, motor N54 e twin turbo em 3D
6. Performance — relógios animados e curva de dinamômetro interativa (SVG)
7. FlowCalc — calculadora de injetores / potência teórica
8. A Frota — 335i, Fusca 86 e a próxima vaga
9. Acompanhe + rodapé

## Arquivos

- index.html — página principal
- style.css — estilos (tokens no topo do arquivo)
- main.js — preloader, nav, reveals, contadores, relógios, dyno, FlowCalc e 3D
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
