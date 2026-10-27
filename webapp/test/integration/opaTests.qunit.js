/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["zserviceportal/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
