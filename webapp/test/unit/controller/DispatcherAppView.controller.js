/*global QUnit*/

sap.ui.define([
	"dispatcherns/dispatcherapp/controller/DispatcherAppView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("DispatcherAppView Controller");

	QUnit.test("I should test the DispatcherAppView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
