sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";
	var oView, selectedData, i18n;
	return Controller.extend("com.itell.bradford.ZSD_SUBPLAN_MAINT.controller.SubPlanReport", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.SubPlanReport
		 */
		onInit: function () {
			oView = this.getView();
			//Fetch i18n Model
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			if (sap.ui.getCore().getModel("routeCheckModel") === undefined) {
				var obj = {
					"routeCheck": false
				};
				var oModel = new sap.ui.model.json.JSONModel(obj);
				sap.ui.getCore().setModel(oModel, "routeCheckModel");
			}
			//Initiate Routing
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.attachRoutePatternMatched(this._handleRouteMatched, this);
			//to set initial sort order to smart table
			// this.setInitialSortOrderForSmartTable();
			// To hide the back button
			//sap.ui.getCore().byId("backBtn").setVisible(false);
			
			//Adding Default Sort
			this.setInitialSortOrder();
		},

		//Default Sort Order
		setInitialSortOrder: function () {
			var oSmartTable = this.getView().byId("subPlanHeader");
			oSmartTable.applyVariant({
				sort: {
					sortItems: [{
						columnKey: "subplanid",
						operation: "Descending"
					}]
				}
			});
		},
		//get Default Sales Org value
		_getDefaults: function () {
			var model = this.getOwnerComponent().getModel("defaultValuesModel");
			model.read("/Defaultparameters('FIN')", {
				method: "GET",
				success: function (response) {
					oView.byId("smartFilterBar").getControlByKey("salesorganization").setValue(response.SalesOrganization);
					if (this.params) {
						if (this.params.subplanid[0]) {
							oView.byId("smartFilterBar").getControlByKey("subplanid").setValue(this.params.subplanid[0]);
						}
						if (this.params.planversionnum[0]) {
							oView.byId("smartFilterBar").getControlByKey("planversionnum").setValue(this.params.planversionnum[0]);
						}
					}
				}.bind(this),
				error: function (oError) {
					var oXmlData = oError.response.body;
					var oXMLModel = new sap.ui.model.xml.XMLModel();
					oXMLModel.setXML(oXmlData);
					var otext = oXMLModel.getProperty("/message");
					sap.m.MessageBox.show(otext, sap.m.MessageBox.Icon.ERROR);
				}
			});
		},
		_handleRouteMatched: function (oEvt) {
			var param = oEvt.getParameter("name");
			if (param !== "Main") {
				return;
			}
			//check if any parameters exists
			this.params = this.getOwnerComponent().getComponentData().startupParameters;
			// To hide the back button
			if (sap.ui.getCore().byId("backBtn")) {
				sap.ui.getCore().byId("backBtn").setVisible(true);
			}
			if (sap.ui.getCore().getModel("routeCheckModel").getProperty("/routeCheck")) {
				oView.byId("subPlanHeader").rebindTable();
			}
			//get Default Values
			this._getDefaults();
		},
		//on smart filter bar initialized
		onSMFBInitialise: function (oEvt) {
			if (this.params) {
				if (this.params.subplanid[0]) {
					oView.byId("smartFilterBar").getControlByKey("subplanid").setValue(this.params.subplanid[0]);
				}
				if (this.params.planversionnum[0]) {
					oView.byId("smartFilterBar").getControlByKey("planversionnum").setValue(this.params.planversionnum[0]);
				}
			}
		},
		//sort order for smart table
		setInitialSortOrderForSmartTable: function () {
			var oSmartTable = this.getView().byId("subPlanHeader");
			oSmartTable.applyVariant({
				sort: {
					sortItems: [{
						columnKey: "changedate",
						operation: "Descending"
					}]
				}
			});
		},
		//smart table rebind table
		onRebindTable: function (oEvt) {
			var mBindingParams = oEvt.getParameter("bindingParams");
			// var oSmartTable = this.getView().byId("subPlanHeader");
			// oSmartTable.applyVariant({
			// 	sort: {
			// 		sortItems: [{
			// 			columnKey: "changedate",
			// 			operation: "Descending"
			// 		}]
			// 	}
			// });
			if (!mBindingParams.sorter.length) {
				mBindingParams.sorter.push(new sap.ui.model.Sorter("changedate", true));
			}
			if (sap.ui.getCore().getModel("routeCheckModel").getProperty("/routeCheck")) {
				var sFilters = [];
				sFilters = this.getView().byId("smartFilterBar").getFilters();
				mBindingParams.filters = sFilters;
			}
		},
		//to handle navigation clicks
		onNavigation: function (oEvt) {
			selectedData = oEvt.getSource().getSelectedItem().getBindingContext().getObject();
			this.displaySubPlan();
		},

		displaySubPlan: function () {
			this.oRouter.navTo("DisplaySubPlan", {
				salesorganization: selectedData.salesorganization,
				subplanid: selectedData.subplanid,
				status: selectedData.status,
				planversionnum: selectedData.planversionnum
			});
		},

		onNewSubPlan: function () {
			this.CreateSubPlan();
		},

		CreateSubPlan: function () {
			this.oRouter.navTo("CreateSubPlan", {
				action: "CREATE",
				salesorganization: oView.byId("smartFilterBar").getFilterData().salesorganization
					// subplanid: selectedData.subplanid
			});

		},
		onNavBack: function (oEvt) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "#"
					}
				});
			}
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.SubPlanReport
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.SubPlanReport
		 */
		onAfterRendering: function () {
			// oView.byId("smartFilterBar").getControlByKey("subplanid").setValue("99701");
		},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.SubPlanReport
		 */

		onExit: function () {
			// To visible the back button
			sap.ui.getCore().byId("backBtn").setVisible(true);
		}

	});

});