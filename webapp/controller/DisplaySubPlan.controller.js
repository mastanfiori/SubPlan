sap.ui.define([
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/controller/BaseController",
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/util/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/util/LogicHelper"
], function (Controller, oFormatter, JSONModel, oMsgBox, oLogicHelper) {
	"use strict";
	var oView, i18n, selectedData, sPath, that;
	return Controller.extend("com.itell.bradford.ZSD_SUBPLAN_MAINT.controller.DisplaySubPlan", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.DisplaySubPlan
		 */
		//Calling Formatter 
		oFormatter: oFormatter,
		onInit: function () {
			oView = this.getView();
			//Fetch i18n Model
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var routeObj = {
				"routeCheck": true
			};
			var oModel = new sap.ui.model.json.JSONModel(routeObj);
			sap.ui.getCore().setModel(oModel, "routeCheckModel");
			//Initiate Routing
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.attachRoutePatternMatched(this._handleRouteMatched, this);
			//set model for manual trackcodes n range data
			var trackJSON = new JSONModel();
			var trackMMJSON = new JSONModel();
			oView.setModel(trackJSON, "manualTrackCodesDisplay");
			oView.setModel(trackMMJSON, "TrackRangeDataDisplay");
			//Object Status Model
			var ObjectStatus = {
				"Text": "",
				"State": i18n.getText("None")
			};
			var ObjectStatusModel = new JSONModel(ObjectStatus);
			oView.setModel(ObjectStatusModel, "ObjecStatusModel");
			//OData call to get Sub Plan Staus items
			this._getSubPlanStatusItems();
		},
		//oData call for Sub Plan Status Items
		_getSubPlanStatusItems: function () {
			sPath = "/StatusRangeSet";
			var oSuccess = function (oData) {
				sap.ui.core.BusyIndicator.hide();
				var statusModel = new JSONModel(oData.results);
				oView.setModel(statusModel, "subPlanStatusItemsDisp");
			};
			var oError = function (error) {
				sap.ui.core.BusyIndicator.hide();
				that.ErrorHandling(error);
			};
			sap.ui.core.BusyIndicator.show();
			this.getOwnerComponent().getModel().read(sPath, {
				success: oSuccess,
				error: oError
			});
		},
		_handleRouteMatched: function (oEvt) {
			var param = oEvt.getParameter("name");
			if (param !== "DisplaySubPlan") {
				return;
			}
			selectedData = oEvt.getParameters().arguments;
			selectedData.copiedsalesorg = "";
			var oEntry = {
				"Buttonflag": "DISP",
				"SubPlanID": selectedData.subplanid,
				"SalesOrganization": selectedData.salesorganization,
				"Status": selectedData.status,
				"PlanVersionNum": selectedData.planversionnum,
				"SubplanInboundNav": [{
					"Material": "",
					"SubPlanID": selectedData.subplanid,
					"SubPlanTrackingCodesNav": [{
						"Prodid": "",
						"SubPlanID": "",
						"PlanVersionNum": "",
						"Material": "",
						"ManualTrackingRange": ""
					}]
				}]
			};
			//set route check model for report screen refresh
			sap.ui.getCore().getModel("routeCheckModel").setProperty("/routeCheck", true);
			//Header Model
			var HeaderObj = {
				"SubPlanID": "",
				"SalesOrganization": "",
				"PromoID": "",
				"OfferSeqNbr": "1.100",
				"PlanID": "",
				"MarketArea": "",
				"TrackingCodeFrom": "V",
				"TrackingCodeTo": "V",
				"BackendTrackCode": "",
				"TrackCodeManualFlag": false,
				"TrackCodeAutoFlag": true,
				"Status": "",
				"PlanVersionNum": "",
				"PlanVersionDesc": "",
				"ClntSrvcsTrackingCode": "0009"
			};
			//set header model for display
			var SubPlanHeader = new sap.ui.model.json.JSONModel(HeaderObj);
			this.getView().setModel(SubPlanHeader, "DispSubPlanHeader");
			//set Items model for display
			var SubPlanItemDisplay = new JSONModel();
			this.getView().setModel(SubPlanItemDisplay, "SubPlanItemDisplay");
			//get Sub Plan Display data
			sPath = "/SubplanInboundHeadSet";
			that = this;
			var subPlanItems = [],
				manualTrackCodes = [],
				allItemtrackCodes = [];
			var subPlanItemObj = {},
				trackObj = {},
				j;
			var oSuccess = function (oData) {
				sap.ui.core.BusyIndicator.hide();
				for (var i = 0; i < oData.SubplanInboundNav.results.length; i++) {
					subPlanItemObj = {};
					subPlanItemObj.SubItemInternalID = oData.SubplanInboundNav.results[i].SubItemInternalID;
					subPlanItemObj.SubPlanID = oData.SubplanInboundNav.results[i].SubPlanID;
					subPlanItemObj.ProdID = oData.SubplanInboundNav.results[i].ProdID;
					subPlanItemObj.Material = oData.SubplanInboundNav.results[i].Material;
					subPlanItemObj.MaterialSubstitution = oData.SubplanInboundNav.results[i].MaterialSubstitution;
					subPlanItemObj.CatalogMaterial = oData.SubplanInboundNav.results[i].CatalogMaterial;
					subPlanItemObj.MaterialDescription = oData.SubplanInboundNav.results[i].MaterialDescription;
					subPlanItemObj.PanelArea = oData.SubplanInboundNav.results[i].PanelArea;
					subPlanItemObj.PanelCode = oData.SubplanInboundNav.results[i].PanelCode;
					subPlanItemObj.ProdSeqNum = oData.SubplanInboundNav.results[i].ProdSeqNum;
					subPlanItemObj.TrackingCode = oData.BackendTrackCode;
					subPlanItemObj.ProdSellPrice = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].ProdSellPrice);
					subPlanItemObj.ProdSellPriceErrorState = "None";
					subPlanItemObj.ProdSellPriceErrorText = "";
					subPlanItemObj.PostageHandling = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].PostageHandling);
					subPlanItemObj.PostageHandlingErrorState = "None";
					subPlanItemObj.PostageHandlingErrorText = "";
					subPlanItemObj.PostageHandling2 = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].PostageHandling2);
					subPlanItemObj.PostageHandling2ErrorState = "None";
					subPlanItemObj.PostageHandling2ErrorText = "";
					subPlanItemObj.ProdAmtPaidTrigger = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].ProdAmtPaidTrigger);
					subPlanItemObj.ProdAmtPaidTriggerErrorState = "None";
					subPlanItemObj.ProdAmtPaidTriggerErrorText = "";
					subPlanItemObj.FreeProduct = oData.SubplanInboundNav.results[i].FreeProduct;
					if (subPlanItemObj.FreeProduct === "X") {
						subPlanItemObj.FreeProductState = i18n.getText("Information");
					} else {
						subPlanItemObj.FreeProductState = i18n.getText("None");
					}
					subPlanItemObj.NumberOfInstalls = oData.SubplanInboundNav.results[i].NumberOfInstalls;
					subPlanItemObj.FirstInstallAmt = oData.SubplanInboundNav.results[i].FirstInstallAmt;
					subPlanItemObj.InvAllocationCode = oData.SubplanInboundNav.results[i].InvAllocationCode;
					subPlanItemObj.TmpltLineNbr = oData.SubplanInboundNav.results[i].TmpltLineNbr;
					subPlanItemObj.OfferSeqNbr = oData.SubplanInboundNav.results[i].OfferSeqNbr;
					subPlanItemObj.PurchaseLimit = oData.SubplanInboundNav.results[i].PurchaseLimit;
					subPlanItemObj.SegmentCode = oData.SubplanInboundNav.results[i].SegmentCode;
					subPlanItemObj.SegmentDescrip = oData.SubplanInboundNav.results[i].SegmentDescrip;
					subPlanItemObj.SubSegmentCode = oData.SubplanInboundNav.results[i].SubSegmentCode;
					subPlanItemObj.SubSegmentDescrip = oData.SubplanInboundNav.results[i].SubSegmentDescrip;
					subPlanItemObj.PromiseDays = oData.SubplanInboundNav.results[i].PromiseDays;
					subPlanItemObj.NumberOfDays = oData.SubplanInboundNav.results[i].NumberOfDays;
					subPlanItemObj.DeletionFlag = oData.SubplanInboundNav.results[i].DeletionFlag;
					subPlanItemObj.TBDFlag = oData.SubplanInboundNav.results[i].TBDFlag;
					subPlanItemObj.NubrPmtsBefore = oData.SubplanInboundNav.results[i].NubrPmtsBefore;
					subPlanItemObj.ShipIntervalDaysCC = oData.SubplanInboundNav.results[i].ShipIntervalDaysCC;
					subPlanItemObj.ShipIntervalDayNonCC = oData.SubplanInboundNav.results[i].ShipIntervalDayNonCC;
					subPlanItemObj.MaterialSalesStatusDesc = oData.SubplanInboundNav.results[i].MaterialSalesStatusDesc;
					subPlanItemObj.MaterialSalesStatus = oData.SubplanInboundNav.results[i].MaterialSalesStatus;
					subPlanItemObj.UnequalFirstInstallment = oData.SubplanInboundNav.results[i].UnequalFirstInstallment;
					subPlanItemObj.Category1 = oData.SubplanInboundNav.results[i].Category1;
					subPlanItemObj.Category2 = oData.SubplanInboundNav.results[i].Category2;
					subPlanItemObj.Category3 = oData.SubplanInboundNav.results[i].Category3;
					subPlanItemObj.Category4 = oData.SubplanInboundNav.results[i].Category4;
					subPlanItemObj.Category5 = oData.SubplanInboundNav.results[i].Category5;
					if (oData.SubplanInboundNav.results[i].StaticPromiseDate !== "0000-00-00") {
						subPlanItemObj.StaticPromiseDate = oData.SubplanInboundNav.results[i].StaticPromiseDate;
					}
					//get Tracking Codes
					if (oData.SubplanInboundNav.results[i].ProdSeqNum === "1") {
						//pull out manual tracking codes and assign to Manual Tracking display model
						for (j = 0; j < oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results.length; j++) {
							trackObj = {};
							trackObj.TrackingCode = oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results[j].ManualTrackingRange;
							if (trackObj.TrackingCode !== "") {
								manualTrackCodes.push(trackObj);
							}
						}
						oView.getModel("manualTrackCodesDisplay").setData(manualTrackCodes);
						oView.getModel("manualTrackCodesDisplay").refresh();
						//pull out all Range tracking code
						for (j = 0; j < oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results.length; j++) {
							trackObj = {};
							trackObj.TrackingCode = oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results[j].TrackingRange;
							if (trackObj.TrackingCode !== "") {
								allItemtrackCodes.push(trackObj);
							}
						}
						allItemtrackCodes = allItemtrackCodes.concat(manualTrackCodes);
						oView.getModel("TrackRangeDataDisplay").setData(allItemtrackCodes);
						oView.getModel("TrackRangeDataDisplay").refresh();
					}
					//add row highlight based on delete flag
					if (subPlanItemObj.DeletionFlag) {
						subPlanItemObj.Status = i18n.getText("Error");
						subPlanItemObj.StatusText = "";
					} else {
						subPlanItemObj.Status = i18n.getText("None");
						subPlanItemObj.StatusText = "";
					}
					subPlanItems.push(subPlanItemObj);
				}
				//get sorted sub plan items based on Prod Seq number
				subPlanItems = oLogicHelper.getSubPlanSortedItems(subPlanItems);
				//set Items
				oView.getModel("SubPlanItemDisplay").setData(subPlanItems);
				oView.getModel("SubPlanItemDisplay").refresh();
				//set Header
				oView.getModel("DispSubPlanHeader").setProperty("/SubPlanID", oData.SubPlanID);
				oView.getModel("DispSubPlanHeader").setProperty("/SubplanName", oData.SubplanName);
				oView.getModel("DispSubPlanHeader").setProperty("/SalesOrganization", oData.SalesOrganization);
				oView.getModel("DispSubPlanHeader").setProperty("/PlanVersionDesc", oData.PlanVersionDesc);
				oView.getModel("DispSubPlanHeader").setProperty("/PromoID", oData.PromoID);
				oView.getModel("DispSubPlanHeader").setProperty("/OfferSeqNbr", oData.OfferSeqNbr);
				oView.getModel("DispSubPlanHeader").setProperty("/PlanID", oData.PlanID);
				oView.getModel("DispSubPlanHeader").setProperty("/PlanVersionNum", oData.PlanVersionNum);
				// oView.getModel("DispSubPlanHeader").setProperty("/CTN", oData.CTN);
				oView.getModel("DispSubPlanHeader").setProperty("/RolloutMaterial", oData.RolloutMaterial);
				oView.getModel("DispSubPlanHeader").setProperty("/RolloutMaterialDes", oData.RolloutMaterialDes);
				oView.getModel("DispSubPlanHeader").setProperty("/CatalogMaterial", oData.CatalogMaterial);
				oView.getModel("DispSubPlanHeader").setProperty("/CatalogMaterialDes", oData.CatalogMaterialDes);
				oView.getModel("DispSubPlanHeader").setProperty("/Status", oData.Status);
				oView.getModel("DispSubPlanHeader").setProperty("/MarketArea", oData.MarketArea);
				oView.getModel("DispSubPlanHeader").setProperty("/MarketAreaDesc", oData.MarketAreaDesc);
				// oView.getModel("DispSubPlanHeader").setProperty("/SegmentCode", oData.SegmentCode);
				// oView.getModel("DispSubPlanHeader").setProperty("/SubSegmentCode", oData.SubSegmentCode);
				oView.getModel("DispSubPlanHeader").setProperty("/ClntSrvcsTrackingCode", oData.ClntSrvcsTrackingCode);
				oView.getModel("DispSubPlanHeader").setProperty("/BackendTrackCode", oData.BackendTrackCode);
				oView.getModel("DispSubPlanHeader").setProperty("/TrackingCodeFrom", oData.TrackingCodeFrom);
				oView.getModel("DispSubPlanHeader").setProperty("/TrackingCodeTo", oData.TrackingCodeTo);

				// //Defaults header info
				oView.getModel("DispSubPlanHeader").setProperty("/PromiseDays", oData.PromiseDays);
				oView.getModel("DispSubPlanHeader").setProperty("/PanelArea", oData.PanelArea);
				oView.getModel("DispSubPlanHeader").setProperty("/ShipIntervalDaysCC", oData.ShipIntervalDaysCC);
				// if (oData.StaticPromiseDate !== "0000-00-000") {
				// 	oView.getModel("DispSubPlanHeader").setProperty("/StaticPromiseDate", oData.StaticPromiseDate);
				// }
				oView.getModel("DispSubPlanHeader").setProperty("/ShipIntervalDayNonCC", oData.ShipIntervalDayNonCC);
				oView.getModel("DispSubPlanHeader").setProperty("/NumberOfDays", oData.NumberOfDays);
				oView.getModel("DispSubPlanHeader").setProperty("/PromiseDays", oData.PromiseDays);
				oView.getModel("DispSubPlanHeader").setProperty("/NumberOfInstalls", oData.NumberOfInstalls);
				oView.getModel("DispSubPlanHeader").setProperty("/NubrPmtsBefore", oData.NubrPmtsBefore);
				oView.getModel("DispSubPlanHeader").setProperty("/PurchaseLimit", oData.PurchaseLimit);
				oView.getModel("DispSubPlanHeader").setProperty("/ConsecutiveReturnCount", oData.ConsecutiveReturnCount);
				oView.getModel("DispSubPlanHeader").setProperty("/InvAllocationCode", oData.InvAllocationCode);
				oView.getModel("DispSubPlanHeader").setProperty("/PostageHandling", oData.PostageHandling);
				oView.getModel("DispSubPlanHeader").setProperty("/PostageHandling2", oData.PostageHandling2);
				oView.getModel("DispSubPlanHeader").setProperty("/SlidingScaleType", oData.SlidingScaleType);
				oView.getModel("DispSubPlanHeader").setProperty("/CatalogID", oData.CatalogID);
				oView.getModel("DispSubPlanHeader").setProperty("/Reportbreak", oData.Reportbreak);
				oView.getModel("DispSubPlanHeader").setProperty("/NumberOfUnits", oData.NumberOfUnits);
				oView.getModel("DispSubPlanHeader").setProperty("/PercentReturnThres", oData.PercentReturnThres);
				oView.getModel("DispSubPlanHeader").setProperty("/UnequalFirstInstallment", oData.UnequalFirstInstallment);
				//category info
				oView.getModel("DispSubPlanHeader").setProperty("/Category1", oData.Category1);
				oView.getModel("DispSubPlanHeader").setProperty("/Category2", oData.Category2);
				oView.getModel("DispSubPlanHeader").setProperty("/Category3", oData.Category3);
				oView.getModel("DispSubPlanHeader").setProperty("/Category4", oData.Category4);
				oView.getModel("DispSubPlanHeader").setProperty("/Category5", oData.Category5);
				oView.getModel("DispSubPlanHeader").setProperty("/WEBOEFlag", oData.WEBOEFlag);
				if (oData.Agedtrackingcode === "X") {
					oView.getModel("DispSubPlanHeader").setProperty("/Agedtrackingcode", true);
				} else if (oData.Agedtrackingcode === "") {
					oView.getModel("DispSubPlanHeader").setProperty("/Agedtrackingcode", false);
				} else {
					oView.getModel("DispSubPlanHeader").setProperty("/Agedtrackingcode", false);
				}
				if (oData.CTN === "X") {
					oView.getModel("DispSubPlanHeader").setProperty("/CTN", true);
				} else if (oData.CTN === "") {
					oView.getModel("DispSubPlanHeader").setProperty("/CTN", false);
				} else {
					oView.getModel("DispSubPlanHeader").setProperty("/CTN", false);
				}
				if (oData.PromoplanFlag === "X") {
					oView.getModel("DispSubPlanHeader").setProperty("/PromoplanFlag", true);
				} else {
					oView.getModel("DispSubPlanHeader").setProperty("/PromoplanFlag", false);
				}
				//set Object Header Status based on OData received status
				that.setObjectHederStatus(oData.Status);
			};
			var oError = function (error) {
				sap.ui.core.BusyIndicator.hide();
				that.ErrorHandling(error);
			};
			sap.ui.core.BusyIndicator.show();
			this.getOwnerComponent().getModel().create(sPath, oEntry, {
				success: oSuccess,
				error: oError
			});
			//get sub plan versions
			oLogicHelper.getSubPlanVersions(selectedData.subplanid, this);
			// To hide the back button
			sap.ui.getCore().byId("backBtn").setVisible(true);
		},
		//set Object Header Status based on OData received status
		setObjectHederStatus: function (oStatus) {
			switch (oStatus) {
			case 'C':
				oView.getModel("ObjecStatusModel").setProperty("/Text", i18n.getText("CreateShell"));
				oView.getModel("ObjecStatusModel").setProperty("/State", i18n.getText("Information"));
				break;
			case 'I':
				oView.getModel("ObjecStatusModel").setProperty("/Text", i18n.getText("Inactive"));
				oView.getModel("ObjecStatusModel").setProperty("/State", i18n.getText("Warning"));
				break;
			case 'A':
				oView.getModel("ObjecStatusModel").setProperty("/Text", i18n.getText("Active"));
				oView.getModel("ObjecStatusModel").setProperty("/State", i18n.getText("Success"));
				break;
			case 'S':
				oView.getModel("ObjecStatusModel").setProperty("/Text", i18n.getText("Suspended"));
				oView.getModel("ObjecStatusModel").setProperty("/State", i18n.getText("Error"));
				break;
			default:
				oView.getModel("ObjecStatusModel").setProperty("/0/Text", "");
				oView.getModel("ObjecStatusModel").setProperty("/0/State", i18n.getText("None"));
				break;
			}
		},
		//triggers when user clicks on Cancel in Tracking Range Dialog
		// ontrackCodeRangeDisplayDialogCancel: function (oEvt) {
		// 	this._trackCodeRangeDisplayDialog.close();
		// },
		onDisplayTrackCodesDialog: function () {
			// create  dialog
			if (!this._trackCodeRangeDisplayDialog) {
				this._trackCodeRangeDisplayDialog = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.TrackCodeRangeDisplay",
					this
				);
				this.getView().addDependent(this._trackCodeRangeDisplayDialog);
			}
			this._trackCodeRangeDisplayDialog.open();
		},
		// //on Cust Srv Tracking Codes Display
		// onCustSrvTrackCodeDisplay: function (oEvt) {
		// 	// create  dialog
		// 	if (!this._custSrvTrackDisplayDialog) {
		// 		this._custSrvTrackDisplayDialog = sap.ui.xmlfragment(
		// 			"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.CustSrvTrackCodeDisplay",
		// 			this
		// 		);
		// 		this.getView().addDependent(this._custSrvTrackDisplayDialog);
		// 	}
		// 	var oModel = new JSONModel();
		// 	oView.setModel(oModel, "CustSrvTrackCodesData");
		// 	var subPlanID = oView.getModel("DispSubPlanHeader").getProperty("/SubPlanID");
		// 	if (subPlanID) {
		// 		sPath = "/ClientServTrackingCodef4HelpSet";
		// 		var oFilters = [];
		// 		oFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, subPlanID));
		// 		var oSuccess = function (oData) {
		// 			sap.ui.core.BusyIndicator.hide();
		// 			oView.getModel("CustSrvTrackCodesData").setData(oData.results);
		// 		};
		// 		var oError = function (error) {
		// 			sap.ui.core.BusyIndicator.hide();
		// 			that.ErrorHandling(error);
		// 		};
		// 		sap.ui.core.BusyIndicator.show();
		// 		this.getOwnerComponent().getModel().read(sPath, {
		// 			success: oSuccess,
		// 			error: oError,
		// 			filters: oFilters
		// 		});
		// 	}
		// 	this._custSrvTrackDisplayDialog.open();
		// },
		//
		onCustTrackCodeDisplayDialogCancel: function () {
			this._custSrvTrackDisplayDialog.close();
		},
		onManualTrackingCodesDisplay: function () {
			// create dialog for manual tracking Code display
			if (!this._DisplayTrackCodeManual) {
				this._DisplayTrackCodeManual = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.DisplayTrackCodeManual",
					this
				);
				this.getView().addDependent(this._DisplayTrackCodeManual);
			}
			this._DisplayTrackCodeManual.open();
		},
		//triggers when user clicks on Cancel in Tracking Range Dialog
		// onDisplayTrackCodeManualCancel: function (oEvt) {
		// 	this._DisplayTrackCodeManual.close();
		// },

		//on Change log press
		onChangeLogPress: function (oEvt) {
			this.oRouter.navTo("ChangeLog", {
				subplanid: selectedData.subplanid,
				salesorganization: selectedData.salesorganization,
				status: selectedData.status,
				planversionnum: selectedData.planversionnum
			});
		},

		//onEdit SubPlan 
		onEdit: function (oEvt) {
			this.oRouter.navTo("CreateSubPlan", {
				action: "EDIT",
				salesorganization: selectedData.salesorganization,
				subplanid: selectedData.subplanid,
				status: selectedData.status,
				planversionnum: selectedData.planversionnum
			});
		},
		//onCopy SubPlan 
		onCopy: function (oEvt) {
			// create value help dialog
			if (!this._valueHelpDialogSalesOrg) {
				this._valueHelpDialogSalesOrg = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.SalesOrgF4Help",
					this
				);
				this.getView().addDependent(this._valueHelpDialogSalesOrg);
			}
			this._valueHelpDialogSalesOrg.open();
			// this.oRouter.navTo("CreateSubPlan", {
			// 	action: "COPY",
			// 	salesorganization: selectedData.salesorganization,
			// 	subplanid: selectedData.subplanid,
			// 	status: selectedData.status,
			// 	planversionnum: selectedData.planversionnum
			// });
		},

		//Handle Sales Org. F4 Help functionality Search
		_handleSalesOrgValueHelpSearch: function (oEvt) {
			var sValue = oEvt.getParameters().value;
			var oFilter = new sap.ui.model.Filter(
				"Vkorg",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvt.getSource().getBinding("items").filter([oFilter]);
		},
		//Handle Sales Org. F4 Help functionality Confirm
		_handleSalesOrgValueHelpConfirm: function (oEvt) {
			var oSelectedProduct = oEvt.getParameter("selectedItem");
			selectedData.copiedsalesorg = oSelectedProduct.getTitle();
			oEvt.getSource().getBinding("items").filter();
			this.onNavToNewVersion();
		},
		//Create new version navigation
		onNavToNewVersion: function () {
			this.oRouter.navTo("CreateSubPlan", {
				action: "COPY",
				salesorganization: selectedData.salesorganization,
				subplanid: selectedData.subplanid,
				status: selectedData.status,
				planversionnum: selectedData.planversionnum,
				copiedsalesorg: selectedData.copiedsalesorg
			});
		},
		onNavBack: function () {
			this.oRouter.navTo("Main", {});
		},
		//onNewVersion SubPlan 
		onNewVersion: function (oEvt) {
			// create value help dialog
			if (!this._valueHelpDialogSalesOrg) {
				this._valueHelpDialogSalesOrg = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.SalesOrgF4Help",
					this
				);
				this.getView().addDependent(this._valueHelpDialogSalesOrg);
			}
			this._valueHelpDialogSalesOrg.open();
		},
		//onDelete SubPlan 
		onDelete: function (oEvt) {

		},
		//naigation to Panel Code Fiori Ele App
		onPanelCodePress: function (oEvt) {
			oLogicHelper.navToPanelMaintenance(oEvt.getSource().getText(), oEvt.getSource().getTarget());
		},

		//Navigation to Material Factsheet
		onMaterialLinkPress: function (oEvt) {
			oLogicHelper.navToMaterialFactSheet(oEvt.getSource().getText());
		},
		//navigation Tracking Maintenance app
		onTrackingCodeLinkPress: function (oEvt) {
			oLogicHelper.navToTrackingMaintenance(oEvt.getSource().getText(), oEvt.getSource().getTarget());
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
			/**
			 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
			 * (NOT before the first rendering! onInit() is used for that one!).
			 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.DisplaySubPlan
			 */
			//	onBeforeRendering: function() {
			//
			//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.DisplaySubPlan
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.DisplaySubPlan
		 */
		//	onExit: function() {
		//
		//	}

	});

});