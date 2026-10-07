# NASSA GARAGE — Site oficial

Site da Nassa Garage: builds documentadas com dados, ferramentas de cálculo e o BMW 335i E90 em 3D.
HTML, CSS e JavaScript puro. Three.js vem junto em `vendor/`, sem depender de CDN.

## Atualizar os números do carro

Tudo sai de **`data.js`**: ficha técnica, relógios, blueprint, card da frota e curva do dinamômetro.
Edite os valores lá e suba só esse arquivo.

- **Diário do build** (`log`) e **lista de peças** (`pecas`): começam vazios e aparecem sozinhos
  na seção O carro assim que tiverem um item. O formato está comentado no topo do arquivo.
- **Curva do dinamômetro** (`dyno.pontos`): pares de rpm e torque. Ao trocar por uma puxada real,
  mude `fonte` para `'banco'` e o texto do gráfico muda junto.

## Arquivos

| Arquivo | Função |
| --- | --- |
| `index.html` | Página principal |
| `flowcalc.html` | Ferramentas em tela cheia (aceita `#injetores`, `#pneus`, `#conversor`, `#datalog`) |
| `404.html` | Página de endereço não encontrado |
| `style.css` | Estilos, com os tokens de cor e fonte no topo |
| `data.js` | Dados do carro, diário do build e lista de peças |
| `main.js` | Preloader, nav, menu, reveals, contadores, relógios e dyno |
| `tools.js` | Injetores, pneus e marchas, conversor e leitor de datalog |
| `three-scene.js` | Blueprint e peças em 3D, carregado só perto da seção |
| `models/` | Modelos 3D comprimidos com Draco |
| `vendor/three/` | Three.js 0.169, GLTFLoader e decodificador Draco |
| `og.jpg` | Imagem de compartilhamento 1200 × 630 |
| `logo.png`, `favicon.png`, `apple-touch-icon.png`, `icon-*.png` | Identidade e ícones |
| `site.webmanifest`, `sitemap.xml`, `robots.txt` | Instalação no celular e SEO |

## Ao publicar uma atualização

Os arquivos de estilo e de script têm um número de versão no endereço, como `style.css?v=20261008`.
Sempre que mudar `style.css`, `main.js`, `tools.js`, `data.js` ou `three-scene.js`, troque esse número
em `index.html`, `flowcalc.html`, `404.html` e na linha do `import` em `main.js`. Assim nenhum
visitante fica com uma mistura de arquivos novos e antigos guardados no navegador.

## Rodar localmente

    python3 -m http.server   →   http://localhost:8000

Abrir o HTML com dois cliques não carrega o 3D.

## Publicar no GitHub Pages

Settings → Pages → Deploy from a branch → main / (root) → Save.

Depois de publicar, envie `https://gabrielnassa.github.io/nassagarage/sitemap.xml`
no Google Search Console. Se registrar um domínio próprio, crie um arquivo `CNAME`
com o domínio e troque os endereços `gabrielnassa.github.io/nassagarage` nas tags
de compartilhamento, no `sitemap.xml` e nos caminhos do `404.html`.

— Desenvolvido por Nassa Tech
