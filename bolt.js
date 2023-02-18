devChar = null;
dev = null;
writeChar=function(cn, buffer){
	const encoder = new TextEncoder('utf-8');
	const userDescription = encoder.encode(buffer.padEnd(18));
	return devChar.writeValue(userDescription);
};

function handleError(errStr){
	var errorH2 = document.getElementById('error');
	console.log("Error: " + errStr);
	if(errorH2){
		errorH2.hidden = false;
		errorH2.innerText = errStr;
	}
	
	var loader = document.getElementById('loader');
	
	if (loader) {
		loader.hidden = true;
	}
}

function clearError(){
	var errorH2 = document.getElementById('error');
	if(errorH2){
		errorH2.hidden = true;
	}
}

function onDisconnect(){
	console.log("Disconnected");
	document.getElementById("toggle").checked = false;
}

window.connect = function(){
	var ColorPicker = require('simple-color-picker');
	const colorPicker = new ColorPicker();
	var loader = document.getElementById('loader');
	
	if (loader) {
		loader.hidden = false;
	}
	console.log('Requesting Bluetooth Device...');
	navigator.bluetooth.requestDevice({
	  filters: [
		{ services: ["0000fff0-0000-1000-8000-00805f9b34fb"] },
		{ name: "MFBOLT" }
	  ],
	})
	.then(device => {
		console.log(`Connected to device: ${device.name}`);
		device.ongattserverdisconnected = onDisconnect;
		dev = device;
		console.log('Connecting to GATT Server...');
		return device.gatt.connect();
	})
	.then(server => {
		console.log('Getting Service...');
		return server.getPrimaryService("0000fff0-0000-1000-8000-00805f9b34fb");
	})
	.then(service => {
		console.log('Getting Characteristic...');
		return service.getCharacteristic(0xfff1);
	})
	.then(characteristic => {
		if (loader){
			loader.hidden = true;
		}
		console.log('> Characteristic UUID:  ' + characteristic.uuid);
		console.log('> Broadcast:            ' + characteristic.properties.broadcast);
		console.log('> Read:                 ' + characteristic.properties.read);
		console.log('> Write w/o response:   ' +
		  characteristic.properties.writeWithoutResponse);
		console.log('> Write:                ' + characteristic.properties.write);
		console.log('> Notify:               ' + characteristic.properties.notify);
		console.log('> Indicate:             ' + characteristic.properties.indicate);
		console.log('> Signed Write:         ' +
		  characteristic.properties.authenticatedSignedWrites);
		console.log('> Queued Write:         ' + characteristic.properties.reliableWrite);
		console.log('> Writable Auxiliaries: ' +
		  characteristic.properties.writableAuxiliaries);
		devChar  = characteristic ;
		document.getElementById("toggle").checked = true;
		clearError();
	  })
  .catch(error => {
    handleError(error);
  });
}

window.init_picker = function(){
	var changeColorLock = false;
	
	document.getElementById("toggle").addEventListener("change",function() {
		if(this.checked == true){
			// Hold the toggle until device is connected
			this.checked = false;
			clearError();
			connect();
		}
		else{
			// Disconnect from device
			dev.gatt.disconnect();
		}
	});
	
	const AColorPicker = require('a-color-picker');
	 AColorPicker.from('.picker')
	.on('change', (picker, color) => {
		// If no set color action is active
		if(!changeColorLock){
			changeColorLock = true;
			var col = color.substring(4,).slice(0, -1).replaceAll(' ', '');
			var lum = col.split(',')
			// Determine the luminance, https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
			lum = Math.round((Number(lum[0])*0.2126 + Number(lum[1])*0.7152 + Number(lum[2])*0.0722)/255*100);
			console.log("Setting the color to: " + color + ", luminance: " + lum);
			if (devChar == null || !dev.gatt.connected){
				console.log("No device connected");
				changeColorLock = false;
			}
			else {
				writeChar("0000fff1-0000-1000-8000-00805f9b34fb", col+",100").then(_ => {
					changeColorLock = false;
				});
			}
		}
	})
}
