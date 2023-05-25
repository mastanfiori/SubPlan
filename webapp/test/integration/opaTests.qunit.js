/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/itell/bradford/ZSD_SUBPLAN_MAINT/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});