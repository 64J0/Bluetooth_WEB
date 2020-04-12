/**
 * Esse arquivo é usado para mostrar como o layout irá ficar quando o sistema receber
 * um conjunto de dados do sensor. Portanto deve ser usado apenas para projetar a
 * interface de usuário (UI).
 */

"use strict";

//const payload = require('./payload.js'); // -> Não funciona
//import payload from './payload.js'; //-> Não funciona

// A solução adotada foi copiar o JSON que seria exportado de um arquivo externo e copiar
// seu conteúdo para essa função. Solução nada elegante...
const arquivoJson = {
  payload:
    "F80AFC0C360285053602D00434023F0547028506500211095B020F0FB702C12D6744CF2B68018F0EC2017308D101BD05E1011304F401A702F50102011602C9040E0AF509B301D804D1019703D601F902D101AB02D6018802DD01C302D801C9056E087504EF01B901E1014401E2010B01DC01EB00D201DA00CE01CF00C8010C01F4024D01D701DF00CD01CB00C801C400C601C900BB01CE00B101E2009801D5016104E901E1012901CC010D01BB010301B801FD00B301EF00B101D400A6015200BC023102AF019B01A50183019E017C0199017F019601800193018E018E01CD01340147017E016E017601780177018101700187016F018F0167019A016001D801F4017401600184015901890155018E014F018C014B019301470198014601AC0131018701310191012E0192012801900128019101210194011C0196011701B2010C0167010A0178010701790100017601FC007701F5007201F0006D01EA0065010A017201E4006401DD006101D8005B01D0005701CC004E01C6004A01C2004501B0003D01B3003501AD002F01AB002801A50022019E00190198001501950011018300F9008500F9008000F3007B00EB007500E4007000D9006800D3006500C6005300C6005500BF005200B5004C00AD004400A70040009F0039009800350092002C008C0028008600220082001D007E0016007A00100077000D0076000600760000000DFF8001EAFEE900F1FE730141FFEF00E6FE6D0148FFEF00D9FE670145FFED00CFFE5F0140FFEE00C2FE550138FFE800BBFE4A0133FFEA00B0FE1C0128FFEC000EFFA7010EFFD30087FE660114FFD2007FFE53010BFFCF0077FE4C01FDFEC5006BFE4501F3FEBE0061FE4301E0FEB10053FE4E01C1FEA30041FEA4013AFE50FF37FD3F00F4FFB80050FEBB0044FFA5003CFEC80022FF990034FECC0010FF8C002AFED00009FF7E0022FEDF000BFF7A0011FE00010CFF6F00FCFDD90140FFF2009AFB9CFE80FE4C003CFEC8FFC2FE420023FEF2FFCAFE340017FEFCFFCEFE27000EFEF6FFD2FE1D000DFEF3FFCBFE15000AFEFAFFB6FE080002FE3C0057FE18FF2AFD0BFF73FFE6FF16FE64FF17FFD6FF13FE64FF06FFC8FF13FE5BFFF9FEBCFF0FFE48FFE5FEB3FF0FFE33FFB1FE9EFF17FE29FF36FE7EFF15FE49FF9DFBDAF87AFD58FE5704C1FF25FE78FE62019BFF2CFE54FEF5008BFF3AFE27FEE60085FF46FEEBFDFD0079FF48FE7AFD40016EFF57FEA8FCE0016EFF76FE52F9850460052E060F0301FD32FF45FE4EFFF8FF3CFF64FE4CFEDB0037FF6EFE79FDA4013EFF84FE8DFC910237FF9CFE1EFB220437FFB2FEEFF7A50760FFF2FECBE876185F2724233B1721E59CFE54FE5007C0F6D2FE8EFE370435FADCFE9AFEDF02ADFBE1FEABFE2F026CFCE2FEC9FEFD01B9FCDFFED3FE61026BFCE0FEE0FE2F06B3F8",
  G: 9.81,
  CNT_RESOLUCAO: 32768,
  SENSIBILIDADE: 2,
  FREQ: 3200,
  N_SAMP: 512,
};

const { payload, G, CNT_RESOLUCAO, SENSIBILIDADE, FREQ, N_SAMP } = arquivoJson;

// Fórmula para calcular a aceleração em m/s^2:
// hexToDecimal(CDAB) * G * SENSIBILIDADE / CNT_RESOLUCAO

// Variáveis globais
let x = [],
  y = [],
  byte1 = null,
  byte2 = null,
  byteCerto = [],
  resultado = 0,
  myChart;

function calcAceleracao() {
  // Ajusta a ordem dos valores enviados pelo sensor
  for (let cont = 0, len = payload.length; cont < len; cont += 4) {
    byte2 = String(payload[cont]) + String(payload[cont + 1]);
    byte1 = String(payload[cont + 2]) + String(payload[cont + 3]);
    byteCerto.push(String(byte1) + String(byte2));
    byte1 = null;
    byte2 = null;
  }

  // Faz os cálculos com os valores certos dos bytes
  for (let cont = 0, len = byteCerto.length * 0.5; cont < len; cont++) {
    resultado =
      parseInt(byteCerto[cont], 16) * G * (SENSIBILIDADE / CNT_RESOLUCAO);
    y.push(resultado.toFixed(4));
    // Arredonda os valores em X para duas casas decimais.
    x.push((cont * (FREQ / N_SAMP)).toFixed(2));
  }

  plotData(x, y);
}

function plotData(x, y) {
  var ctx = document.getElementById("myChart").getContext("2d");
  myChart = new Chart(ctx, {
    // O tipo do gráfico que será criado
    type: "line",

    // Os dados do nosso conjunto (dataset)
    data: {
      // Eixo X
      labels: x,
      // Valores do eixo Y (pode ser mais que um, por isso o array)
      datasets: [
        {
          label: "m/(s²)",
          backgroundColor: "rgba(28, 167, 45, 0.8)",
          data: y,
          fill: true,
        },
      ],
    },

    // Outras opções
    options: {
      /* O balão que abre pra informar as coordenadas do ponto no 
      gráfico quando o usuário chega o mouse muito perto de algum 
      desses pontos. Neste caso foi configurado para mostrar apenas 
      uma informação, levando em consideração apenas o ponto mais 
      próximo do cursor do usuário. */
      tooltips: {
        mode: "nearest",
      },
      // Legenda dos valores em Y
      legend: {
        position: "top",
        labels: {
          fontSize: 14,
        },
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Frequência em Hz",
              fontSize: 14,
            },
          },
        ],
      },
      // Título do canvas
      title: {
        display: true,
        text: "Aceleração",
        fontSize: 18,
      },
    },
  });
}

calcAceleracao();
