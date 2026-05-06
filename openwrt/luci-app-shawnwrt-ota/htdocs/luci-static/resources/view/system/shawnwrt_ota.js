'use strict';
'require view';
'require uci';
'require fs';
'require ui';

var zh = (document.documentElement.getAttribute('lang') || navigator.language || '').toLowerCase().indexOf('zh') === 0;

function runOta(args) {
	return fs.exec('/usr/bin/shawnwrt-ota', args).then(function(res) {
		return { ok: true, stdout: (res.stdout || '').trim() };
	}).catch(function() {
		return { ok: false, stdout: '' };
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
		var self = this;
		return Promise.all([
			runOta(['board']),
			runOta(['status']),
			uci.load('shawnwrt_ota')
		]).then(function(results) {
			self._boardId = (results[0].stdout || '').trim();
			self._statusInfo = parseInfo(results[1].stdout);
			return self;
		});
	},

	render: function() {
		var self = this;
		var info = self._statusInfo;
		var boardId = self._boardId;
		var enabled = uci.get('shawnwrt_ota', 'auto', 'enabled') === '1';
		var startHour = parseInt(uci.get('shawnwrt_ota', 'auto', 'start_hour') || '1');
		var endHour = parseInt(uci.get('shawnwrt_ota', 'auto', 'end_hour') || '3');
		
		var color, bgColor, icon, title;
		if (info.STATE === 'current') {
			color = '#34c759';
			bgColor = 'rgba(52,199,89,0.1)';
			icon = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
			title = zh ? '当前已是最新版本' : 'System is up to date';
		} else if (info.STATE === 'update') {
			color = '#007aff';
			bgColor = 'rgba(0,122,255,0.1)';
			icon = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>';
			title = zh ? '发现新版本' : 'Update Available';
		} else {
			color = '#ff9500';
			bgColor = 'rgba(255,149,0,0.1)';
			icon = '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>';
			title = zh ? '正在检查更新...' : 'Checking...';
		}
		
		var sizeStr = info.SIZE ? (parseInt(info.SIZE) / 1048576).toFixed(1) + ' MB' : '---';
		
		var startOptions = '';
		var endOptions = '';
		for (var h = 0; h < 24; h++) {
			var label = (h < 10 ? '0' : '') + h + ':00';
			startOptions += '<option value="' + h + '"' + (h === startHour ? ' selected' : '') + '>' + label + '</option>';
			endOptions += '<option value="' + h + '"' + (h === endHour ? ' selected' : '') + '>' + label + '</option>';
		}
		
		var installBtnHtml = info.STATE === 'update' 
			? '<button id="ota-install" class="btn cbi-button-action" style="background:#007aff;color:#fff">' + (zh ? '下载并安装' : 'Download & Install') + '</button>' 
			: '';
		
		var html = 
			'<div class="cbi-map">' +
				'<div class="cbi-section">' +
					'<div class="cbi-section-descr">' +
						'<div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">' +
							'<div style="width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:' + bgColor + '">' +
								'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg>' +
							'</div>' +
							'<div>' +
								'<div style="font-size:1.1rem;font-weight:600;margin-bottom:0.2rem">' + title + '</div>' +
								'<div style="font-size:0.85rem;opacity:0.6;font-family:ui-monospace">' + (info.CLOUD_TAG || info.INSTALLED_TAG || '---') + '</div>' +
							'</div>' +
						'</div>' +
						'<table style="width:100%;border-collapse:collapse;margin-top:1rem">' +
							'<tbody>' +
								'<tr><td style="padding:0.5rem 0.8rem;border-bottom:1px solid rgba(0,0,0,0.06);font-size:0.8rem;opacity:0.5;width:40%">' + (zh ? '当前版本' : 'Current Version') + '</td><td style="padding:0.5rem 0.8rem;border-bottom:1px solid rgba(0,0,0,0.06);font-size:0.85rem;font-family:ui-monospace">' + (info.INSTALLED_TAG || '---') + '</td></tr>' +
								'<tr><td style="padding:0.5rem 0.8rem;border-bottom:1px solid rgba(0,0,0,0.06);font-size:0.8rem;opacity:0.5">' + (zh ? '云端版本' : 'Cloud Version') + '</td><td style="padding:0.5rem 0.8rem;border-bottom:1px solid rgba(0,0,0,0.06);font-size:0.85rem;font-family:ui-monospace">' + (info.CLOUD_TAG || '---') + '</td></tr>' +
								'<tr><td style="padding:0.5rem 0.8rem;border-bottom:1px solid rgba(0,0,0,0.06);font-size:0.8rem;opacity:0.5">' + (zh ? '设备目标' : 'Device Target') + '</td><td style="padding:0.5rem 0.8rem;border-bottom:1px solid rgba(0,0,0,0.06);font-size:0.85rem;font-family:ui-monospace">' + boardId + '</td></tr>' +
								'<tr><td style="padding:0.5rem 0.8rem;font-size:0.8rem;opacity:0.5">' + (zh ? '文件大小' : 'File Size') + '</td><td style="padding:0.5rem 0.8rem;font-size:0.85rem;font-family:ui-monospace">' + sizeStr + '</td></tr>' +
							'</tbody>' +
						'</table>' +
					'</div>' +
					'<div style="display:flex;gap:0.5rem;margin-top:1rem">' +
						installBtnHtml +
						'<button id="ota-check" class="btn cbi-button-action">' + (zh ? '检查更新' : 'Check for Updates') + '</button>' +
						'<button id="ota-log" class="btn cbi-button-action">' + (zh ? '执行日志' : 'Execution Log') + '</button>' +
					'</div>' +
				'</div>' +
				'<div class="cbi-section">' +
					'<h3 class="cbi-section-title">' + (zh ? '自动更新' : 'Auto Update') + '</h3>' +
					'<div class="cbi-section-node">' +
						'<div class="cbi-value">' +
							'<label class="cbi-value-title">' + (zh ? '启用' : 'Enable') + '</label>' +
							'<div class="cbi-value-field">' +
								'<input type="checkbox" name="auto.enabled" value="1"' + (enabled ? ' checked' : '') + '>' +
							'</div>' +
						'</div>' +
					'</div>' +
					'<div class="cbi-section-node">' +
						'<div class="cbi-value">' +
							'<label class="cbi-value-title">' + (zh ? '开始时间' : 'Start Time') + '</label>' +
							'<div class="cbi-value-field">' +
								'<select name="auto.start_hour" class="cbi-input-select">' + startOptions + '</select>' +
							'</div>' +
						'</div>' +
					'</div>' +
					'<div class="cbi-section-node">' +
						'<div class="cbi-value">' +
							'<label class="cbi-value-title">' + (zh ? '结束时间' : 'End Time') + '</label>' +
							'<div class="cbi-value-field">' +
								'<select name="auto.end_hour" class="cbi-input-select">' + endOptions + '</select>' +
							'</div>' +
						'</div>' +
					'</div>' +
					'<p class="cbi-section-descr" style="font-size:0.75rem;opacity:0.5">' + (zh ? '路由器将在设定时间段内自动检查更新并安装' : 'Router will check and install updates during the scheduled time window') + '</p>' +
				'</div>' +
			'</div>';
		
		var container = document.createElement('div');
		container.innerHTML = html;
		
		var installBtn = container.querySelector('#ota-install');
		var checkBtn = container.querySelector('#ota-check');
		var logBtn = container.querySelector('#ota-log');
		
		if (installBtn) {
			installBtn.addEventListener('click', function() {
				ui.showModal(zh ? '下载并安装' : 'Download & Install', [
					E('p', [zh ? '更新过程中网络会短暂中断，完成后路由器将自动重启。建议在更新前备份配置。' : 'Network will disconnect briefly. The router will reboot automatically. Backup is recommended.']),
					E('div', { 'class': 'right' }, [
						E('button', { 'class': 'btn', 'click': ui.hideModal }, [zh ? '关闭' : 'Close']),
						' ',
						E('button', { 'class': 'btn cbi-button-negative', 'click': function() {
							ui.hideModal();
							installBtn.disabled = true;
							runOta(['start', 'all']);
						}}, [zh ? '确认' : 'Confirm'])
					])
				]);
			});
		}
		
		checkBtn.addEventListener('click', function() {
			checkBtn.disabled = true;
			checkBtn.textContent = zh ? '检查中...' : 'Checking...';
			runOta(['start', 'check']).then(function() {
				var poll = function() {
					runOta(['job-status']).then(function(res) {
						var job = parseInfo(res.stdout);
						if (job.JOB_RUNNING === '1') {
							setTimeout(poll, 1000);
						} else {
							location.reload();
						}
					});
				};
				poll();
			});
		});
		
		logBtn.addEventListener('click', function() {
			runOta(['job-status']).then(function(res) {
				ui.showModal(zh ? '执行日志' : 'Execution Log', [
					E('pre', { 'style': 'max-height:400px;overflow:auto;font-size:12px;font-family:ui-monospace;background:rgba(0,0,0,0.04);padding:1rem;border-radius:10px;white-space:pre-wrap' }, [res.stdout]),
					E('div', { 'class': 'right', 'style': 'margin-top:1rem' }, [
						E('button', { 'class': 'btn', 'click': ui.hideModal }, [zh ? '关闭' : 'Close'])
					])
				]);
			});
		});
		
		return container;
	},
	
	handleSaveApply: function() {
		var enabled = document.querySelector('input[name="auto.enabled"]').checked ? '1' : '0';
		var startHour = document.querySelector('select[name="auto.start_hour"]').value;
		var endHour = document.querySelector('select[name="auto.end_hour"]').value;
		
		if (parseInt(startHour) >= parseInt(endHour)) {
			ui.addNotification(null, E('p', [zh ? '结束时间必须大于开始时间' : 'End time must be greater than start time']), 'danger');
			return false;
		}
		
		var autoExists = uci.get('shawnwrt_ota', 'auto');
		if (!autoExists) {
			uci.add('shawnwrt_ota', 'ota', 'auto');
		}
		
		uci.set('shawnwrt_ota', 'auto', 'enabled', enabled);
		uci.set('shawnwrt_ota', 'auto', 'start_hour', startHour);
		uci.set('shawnwrt_ota', 'auto', 'end_hour', endHour);
		
		return uci.apply().then(function() {
			return fs.exec('/etc/init.d/shawnwrt-ota-cron', ['restart']).catch(function() {});
		});
	},
	
	handleSave: function() {
		return this.handleSaveApply();
	}
});
