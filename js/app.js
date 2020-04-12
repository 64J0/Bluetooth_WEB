"use strict";

// Valores característicos do serviço BLE -> Constantes
const bleNusServiceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const bleNusCharRXUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const bleNusCharTXUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const MTU = 20;

// Variáveis Globais:
// Variáveis do sensor/API do google
let bleDevice,
  bleServer,
  nusService,
  rxCharacteristic,
  txCharacteristic,
  connected = false;

// Variável resultado da medição do sensor;
let stringHexadecimal;

// Variáveis a serem plotadas
let x = [],
  y = [],
  byte1 = null,
  byte2 = null,
  byteCerto = [],
  resultado = 0,
  myChart = null;

// Variáveis dos cálculos
let G = 9.81,
  CNT_RESOLUCAO = 32768,
  SENSIBILIDADE = 2,
  FREQ = 3200,
  N_SAMP;

// setValueOfN_SAMP()
//
// Essa função é responsável por definir o valor da variável N_SAMP com base no valor
// digitado pelo usuário no campo de input. Sua chamada está associada a um evento
// onChange no elemento input.
function setValueOfN_SAMP() {
  let cmd_input = document.getElementById("data").value;
  switch (cmd_input) {
    case "FFTS6":
      N_SAMP = 2048 * 0.5;
      break;
    case "FFTS5":
      N_SAMP = 1024 * 0.5;
      break;
    case "FFTS4":
      N_SAMP = 512 * 0.5;
      break;
    case "FFTS3":
      N_SAMP = 256 * 0.5;
      break;
    case "FFTS2":
      N_SAMP = 128 * 0.5;
      break;
    case "FFTS1":
      N_SAMP = 64 * 0.5;
      break;
    default:
      N_SAMP = 64 * 0.5;
      alert("Valor digitado é inválido!");
      break;
  }
  stringHexadecimal = "";
  console.log("Número de samples: " + N_SAMP);
}

// connectionToggle()
//
// Essa função inicia a conexão ou termina dependendo do estado atual da variável connected.
function connectionToggle() {
  if (connected) {
    disconnect();
  } else {
    connect();
  }
  document.getElementById("terminal").focus();
}

// setConnButtonState()
//
// Define o texto que será mostrado no botão Connect com base no estado do parâmetro enabled.
function setConnButtonState(enabled) {
  if (enabled) {
    document.getElementById("clientConnectButton").innerHTML = "Desconectar";
  } else {
    document.getElementById("clientConnectButton").innerHTML = "Conectar";
  }
}

// connect()
//
// Essa função é responsável por fazer a conexão do navegador com o sensor através
// do protocolo BLE.
function connect() {
  // Verifica a dispobilidade da função navigator.bluetooth...
  if (!navigator.bluetooth) {
    console.log(
      "WebBluetooth API is not available.\r\n" +
        "Please make sure the Web Bluetooth flag is enabled."
    );
    return null;
  }
  console.log("Requesting Bluetooth Device...");
  navigator.bluetooth
    .requestDevice({
      // Sem filtros!
      // filters: [{services: []}]
      optionalServices: [bleNusServiceUUID],
      acceptAllDevices: true,
    })
    .then((device) => {
      bleDevice = device;
      console.log("Found " + device.name);
      console.log("Connecting to GATT Server...");
      bleDevice.addEventListener("gattserverdisconnected", onDisconnected);
      return device.gatt.connect();
    })
    .then((server) => {
      console.log("Locate NUS service");
      return server.getPrimaryService(bleNusServiceUUID);
    })
    .then((service) => {
      nusService = service;
      console.log("Found NUS service: " + service.uuid);
    })
    .then(() => {
      console.log("Locate RX characteristic");
      return nusService.getCharacteristic(bleNusCharRXUUID);
    })
    .then((characteristic) => {
      rxCharacteristic = characteristic;
      console.log("Found RX characteristic");
    })
    .then(() => {
      console.log("Locate TX characteristic");
      return nusService.getCharacteristic(bleNusCharTXUUID);
    })
    .then((characteristic) => {
      txCharacteristic = characteristic;
      console.log("Found TX characteristic");
    })
    .then(() => {
      console.log("Enable notifications");
      return txCharacteristic.startNotifications();
    })
    .then(() => {
      console.log("Notifications started");
      txCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleNotifications
      );
      connected = true;
      setConnButtonState(true);
    })
    .catch((error) => {
      console.log("" + error);
      if (bleDevice && bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
      }
    });
}

// disconnect()
//
// Essa função é responsável por desconectar o sensor.
function disconnect() {
  if (!bleDevice) {
    console.log("No Bluetooth Device connected...");
    return null;
  }
  console.log("Disconnecting from Bluetooth Device...");
  if (bleDevice.gatt.connected) {
    bleDevice.gatt.disconnect();
    connected = false;
    setConnButtonState(false);
    console.log("Bluetooth Device connected: " + bleDevice.gatt.connected);
  } else {
    console.log("> Bluetooth Device is already disconnected");
  }
}

// onDisconnected()
//
// Essa função é responsável por atualizar os estados das variáveis que definem quando
// o usuário está conectado ou não
function onDisconnected() {
  connected = false;
  setConnButtonState(false);
}

// handleNotification()
//
// Essa função lida com os pacotes que são enviados para o sensor e a resposta deste.
function handleNotifications(event) {
  let value = event.target.value;
  let str = "",
    str_hex = "";

  // Primeira string enviada pelo sensor indica qual função será executada
  // internamente, e tem um comprimento de 13 bytes. Nesse caso, a será
  // mostrado no console do navegador esses dados.
  str =
    String.fromCharCode(value.getUint8(0)) +
    String.fromCharCode(value.getUint8(1)) +
    String.fromCharCode(value.getUint8(2));
  if (str === "FFT") {
    str = "";
    for (let i = 0; i < value.byteLength; i++) {
      str += String.fromCharCode(value.getUint8(i));
    }
    console.log(str);
  } else {
    // Armazenar o comprimento de um vetor em uma variável na instrução for
    // otimiza essa instrução.
    // Os outros pacotes vem sempre em um conjunto de 20 bytes, menos o último
    // que terá o tamanho conforme a necessidade
    for (let i = 0, len = value.byteLength; i < len; i++) {
      str_hex = value.getUint8(i).toString(16);
      // Verifica o tamanho do valor hexadecimal.
      if (str_hex.length < 2) {
        str_hex = "0" + str_hex;
      }
      stringHexadecimal += str_hex;
      if (stringHexadecimal.length === N_SAMP * 8) {
        console.log(stringHexadecimal.length);
        hexToDec(stringHexadecimal);
        stringHexadecimal = "";
      }
    }
  }
}

// hexToDex()
//
// Essa função é utilizada para transformar os valores hexadecimais em valores
// decimais em m/s^2
function hexToDec(payload) {
  x = [];
  y = [];
  byteCerto = [];
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

// nusSendString()
//
// Essa função é responsável por enviar o conteúdo do elemento input para o sensor
// através do protocolo Nordic Uart.
function nusSendString() {
  let data = document.getElementById("data").value;
  console.log(data);
  if (bleDevice && bleDevice.gatt.connected) {
    console.log("send: " + data);
    let val_arr = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      let val = data[i].charCodeAt(0);
      val_arr[i] = val;
    }
    sendNextChunk(val_arr);
  } else {
    console.log("Not connected to a device yet.");
  }
}

// sendNextChunk()
//
// Envia o próximo pedaço da mensagem.
function sendNextChunk(a) {
  let chunk = a.slice(0, MTU);
  rxCharacteristic.writeValue(chunk).then(function () {
    if (a.length > MTU) {
      sendNextChunk(a.slice(MTU));
    }
  });
}

// plotData()
//
// Essa função é responsável por plotar o gráfico do resultado da medição do sensor,
// usando o ChartJS.
function plotData(x, y) {
  var ctx = document.getElementById("myChart").getContext("2d");
  if (myChart) {
    myChart.destroy();
  }
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
