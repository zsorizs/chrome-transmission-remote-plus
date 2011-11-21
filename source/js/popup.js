// global variables
var		torrents = []	// array of displayed torrents
	,	refresh			// variable that holds refreshPopup() timeout
	,	port = chrome.extension.connect({ name: 'popup' })
	;

const	TAG_BASELINE	= 1
	,	TAG_UPDATE		= 2
	,	TAG_TURTLE_MODE	= 3
	;
// search for an id in the torrents array
// returns: index or -1
Array.prototype.getTorrentById = function(id) {
	for (var i = this.length - 1; i >= 0; i--) {
		if (this[i].id === id) return i;
	}

	return -1;
};

// credit to: http://web.elctech.com/2009/01/06/convert-filesize-bytes-to-readable-string-in-javascript/
// modified to allow for 0 bytes and removed extraneous Math.floor
function formatBytes(bytes) {
	if (bytes < 1) return '0 bytes';

	var s = [ 'bytes', 'KB', 'MB', 'GB', 'TB', 'PB' ],
		e = Math.floor(Math.log(bytes) / Math.log(1024));

	if (e > 2) return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + s[e];

	return (bytes / Math.pow(1024, e)).toFixed(1) + ' ' + s[e];
}

// display seconds in a human readable format
function formatSeconds(seconds) {
	if (seconds < 1) return 'unknown time';

	var units = [ { 'seconds': 86400, 'label': 'days' }, { 'seconds': 3600, 'label': 'hr' }, { 'seconds': 60, 'label': 'min' }, { 'seconds': 1, 'label': 'seconds' } ],
		tmp, time;

	// loop through units and display a max of two consecutive units
	for (var i = 0, unit; unit = units[i]; ++i) {
		if (seconds > unit.seconds) {
			tmp = Math.floor(seconds / unit.seconds);
			time = tmp + ' ' + unit.label;
			seconds -= unit.seconds * tmp;

			if (i < (units.length - 1)) {
				tmp = Math.floor(seconds / units[i + 1].seconds);

				if (tmp > 0) time += ' ' + tmp + ' ' + units[i + 1].label;
			}

			return time;
		}
	}
}

// update the global stats
function updateStats(uTorrents) {
	var stats = [0, 0, 0]
	,	totalDownload = 0
	,	totalUpload = 0
	,	list					= $('#list')[0]
	,	status					= $('#status')[0]
	;

	// count how many of each status
	for (var i = 0, torrent; torrent = torrents[i]; ++i) {
		switch(torrent.status)
		{
		case 1: case 2: case 4:
			stats[0]++;
			break;
		case 8:
			stats[1]++;
			break;
		case 16:
			stats[2]++;
			break;
		}
	}

	// get the global speeds
	for (var i = 0, uTorrent; uTorrent = uTorrents[i]; ++i) {
		totalDownload += uTorrent.rateDownload;
		totalUpload += uTorrent.rateUpload;
	}

	// update the global status
	$('#global_torrents').html(torrents.length);
	$('#global_downloading').html(stats[0]);
	$('#global_seeding').html(stats[1]);
	$('#global_pausedcompleted').html(stats[2]);
	$('#global_downloadrate').html(formatBytes(totalDownload));
	$('#global_uploadrate').html(formatBytes(totalUpload));
}

// set the visibility of the no torrents status message
function setStatusVisibility() {
	if (list.hasChildNodes()) {
		$(status).hide();
		$(list).show();
	} else {
		$(status).show();
		$(list).hide();
	}
}

port.onMessage.addListener(function(msg) {
	switch(msg.tag) {
		case TAG_BASELINE:
			var uTorrents = msg.args.torrents.sort(function(a, b) { return b.addedDate - a.addedDate; });

			// add the torrent to the torrents array and set whether it's visible or not
			for (var i = 0, uTorrent; uTorrent = uTorrents[i]; ++i) {
				torrents[torrents.push(new Torrent()) - 1].createElem(uTorrent);
				torrents[i].filter();
			}

			setStatusVisibility();
			updateStats(uTorrents);
		break;
		case TAG_UPDATE:
			var rTorrents = msg.args.removed
			,	uTorrents = msg.args.torrents
			,	torrent
			;

			// remove torrents
			for (var i = 0, rTorrent; rTorrent = rTorrents[i]; ++i) {
				var torrent = torrents.getTorrentById(rTorrent);
				if (torrent > -1) {
					torrents.splice(torrent, 1)[0].removeElem();
				}
			}

			// add/update torrents
			for (var i = 0, uTorrent; uTorrent = uTorrents[i]; ++i) {
				var torrent = torrents.getTorrentById(uTorrent.id);
				if (torrent < 0) {		// new
					torrents.unshift(new Torrent());
					torrents[0].createElem(uTorrent);
					torrents[0].filter(0);
				} else {		// existing
					torrents[torrent].updateElem(uTorrent);
				}
			}

			setStatusVisibility();
			updateStats(uTorrents);
		break;
		case TAG_TURTLE_MODE:
			$('#turtle_button').toggleClass('on', !!msg.args['alt-speed-enabled']);
		break;
	}
});

// keep refreshing the torrent list
function refreshPopup() {
	port.postMessage({
		'args': '"fields": [ "id", "status", "name", "downloadDir", "metadataPercentComplete", "sizeWhenDone", "leftUntilDone", "eta", "rateDownload", "rateUpload", "uploadedEver", "addedDate", "doneDate", "recheckProgress" ], "ids": "recently-active"',
		'method': 'torrent-get',
		'tag': TAG_UPDATE
	});

	port.postMessage({ 'args': '', 'method': 'session-get', 'tag': TAG_TURTLE_MODE });

	refresh = setTimeout(refreshPopup, 3000);
}

(function() {
	// persistent torrent type dropdown and filter textbox
	$('#filter_type').val(localStorage.torrentType || 0);

	var filterValue = localStorage.torrentFilter || "";
	$('#filter_input').val(filterValue);
	$('#filter_clear').toggle(!!filterValue);

	// initial baseline of torrents, turtle mode, then start the refresh
	port.postMessage({
		'args': '"fields": [ "id", "status", "name", "downloadDir", "metadataPercentComplete", "sizeWhenDone", "leftUntilDone", "eta", "rateDownload", "rateUpload", "uploadedEver", "addedDate", "doneDate", "recheckProgress" ]',
		'method': 'torrent-get',
		'tag': TAG_BASELINE
	});

	port.postMessage({ 'args': '', 'method': 'session-get', 'tag': TAG_TURTLE_MODE });

	refresh = setTimeout(refreshPopup, 3000);
})();
