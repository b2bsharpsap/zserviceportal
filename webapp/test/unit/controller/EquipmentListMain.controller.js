/*global QUnit*/

sap.ui.define([
	"zserviceportal/controller/EquipmentListMain.controller"
], function (Controller) {
	"use strict";

	QUnit.module("EquipmentListMain Controller");

	QUnit.test("I should test the EquipmentListMain controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
