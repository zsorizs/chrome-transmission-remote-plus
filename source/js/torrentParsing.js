/*=================================================================================
 parseTorrent(file torrent, function callback)

 parses the torrent into a javascript object

 parameters
		 torrent: (required) a torrent file
		callback: (required) where to send he parsed torrent object

 returns
		nothing
=================================================================================*/
function parseTorrent(torrent, callback) {
	var reader = new FileReader();

	reader.onload = function (e) {
		var worker = new Worker('js/bencode.js');

		worker.onmessage = function(ev) {

			if (ev.data.split) {
				var data = ev.data.split(":");
				switch(true) {
					case data[0] === "debug": {
						console.debug(data[1]);
						break;
					}
					default : {
					}
				}
			} else {
				callback(ev.data);
			}
		};

		worker.onerror = function(event){
			throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
		};

		worker.postMessage(reader.result);
	};

	reader.readAsBinaryString(torrent);
}

/*=================================================================================
 encodeFile(file file, function callback)

 encodes a file into base64

 parameters
			file: (required) file
		callback: (required) where to send the base64 encoded file

 returns
		nothing
=================================================================================*/
function encodeFile(file, callback) {
	var reader = new FileReader();

	reader.onload = function (e) {
		callback(reader.result.replace('data:application/x-bittorrent;base64,', '').replace('data:base64,', ''));
	};

	reader.readAsDataURL(file);
}

/*=================================================================================
 getFile(string url, function callback)

 downloads a file

 parameters
			 url: (required) URL of the file to download and encode
		callback: (required) where to send the downloaded file

 returns
		nothing
=================================================================================*/
function getFile(url, callback) {
	//TODO: jquery 1.7 and earlier don't support responseType and arraybuffer
	//http://forum.jquery.com/topic/extending-ajax-addition-of-a-responsehandler
	var xhr = $.get(url, function(data) {
		//TODO: why 'parseerror' thrown here??
	}, 'dataview');

	xhr.complete(function(jqXHR, textStatus){
		var blob = new WebKitBlobBuilder();
		blob.append(jqXHR.responseText);
		callback(blob.getBlob());
	});
}
