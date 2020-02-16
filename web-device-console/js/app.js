const bleNusServiceUUID  = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharRXUUID   = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const bleNusCharTXUUID   = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
// Não sei o que é isso ainda
const MTU = 20;

var bleDevice;
var bleServer;
var nusService;
var rxCharacteristic;
var txCharacteristic;

var connected = false;

let cont = 0,
    xlabel = [],
    ylabel = [];

// Esta função inicia a conexão ou termina dependendo do estado atual
function connectionToggle() {
    if (connected) {
        disconnect();
    } else {
        connect();
    }
    document.getElementById('terminal').focus();
}

// Define se o botão irá conectar ou desconectar
function setConnButtonState(enabled) {
    if (enabled) {
        document.getElementById("clientConnectButton").innerHTML = "Disconnect";
    } else {
        document.getElementById("clientConnectButton").innerHTML = "Connect";
    }
}

function connect() {
    // Verifica a dispobilidade da função navigator.bluetooth
    if (!navigator.bluetooth) {
        console.log('WebBluetooth API is not available.\r\n' +
                    'Please make sure the Web Bluetooth flag is enabled.');
        return;
    }

    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({
        //filters: [{services: []}]
        optionalServices: [bleNusServiceUUID],
        acceptAllDevices: true
    })
    .then(device => {
        bleDevice = device; 
        console.log('Found ' + device.name);
        console.log('Connecting to GATT Server...');
        bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(server => {
        console.log('Locate NUS service');
        return server.getPrimaryService(bleNusServiceUUID);
    }).then(service => {
        nusService = service;
        console.log('Found NUS service: ' + service.uuid);
    })
    .then(() => {
        console.log('Locate RX characteristic');
        return nusService.getCharacteristic(bleNusCharRXUUID);
    })
    .then(characteristic => {
        rxCharacteristic = characteristic;
        console.log('Found RX characteristic');
    })
    .then(() => {
        console.log('Locate TX characteristic');
        return nusService.getCharacteristic(bleNusCharTXUUID);
    })
    .then(characteristic => {
        txCharacteristic = characteristic;
        console.log('Found TX characteristic');
    })
    .then(() => {
        console.log('Enable notifications');
        return txCharacteristic.startNotifications();
    })
    .then(() => {
        console.log('Notifications started');
        txCharacteristic.addEventListener('characteristicvaluechanged',
                                          handleNotifications);
        connected = true;
        setConnButtonState(true);
    })
    .catch(error => {
        console.log('' + error);
        if(bleDevice && bleDevice.gatt.connected)
        {
            bleDevice.gatt.disconnect();
        }
    });
}

function disconnect() {
    if (!bleDevice) {
        console.log('No Bluetooth Device connected...');
        return;
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        connected = false;
        setConnButtonState(false);
        console.log('Bluetooth Device connected: ' + bleDevice.gatt.connected);
    } else {
        console.log('> Bluetooth Device is already disconnected');
    }
}

function onDisconnected() {
    connected = false;
    setConnButtonState(false);
}

function handleNotifications(event) {
    let value = event.target.value;
    // Convert raw data bytes to character values and use these to 
    // construct a string.
    let str = "";
    let aux = 0,
        hex2dec = 0,
        primeiroByte,
        segundoByte,
        informacao;

    console.log('value: ', value, '\n');

    // Primeira string enviada indicando a função interna que está sendo executada
    if (value.byteLength == 13) {

        for (let i = 0; i < value.byteLength; i++) {
            str += String.fromCharCode(value.getUint8(i));
        }
        console.log(str);

    } else {
        
        // Outro valores passados pelo sensor
        for (let i = 0; i < value.byteLength; i++) {

            if (!(i % 2)) {
                primeiroByte = value.getUint8(i);
                console.log('primeiro byte: ', primeiroByte);
            } else {
                segundoByte = value.getUint8(i);
                informacao = String(segundoByte) + String(primeiroByte);
                hex2dec = parseInt(informacao, 16);
                console.log('segundo byte: ', segundoByte);
                console.log('valores concatenados:', informacao);
                console.log('valor inteiro:', hex2dec);
                console.log('===================================================');
                xlabel.push(cont);
                ylabel.push(hex2dec);
                cont++;
            }

            if (xlabel.length > 1023) {
                //plotGraphics(xlabel, ylabel);
                // Salvar no banco de dados e resetar as variáveis
                xlabel.length = 0;
                ylabel.length = 0;
                cont = 0;
            }
    
        }

    }
    
}

function nusSendString() {
    let data = document.getElementById('data').value;
    console.log(data);
    if(bleDevice && bleDevice.gatt.connected) {
        console.log("send: " + data);
        let val_arr = new Uint8Array(data.length)
        for (let i = 0; i < data.length; i++) {
            let val = data[i].charCodeAt(0);
            val_arr[i] = val;
        }
        sendNextChunk(val_arr);
    } else {
        console.log('Not connected to a device yet.');
    }
}

function sendNextChunk(a) {
    let chunk = a.slice(0, MTU);
    rxCharacteristic.writeValue(chunk)
      .then(function() {
          if (a.length > MTU) {
              sendNextChunk(a.slice(MTU));
          }
      });
}





function plotGraphics(xlabel, ylabel) {
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: xlabel,
            datasets: [{
                label: '# of Votes',
                data: ylabel
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}