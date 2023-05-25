sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";
	var oView, i18n, selectedData, sPath;
	return Controller.extend("com.itell.bradford.ZSD_SUBPLAN_MAINT.controller.ChangeLog", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.ChangeLog
		 */
		onInit: function () {
			oView = this.getView();
			//Fetch i18n Model
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			//Initiate Routing
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.attachRoutePatternMatched(this._handleRouteMatched, this);
		},

		_handleRouteMatched: function (oEvt) {
			var param = oEvt.getParameter("name");
			if (param !== "ChangeLog") {
				return;
			}
			selectedData = oEvt.getParameters().arguments;
			oView.byId("clSubPlanID").setValue(selectedData.subplanid);
			if (oView.byId("ChangeLogSmartTable")) {
				oView.byId("ChangeLogSmartTable").rebindTable();
			}
		},
		onChangeLogNavBack: function (oEvt) {
			this.oRouter.navTo("DisplaySubPlan", {
				salesorganization: selectedData.salesorganization,
				subplanid: selectedData.subplanid,
				status: selectedData.status,
				planversionnum: selectedData.planversionnum
			});
		},
		// onFBInitialized: function () {
		// 	oView.byId("CLsmartFilterBar").getControlByKey("SubPlanID").setValue(selectedData.subplanid);
		// 	oView.byId("ChangeLogSmartTable").rebindTable();
		// },
		//smart table rebind table
		onRebindTable: function (oEvt) {
			var sFilters = [];
			sFilters = this.getView().byId("CLsmartFilterBar").getFilters();
			sFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, selectedData.subplanid));
			var mBindingParams = oEvt.getParameter("bindingParams");
			mBindingParams.filters = sFilters;
		},
		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.ChangeLog
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.ChangeLog
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.ChangeLog
		 */
		//	onExit: function() {
		//
		//	}

	});

});