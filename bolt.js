devChar = null;
dev = null;
colorPicker = null;

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
	document.getElementById("toggle").checked = false;
	document.getElementById("button-connect").textContent = "Connect";
	document.getElementById("button-connect").style.backgroundImage = "linear-gradient(to bottom right, #fcd34d, #ef4444, #ec4899)";
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
	document.getElementById("button-connect").textContent = "Connect";
	document.getElementById("button-connect").style.backgroundImage = "linear-gradient(to bottom right, #fcd34d, #ef4444, #ec4899)";
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
		document.getElementById("button-connect").textContent = "Disconnect";
		document.getElementById("button-connect").style.backgroundImage = "linear-gradient(to right top, #051937, #004d7a, #008793, #00bf72, #a8eb12)";
		clearError();
	  })
  .catch(error => {
    handleError(error);
  });
}

window.init_picker = function(){
	var changeColorLock = false;
	document.getElementById("button-connect").checked = false;
	
	document.getElementById("button-connect").addEventListener("click",function() {
		if(this.checked == false){
			// Connect
			this.checked = true;
			clearError();
			connect();
		}
		else{
			// Disconnect
			this.checked = false;
			dev.gatt.disconnect();
		}
	});
	
	document.getElementById("toggle").addEventListener("change",function() {
		if (devChar == null || !dev.gatt.connected){
			console.log("No device connected");
			changeColorLock = false;
		}
		else {
			changeColorLock = true;
			if(this.checked == true){
				// Turn on
				var col = colorPicker.rgb.join(",");
				var lum = col.split(',')
				document.getElementById("curtain").style.backgroundImage = "linear-gradient(to right top, #BDBDBD, rgb("+col+"))";
				writeChar("0000fff1-0000-1000-8000-00805f9b34fb", col+",100").then(_ => {
					changeColorLock = false;
				});
			}
			else{
				// Turn off
				writeChar("0000fff1-0000-1000-8000-00805f9b34fb", ",,,0").then(_ => {
					changeColorLock = false;
				});
			}

		}
	});
	
	const AColorPicker = require('a-color-picker');
	console.log(AColorPicker);
	
	var picker = AColorPicker.from('.picker')
	colorPicker = picker[0];
	picker.on('change', (picker, color) => {
		// If no set color action is active
		if(!changeColorLock){
			changeColorLock = true;
			var col = color.substring(4,).slice(0, -1).replaceAll(' ', '');
			document.getElementById("curtain").style.backgroundImage = "linear-gradient(to right top, #BDBDBD, rgb("+col+"))";

			console.log("Setting the color to: " + color);
			if (devChar == null || !dev.gatt.connected){
				console.log("No device connected");
				changeColorLock = false;
			}
			else {
				writeChar("0000fff1-0000-1000-8000-00805f9b34fb", col+",100").then(_ => {
					changeColorLock = false;
					this.checked = false;
				});
			}
		}
	})
}
