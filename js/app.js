const bleNusServiceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const bleNusCharRXUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const bleNusCharTXUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const MTU = 20;

// Inicialização de variáveis globais:
let bleDevice,
  bleServer,
  nusService,
  rxCharacteristic,
  txCharacteristic,
  connected = false,
  calc = 0,
  myChart,
  valorMaximo = 0,
  cont = 0,
  xlabel = [],
  ylabel = [],
  G = 9.81,
  RES_TO_CALC = 32768,
  SENSIBILIDADE = 2,
  FREQ = 3200,
  N_SAMP = 1024;

// setValueOfN_SAMP()
//
// Essa função é responsável por definir o valor da variável N_SAMP com base no valor
// digitado pelo usuário no campo de input. Sua chamada está associada a um evento
// onChange no elemento input.
function setValueOfN_SAMP() {
  let cmd_input = document.getElementById("data").value;
  switch (cmd_input) {
    case "FFTS6":
      N_SAMP = 2048;
      break;
    case "FFTS5":
      N_SAMP = 1024;
      break;
    case "FFTS4":
      N_SAMP = 512;
      break;
    case "FFTS3":
      N_SAMP = 256;
      break;
    case "FFTS2":
      N_SAMP = 128;
      break;
    case "FFTS1":
      N_SAMP = 64;
      break;
    default:
      N_SAMP = 64;
      alert("Valor digitado é inválido!");
      break;
  }
  console.log("N_SAMP: " + N_SAMP);
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
// Define o texto que será mostrado no botão Connect com base no estado da variável enabled.
function setConnButtonState(enabled) {
  if (enabled) {
    document.getElementById("clientConnectButton").innerHTML = "Disconnect";
  } else {
    document.getElementById("clientConnectButton").innerHTML = "Connect";
  }
}

// connect()
//
// Essa função é responsável por fazer a conexão do navegador com o sensor através
// do protocolo BLE.
function connect() {
  if (!navigator.bluetooth) {
    // Verifica a dispobilidade da função navigator.bluetooth...
    console.log(
      "WebBluetooth API is not available.\r\n" +
        "Please make sure the Web Bluetooth flag is enabled."
    );
    return undefined;
  }
  console.log("Requesting Bluetooth Device...");
  navigator.bluetooth
    .requestDevice({
      //filters: [{services: []}]
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
    return;
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
  // Convert raw data bytes to character values and use these to
  // construct a string.
  let str = "";
  let hex2dec = 0,
    primeiroByte,
    segundoByte,
    informacao;

  // Primeira string enviada indicando a função interna que está sendo executada
  if (value.byteLength == 13) {
    for (let i = 0; i < value.byteLength; i++) {
      str += String.fromCharCode(value.getUint8(i));
    }
    console.log(str);
  } else {
    // Outro valores passados pelo sensor
    console.log("value", value.buffer);
    /*
        if (ylabel.length <= (N_SAMP * 0.5)) { 
            for (let i = 0; i < (value.byteLength * 0.5); i++) {
                if (!(i % 2)) {
                    primeiroByte = value.getUint8(i).toString(16);
                } else {
                    segundoByte = value.getUint8(i).toString(16);
                    informacao = String(segundoByte) + String(primeiroByte);
                    hex2dec = parseInt(informacao, 16);
                    calc = parseFFTtoms2(hex2dec);
                    if (calc > valorMaximo) {
                        valorMaximo = calc;
                    }
                    ylabel.push(calc.toFixed(2));
                }
            }
        }
        */
  }

  /*
  if (ylabel.length >= N_SAMP * 0.5) {
    console.log("valorMaximo", valorMaximo);
    for (var aux = 0; aux < N_SAMP * 0.5; aux++) {
      xlabel.push((aux * (FREQ / N_SAMP)).toFixed(2));
    }
    if (myChart) myChart.destroy();
    console.log("xlabel", xlabel, "ylabel", ylabel);
    plotGraphics(xlabel, ylabel);
  }
  */
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

// parseFFTtoms2()
//
// Essa função é responsável por executar o cálculo que pega um valor do sensor
// no domínio da FFT e transforma em m/s^2.
function parseFFTtoms2(value) {
  return (value * G * SENSIBILIDADE) / RES_TO_CALC;
}

// plotGraphics()
//
// Essa função é responsável por plotar o gráfico do resultado da medição do sensor,
// usando o ChartJS.
function plotGraphics(xlabel, ylabel) {
  var ctx = document.getElementById("myChart").getContext("2d");
  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: xlabel,
      datasets: [
        {
          label: "aceleration",
          data: ylabel,
        },
      ],
    },
    options: {},
  });
  /*
    xlabel.length = 0;
    ylabel.length = 0;
    cont = 0;
    */
}
