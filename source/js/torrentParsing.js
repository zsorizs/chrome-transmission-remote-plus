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
					case data[0] === "debug":
						console.debug(data[1]);
					break;
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

	reader.readAsBinaryString(new Blob([torrent], {type: "application/octet-stream"}));
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
	//callback(btoa(unescape(encodeURIComponent( file ))));
	var reader = new FileReader();

	reader.onload = function (e) {
		// assume base64 and just split to get data
		// data:[<MIME-type>][;charset=<encoding>][;base64],<data>
		var parts = reader.result.split(",", 2);
		callback(parts[1]);
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
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'blob';
	xhr.onload = function(e) {
		if (this.status == 200) {
			callback(this.response);
		}
	};
	xhr.send();
}
