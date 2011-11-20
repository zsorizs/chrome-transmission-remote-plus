//chrome-extension://hniolkcjkcfecgnhgpmeddfhndceheci/popup.html

function Torrent() {

	const	TORRENT_ERROR		= -1
	,		TORRENT_WAIT_VERIFY	= 1
	,		TORRENT_VERIFING	= 2
	,		TORRENT_DOWNLOADING	= 4
	,		TORRENT_SEEDING		= 8
	,		TORRENT_PAUSED		= 16
	;

	var oPauseBtn
	,	oResumeBtn
	,	oRemoveBtn
	,	oProgress
	, 	oProgressBar
	,	oStats
	,	oSpeeds
	,	oRoot = $('<li></li>')
	;

	this.id = 0;
	this.name = '';
	this.status = 0;

	// send RPC for a torrent
	this.sendRPC = function(method, ctrlDown) {
		clearTimeout(refresh);

		var deleteCmd = (method === 'torrent-remove' && ctrlDown) ? ', "delete-local-data": true' : '';

		port.postMessage({ args: '"ids": [ ' + this.id + ' ]' + deleteCmd, method: method });

		refresh = setTimeout(refreshPopup, method === 'torrent-stop' ? 500 : 0);
	};

	// test the torrent name against the current filter and set whether it's visible or not
	this.filter = function() {
		var filter = !localStorage.torrentFilter
						? ''
						: new RegExp(localStorage.torrentFilter.replace(/ /g, '[^A-z0-9]*'), 'i')
		,	type = localStorage.torrentType || 0
		;

		if ((type == 0 || this.status == type) && this.name.search(filter) > -1) {
			$('#list').append(oRoot);
		} else {
			$('#list_hidden').append(oRoot);
		}
	};

	function adjustButtons(status) {
		oPauseBtn.toggle(status === TORRENT_DOWNLOADING || status === TORRENT_SEEDING);
		oResumeBtn.toggle(status === TORRENT_PAUSED);
	}

	function adjustLabels(props) {
		switch(props.status) {
			case TORRENT_WAIT_VERIFY:
				oStats.text(formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone)
							+ ' (' + percentDone.toFixed(2) + '%) - waiting to verify local data');
				oSpeeds.text('');
			break;
			case TORRENT_VERIFING:
				oStats.text(formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone)
							+ ' (' + percentDone.toFixed(2) + '%) - verifying local data (' + (props.recheckProgress * 100).toFixed() + '%)');
				oSpeeds.text('');
			break;
			case TORRENT_DOWNLOADING:
				if (props.metadataPercentComplete < 1) {
					oStats.text('Magnetized transfer - retrieving metadata (' + (props.metadataPercentComplete * 100).toFixed() + '%)');
					oSpeeds.text('');
					oProgressElem.attr('class', 'torrent_progress magnetizing');
				} else {
					oStats.text(formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone)
								+ ' (' + percentDone.toFixed(2) + '%) - ' + formatSeconds(props.eta) + ' remaining');
					oSpeeds.text('DL: ' + formatBytes(props.rateDownload) + '/s UL: ' + formatBytes(props.rateUpload) + '/s');
				}
			break;
			case TORRENT_SEEDING:
				oStats.text(formatBytes(props.sizeWhenDone) + ' - Seeding, uploaded ' + formatBytes(props.uploadedEver)
					+ ' (Ratio ' + (props.uploadedEver / props.sizeWhenDone).toFixed(2) + ')');
				oSpeeds.text('UL: ' + formatBytes(props.rateUpload) + '/s');
				oProgressBar.attr('class', 'seeding');
			break;
			case TORRENT_PAUSED:
				if (props.leftUntilDone) {
					oStats.text(formatBytes(props.sizeWhenDone - props.leftUntilDone) + ' of ' + formatBytes(props.sizeWhenDone) + ' (' + percentDone.toFixed(2) + '%) - Paused');
				} else {
					var done = (props.doneDate > 0) ? props.doneDate : props.addedDate;
					oStats.text(formatBytes(props.sizeWhenDone) + ' - Completed on ' + new Date(done * 1000).toLocaleDateString());
				}
				oSpeeds.text('');
				oProgressBar.attr('class', 'paused');
			break;
		}
	}

	function adjustProgress(percentDone) {
		if (percentDone === 100) {
			oProgressBar.attr('class', 'complete').css('width', percentDone + '%');
		} else if (percentDone > 0) {
			oProgressBar.attr('class', 'downloading').css('width', percentDone + '%');
		} else {
			oProgressBar.hide();
		}
	}

	// create the list element and update torrent properties
	this.createElem = function(props) {

		this.id = props.id || TORRENT_ERROR;
		this.name = props.name || TORRENT_ERROR;
		this.status = props.status || TORRENT_ERROR;

		var self = this;

		oName = $('<div>' + props.name + '</div>').attr({
				'class': 'torrent_name'
			,	'title': props.name + '\n\nDownloaded to: ' + props.downloadDir
		}).appendTo(oRoot);

		oStats = $('<div></div>').attr({
				'class': 'torrent_stats'
		}).appendTo(oRoot);

		oSpeeds = $('<div></div>').attr({
				'class': 'torrent_speeds'
		}).appendTo(oRoot);

		oProgress = $('<div></div>').attr({
				'class': 'torrent_progress'
		}).appendTo(oRoot);

		oProgressBar = $('<div></div>').appendTo(oProgress);

		oPauseBtn = $('<div></div>').attr({
				'class': 'torrent_button pause'
			,	'title': 'Pause'
		}).click(function(e) {
			self.sendRPC('torrent-stop');
		}).appendTo(oRoot);

		oResumeBtn = $('<div></div>').attr({
				'class': 'torrent_button resume'
			,	'title': 'Resume'
		}).click(function() {
			self.sendRPC('torrent-start');
		}).appendTo(oRoot);

		oRemoveBtn = $('<div></div>').attr({
				'name' : 'torrent_remove'
			,	'class': 'torrent_button remove'
			,	'title': 'Double-click to remove torrent\n\nHold down CTRL to also delete data'
		}).dblclick(function(e) {
			self.sendRPC('torrent-remove', e.ctrlKey);
		}).appendTo(oRoot);

		adjustProgress(100 - (props.leftUntilDone / props.sizeWhenDone * 100));
		adjustButtons(props.status);
		adjustLabels(props);
	};

	// update the list element and update torrent properties
	this.updateElem = function(props) {
		this.status = props.status || TORRENT_ERROR;

		oName.attr('title', props.name + '\n\nDownloaded to: ' + props.downloadDir);
		oProgress.attr('class', 'torrent_progress');

		adjustProgress(100 - (props.leftUntilDone / props.sizeWhenDone * 100));
		adjustButtons(props.status);
		adjustLabels(props);
	};

	// remove the list element for torrent
	this.removeElem = function() {
		oRoot.remove();
	};
}
