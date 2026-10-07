/* NASSA GARAGE — dados do build
   ------------------------------------------------------------------
   Este é o ÚNICO lugar para atualizar os números do carro. Ficha
   técnica, relógios, blueprint, curva do dinamômetro e card da frota
   leem daqui. Depois de editar, é só subir este arquivo.

   O "diário do build" e a "lista de peças" aparecem sozinhos no site
   assim que tiverem pelo menos um item. Exemplos de formato:

   log: [
     { data: '2026-03-14', titulo: 'Downpipes e mapa Stage 2',
       texto: 'O que foi feito e por quê.',
       antes: '360 cv', depois: '420 cv' }        // antes/depois opcionais
   ]

   pecas: [
     { grupo: 'Motor', item: 'Downpipes sem catalisador', marca: 'VRSF' }
   ]
------------------------------------------------------------------ */
window.NASSA = {
  carro: {
    nome: 'BMW 335i',
    ano: 2010,
    chassi: 'E90 LCI',
    motor: 'N54B30',
    motorDesc: '3.0 R6 biturbo',
    potenciaCv: 420,
    torqueNm: 560,
    boostBar: 1.2,
    corteRpm: 7000,
    tracao: 'Traseira · RWD',
    estagio: 'Stage 2 · Podium',
    rodas: 'Style 359M · M Performance'
  },

  /* Curva do dinamômetro: pares [rpm, torque em Nm].
     A potência é calculada (cv = Nm × rpm ÷ 7127).
     fonte: 'estimada' enquanto não houver puxada real de banco;
     troque para 'banco' e cole os pontos medidos quando tiver. */
  dyno: {
    fonte: 'estimada',
    pontos: [
      [1000, 240], [1500, 370], [2000, 520], [2500, 560], [3000, 560],
      [3500, 560], [4000, 558], [4500, 552], [5000, 540], [5500, 530],
      [6000, 495], [6500, 455], [7000, 405]
    ]
  },

  log: [],
  pecas: []
};
