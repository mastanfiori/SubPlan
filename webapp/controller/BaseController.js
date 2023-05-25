sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/util/LogicHelper",
	"sap/m/MessageBox"
], function (Controller, JSONModel, oLogicHelper, oMsgBox) {
	"use strict";
	var oDataModel, sPath, oFilters = [];
	return Controller.extend("com.itell.bradford.ZSD_SUBPLAN_MAINT.controller.BaseController", {
		onAvailbleVersionsClick: function () {
			// var subPlanID;
			// create  dialog
			if (!this._planVersionDisplayDialog) {
				this._planVersionDisplayDialog = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.AvailableVersionsDisplay",
					this
				);
				this.getView().addDependent(this._planVersionDisplayDialog);
			}
			//get subplan ID
			// if (this.getView().getModel("SubPlanHeader")) {
			// 	subPlanID = this.getView().getModel("SubPlanHeader").getProperty("/SubPlanID");
			// } else if (this.getView().getModel("DispSubPlanHeader")) {
			// 	subPlanID = this.getView().getModel("DispSubPlanHeader").getProperty("/SubPlanID");
			// }
			this._planVersionDisplayDialog.open();
		},
		//display dialog close
		onDisplayDialogCancel: function (oEvt) {
			oEvt.getSource().getParent().close();
		},
		//Handle value Help dialog Close
		_handleValueHelpDialogClose: function (oEvt) {
			oEvt.getSource().getBinding("items").filter();
		},
		//handle material value help dialog close
		_handleMaterialValueHelpDialogClose: function (oEvt) {
			oEvt.getSource().close();
		},
		//on Cust Srv Tracking Codes Display
		onCustSrvTrackCodeDisplay: function (oEvt) {
			// create  dialog
			if (!this._custSrvTrackDisplayDialog) {
				this._custSrvTrackDisplayDialog = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.CustSrvTrackCodeDisplay",
					this
				);
				this.getView().addDependent(this._custSrvTrackDisplayDialog);
			}
			var oModel = new JSONModel();
			this.getView().setModel(oModel, "CustSrvTrackCodesData");
			var subPlanID; // = this.getView().getModel("DispSubPlanHeader").getProperty("/SubPlanID");
			//get subplan ID
			if (this.getView().getModel("SubPlanHeader")) {
				subPlanID = this.getView().getModel("SubPlanHeader").getProperty("/SubPlanID");
			} else if (this.getView().getModel("DispSubPlanHeader")) {
				subPlanID = this.getView().getModel("DispSubPlanHeader").getProperty("/SubPlanID");
			}
			var that = this;
			if (subPlanID) {
				sPath = "/ClientServTrackingCodef4HelpSet";
				oFilters = [];
				oFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, subPlanID));
				var oSuccess = function (oData) {
					sap.ui.core.BusyIndicator.hide();
					that.getView().getModel("CustSrvTrackCodesData").setData(oData.results);
				};
				var oError = function (error) {
					sap.ui.core.BusyIndicator.hide();
					that.ErrorHandling(error);
				};
				sap.ui.core.BusyIndicator.show();
				this.getOwnerComponent().getModel().read(sPath, {
					success: oSuccess,
					error: oError,
					filters: oFilters
				});
			}
			this._custSrvTrackDisplayDialog.open();
		},
		//Error Handling Method for OData services
		ErrorHandling: function (oError) {
			if (oError.name) {
				oMsgBox.error(oError.name);
			} else {
				var oXmlData = oError.responseText;
				var oXMLModel = new sap.ui.model.json.JSONModel();
				oXMLModel.setJSON(oXmlData);
				var otext = oXMLModel.getData().error.message.value;
				oMsgBox.error(otext);
			}
		}

	});
});