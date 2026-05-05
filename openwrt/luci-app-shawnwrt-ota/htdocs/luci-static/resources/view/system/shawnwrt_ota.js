'use strict';
'require view';
'require fs';
'require ui';

var zh = (document.documentElement.getAttribute('lang') || navigator.language || '').toLowerCase().indexOf('zh') === 0;

var L = {
	title: zh ? '系统更新' : _('Software Update'),
	subtitle: zh ? '让你的 ShawnWrt 保持最新状态。' : _('Keep your ShawnWrt up to date.'),
	checking: zh ? '正在检查更新...' : _('Checking for updates...'),
	upToDate: zh ? '您的系统已是最新版本' : _('Your system is up to date'),
	updateAvailable: zh ? '发现新版本' : _('Update Available'),
	version: zh ? '版本' : _('Version'),
	installedVersion: zh ? '当前版本' : _('Installed'),
	latestVersion: zh ? '最新版本' : _('Latest'),
	checkedAt: zh ? '上次检查时间：' : _('Last checked: '),
	downloadAndInstall: zh ? '立即更新' : _('Update Now'),
	installing: zh ? '正在更新...' : _('Updating...'),
	downloading: zh ? '正在下载固件...' : _('Downloading firmware...'),
	verifying: zh ? '正在校验与测试...' : _('Verifying and testing...'),
	rebooting: zh ? '即将重启' : _('Rebooting shortly'),
	error: zh ? '更新失败' : _('Update Failed'),
	log: zh ? '详细日志' : _('Details'),
	close: zh ? '关闭' : _('Close'),
	needCheck: zh ? '尚未检查更新' : _('Check needed'),
	checkNow: zh ? '检查更新' : _('Check for Update'),
	rebootWarning: zh ? '更新过程中网络会短暂中断，完成后路由器将自动重启。' : _('Network will disconnect briefly. The router will reboot automatically after completion.')
};

function runOta(args) {
	return fs.exec('/usr/bin/shawnwrt-ota', args).then(function(res) {
		return { ok: true, stdout: (res.stdout || '').trim(), stderr: (res.stderr || '').trim(), code: res.code };
	}).catch(function(err) {
		return { ok: false, stdout: (err.stdout || '').trim(), stderr: (err.stderr || err.message || '').trim(), code: err.code };
	});
}

function parseInfo(text) {
	var info = {};
	(text || '').split(/\n/).forEach(function(line) {
		var pos = line.indexOf('=');
		if (pos > 0) info[line.slice(0, pos)] = line.slice(pos + 1);
	});
	return info;
}

return view.extend({
	load: function() {
		return Promise.all([
			runOta(['board']),
			runOta(['status'])
		]);
	},

	render: function(data) {
		var self = this;
		var board = data[0].stdout || 'unknown';
		var statusInfo = parseInfo(data[1].stdout);
		
		var container = E('div', { 'class': 'swrt-ota-container' });
		
		// CSS Styles
		var style = E('style', {}, [`
			.swrt-ota-container {
				max-width: 800px;
				margin: 1rem auto;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			}
			.swrt-ota-header {
				margin-bottom: 2rem;
				text-align: center;
			}
			.swrt-ota-header h2 {
				font-size: 2.2rem;
				font-weight: 700;
				margin: 0;
				background: linear-gradient(135deg, #222 0%, #666 100%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			}
			.swrt-ota-header p {
				color: #888;
				font-size: 1.1rem;
				margin-top: 0.5rem;
			}
			.swrt-ota-card {
				background: rgba(255, 255, 255, 0.7);
				backdrop-filter: blur(20px);
				-webkit-backdrop-filter: blur(20px);
				border-radius: 24px;
				padding: 2.5rem;
				box-shadow: 0 10px 40px rgba(0,0,0,0.06);
				border: 1px solid rgba(255, 255, 255, 0.8);
				display: flex;
				flex-direction: column;
				align-items: center;
				transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
			}
			@media (prefers-color-scheme: dark) {
				.swrt-ota-header h2 { background: linear-gradient(135deg, #fff 0%, #aaa 100%); -webkit-background-clip: text; }
				.swrt-ota-card { background: rgba(30, 30, 40, 0.6); border-color: rgba(255, 255, 255, 0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
			}
			.swrt-ota-icon {
				width: 80px;
				height: 80px;
				background: linear-gradient(135deg, #007aff 0%, #0051af 100%);
				border-radius: 20px;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-bottom: 1.5rem;
				box-shadow: 0 8px 20px rgba(0,122,255,0.3);
			}
			.swrt-ota-icon svg { width: 44px; height: 44px; fill: white; }
			
			.swrt-ota-status-text { font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem; text-align: center; }
			
			.swrt-ota-versions {
				display: flex;
				gap: 3rem;
				margin-bottom: 2rem;
				width: 100%;
				justify-content: center;
			}
			.swrt-ota-ver-item { text-align: center; }
			.swrt-ota-ver-label { font-size: 0.85rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem; }
			.swrt-ota-ver-val { font-size: 1.1rem; font-weight: 500; font-family: ui-monospace, monospace; }

			.swrt-ota-btn {
				background: #007aff;
				color: white !important;
				border: none;
				padding: 12px 36px;
				border-radius: 100px;
				font-size: 1.05rem;
				font-weight: 600;
				cursor: pointer;
				transition: all 0.2s;
				box-shadow: 0 4px 15px rgba(0,122,255,0.25);
			}
			.swrt-ota-btn:hover { transform: scale(1.03); background: #0084ff; box-shadow: 0 6px 20px rgba(0,122,255,0.35); }
			.swrt-ota-btn:active { transform: scale(0.98); }
			.swrt-ota-btn:disabled { background: #ccc; box-shadow: none; cursor: not-allowed; }

			.swrt-ota-progress-wrap { width: 100%; max-width: 400px; margin-top: 1.5rem; display: none; }
			.swrt-ota-progress-bar { height: 8px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 0.6rem; }
			@media (prefers-color-scheme: dark) { .swrt-ota-progress-bar { background: rgba(255,255,255,0.1); } }
			.swrt-ota-progress-inner { height: 100%; background: #007aff; width: 0%; transition: width 0.3s ease; }
			.swrt-ota-progress-text { font-size: 0.9rem; color: #888; text-align: center; }

			.swrt-ota-footer { margin-top: 1.5rem; font-size: 0.85rem; color: #999; text-align: center; }
			.swrt-ota-log-btn { background: none; border: none; color: #007aff; cursor: pointer; padding: 0.5rem; text-decoration: none; }
			.swrt-ota-log-btn:hover { text-decoration: underline; }

			.spinning { animation: spin 1s linear infinite; }
			@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
			
			.pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
			@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
		`]);

		var iconUpdate = '<svg viewBox="0 0 24 24"><path d="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15V18M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z"/></svg>';
		var iconCheck = '<svg viewBox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>';
		
		var statusText = E('div', { 'class': 'swrt-ota-status-text' }, [L.checking]);
		var iconWrap = E('div', { 'class': 'swrt-ota-icon pulse' }, [E('div', { 'innerHTML': iconUpdate })]);
		
		var installedVerVal = E('div', { 'class': 'swrt-ota-ver-val' }, [statusInfo.INSTALLED_TAG || '...']);
		var latestVerVal = E('div', { 'class': 'swrt-ota-ver-val' }, [statusInfo.CLOUD_TAG || '...']);
		
		var progressWrap = E('div', { 'class': 'swrt-ota-progress-wrap' }, [
			E('div', { 'class': 'swrt-ota-progress-bar' }, [
				E('div', { 'class': 'swrt-ota-progress-inner' })
			]),
			E('div', { 'class': 'swrt-ota-progress-text' }, ['0%'])
		]);

		var actionBtn = E('button', { 'class': 'swrt-ota-btn', 'disabled': 'true' }, [L.checking]);
		
		var footerText = E('div', { 'class': 'swrt-ota-footer' }, [
			statusInfo.CHECKED_AT ? (L.checkedAt + statusInfo.CHECKED_AT) : '',
			E('br'),
			E('button', { 'class': 'swrt-ota-log-btn', 'click': showLog }, [L.log])
		]);

		var card = E('div', { 'class': 'swrt-ota-card' }, [
			iconWrap,
			statusText,
			E('div', { 'class': 'swrt-ota-versions' }, [
				E('div', { 'class': 'swrt-ota-ver-item' }, [
					E('div', { 'class': 'swrt-ota-ver-label' }, [L.installedVersion]),
					installedVerVal
				]),
				E('div', { 'class': 'swrt-ota-ver-item' }, [
					E('div', { 'class': 'swrt-ota-ver-label' }, [L.latestVersion]),
					latestVerVal
				])
			]),
			actionBtn,
			progressWrap,
			footerText
		]);

		container.append(style, 
			E('div', { 'class': 'swrt-ota-header' }, [
				E('h2', [L.title]),
				E('p', [L.subtitle])
			]),
			card
		);

		function updateUI(info) {
			var state = info.STATE;
			installedVerVal.textContent = info.INSTALLED_TAG || 'Unknown';
			latestVerVal.textContent = info.CLOUD_TAG || '---';
			
			if (state === 'current') {
				statusText.textContent = L.upToDate;
				iconWrap.classList.remove('pulse');
				iconWrap.innerHTML = iconCheck;
				iconWrap.style.background = 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)';
				iconWrap.style.boxShadow = '0 8px 20px rgba(40,167,69,0.3)';
				actionBtn.textContent = L.checkNow;
				actionBtn.disabled = false;
				actionBtn.onclick = function() { startCheck(); };
			} else if (state === 'update') {
				statusText.textContent = L.updateAvailable;
				iconWrap.classList.add('pulse');
				iconWrap.innerHTML = iconUpdate;
				iconWrap.style.background = 'linear-gradient(135deg, #007aff 0%, #0051af 100%)';
				actionBtn.textContent = L.downloadAndInstall;
				actionBtn.disabled = false;
				actionBtn.onclick = function() { confirmInstall(); };
			} else if (state === 'need_check') {
				statusText.textContent = L.needCheck;
				actionBtn.textContent = L.checkNow;
				actionBtn.disabled = false;
				actionBtn.onclick = function() { startCheck(); };
			} else if (state === 'pending') {
				statusText.textContent = L.rebooting;
				actionBtn.style.display = 'none';
			}
			
			if (info.CHECKED_AT) {
				footerText.firstChild.textContent = L.checkedAt + info.CHECKED_AT;
			}
		}

		function startCheck() {
			actionBtn.disabled = true;
			actionBtn.textContent = L.checking;
			runOta(['start', 'check']).then(function() {
				pollJob();
			});
		}

		function confirmInstall() {
			ui.showModal(L.downloadAndInstall, [
				E('p', [L.rebootWarning]),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'btn', 'click': ui.hideModal }, [L.close]),
					' ',
					E('button', { 'class': 'btn cbi-button-negative', 'click': function() {
						ui.hideModal();
						startInstall();
					}}, [L.downloadAndInstall])
				])
			]);
		}

		function startInstall() {
			actionBtn.style.display = 'none';
			progressWrap.style.display = 'block';
			statusText.textContent = L.downloading;
			runOta(['start', 'all']).then(function() {
				pollJob();
			});
		}

		function pollJob() {
			runOta(['job-status']).then(function(res) {
				var job = parseInfo(res.stdout);
				var running = job.JOB_RUNNING === '1';
				var cmd = job.JOB_COMMAND;
				var progress = parseInt(job.JOB_PROGRESS || '0');
				var exitCode = job.JOB_EXIT;

				if (running) {
					if (cmd === 'all' || cmd === 'download') {
						if (progress > 0 && progress < 100) {
							statusText.textContent = L.downloading + ' (' + progress + '%)';
						} else if (progress === 100) {
							statusText.textContent = L.verifying;
						}
						progressWrap.querySelector('.swrt-ota-progress-inner').style.width = progress + '%';
						progressWrap.querySelector('.swrt-ota-progress-text').textContent = progress + '%';
					} else if (cmd === 'check') {
						statusText.textContent = L.checking;
					}
					
					// If we see ACTION=test_ok in log, it means it's about to reboot
					if (res.stdout.indexOf('ACTION=test_ok') !== -1) {
						statusText.textContent = L.rebooting;
					}

					setTimeout(pollJob, 1500);
				} else {
					if (exitCode === '0') {
						runOta(['status']).then(function(s) {
							var info = parseInfo(s.stdout);
							updateUI(info);
							progressWrap.style.display = 'none';
							actionBtn.style.display = 'block';
						});
					} else if (exitCode !== '') {
						statusText.textContent = L.error;
						statusText.style.color = '#ff3b30';
						actionBtn.disabled = false;
						actionBtn.textContent = L.checkNow;
						actionBtn.style.display = 'block';
						progressWrap.style.display = 'none';
						ui.addNotification(null, E('p', [L.error + ' (Code ' + exitCode + ')']), 'danger');
					}
				}
			});
		}

		function showLog() {
			runOta(['job-status']).then(function(res) {
				var log = res.stdout;
				ui.showModal(L.log, [
					E('pre', { 'style': 'max-height:400px; overflow:auto; font-size:12px; background:#f4f4f4; padding:10px; border-radius:8px;' }, [log]),
					E('div', { 'class': 'right', 'style': 'margin-top:10px' }, [
						E('button', { 'class': 'btn', 'click': ui.hideModal }, [L.close])
					])
				]);
			});
		}

		// Initial check if we need update
		if (statusInfo.STATE === 'need_check' || !statusInfo.CLOUD_TAG) {
			startCheck();
		} else {
			updateUI(statusInfo);
		}

		return container;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
