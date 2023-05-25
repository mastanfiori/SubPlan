sap.ui.define([
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/MessageItem",
	"sap/m/MessagePopover",
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/util/formatter",
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/util/LogicHelper",
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/util/Constants"
], function (Controller, JSONModel, oMsgBox, oMsgToast, oMsgItem, oMsgPop, oFormatter, oLogicHelper, Constants) {
	"use strict";
	var oView, i18n, sPath, regFloatExp = /^(?:[1-9]\d*|0)?(?:\.\d+)?$/gm, ///[0-9]+\.[0-9]+$/,
		subPlanAction, that, selectedData, activateFlag, oMsgs = [],
		errorCount, copyFlag, oDataModel, sameErrorCount = 0,
		aFilters = [],
		errorText, oEventSrc, regIntExp = /^[0-9]{1,10}$/g;
	return Controller.extend("com.itell.bradford.ZSD_SUBPLAN_MAINT.controller.CreateSubPlan", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.CreateSubPlan
		 */
		//Calling Formatter 
		oFormatter: oFormatter,
		onInit: function () {
			oView = this.getView();
			that = this;
			oDataModel = this.getOwnerComponent().getModel();
			//Fetch i18n Model
			i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			//Initiate Routing
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.attachRoutePatternMatched(this._handleRouteMatched, this);
			//Object Status Model
			var ObjectStatus = {
				"Text": "",
				"State": i18n.getText("None")
			};
			var ObjectStatusModel = new JSONModel(ObjectStatus);
			oView.setModel(ObjectStatusModel, "ObjectStatusModelCreate");
			// //Local object for the Column Names for valuehelp of Material
			var data = {
				"cols": [{
					"label": i18n.getText("Material"), //Material
					"template": "Material" // Field from the oData servie
						// "width": "5rem"
				}, {
					"label": i18n.getText("MaterialDes"), //Material Des
					"template": "MaterialDescription" // Field from OData Service
				}, {
					"label": i18n.getText("ProductPrice"), // ProdSellPrice
					"template": "ProdSellPrice" // Field from the OData Service
				}, {
					"label": i18n.getText("MaterialSubstitution"), // Material Substitution 
					"template": "MaterialSubstitution" // Field from the OData Service
				}, {
					"label": i18n.getText("MaterialDes"), // Material Substitution Desc
					"template": "MaterialSubstituteDescription" // Field from the OData Service

				}, {
					"label": i18n.getText("MaterialSalesStatus"), // Material Sales Status
					"template": "MaterialSalesStatus" // Field from the OData Service
				}, {
					"label": i18n.getText("MaterialSalesStatusDesc"), // Material Sales Status Desc
					"template": "MaterialSalesStatusDesc" // Field from the OData Service
				}, {
					"label": i18n.getText("TBDFlag"), // TBD Flag
					"template": "TBDFlag" // Field from the OData Service
				}]
			};
			// // create JSON model instance
			this.oColModelforMaterialF4 = new sap.ui.model.json.JSONModel();
			// // set the data for the model
			this.oColModelforMaterialF4.setData(data);
			//Manual trackin code fragment loading.
			if (!this._trackCodeRangeEditDialog2) {
				this._trackCodeRangeEditDialog2 = this.loadFragment({
					name: "com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.TrackCodeManual2"
				});
			}
			//SubPlan Materials fragment loading.
			if (!this._subplanMatEditDialog) {
				this._subplanMatEditDialog = this.loadFragment({
					name: "com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.SubPlanItemsMaterial"
				});
			}
		},
		//triggers when user clicks on Cancel in Tracking Range Dialog
		// ontrackCodeRangeEditDialogCancel: function (oEvt) {
		// 	this._trackCodeRangeEditDialog.close();
		// },
		_handleRouteMatched: function (oEvt) {
			var param = oEvt.getParameter("name");
			if (param !== "CreateSubPlan") {
				return;
			}
			activateFlag = false;
			var routeObj = oEvt.getParameters().arguments;
			selectedData = routeObj;
			subPlanAction = routeObj.action;
			//Item Model
			var array = [],
				oEntry = {},
				oSuccess, oError;
			copyFlag = false;
			// array.push();
			var frontendTrack = new sap.ui.model.json.JSONModel();
			this.getView().setModel(frontendTrack, "FronendTrackCodesData");
			var rangeTrack = new sap.ui.model.json.JSONModel(array);
			this.getView().setModel(rangeTrack, "TrackRangeDataDisplay");
			var manuTrack = new sap.ui.model.json.JSONModel();
			this.getView().setModel(manuTrack, "manualTrackCodesData");
			this.getView().getModel("manualTrackCodesData").setData("");
			var SubPlanItemList = new sap.ui.model.json.JSONModel(array);
			this.getView().setModel(SubPlanItemList, "SubPlanItemList");
			var oPlanVersionModel = new JSONModel();
			this.getView().setModel(oPlanVersionModel, "AvailbleVersionsData");
			oView.byId("ManuTrackBtn2").setType(i18n.getText("Default"));
			// Message Model
			oMsgs = [];
			var e = new JSONModel(oMsgs);
			oView.setModel(e, "oMsgModel");
			//set header data model
			var SubPlanHeader = new sap.ui.model.json.JSONModel();
			this.getView().setModel(SubPlanHeader, "SubPlanHeader");
			if (subPlanAction === "CREATE") {
				//Header Model
				var HeaderObj = {
					"SubPlanID": "", //040858
					"SalesOrganization": routeObj.salesorganization,
					"SubplanName": "",
					"PromoID": "", //514559
					"OfferSeqNbr": "", //1.100
					"PlanID": "",
					"MarketArea": "",
					"MarketAreaDesc": "",
					"TrackingCodeFrom": "V",
					"TrackingCodeTo": "V",
					"BackendTrackCode": "",
					"TrackCodeManualFlag": false,
					"TrackCodeAutoFlag": true,
					"Status": "C",
					"PlanVersionNum": "1",
					"PlanVersionDesc": "",
					"GetStubFlag": false,
					"EditFlag": true,
					"PromoplanFlag": true,
					"ManualSubPlanFlag": true
				};
				oView.getModel("SubPlanHeader").setData(HeaderObj);
				oView.getModel("SubPlanHeader").refresh();
				//set page title
				// oView.byId("ObjectPageLayout").getHeaderTitle().setObjectTitle(i18n.getText("CreateSubPlan"));
				oView.byId("ObjectPageHeader").setText(i18n.getText("CreateSubPlan"));
				//set Object Header Status based on OData received status
				that.setObjectHederStatus(Constants.subPlanShellCreationStatus);
			} else if (subPlanAction === "EDIT") {
				oEntry = {};
				oEntry = {
					"Buttonflag": "DISP",
					"SubPlanID": routeObj.subplanid,
					"SalesOrganization": routeObj.salesorganization,
					"Status": routeObj.status,
					"PlanVersionNum": routeObj.planversionnum,
					"SubplanInboundNav": [{
						"Material": "",
						"SubPlanID": routeObj.subplanid,
						"SubPlanTrackingCodesNav": [{
							"Prodid": "",
							"SubPlanID": "",
							"PlanVersionNum": "",
							"Material": "",
							"ManualTrackingRange": ""
						}]
					}]
				};
				//get Sub Plan Edit data
				sPath = "/SubplanInboundHeadSet";
				that = this;
				var subPlanItems = [],
					manualTrackCodes = [],
					allItemtrackCodes = [];
				var subPlanItemObj = {},
					trackObj = {},
					j;
				oSuccess = function (oData) {
					sap.ui.core.BusyIndicator.hide();
					//prepare Sub Plan items according to UI once we receive data from OData
					subPlanItems = oLogicHelper.prepareSubPlanItems(oData, oView, i18n);
					//set Items
					oView.getModel("SubPlanItemList").setData(subPlanItems);
					oView.getModel("SubPlanItemList").refresh();
					//set Header
					oView.getModel("SubPlanHeader").setProperty("/TrackingCodeFrom", oData.TrackingCodeFrom);
					oView.getModel("SubPlanHeader").setProperty("/TrackingCodeTo", oData.TrackingCodeTo);
					oView.getModel("SubPlanHeader").setProperty("/EditFlag", false);
					oView.getModel("SubPlanHeader").setProperty("/ManualSubPlanFlag", false);
					that._fillSubPlanHeader(oData);
					//set Object Header Status based on OData received status
					that.setObjectHederStatus(oData.Status);
					oView.byId("ObjectPageHeader").setText(i18n.getText("EditSubPlan") + " " + oData.SubPlanID);
				};
				oError = function (error) {
					sap.ui.core.BusyIndicator.hide();
					oView.byId("ObjectPageHeader").setText(i18n.getText("EditSubPlan"));
					// that.ErrorHandling(error);
				};
				sap.ui.core.BusyIndicator.show();
				this.getOwnerComponent().getModel().create(sPath, oEntry, {
					success: oSuccess,
					error: oError
				});
				//get sub plan versions
				oLogicHelper.getSubPlanVersions(routeObj.subplanid, this);
				//set page title
				// oView.byId("ObjectPageLayout").getHeaderTitle().setObjectTitle(i18n.getText("EditSubPlan"));
			} else if (subPlanAction === "COPY") {
				oEntry = {};
				oEntry = {
					"Buttonflag": "COPY",
					"SubPlanID": routeObj.subplanid,
					"SalesOrganization": routeObj.salesorganization,
					"Status": routeObj.status,
					"PlanVersionNum": routeObj.planversionnum,
					"CopiedSalesOrg": routeObj.copiedsalesorg,
					"SubplanInboundNav": [{
						"Material": "",
						"SubPlanID": routeObj.subplanid,
						"SubPlanTrackingCodesNav": [{
							"Prodid": "",
							"SubPlanID": "",
							"PlanVersionNum": "",
							"Material": "",
							"ManualTrackingRange": ""
						}]
					}]
				};
				// //get Sub Plan Edit data
				sPath = "/SubplanInboundHeadSet";
				that = this;
				// var subPlanItems = [];
				// var subPlanItemObj = {};
				oSuccess = function (oData) {
					sap.ui.core.BusyIndicator.hide();
					// 	for (var i = 0; i < oData.SubplanInboundNav.results.length; i++) {
					//set Header
					oView.getModel("SubPlanHeader").setProperty("/EditFlag", true);
					oView.getModel("SubPlanHeader").setProperty("/ManualSubPlanFlag", false);
					that._fillSubPlanHeader(oData);
					//set Object Header Status based on OData received status
					that.setObjectHederStatus(oData.Status);
					//set items if Sub plan is  Non-Promo: 
					//for Promo Sub Plans we no need to copy items
					if (!oData.PromoplanFlag) {
						//prepare Sub Plan items according to UI once we receive data from OData
						subPlanItems = oLogicHelper.prepareSubPlanItems(oData, oView, i18n);
						//set items to UI model
						oView.getModel("SubPlanItemList").setData(subPlanItems);
						oView.getModel("SubPlanItemList").refresh();
					}

				};
				oError = function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				};
				sap.ui.core.BusyIndicator.show();
				this.getOwnerComponent().getModel().create(sPath, oEntry, {
					success: oSuccess,
					error: oError
						// select: "SubPlanID,SalesOrganization,PlanVersionDesc,PromoID,OfferSeqNbr,PlanID,PlanVersionNum,Status"
				});
				//set page title
				// oView.byId("ObjectPageLayout").getHeaderTitle().setObjectTitle(i18n.getText("CreateNewVersionSubPlan"));
				oView.byId("ObjectPageHeader").setText(i18n.getText("EditSubPlan")); //+ " " + oData.SubPlanID);
				//get sub plan versions
				oLogicHelper.getSubPlanVersions(routeObj.subplanid, this);
			}
			//get SalesOrg value help 
			this._getSalesOrgValueHelp();
			//OData call to get Sub Plan Staus items
			this._getSubPlanStatusItems();
			//get Market area value help
			this._getMarketAreaValueHelp();
			//get Segment code value helps
			this._getSegmentCodeValueHelp();
			//get sub segment code value helps
			this._getSubSegmentCodeValueHelp();
			// To hide the back button
			sap.ui.getCore().byId("backBtn").setVisible(true);
		},
		//set Object Header Status based on OData received status
		setObjectHederStatus: function (oStatus) {
			switch (oStatus) {
			case "C":
				oView.getModel("ObjectStatusModelCreate").setProperty("/Text", i18n.getText("CreateShell"));
				oView.getModel("ObjectStatusModelCreate").setProperty("/State", i18n.getText("Information"));
				break;
			case "I":
				oView.getModel("ObjectStatusModelCreate").setProperty("/Text", i18n.getText("Inactive"));
				oView.getModel("ObjectStatusModelCreate").setProperty("/State", i18n.getText("Warning"));
				break;
			case "A":
				oView.getModel("ObjectStatusModelCreate").setProperty("/Text", i18n.getText("Active"));
				oView.getModel("ObjectStatusModelCreate").setProperty("/State", i18n.getText("Success"));
				break;
			case "S":
				oView.getModel("ObjectStatusModelCreate").setProperty("/Text", i18n.getText("Suspended"));
				oView.getModel("ObjectStatusModelCreate").setProperty("/State", i18n.getText("Error"));
				break;
			default:
				oView.getModel("ObjectStatusModelCreate").setProperty("/0/Text", "");
				oView.getModel("ObjectStatusModelCreate").setProperty("/0/State", i18n.getText("None"));
				break;
			}
		},
		//fill Sub Plan header from OData response
		_fillSubPlanHeader: function (oData) {
			//set Header
			oView.getModel("SubPlanHeader").setProperty("/SubPlanID", oData.SubPlanID);
			oView.getModel("SubPlanHeader").setProperty("/SubplanName", oData.SubplanName);
			oView.getModel("SubPlanHeader").setProperty("/SalesOrganization", oData.SalesOrganization);
			oView.getModel("SubPlanHeader").setProperty("/PlanVersionDesc", oData.PlanVersionDesc);
			// oView.getModel("SubPlanHeader").setProperty("/CTN", oData.CTN);
			oView.getModel("SubPlanHeader").setProperty("/RolloutMaterial", oData.RolloutMaterial);
			oView.getModel("SubPlanHeader").setProperty("/RolloutMaterialDes", oData.RolloutMaterialDes);
			oView.getModel("SubPlanHeader").setProperty("/CatalogMaterial", oData.CatalogMaterial);
			oView.getModel("SubPlanHeader").setProperty("/CatalogMaterialDes", oData.CatalogMaterialDes);
			oView.getModel("SubPlanHeader").setProperty("/PromoID", oData.PromoID);
			oView.getModel("SubPlanHeader").setProperty("/OfferSeqNbr", oData.OfferSeqNbr);
			oView.getModel("SubPlanHeader").setProperty("/PlanID", oData.PlanID);
			oView.getModel("SubPlanHeader").setProperty("/PlanVersionNum", oData.PlanVersionNum);
			oView.getModel("SubPlanHeader").setProperty("/Status", oData.Status);
			oView.getModel("SubPlanHeader").setProperty("/MarketArea", oData.MarketArea);
			oView.getModel("SubPlanHeader").setProperty("/MarketAreaDesc", oData.MarketAreaDesc);
			// oView.getModel("SubPlanHeader").setProperty("/SegmentCode", oData.SegmentCode);
			// oView.getModel("SubPlanHeader").setProperty("/SubSegmentCode", oData.SubSegmentCode);
			oView.getModel("SubPlanHeader").setProperty("/PlanID", oData.PlanID);
			oView.getModel("SubPlanHeader").setProperty("/ClntSrvcsTrackingCode", oData.ClntSrvcsTrackingCode);
			oView.getModel("SubPlanHeader").setProperty("/BackendTrackCode", oData.BackendTrackCode);

			// //Defaults header info
			oView.getModel("SubPlanHeader").setProperty("/PromiseDays", oData.PromiseDays);
			oView.getModel("SubPlanHeader").setProperty("/PanelArea", oData.PanelArea);
			oView.getModel("SubPlanHeader").setProperty("/ShipIntervalDaysCC", oData.ShipIntervalDaysCC);
			// if (oData.StaticPromiseDate !== "0000-00-00") {
			// 	oView.getModel("SubPlanHeader").setProperty("/StaticPromiseDate", oData.StaticPromiseDate);
			// }
			oView.getModel("SubPlanHeader").setProperty("/ShipIntervalDayNonCC", oData.ShipIntervalDayNonCC);
			oView.getModel("SubPlanHeader").setProperty("/NumberOfDays", oData.NumberOfDays);
			oView.getModel("SubPlanHeader").setProperty("/PromiseDays", oData.PromiseDays);
			oView.getModel("SubPlanHeader").setProperty("/NumberOfInstalls", oData.NumberOfInstalls);
			oView.getModel("SubPlanHeader").setProperty("/NubrPmtsBefore", oData.NubrPmtsBefore);
			oView.getModel("SubPlanHeader").setProperty("/PurchaseLimit", oData.PurchaseLimit);
			oView.getModel("SubPlanHeader").setProperty("/ConsecutiveReturnCount", oData.ConsecutiveReturnCount);
			oView.getModel("SubPlanHeader").setProperty("/InvAllocationCode", oData.InvAllocationCode);
			oView.getModel("SubPlanHeader").setProperty("/PostageHandling", oData.PostageHandling);
			oView.getModel("SubPlanHeader").setProperty("/PostageHandling2", oData.PostageHandling2);
			oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorState", i18n.getText("None"));
			oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorText", "");
			oView.getModel("SubPlanHeader").setProperty("/SlidingScaleType", oData.SlidingScaleType);
			oView.getModel("SubPlanHeader").setProperty("/CatalogID", oData.CatalogID);
			oView.getModel("SubPlanHeader").setProperty("/Reportbreak", oData.Reportbreak);
			oView.getModel("SubPlanHeader").setProperty("/NumberOfUnits", oData.NumberOfUnits);
			oView.getModel("SubPlanHeader").setProperty("/PercentReturnThres", oData.PercentReturnThres);
			oView.getModel("SubPlanHeader").setProperty("/UnequalFirstInstallment", oData.UnequalFirstInstallment);
			oView.getModel("SubPlanHeader").setProperty("/WEBOEFlag", oData.WEBOEFlag);
			if (oData.Agedtrackingcode === "X") {
				oView.getModel("SubPlanHeader").setProperty("/Agedtrackingcode", true);
			} else if (oData.Agedtrackingcode === "") {
				oView.getModel("SubPlanHeader").setProperty("/Agedtrackingcode", false);
			} else {
				oView.getModel("SubPlanHeader").setProperty("/Agedtrackingcode", false);
			}
			if (oData.CTN === "X") {
				oView.getModel("SubPlanHeader").setProperty("/CTN", true);
			} else if (oData.CTN === "") {
				oView.getModel("SubPlanHeader").setProperty("/CTN", false);
			} else {
				oView.getModel("SubPlanHeader").setProperty("/CTN", false);
			}
			if (oData.PromoplanFlag === "X") {
				oView.getModel("SubPlanHeader").setProperty("/PromoplanFlag", true);
			} else {
				oView.getModel("SubPlanHeader").setProperty("/PromoplanFlag", false);
			}
			//fill all error states
			oView.getModel("SubPlanHeader").setProperty("/PostageHandlingErrorState", i18n.getText("None"));
			oView.getModel("SubPlanHeader").setProperty("/PostageHandlingErrorText", "");
			oView.getModel("SubPlanHeader").setProperty("/BackendTrackCodeErrorState", i18n.getText("None"));
			oView.getModel("SubPlanHeader").setProperty("/BackendTrackCodeErrorText", "");
			oView.getModel("SubPlanHeader").setProperty("/TrackingCodeToErrorState", i18n.getText("None"));
			oView.getModel("SubPlanHeader").setProperty("/TrackingCodeToErrorText", "");
			oView.getModel("SubPlanHeader").setProperty("/TrackingCodeFromErrorState", i18n.getText("None"));
			oView.getModel("SubPlanHeader").setProperty("/TrackingCodeFromErrorText", "");
			oView.getModel("SubPlanHeader").setProperty("/MarketAreaErrorState", i18n.getText("None"));
			oView.getModel("SubPlanHeader").setProperty("/MarketAreaErrorText", "");
			oView.getModel("SubPlanHeader").setProperty("/ClntSrvcsTrackingCodeErrorState", i18n.getText("None"));
			oView.getModel("SubPlanHeader").setProperty("/ClntSrvcsTrackingCodeErrorText", "");
			//category info
			oView.getModel("SubPlanHeader").setProperty("/Category1", oData.Category1);
			oView.getModel("SubPlanHeader").setProperty("/Category2", oData.Category2);
			oView.getModel("SubPlanHeader").setProperty("/Category3", oData.Category3);
			oView.getModel("SubPlanHeader").setProperty("/Category4", oData.Category4);
			oView.getModel("SubPlanHeader").setProperty("/Category5", oData.Category5);
			// create & change log info
			oView.getModel("SubPlanHeader").setProperty("/CreatedByUser", oData.CreatedByUser);
			oView.getModel("SubPlanHeader").setProperty("/CreationDate", oData.CreationDate);
			oView.getModel("SubPlanHeader").setProperty("/CreationTime", oData.CreationTime);
			oView.getModel("SubPlanHeader").setProperty("/ChangeUser", oData.ChangeUser);
			oView.getModel("SubPlanHeader").setProperty("/ChangeDate", oData.ChangeDate);
			oView.getModel("SubPlanHeader").setProperty("/ChangeTime", oData.ChangeTime);
		},
		//oData call for Market area value help
		_getMarketAreaValueHelp: function () {
			sPath = "/MarketAreaF4HelpSet";
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					var marketAreaF4Model = new JSONModel(response.results);
					oView.setModel(marketAreaF4Model, "marketAreaF4Collection");
				})
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					// // that.ErrorHandling(error);
				});
		},
		//oData call for Segement Code value help
		_getSegmentCodeValueHelp: function () {
			sPath = "/SegmentCodeF4HelpSet";
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					var segmentCodeF4Model = new JSONModel(response.results);
					oView.setModel(segmentCodeF4Model, "segmentCodeF4Collection");
				})
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					that.ErrorHandling(error);
				});
		},
		//oData call for Segement Code value help
		_getSubSegmentCodeValueHelp: function () {
			sPath = "/SubSegmentCodeF4HelpSet";
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					var subSegmentCodeF4Model = new JSONModel(response.results);
					oView.setModel(subSegmentCodeF4Model, "subSegmentCodeF4Collection");
				})
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				});
		},
		//oData call for SalesOrg value help
		_getSalesOrgValueHelp: function () {
			sPath = "/SalesOrgHelpSet";
			// var sFilters = [];
			// that = this;
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					var salesOrgF4Model = new JSONModel(response.results);
					oView.setModel(salesOrgF4Model, "salesOrgCollection");
				})
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				});
		},
		//oData call for Sub Plan Status Items
		_getSubPlanStatusItems: function () {
			sPath = "/StatusRangeSet";
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					var statusModel = new JSONModel(response.results);
					oView.setModel(statusModel, "subPlanStatusItems");
				})
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					that.ErrorHandling(error);
				});
		},

		onHeaderSubPlanSwitchChange: function (oEvt) {
			var oState = oEvt.getParameters().state;
			if (oState) {
				oView.getModel("SubPlanHeader").setProperty("/PromoplanFlag", true);
				//delete all items if Sub Plan is not created
				if (oView.getModel("SubPlanHeader").getProperty("/SubPlanID") === "") {
					var planItem = this.getView().getModel("SubPlanItemList");
					var postArray = [];
					planItem.setData(postArray);
				}
			} else {
				oView.getModel("SubPlanHeader").setProperty("/PromoplanFlag", false);
			}
		},
		//on Segment Code value Help
		handleValueHelpSegmentCode: function (oEvt) {
			this.inputId = oEvt.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialogSegmentCode) {
				this._valueHelpDialogSegmentCode = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.SegmentCodeF4Help",
					this
				);
				this.getView().addDependent(this._valueHelpDialogSegmentCode);
			}
			this._valueHelpDialogSegmentCode.open();
		},
		//on Sub Segment Code value Help
		handleValueHelpSubSegmentCode: function (oEvt) {
			this.inputId = oEvt.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialogSubSegmentCode) {
				this._valueHelpDialogSubSegmentCode = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.SubSegmentCodeF4Help",
					this
				);
				this.getView().addDependent(this._valueHelpDialogSubSegmentCode);
			}
			this._valueHelpDialogSubSegmentCode.open();
		},
		//to handle segment code value help confirm
		_handleSegCodeValueHelpConfirm: function (oEvt) {
			var oSelectedProduct = oEvt.getParameter("selectedItem");
			if (oSelectedProduct) {
				var oInput = this.byId(this.inputId);
				sPath = oInput.getBindingContext("SubPlanItemList").getPath();
				oView.getModel("SubPlanItemList").setProperty(sPath + "/SegmentCode", oSelectedProduct.getTitle());
				oView.getModel("SubPlanItemList").setProperty(sPath + "/SegmentDescrip", oSelectedProduct.getDescription());
				oView.getModel("SubPlanItemList").setProperty(sPath + "/SegmentCodeState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty(sPath + "/SegmentCodeStateText", "");
				this.removeMessagePopoverObject(i18n.getText("SegmentCode"));
				oEvt.getSource().getBinding("items").filter();
			}
		},
		//to handle search in Segmend code value help
		_handleSegCodeValueHelpSearch: function (oEvt) {
			var sValue = oEvt.getParameters().value;
			var oFilter = new sap.ui.model.Filter(
				"Value",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvt.getSource().getBinding("items").filter([oFilter]);
		},
		//to handle sub segment code value help confirm
		_handleSubSegCodeValueHelpConfirm: function (oEvt) {
			var oSelectedProduct = oEvt.getParameter("selectedItem");
			if (oSelectedProduct) {
				var oInput = this.byId(this.inputId);
				sPath = oInput.getBindingContext("SubPlanItemList").getPath();
				oView.getModel("SubPlanItemList").setProperty(sPath + "/SubSegmentCode", oSelectedProduct.getTitle());
				oView.getModel("SubPlanItemList").setProperty(sPath + "/SubSegmentDescrip", oSelectedProduct.getDescription());
				oView.getModel("SubPlanItemList").setProperty(sPath + "/SubSegmentCodeState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty(sPath + "/SubSegmentCodeStateText", "");
				this.removeMessagePopoverObject(i18n.getText("SubSegmentCode"));
				oEvt.getSource().getBinding("items").filter();
			}
		},
		//to handle search in Sub segmend code value help
		_handleSubSegCodeValueHelpSearch: function (oEvt) {
			var sValue = oEvt.getParameters().value;
			var oFilter = new sap.ui.model.Filter(
				"Value",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvt.getSource().getBinding("items").filter([oFilter]);
		},
		//on Sales Org. Value help click
		handleValueHelpSalesOrg: function (oEvt) {
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
			var sInputValue = oSelectedProduct.getTitle();
			oView.getModel("SubPlanHeader").setProperty("/SalesOrganization", sInputValue);
			oView.byId("soInput").setValueState("None");
			oView.byId("soInput").setValueStateText("");
			this.removeMessagePopoverObject(i18n.getText("salesorganization"));
			oEvt.getSource().getBinding("items").filter();
			activateFlag = false;
		},
		//to handle sales Org change
		handleSalesOrgChange: function (oEvt) {
			var oValue = oEvt.getParameters().newValue;
			var oInput = oEvt.getSource();
			activateFlag = false;
			var salesOrgs = [];
			if (oValue.trim() === "" || oValue === undefined) {
				oInput.setValueState(i18n.getText("Error"));
				oInput.setValueStateText(i18n.getText("InvalidEntry"));
			} else {
				var salesOrgData = oView.getModel("salesOrgCollection").getData();
				salesOrgs = $.grep(salesOrgData, function (ele) {
					if (ele.Vkorg === oValue) {
						return ele;
					}
				});
				if (salesOrgs.length === 0) {
					oInput.setValueState(i18n.getText("Error"));
					oInput.setValueStateText(i18n.getText("InvalidEntry"));
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"InvalidEntry"));
				} else {
					oInput.setValueState(i18n.getText("None"));
					oInput.setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
			}
		},
		//remove non error from msg model
		removeMessagePopoverObject: function (name) {
			oMsgs = oMsgs.filter(function (obj) {
				return obj.key !== name;
			});
			oView.getModel("oMsgModel").setData(oMsgs);
		},
		//Method to fill Message Pop over
		fillMessagePopover: function (type, key, name, subtitle, description, groupName) {
			//check if msg already exists or not based on name
			var msgExists = true;
			var oMsgModel = oView.getModel("oMsgModel").getData();
			if (oMsgModel.length > 0) {
				for (var i = 0; i < oMsgModel.length; i++) {
					if (oMsgModel[i].key === key) {
						msgExists = false;
						return;
					}
				}
			}
			if (msgExists) {
				if (groupName === undefined) {
					groupName = "UI";
				}
				var oMessageTemplate = {
					"type": type,
					"key": key,
					"title": name,
					"subtitle": subtitle,
					"description": description,
					"groupName": groupName
				};
				oMsgs.push(oMessageTemplate);
				oView.getModel("oMsgModel").setData(oMsgs);
				oView.getModel("oMsgModel").refresh(true);
			}
		},
		// to handle Market area value change
		onMarketAreaChange: function (oEvt) {
			var oValue = oEvt.getParameters().newValue;
			var oInput = oEvt.getSource();
			activateFlag = false;
			var mAreas = [];
			if (oValue.trim() === "" || oValue === undefined) {
				oInput.setValueState(i18n.getText("Error"));
				oInput.setValueStateText(i18n.getText("InvalidEntry"));
			} else {
				oValue = oValue.toUpperCase();
				var mAreasData = oView.getModel("marketAreaF4Collection").getData();
				mAreas = $.grep(mAreasData, function (ele) {
					if (ele.Mvgr1 === oValue) {
						return ele;
					}
				});
				if (mAreas.length === 0) {
					oInput.setValueState(i18n.getText("Error"));
					oInput.setValueStateText(i18n.getText("InvalidEntry"));
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"InvalidEntry"));
				} else {
					oInput.setValueState(i18n.getText("None"));
					oInput.setValueStateText("");
					oView.getModel("SubPlanHeader").setProperty("/MarketArea", oValue);
					oView.getModel("SubPlanHeader").setProperty("/MarketAreaDesc", mAreas[0].Bezei);
					this.removeMessagePopoverObject(oEvt.getSource().getName());
					oView.byId("TrackingCodeFromInp").fireLiveChange();
					oView.byId("TrackingCodeToInp").fireLiveChange();
				}
			}
		},
		//Sliding Scale type value help click
		onScaleTypeF4: function (oEvt) {
			// create value help dialog
			if (!this._valueHelpDialogScaleType) {
				this._valueHelpDialogScaleType = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.SlidingScaleTypeF4Help",
					this
				);
				this.getView().addDependent(this._valueHelpDialogScaleType);
			}
			this._valueHelpDialogScaleType.open();
		},
		//Handle Sliding Scale Type Help functionality Confirm
		_handleSSTValueHelpConfirm: function (oEvt) {
			var oSelectedProduct = oEvt.getParameter("selectedItem");
			var sInputValue = oSelectedProduct.getTitle();
			oView.getModel("SubPlanHeader").setProperty("/SlidingScaleType", sInputValue);
			oEvt.getSource().getBinding("items").filter();
			activateFlag = false;
		},
		//Handle Sliding Scale Type functionality Search
		_handleSSTValueHelpSearch: function (oEvt) {
			var sValue = oEvt.getParameters().value;
			var oFilter = new sap.ui.model.Filter(
				"Value",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvt.getSource().getBinding("items").filter([oFilter]);
		},
		//Catalog ID value help click
		onCatalogIDF4: function (oEvt) {
			var salesOrg = oView.getModel("SubPlanHeader").getProperty("/SalesOrganization");
			var oFilter = new sap.ui.model.Filter(
				"SalesOrganization",
				sap.ui.model.FilterOperator.EQ, salesOrg
			);
			// create value help dialog
			if (!this._valueHelpDialogCatalogIDF4Help) {
				this._valueHelpDialogCatalogIDF4Help = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.CatalogIDF4Help",
					this
				);
				this.getView().addDependent(this._valueHelpDialogCatalogIDF4Help);
			}
			this._valueHelpDialogCatalogIDF4Help.getBinding("items").filter([oFilter]);
			this._valueHelpDialogCatalogIDF4Help.open();
		},
		//Handle Calatlog IDe Help functionality Confirm
		_handleCatalogIDValueHelpConfirm: function (oEvt) {
			var oSelectedProduct = oEvt.getParameter("selectedItem");
			var sInputValue = oSelectedProduct.getTitle();
			oView.getModel("SubPlanHeader").setProperty("/CatalogID", sInputValue);
			oEvt.getSource().getBinding("items").filter();
			activateFlag = false;
		},
		//Handle Calatlog ID functionality Search
		_handleCatalogIDValueHelpSearch: function (oEvt) {
			var sValue = oEvt.getParameters().value;
			var oFilter = new sap.ui.model.Filter(
				"CatalogID",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvt.getSource().getBinding("items").filter([oFilter]);
		},
		//on Item Material Value Help Click
		onMaterialF4: function (oEvt) {
			this.inputId = oEvt.getSource().getId();
			this.matInput = oEvt.getSource();
			this._oBasicSearchField = new sap.m.SearchField({
				showSearchButton: false
			});

			var aCols = this.oColModelforMaterialF4.getData().cols;
			// create value help dialog
			// if (!this._valueHelpDialogMaterial) {
			this._valueHelpDialogMaterial = sap.ui.xmlfragment(
				"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.MaterialF4Help",
				this
			);
			this.getView().addDependent(this._valueHelpDialogMaterial);
			this._valueHelpDialogMaterial.getFilterBar().setBasicSearch(false);
			this._valueHelpDialogMaterial.getTableAsync().then(function (oTable) {
				oTable.setModel(this.oProductsModel);
				oTable.setSelectionMode("Single");
				oTable.setModel(this.oColModelforMaterialF4, "columns");
				var salesOrg = oView.getModel("SubPlanHeader").getProperty("/SalesOrganization");
				var aFilters = [];
				aFilters.push(new sap.ui.model.Filter({
					path: "SalesOrganization",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: salesOrg
				}));
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/MaterialF4HelpSet",
						filters: aFilters
					});
				}
				if (oTable.bindItems) {
					oTable.bindAggregation("items", {
						path: "/MaterialF4HelpSet",
						template: function () {
							return new sap.m.ColumnListItem({
								cells: aCols.map(function (column) {
									return new sap.m.Label({
										text: "{" + column.template + "}"
									});
								})
							});
						},
						filters: aFilters
					});
					// oTable.bindAggregation("items", "/MaterialF4HelpSet", function () {
					// 	return new sap.m.ColumnListItem({
					// 		cells: aCols.map(function (column) {
					// 			return new sap.m.Label({
					// 				text: "{" + column.template + "}"
					// 			});
					// 		})
					// 	});
					// });
				}
				// oTable.getBinding("items").filter(aFilters);
				this._valueHelpDialogMaterial.update();
			}.bind(this));
			// }
			this._valueHelpDialogMaterial.open();
		},
		//to Handle Material F4 filter bar search
		onFilterBarSearch: function (oEvent) {
			var aFilters = [];
			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					if (oControl.getName() !== "TBDFlag") {
						aResult.push(new sap.ui.model.Filter({
							path: oControl.getName(),
							operator: sap.ui.model.FilterOperator.Contains,
							value1: oControl.getValue()
						}));
					} else {
						aResult.push(new sap.ui.model.Filter({
							path: oControl.getName(),
							operator: sap.ui.model.FilterOperator.EQ,
							value1: oControl.getValue()
						}));
					}

				}

				return aResult;
			}, []);
			if (aFilters.length === 0) {
				aFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter({
							path: "MaterialDescription",
							operator: sap.ui.model.FilterOperator.Contains,
							value1: sSearchQuery
						}),
						new sap.ui.model.Filter({
							path: "Material",
							operator: sap.ui.model.FilterOperator.Contains,
							value1: sSearchQuery
						}),
						new sap.ui.model.Filter({
							path: "MaterialSubstitution",
							operator: sap.ui.model.FilterOperator.Contains,
							value1: sSearchQuery
						}),
						new sap.ui.model.Filter({
							path: "MaterialSalesStatus",
							operator: sap.ui.model.FilterOperator.Contains,
							value1: sSearchQuery
						})
					],
					and: false
				}));
			}
			//sales organization filter
			var salesOrg = oView.getModel("SubPlanHeader").getProperty("/SalesOrganization");
			aFilters.push(new sap.ui.model.Filter({
				path: "SalesOrganization",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: salesOrg
			}));
			this._filterTable(new sap.ui.model.Filter({
				filters: aFilters,
				and: true
			}));
		},
		//Filtering the table data based on search
		_filterTable: function (oFilter) {
			var oValueHelpDialog = this._valueHelpDialogMaterial;
			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}
				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}
				oValueHelpDialog.update();
			});
		},
		_onValueHelpAfterClose: function () {
			this._valueHelpDialogMaterial.destroy();
		},
		//to handle material value help confirm for both item level material & header level rollout material
		_handleMaterialValueHelpConfirm: function (oEvt) {
			// var oSelectedProduct = oEvt.getParameter("selectedItem");
			var matTab = oEvt.getSource().getTable();
			var selectedIndex = matTab.getSelectedIndex();
			var selectedConText = "";
			if (this.matInput.getName() === i18n.getText("CatalogMaterial")) {
				if (selectedIndex != -1) {
					selectedConText = matTab.getContextByIndex(selectedIndex).getObject();
					oView.getModel("SubPlanHeader").setProperty("/CatalogMaterial", selectedConText.Material);
					oView.getModel("SubPlanHeader").setProperty("/CatalogMaterialDes", selectedConText.MaterialDescription);
					this.matInput.setValueState(i18n.getText("None"));
					this.matInput.setValueStateText("");
				}
			} else if (this.matInput.getName() === i18n.getText(
					"RolloutMaterial")) {
				// this.removeMessagePopoverObject(i18n.getText("RolloutMaterial"));
				if (selectedIndex != -1) {
					selectedConText = matTab.getContextByIndex(selectedIndex).getObject();
					oView.getModel("SubPlanHeader").setProperty("/RolloutMaterial", selectedConText.Material);
					oView.getModel("SubPlanHeader").setProperty("/RolloutMaterialDes", selectedConText.MaterialDescription);
					this.matInput.setValueState(i18n.getText("None"));
					this.matInput.setValueStateText("");
				}
			} else {
				this.removeMessagePopoverObject(i18n.getText("Material"));
				if (selectedIndex != -1) {
					selectedConText = matTab.getContextByIndex(selectedIndex).getObject();
					var oInput = this.byId(this.inputId);
					sPath = oInput.getBindingContext("SubPlanItemList").getPath();
					oView.getModel("SubPlanItemList").setProperty(sPath + "/Material", selectedConText.Material);
					oView.getModel("SubPlanItemList").setProperty(sPath + "/MaterialDescription", selectedConText.MaterialDescription);
					oView.getModel("SubPlanItemList").setProperty(sPath + "/ProdSellPrice", selectedConText.ProdSellPrice);
					oView.getModel("SubPlanItemList").setProperty(sPath + "/MaterialSubstitution", selectedConText.MaterialSubstitution);
					oView.getModel("SubPlanItemList").setProperty(sPath + "/TBDFlag", selectedConText.TBDFlag);
					oView.getModel("SubPlanItemList").setProperty(sPath + "/MaterialSalesStatusDesc", selectedConText.MaterialSalesStatusDesc);
					oView.getModel("SubPlanItemList").setProperty(sPath + "/MaterialSalesStatus", selectedConText.MaterialSalesStatus);
					oView.getModel("SubPlanItemList").setProperty(sPath + "/MaterialState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty(sPath + "/MaterialValText", "");

				}
			}
			oEvt.getSource().close();
			// oEvt.getSource().getBinding("items").filter();
		},
		//to handle search in material value help
		_handleMaterialValueHelpSearch: function (oEvt) {
			var sValue = oEvt.getParameters().value;
			var oFilter = new sap.ui.model.Filter(
				"Material",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			var oFilter2 = new sap.ui.model.Filter("MaterialDescription", sap.ui.model.FilterOperator.Contains, sValue);
			var final = new sap.ui.model.Filter({
				filters: [oFilter, oFilter2],
				and: false
			});
			oEvt.getSource().getBinding("items").filter([final]);
		},
		//Market Area Value Help Click
		handleValueHelpMarketArea: function (oEvt) {
			// create value help dialog
			if (!this._valueHelpDialogMarketArea) {
				this._valueHelpDialogMarketArea = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.MarketAreaF4Help",
					this
				);
				this.getView().addDependent(this._valueHelpDialogMarketArea);
			}
			this._valueHelpDialogMarketArea.open();
		},
		//Handle Market Area functionality Search
		_handleMarketAreaValueHelpSearch: function (oEvt) {
			var sValue = oEvt.getParameters().value;
			var oFilter = new sap.ui.model.Filter(
				"Mvgr1",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvt.getSource().getBinding("items").filter([oFilter]);
		},
		//Handle  Market Area Help functionality Confirm
		_handleMarketAreaValueHelpConfirm: function (oEvt) {
			var oSelectedProduct = oEvt.getParameter("selectedItem");
			var sInputValue = oSelectedProduct.getTitle();
			oView.getModel("SubPlanHeader").setProperty("/MarketArea", sInputValue);
			oView.getModel("SubPlanHeader").setProperty("/MarketAreaDesc", oSelectedProduct.getDescription());
			oView.byId("marketAreaInp").setValueState("None");
			oView.byId("marketAreaInp").setValueStateText("");
			this.removeMessagePopoverObject(i18n.getText("MarketArea"));
			oEvt.getSource().getBinding("items").filter();
			activateFlag = false;
			oView.byId("TrackingCodeFromInp").fireLiveChange();
			oView.byId("TrackingCodeToInp").fireLiveChange();
		},

		//Catalog Material Value Help Click
		onCatalogMaterialF4: function (oEvt) {
			// create value help dialog
			if (!this._valueHelpDialogCatalogMaterial) {
				this._valueHelpDialogCatalogMaterial = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.CatalogMaterialF4Help",
					this
				);
				this.getView().addDependent(this._valueHelpDialogCatalogMaterial);
			}
			this._valueHelpDialogCatalogMaterial.open();
		},
		//Handle Market Area functionality Search
		_handleCatalogMatValueHelpSearch: function (oEvt) {
			var sValue = oEvt.getParameters().value;
			var oFilter = new sap.ui.model.Filter(
				"Material",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvt.getSource().getBinding("items").filter([oFilter]);
		},
		//Handle  Market Area Help functionality Confirm
		_handleCatalogMaterialValueHelpConfirm: function (oEvt) {
			var marketArea = oView.getModel("SubPlanHeader").getProperty("/MarketArea");
			if (marketArea === "" || marketArea === undefined || marketArea === null) {
				oMsgBox.information(i18n.getText("enterMarketAreaFirst"));
				oEvt.getSource().setValue("");
				return;
			}
			var oSelectedProduct = oEvt.getParameter("selectedItem");
			var sInputValue = oSelectedProduct.getTitle();
			oView.getModel("SubPlanHeader").setProperty("/CatalogMaterial", sInputValue);
			oView.getModel("SubPlanHeader").setProperty("/CatalogMaterialDes", oSelectedProduct.getDescription());
			oEvt.getSource().getBinding("items").filter();
			activateFlag = false;
			oView.byId("TrackingCodeFromInp").fireLiveChange();
			oView.byId("TrackingCodeToInp").fireLiveChange();
		},

		//below method with Promo Planning Sub Plan deletion with check box
		onSubPlanItemDelete: function (oEvt) {
			sPath = oEvt.getSource().getBindingContext("SubPlanItemList").sPath.split("/")[1];
			if (oEvt.getParameters().selected) {
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/Status", i18n.getText("Error"));
			} else {
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/Status", i18n.getText("None"));
			}
			// oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/DeletionFlag", oEvt.getParameters().selected);
			// oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/StatusText", "Deleted");
			activateFlag = false;
		},
		//manual sub plan deletion when Sub plan with out Promo Planning
		onSubPlanManualItemDelete: function (oEvt) {
			var PanelUITable = oView.byId("idSubPlanItemTab");
			oMsgBox.show(i18n.getText("DeleteConfirm"), {
				icon: oMsgBox.Icon.WARNING,
				title: i18n.getText("Delete"),
				actions: [oMsgBox.Action.YES, oMsgBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === oMsgBox.Action.YES) {
						// Fetch deleted item index
						var index = PanelUITable.getSelectedIndex();
						//delete item
						oView.getModel("SubPlanItemList").getData().splice(index, 1);
						oView.getModel("SubPlanItemList").refresh();
						if (oView.getModel("SubPlanItemList").getData().length === 0) {
							oView.byId("subPlanManDeleteBtn").setEnabled(false);
						}
					}
				}
			});
		},
		//on CTN flag selection
		onCTNSelectionChange: function (oEvt) {
			var oSelectedState = oEvt.getParameters().state;
			var oSelectedValue;
			if (oSelectedState) {
				oSelectedValue = "X";
			} else {
				oSelectedValue = "";
			}
			var oSelect = oEvt.getSource();
			var planVersions = [];
			// if (oSelectedValue === "X") {

			var planVersionsData = oView.getModel("AvailbleVersionsData").getData();
			planVersions = $.grep(planVersionsData, function (ele) {
				if (ele.CTN === Constants.lc_x) {
					return ele;
				}
			});
			if (planVersions.length > 0) {
				oMsgBox.error(i18n.getText("OneVersionCTNAlreadyExisted"));
				oSelect.setState(false);
			}
			// if (planVersions.length === 0) {
			// 	// oSelect.setValueState(i18n.getText("None"));
			// 	// oSelect.setValueStateText("");
			// 	this.removeMessagePopoverObject(oEvt.getSource().getName());
			// } else {
			// 	// oSelect.setValueState(i18n.getText("Error"));
			// 	// oSelect.setValueStateText(i18n.getText("OneVersionCTNAlreadyExisted"));
			// 	this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
			// 		"OneVersionCTNAlreadyExisted"));
			// }
			// }
		},
		//on sub plan version change
		onPlanVersionChange: function (oEvt) {
			var oValue = oEvt.getParameters().newValue;
			var oInput = oEvt.getSource();
			activateFlag = false;
			var planVersions = [];
			if (oValue.trim() === "" || oValue === undefined) {
				oInput.setValueState(i18n.getText("Error"));
				oInput.setValueStateText(i18n.getText("InvalidEntry"));
			} else {
				var planVersionsData = oView.getModel("AvailbleVersionsData").getData();
				planVersions = $.grep(planVersionsData, function (ele) {
					if (ele.PlanVersionNum === oValue) {
						return ele;
					}
				});
				if (planVersions.length === 0) {
					oInput.setValueState(i18n.getText("None"));
					oInput.setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				} else {
					oInput.setValueState(i18n.getText("Error"));
					oInput.setValueStateText(i18n.getText("VersionAlreadyExisted"));
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"VersionAlreadyExisted"));
				}
			}
		},
		//triggers when user clicks on Apply All
		onApplyAll: function (oEvt) {
			var oHeader = oView.getModel("SubPlanHeader").getData();
			if (oHeader.SubPlanID === "") {
				return;
			}
			var oItems = oView.getModel("SubPlanItemList").getData();
			var totalAmount;
			for (var i = 0; i < oItems.length; i++) {
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/NumberOfInstalls", oHeader.NumberOfInstalls);

				oView.getModel("SubPlanItemList").setProperty("/" + i + "/InvAllocationCode", oHeader.InvAllocationCode);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PostageHandling", oHeader.PostageHandling);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PostageHandlingErrorState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PostageHandlingErrorText", "");
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PostageHandling2", oHeader.PostageHandling2);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PostageHandling2ErrorState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PostageHandling2ErrorText", "");
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PurchaseLimit", oHeader.PurchaseLimit);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PromiseDays", oHeader.PromiseDays);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PromiseDaysState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PromiseDaysStateText", "");
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/NumberOfDays", oHeader.NumberOfDays);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/PanelArea", oHeader.PanelArea);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/NubrPmtsBefore", oHeader.NubrPmtsBefore);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDaysCC", oHeader.ShipIntervalDaysCC);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDaysCCValState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDaysCCValText", "");
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDayNonCC", oHeader.ShipIntervalDayNonCC);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDayNonCCValState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDayNonCCValText", "");
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/Category1", oHeader.Category1);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/Category2", oHeader.Category2);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/Category3", oHeader.Category3);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/Category4", oHeader.Category4);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/Category5", oHeader.Category5);

				//calculate  Amount Paid Trigger
				totalAmount = parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + i + "/PostageHandling")) +
					parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + i + "/ProdSellPrice"));
				totalAmount = oFormatter.formatFloat(totalAmount);
				oView.getModel("SubPlanItemList").setProperty("/" + i + "/ProdAmtPaidTrigger", totalAmount);
				//fill first installment
				// if (parseFloat(oHeader.UnequalFirstInstallment) === 0) {
				// oView.getModel("SubPlanItemList").setProperty("/" + i + "/UnequalFirstInstallment", oHeader.UnequalFirstInstallment);
				//fill first installment amount
				this._fillFirstInstallment(i);
				// } else {
				// 	oView.getModel("SubPlanItemList").setProperty("/" + i + "/UnequalFirstInstallment", oHeader.UnequalFirstInstallment);
				// 	oView.getModel("SubPlanItemList").setProperty("/" + i + "/FirstInstallAmt", oHeader.UnequalFirstInstallment);
				// }

				//set static promise mini date
				// this._setStaticPromiseMiniDate(oHeader.PromiseDays, i);
			}
			this.removeMessagePopoverObject(i18n.getText("Numberinstalls"));
			this.removeMessagePopoverObject(i18n.getText("PHPrice"));
			this.removeMessagePopoverObject(i18n.getText("MultiPHPrice"));
			this.removeMessagePopoverObject(i18n.getText("PromiseDays"));
			this.removeMessagePopoverObject(i18n.getText("ShipIntervalCC"));
			this.removeMessagePopoverObject(i18n.getText("ShipIntervalNonCC"));
		},
		onInputChange: function () {
			activateFlag = false;
		},
		onManualTrackCodeChange: function (oEvt) {
			activateFlag = false;
			var trackExp = "^[a-zA-Z0-9]+$";
			var oVal = this.getView().getModel("manualTrackCodesData").getData(); //oEvt.getSource().getValue();
			oEventSrc = this.byId("ManualTrackCodeInp");//oEvt.getSource();
			oView.getModel("SubPlanHeader").setProperty("/PerformTrackValidationFlag", Constants.lc_x);
			var marketArea = oView.getModel("SubPlanHeader").getProperty("/MarketArea");
			var oHeaderModel = oView.getModel("SubPlanHeader");
			if (marketArea === "" || marketArea === undefined || marketArea === null) {
				oMsgBox.warning(i18n.getText("enterMarketAreaFirst"));
				oEventSrc.setValue("");
				return;
			}
			if (oVal.trim() !== "" && oVal !== undefined) {
				oEventSrc.setValue(oVal.toUpperCase());
				oVal = oEventSrc.getValue();
				oVal = oVal.replaceAll('\t','');
				var result = oEventSrc.getValue().split(/\r?\n/);
				errorCount = 0;
				var errorMsg = "";
				// for (var i = 0; i < result.length; i++) {
				// 	if (result[i]) {
				aFilters = [];
				aFilters.push(new sap.ui.model.Filter("PlanVersionNum", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().PlanVersionNum));
				aFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SubPlanID));
				aFilters.push(new sap.ui.model.Filter("OfferSeqNbr", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().OfferSeqNbr));
				aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SalesOrganization));
				aFilters.push(new sap.ui.model.Filter("MarketArea", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().MarketArea));
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().CatalogMaterial));
				aFilters.push(new sap.ui.model.Filter("AgedTrackingCode", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().Agedtrackingcode));
				// if (!result[i].match(trackExp)) {
				// 	errorCount += 1;
				// 	errorMsg = errorMsg + result[i] + Constants.newLine;
				// }
				sPath = "/FieldValidationSet";
				aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, "MANUALTRACKINGRANGE"));
				aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, oVal));
				that = this;
				sap.ui.core.BusyIndicator.show();
				oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
					.then(function (response) {
						sap.ui.core.BusyIndicator.hide();
						var errorText = "";
						sameErrorCount = 0;
						that.removeMessagePopoverObject(oEventSrc.getName());
						for (var i = 0; i < response.results.length; i++) {
							if (response.results[i].Message1.Type === "E") {
								sameErrorCount += 1;
								errorText = errorText + response.results[i].Message1.Message + ": " + response.results[i].FieldValue + Constants.newLine;
								// errorText.push(response.results[i].Message1.MessageV1 + ": " + response.results[i].FieldValue + Constants.newLine);
								oView.byId("ManuTrackBtn2").setType(i18n.getText("Reject"));
							}
						}
						if (sameErrorCount > 0) {
							that.fillMessagePopover(i18n.getText("Error"), oEventSrc.getName(), oEventSrc.getName(), errorText, errorText, "UI");
							oEventSrc.setValueState(i18n.getText("Error"));
							oEventSrc.setValueStateText(i18n.getText("InvalidEntry"));
							oView.byId("ManuTrackBtn2").setType(i18n.getText("Reject"));
						} else {
							that.removeMessagePopoverObject(oEventSrc.getName());
							oEventSrc.setValueState(i18n.getText("None"));
							oEventSrc.setValueStateText("");
							oView.byId("ManuTrackBtn2").setType(i18n.getText("Accept"));
						}
					})
					.catch(function (error) {
						sap.ui.core.BusyIndicator.hide();
						// that.ErrorHandling(error);
					});
				// 	}
				// }
				// if (errorCount > 0) {
				// 	errorMsg = i18n.getText("InvalidManualTrackicodes") + Constants.newLine + errorMsg;
				// 	this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(),
				// 		i18n.getText("InvalidManualTrackicodes"), errorMsg);
				// 	// that.fillMessagePopover(i18n.getText("Error"), errorText, response.results[0].Message1.MessageV1,
				// 	// 	response.results[0].Message1.Message, response.results[0].Message1.Message, "UI");
				// } else {
				// 	this.removeMessagePopoverObject(oEvt.getSource().getName());
				// }
			} else {
				this.removeMessagePopoverObject(oEventSrc.getName());
				oEventSrc.setValueState(i18n.getText("None"));
				oEventSrc.setValueStateText("");
				oView.byId("ManuTrackBtn2").setType(i18n.getText("Default"));
			}
			oEvt.getSource().getParent().close();
		},
		onTrackingCodeChange: function (oEvt) {
			activateFlag = false;
			oView.getModel("SubPlanHeader").setProperty("/PerformTrackValidationFlag", Constants.lc_x);
			var trackExp = "^[a-zA-Z0-9]+$";
			var oVal = oEvt.getSource().getValue();
			var marketArea = oView.getModel("SubPlanHeader").getProperty("/MarketArea");
			if (marketArea === "" || marketArea === undefined || marketArea === null) {
				oMsgBox.information(i18n.getText("enterMarketAreaFirst"));
				oEvt.getSource().setValue("");
				return;
			}
			// var subPlanItems = oView.getModel("SubPlanItemList").getData();
			// if (subPlanItems.length === 0) {
			// 	oMsgBox.information(i18n.getText("SubPlanItemsMustForFronendTrack"));
			// 	oEvt.getSource().setValue("");
			// 	return;
			// }
			if (oVal.trim() !== "" && oVal !== undefined) {
				oEvt.getSource().setValue(oVal.toUpperCase());
				if (!oVal.match(trackExp)) {
					if (oEvt.getSource().getName() === i18n.getText("ManualTrackCode")) {
						oView.byId("ManuTrackBtn").setType(i18n.getText("Reject"));
					}
					oEvt.getSource().setValueState(i18n.getText("Error"));
					oEvt.getSource().setValueStateText(i18n.getText("InvalidEntry"));
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"InvalidEntry"));
				} else {
					if (oEvt.getSource().getName() === i18n.getText("ManualTrackCode")) {
						oEvt.getSource().setValueState(i18n.getText("None"));
						if (oEvt.getSource().getValueStateText() === i18n.getText("InvalidEntry")) {
							oEvt.getSource().setValueStateText("");
						}
						sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
						if (sameErrorCount === 0) {
							this.removeMessagePopoverObject(oEvt.getSource().getName());
							this.removeMessagePopoverObject(i18n.getText("DuplicateTrackingCodes"));
							// oView.byId("ManuTrackBtn").setType(i18n.getText("Accept"));
						}
						this._TrackingODataValidation(oEvt);
					} else {
						this.removeMessagePopoverObject(oEvt.getSource().getName());
						this.removeMessagePopoverObject(i18n.getText("DuplicateTrackingCodes"));
						//Do OData validation for tracking
						this._TrackingODataValidation(oEvt);
					}

				}
			} else {
				errorText = oEvt.getSource().getValueStateText(); // + oEvt.getSource().getName();
				this.removeMessagePopoverObject(errorText);
				oEvt.getSource().setValueState(i18n.getText("None"));
				oEvt.getSource().setValueStateText();
			}
		},
		_TrackingODataValidation: function (oEvt) {
			var oHeaderModel = oView.getModel("SubPlanHeader");
			var oVal = oEvt.getSource().getValue();
			oEventSrc = oEvt.getSource();
			errorText = oEvt.getSource().getValueStateText();
			aFilters = [];
			aFilters.push(new sap.ui.model.Filter("PlanVersionNum", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().PlanVersionNum));
			aFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SubPlanID));
			aFilters.push(new sap.ui.model.Filter("OfferSeqNbr", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().OfferSeqNbr));
			aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SalesOrganization));
			aFilters.push(new sap.ui.model.Filter("MarketArea", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().MarketArea));
			aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().CatalogMaterial));
			aFilters.push(new sap.ui.model.Filter("AgedTrackingCode", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().Agedtrackingcode));
			switch (oEvt.getSource().getName()) {
			case i18n.getText("CustSrvTrackingCode"):
				sPath = "/FieldValidationSet";
				aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, "CLNTSRVCSTRACKINGCODE"));
				aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, oVal));
				that = this;
				sap.ui.core.BusyIndicator.show();
				oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
					.then(function (response) {
						sap.ui.core.BusyIndicator.hide();
						var errorMsg = "";
						var warningMsg = "";
						for (var i = 0; i < response.results.length; i++) {
							if (response.results[i].Message1.Type === "E") {
								errorMsg = errorMsg + Constants.newLine + response.results[i].Message1.Message;
							} else if (response.results[i].Message1.Type === "W") {
								warningMsg = warningMsg + Constants.newLine + response.results[i].Message1.Message;
							}
						}
						if (errorMsg !== "") {
							that.removeMessagePopoverObject(errorText);
							// response.results[0].Message1.MessageV1 +
							errorText = oEventSrc.getName();
							that.fillMessagePopover(i18n.getText("Error"), errorText, errorText,
								errorMsg, errorMsg, "UI");
							oEventSrc.setValueState(i18n.getText("Error"));
							oEventSrc.setValueStateText(i18n.getText("InvalidTrackingCodeEntry"));
						} else if (warningMsg !== "") {
							errorText = oEventSrc.getName() + i18n.getText("Warning");
							that.removeMessagePopoverObject(errorText);
							that.fillMessagePopover(i18n.getText("Warning"), errorText, errorText,
								warningMsg, warningMsg, "UI");
							oEventSrc.setValueState(i18n.getText("Warning"));
							oEventSrc.setValueStateText(i18n.getText("InvalidTrackingCodeEntry"));
						} else {
							errorText = oEventSrc.getName();
							oEventSrc.setValueState(i18n.getText("None"));
							oEventSrc.setValueStateText("");
							that.removeMessagePopoverObject(errorText);
						}
					})
					.catch(function (error) {
						sap.ui.core.BusyIndicator.hide();
						// that.ErrorHandling(error);
					});
				break;
			case i18n.getText("BackendTrackingCode"):
				sPath = "/FieldValidationSet";
				aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, "BACKENDTRACKINGCODE"));
				aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, oVal));
				that = this;
				sap.ui.core.BusyIndicator.show();
				oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
					.then(function (response) {
						sap.ui.core.BusyIndicator.hide();
						var errorMsg = "";
						var warningMsg = "";
						for (var i = 0; i < response.results.length; i++) {
							if (response.results[i].Message1.Type === "E") {
								errorMsg = errorMsg + Constants.newLine + response.results[i].Message1.Message;
							} else if (response.results[i].Message1.Type === "W") {
								warningMsg = warningMsg + Constants.newLine + response.results[i].Message1.Message;
							}
						}
						if (errorMsg !== "") {
							that.removeMessagePopoverObject(errorText);
							// response.results[0].Message1.MessageV1 +
							errorText = oEventSrc.getName();
							that.fillMessagePopover(i18n.getText("Error"), errorText, errorText,
								errorMsg, errorMsg, "UI");
							oEventSrc.setValueState(i18n.getText("Error"));
							oEventSrc.setValueStateText(i18n.getText("InvalidTrackingCodeEntry"));
						} else if (warningMsg !== "") {
							errorText = oEventSrc.getName() + i18n.getText("Warning");
							that.removeMessagePopoverObject(errorText);
							that.fillMessagePopover(i18n.getText("Warning"), errorText, errorText,
								warningMsg, warningMsg, "UI");
							oEventSrc.setValueState(i18n.getText("Warning"));
							oEventSrc.setValueStateText(i18n.getText("InvalidTrackingCodeEntry"));
						} else {
							errorText = oEventSrc.getName();
							oEventSrc.setValueState(i18n.getText("None"));
							oEventSrc.setValueStateText("");
							that.removeMessagePopoverObject(errorText);
						}
					})
					.catch(function (error) {
						sap.ui.core.BusyIndicator.hide();
						// that.ErrorHandling(error);
					});
				break;
			case i18n.getText("TrackingCodeFrom"):
				sPath = "/FieldValidationSet";
				aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, "TRACKINGRANGE"));
				aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, oVal));
				that = this;
				sap.ui.core.BusyIndicator.show();
				oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
					.then(function (response) {
						sap.ui.core.BusyIndicator.hide();
						var errorMsg = "";
						var warningMsg = "";
						for (var i = 0; i < response.results.length; i++) {
							if (response.results[i].Message1.Type === "E") {
								errorMsg = errorMsg + Constants.newLine + response.results[i].Message1.Message;
							} else if (response.results[i].Message1.Type === "W") {
								warningMsg = warningMsg + Constants.newLine + response.results[i].Message1.Message;
							}
						}
						if (errorMsg !== "") {
							that.removeMessagePopoverObject(errorText);
							// response.results[0].Message1.MessageV1 +
							errorText = oEventSrc.getName();
							that.fillMessagePopover(i18n.getText("Error"), errorText, errorText,
								errorMsg, errorMsg, "UI");
							oEventSrc.setValueState(i18n.getText("Error"));
							oEventSrc.setValueStateText(i18n.getText("InvalidTrackingCodeEntry"));
						} else if (warningMsg !== "") {
							errorText = oEventSrc.getName() + i18n.getText("Warning");
							that.removeMessagePopoverObject(errorText);
							that.fillMessagePopover(i18n.getText("Warning"), errorText, errorText,
								warningMsg, warningMsg, "UI");
							oEventSrc.setValueState(i18n.getText("Warning"));
							oEventSrc.setValueStateText(i18n.getText("InvalidTrackingCodeEntry"));
						} else {
							errorText = oEventSrc.getName();
							oEventSrc.setValueState(i18n.getText("None"));
							oEventSrc.setValueStateText("");
							that.removeMessagePopoverObject(errorText);
						}
					})
					.catch(function (error) {
						sap.ui.core.BusyIndicator.hide();
						// that.ErrorHandling(error);
					});
				//do Tracking code with first material validation
				// this._TrackingFirstMaterialODataValidation(oEvt);
				break;
			case i18n.getText("TrackingCodeTo"):
				sPath = "/FieldValidationSet";
				aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, "TRACKINGRANGE"));
				aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, oVal));
				that = this;
				sap.ui.core.BusyIndicator.show();
				oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
					.then(function (response) {
						sap.ui.core.BusyIndicator.hide();
						var errorMsg = "";
						var warningMsg = "";
						for (var i = 0; i < response.results.length; i++) {
							if (response.results[i].Message1.Type === "E") {
								errorMsg = errorMsg + Constants.newLine + response.results[i].Message1.Message;
							} else if (response.results[i].Message1.Type === "W") {
								warningMsg = warningMsg + Constants.newLine + response.results[i].Message1.Message;
							}
						}
						if (errorMsg !== "") {
							that.removeMessagePopoverObject(errorText);
							// response.results[0].Message1.MessageV1 +
							errorText = oEventSrc.getName();
							that.fillMessagePopover(i18n.getText("Error"), errorText, errorText,
								errorMsg, errorMsg, "UI");
							oEventSrc.setValueState(i18n.getText("Error"));
							oEventSrc.setValueStateText(i18n.getText("InvalidTrackingCodeEntry"));
						} else if (warningMsg !== "") {
							errorText = oEventSrc.getName() + i18n.getText("Warning");
							that.removeMessagePopoverObject(errorText);
							that.fillMessagePopover(i18n.getText("Warning"), errorText, errorText,
								warningMsg, warningMsg, "UI");
							oEventSrc.setValueState(i18n.getText("Warning"));
							oEventSrc.setValueStateText(i18n.getText("InvalidTrackingCodeEntry"));
						} else {
							errorText = oEventSrc.getName();
							oEventSrc.setValueState(i18n.getText("None"));
							oEventSrc.setValueStateText("");
							that.removeMessagePopoverObject(errorText);
						}
					})
					.catch(function (error) {
						sap.ui.core.BusyIndicator.hide();
						// // that.ErrorHandling(error);
					});
				//do Tracking code with first material validation
				// this._TrackingFirstMaterialODataValidation(oEvt);
				break;
			case i18n.getText("ManualTrackCode"):
				sPath = "/FieldValidationSet";
				aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, "MANUALTRACKINGRANGE"));
				aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, oVal));
				that = this;
				sap.ui.core.BusyIndicator.show();
				oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
					.then(function (response) {
						sap.ui.core.BusyIndicator.hide();
						if (response.results[0].Message1.Type === "E") {
							that.removeMessagePopoverObject(errorText);
							errorText = response.results[0].Message1.MessageV1 + oEventSrc.getName();
							that.fillMessagePopover(i18n.getText("Error"), errorText, response.results[0].Message1.MessageV1,
								response.results[0].Message1.Message, response.results[0].Message1.Message, "UI");
							oEventSrc.setValueState(i18n.getText("Error"));
							oEventSrc.setValueStateText(errorText);
							oView.byId("ManuTrackBtn").setType(i18n.getText("Reject"));
						} else if (response.results[0].Message1.Type === "W") {
							that.removeMessagePopoverObject(errorText);
							errorText = response.results[0].Message1.MessageV1 + oEventSrc.getName();
							that.fillMessagePopover(i18n.getText("Warning"), errorText, response.results[0].Message1.MessageV1,
								response.results[0].Message1.Message, response.results[0].Message1.Message, "UI");
							oEventSrc.setValueState(i18n.getText("Warning"));
							oEventSrc.setValueStateText(errorText);
						} else {
							oEventSrc.setValueState(i18n.getText("None"));
							oEventSrc.setValueStateText("");
							sameErrorCount = that._checkAnotherSameODATAErrorExists(oEventSrc.getName(), errorText);
							if (sameErrorCount === 0) {
								that.removeMessagePopoverObject(errorText);
							}
							oView.byId("ManuTrackBtn").setType(i18n.getText("Accept"));
						}
					})
					.catch(function (error) {
						sap.ui.core.BusyIndicator.hide();
						// that.ErrorHandling(error);
					});
				//do Tracking code with first material validation
				// this._TrackingFirstMaterialODataValidation(trackingCode, material);
				break;
			}
		},
		onTrackingCodeManual: function () {
			// create value help dialog
			if (!this._trackCodeRangeEditDialog) {
				this._trackCodeRangeEditDialog = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.TrackCodeManual",
					this
				);
				this.getView().addDependent(this._trackCodeRangeEditDialog);
			}
			this._trackCodeRangeEditDialog.open();
		},
		onTrackingCodeManual2: function () {
			//check for items, if no items, raise error
			var subPlanItems = oView.getModel("SubPlanItemList").getData();
			if (subPlanItems.length === 0) {
				oMsgBox.information(i18n.getText("SubPlanItemsMustForManualTrack"));
				return;
			}
			// create value help dialog
			// if (!this._trackCodeRangeEditDialog2) {
			// 	this._trackCodeRangeEditDialog2 = sap.ui.xmlfragment(
			// 		oView.getId(),
			// 		"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.TrackCodeManual2",
			// 		this
			// 	);
			// 	this.getView().addDependent(this._trackCodeRangeEditDialog2);
			// }
			// if (!this._trackCodeRangeEditDialog2) {
			// 	this._trackCodeRangeEditDialog2 = this.loadFragment({
			// 		name: "com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.TrackCodeManual2"
			// 	});
			// }

			this._trackCodeRangeEditDialog2.then(function (oDialog) {
				oDialog.open();
			});
			// this._trackCodeRangeEditDialog2.open();
		},
		//adding item in sub plan items for Manual Plan
		onSubPlanItemAdd: function (oEvt) {
			var subPlanID = oView.getModel("SubPlanHeader").getProperty("/SubPlanID");
			if (subPlanID === "" || subPlanID === null || subPlanID === undefined) {
				return;
			}
			var planItem = this.getView().getModel("SubPlanItemList");
			var postArray = planItem.getData();
			var obj = oLogicHelper.getSubPlanItemObject(this);
			//if Items length is zero : make prod seq num is 1
			if (planItem.getData().length === 0) {
				obj.ProdSeqNum = "1";
			}else{
				var seqNum = parseInt(postArray[postArray.length - 1].ProdSeqNum);
				seqNum = seqNum + 1;
				obj.ProdSeqNum = seqNum.toString();
			}
			postArray.push(obj);
			planItem.setData(postArray);
			// oView.byId("subPlanManDeleteBtn").setEnabled(true);
		},

		//Mass uploading of Material into Items
		onSubPlanAddMaterials: function (oEvt) {
			//check if items has empty seq number or not, if yes then ask them to enter Prod Seq num first
			var planItems = this.getView().getModel("SubPlanItemList").getData();
			var emptyItems = [];
			emptyItems = planItems.filter(function (obj) {
				return obj.ProdSeqNum === "";
			});
			if (emptyItems.length > 0) {
				oMsgToast.show(i18n.getText("enterProdSeqNumberToCopyMats"));
				return;
			}
			this._subplanMatEditDialog.then(function (oDialog) {
				oDialog.open();
			});
		},
		//When users add, new materials by click on Add new Materials button and copy materials
		onSubPlanNewMaterialsCopy: function (oEvt) {
			var result = this.byId("spMat").getValue().split(/\r?\n/);
			var salesOrg = oView.getModel("SubPlanHeader").getProperty("/SalesOrganization");
			this._subplanMatEditDialog.then(function (oDialog) {
				oDialog.close();
			});
			this.byId("spMat").setValue();
			// this.getView().getModel("subplanMaterialData").setData("");
			if (result.length > 0) {
				var obj = {},
					mats = [];
				for (var i = 0; i < result.length; i++) {
					obj = {};
					if (result[i].trim().length > 0) {
						result[i] = result[i].replaceAll('\t','');
						obj.Material = result[i];
						mats.push(obj);
					}
				}
				if (mats.length === 0) {
					return;
				}
				var oEntry = {
					"Material": "TG11",
					"SalesOrganization": salesOrg,
					"NavToMaterialDeep": mats
				};
				sPath = "/MaterialDummyHdrSet";
				that = this;
				var oSuccess = function (oData) {
					sap.ui.core.BusyIndicator.hide();
					var copiedMatsModel = new JSONModel();
					copiedMatsModel.setData(oData.NavToMaterialDeep.results);
					this.getView().setModel(copiedMatsModel, "CopiedMatsConfrmDisplay");
					this._openCopiedMaterialsTab();
				}.bind(this);
				var oError = function (error) {
					sap.ui.core.BusyIndicator.hide();
				};
				sap.ui.core.BusyIndicator.show();
				this.getOwnerComponent().getModel().create(sPath, oEntry, {
					success: oSuccess,
					error: oError
				});
			}
		},
		_openCopiedMaterialsTab: function () {
			// create dialog
			if (!this._copiedMatsConfrmDialog) {
				this._copiedMatsConfrmDialog = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.CopiedMaterialsConfirmation",
					this
				);
				this.getView().addDependent(this._copiedMatsConfrmDialog);
			}
			this._copiedMatsConfrmDialog.open();
		},
		//on Copied Materials Delete Dialouge
		onCopiedMaterialsDelete: function (oEvt) {
			var matsListUITable = oEvt.getSource().getParent().getParent();
			var oSelectedIndices = matsListUITable.getSelectedIndices();
			var matsData = this.getView().getModel("CopiedMatsConfrmDisplay").getData();
			matsData = matsData.filter(function (value, index) {
				return oSelectedIndices.indexOf(index) == -1;
			});
			that.getView().getModel("CopiedMatsConfrmDisplay").setData(matsData);
			that.getView().getModel("CopiedMatsConfrmDisplay").refresh();
			matsListUITable.clearSelection();
		},
		//on Copied Materilas Confirmation Dialouge
		onCopiedMatsConfrmDialogOK: function (oEvt) {
			var obj = {},
				seqNum,
				errorMats = [];
			var planItem = this.getView().getModel("SubPlanItemList");
			var postArray = planItem.getData();
			//get sorted sub plan items based on Prod Seq number
			postArray = oLogicHelper.getSubPlanSortedItems(postArray);
			var copiedMaterials = this.getView().getModel("CopiedMatsConfrmDisplay").getData();
			//check if copied materials has any error status if yes then don't process, 
			//show message to delete error status records
			errorMats = copiedMaterials.filter(function (obj) {
				return obj.Status === i18n.getText("Error");
			});
			if (errorMats.length > 0) {
				oMsgToast.show(i18n.getText("errorMatsDelete"));
				return;
			}

			for (var i = 0; i < copiedMaterials.length; i++) {
				obj = {};
				obj = oLogicHelper.getSubPlanItemObject(this);
				//Add Material Information
				obj.Material = copiedMaterials[i].Material;
				obj.MaterialDescription = copiedMaterials[i].MaterialDescription;
				obj.MaterialSubstitution = copiedMaterials[i].MaterialSubstitution;
				obj.MaterialSubstituteDescription = copiedMaterials[i].MaterialSubstituteDescription;
				obj.TBDFlag = copiedMaterials[i].TBDFlag;
				obj.MaterialSalesStatus = copiedMaterials[i].MaterialSalesStatus;
				obj.MaterialSalesStatusDesc = copiedMaterials[i].MaterialSalesStatusDesc;
				//if Items length is zero : make prod seq num is 1
				if (planItem.getData().length === 0) {
					obj.ProdSeqNum = "1";
				} else {
					//get the latest prod seq number n do increment from there
					seqNum = parseInt(postArray[postArray.length - 1].ProdSeqNum);
					seqNum = seqNum + 1;
					obj.ProdSeqNum = seqNum.toString();
				}

				postArray.push(obj);
			}
			planItem.setData(postArray);
			this.getView().getModel("SubPlanItemList").refresh();
			this._copiedMatsConfrmDialog.close();
			// this.getView().getModel()
		},
		//adding Item in manual tracking code
		onAddItem: function (oEvt) {
			var jsItem = this.getView().getModel("manualTrackCodesData");
			var postArray = jsItem.getData();
			var obj = {
				"TrackingCode": "",
				"TCValueState": i18n.getText("None"),
				"TCValueText": ""
			};
			postArray.push(obj);
			jsItem.setData(postArray);
		},
		onTrackRangeItemDelete: function (oEvt) {
			var bindPath;
			var oPath = oEvt.getParameter("listItem");
			// Fetching deleted path
			if (oPath) {
				bindPath = oPath.getBindingContext("manualTrackCodesData").getPath();
			} else {
				var _itemTable = this.getView().getContent()[0].getContent()[1];
				var _listItem = _itemTable.getItems()[0];
				bindPath = _listItem.getBindingContext("manualTrackCodesData").getPath();
			}
			// Fetch deleted item index
			var index = bindPath.split("/")[1];
			//delete item
			this.getView().getModel("manualTrackCodesData").getData().splice(index, 1);
			this.getView().getModel("manualTrackCodesData").refresh();
			if (this.getView().getModel("manualTrackCodesData").getData().length === 0) {
				oView.byId("ManuTrackBtn").setType(i18n.getText("Default"));
			}
		},
		onGetStubInfo: function () {
			activateFlag = false;
			// array.push(obj);
			// array.push(obj2);
			// array.push(obj3);
			//OData Payload, get Data from CPI using OData Deep entity
			// {
			// 	"Buttonflag": "G",
			// 	"Status": "",
			// 	"Salesorganization": "1750",
			// 	"Subplanid": "1212",
			// 	"Planversionnum": "12",
			// 	"PlanVersionDesc": "",
			// 	"Planid": "12",
			// 	"Promoid": "12",
			// 	"SubplanInboundNav": [{
			// 		"Material": "TG12",
			// 		"Subplanid": "1212",
			// 		"Offerseqnbr": "3.00",
			// 		"Trackingcode": "1212"
			// 	}]
			// }
			var oHeader = oView.getModel("SubPlanHeader").getData();
			if (oHeader.SubPlanID === "") {
				return;
			}
			//only inactive, shell creation, suspened sub plans are stubbed:
			//Active sub plans cannot be stubbed directly, need to make them suspened then do stub
			if (oHeader.Status === "A") {
				oMsgBox.information(i18n.getText("ActiveStubMsg"));
				return;
			}
			var subPlanItems = oView.getModel("SubPlanItemList").getData();
			// var trackingData = oView.getModel("TrackRangeDataDisplay").getData();
			var itemObj = {},
				oItems = [],
				i;
			// trackObj = {},
			// oTracks = [],
			// t;
			for (i = 0; i < subPlanItems.length; i++) {
				itemObj = {};
				itemObj.SubItemInternalID = subPlanItems[i].SubItemInternalID;
				itemObj.SubPlanID = oHeader.SubPlanID;
				itemObj.ProdID = subPlanItems[i].ProdID;
				itemObj.Material = subPlanItems[i].Material;
				itemObj.MaterialSubstitution = subPlanItems[i].MaterialSubstitution;
				itemObj.CatalogMaterial = subPlanItems[i].CatalogMaterial;
				itemObj.MaterialDescription = subPlanItems[i].MaterialDescription;
				itemObj.ProdSeqNum = subPlanItems[i].ProdSeqNum;
				itemObj.TrackingCode = subPlanItems[i].TrackingCode;
				itemObj.PanelArea = subPlanItems[i].PanelArea;
				itemObj.PanelCode = subPlanItems[i].PanelCode;
				itemObj.ProdSellPrice = subPlanItems[i].ProdSellPrice;
				itemObj.PostageHandling = subPlanItems[i].PostageHandling;
				itemObj.PostageHandling2 = subPlanItems[i].PostageHandling2;
				itemObj.ProdAmtPaidTrigger = subPlanItems[i].ProdAmtPaidTrigger;
				itemObj.FreeProduct = subPlanItems[i].FreeProduct;
				itemObj.NumberOfInstalls = subPlanItems[i].NumberOfInstalls;
				itemObj.FirstInstallAmt = subPlanItems[i].FirstInstallAmt;
				itemObj.InvAllocationCode = subPlanItems[i].InvAllocationCode;
				itemObj.TmpltLineNbr = subPlanItems[i].TmpltLineNbr;
				itemObj.OfferSeqNbr = subPlanItems[i].OfferSeqNbr;
				itemObj.DeletionFlag = subPlanItems[i].DeletionFlag;
				itemObj.TBDFlag = subPlanItems[i].TBDFlag;
				itemObj.PromiseDays = subPlanItems[i].PromiseDays;
				itemObj.NumberOfDays = subPlanItems[i].NumberOfDays;
				itemObj.PurchaseLimit = subPlanItems[i].PurchaseLimit;
				itemObj.SegmentCode = subPlanItems[i].SegmentCode;
				itemObj.SegmentDescrip = subPlanItems[i].SegmentDescrip;
				itemObj.SubSegmentCode = subPlanItems[i].SubSegmentCode;
				itemObj.SubSegmentDescrip = subPlanItems[i].SubSegmentDescrip;
				itemObj.NubrPmtsBefore = subPlanItems[i].NubrPmtsBefore;
				itemObj.StaticPromiseDate = subPlanItems[i].StaticPromiseDate;
				itemObj.ShipIntervalDayNonCC = subPlanItems[i].ShipIntervalDayNonCC;
				itemObj.ShipIntervalDaysCC = subPlanItems[i].ShipIntervalDaysCC;
				itemObj.UnequalFirstInstallment = subPlanItems[i].UnequalFirstInstallment;
				itemObj.Category1 = subPlanItems[i].Category1;
				itemObj.Category2 = subPlanItems[i].Category2;
				itemObj.Category3 = subPlanItems[i].Category3;
				itemObj.Category4 = subPlanItems[i].Category4;
				itemObj.Category5 = subPlanItems[i].Category5;
				// //add tracking codes
				// if (itemObj.ProdSeqNum === "1") {
				// 	// add manual tracking codes to Item array
				// 	for (t = 0; t < manualTrackCodes.length; t++) {
				// 		trackObj = {};
				// 		trackObj.Prodid = subPlanItems[i].ProdID;
				// 		trackObj.SubPlanID = oHeader.SubPlanID;
				// 		trackObj.PlanVersionNum = oHeader.PlanVersionNum;
				// 		trackObj.Material = subPlanItems[i].Material;
				// 		trackObj.ManualTrackingRange = manualTrackCodes[t].TrackingCode;
				// 		oTracks.push(trackObj);
				// 	}
				// 	// add Range Tracking Codes to Item array
				// 	for (t = 0; t < trackCodeRange.length; t++) {
				// 		trackObj = {};
				// 		trackObj.Prodid = subPlanItems[i].ProdID;
				// 		trackObj.SubPlanID = oHeader.SubPlanID;
				// 		trackObj.PlanVersionNum = oHeader.PlanVersionNum;
				// 		trackObj.Material = subPlanItems[i].Material;
				// 		trackObj.TrackingRange = trackCodeRange[t].TrackingCode;
				// 		oTracks.push(trackObj);
				// 	}

				// 	itemObj.SubPlanTrackingCodesNav = oTracks;
				// }
				oItems.push(itemObj);
			}
			//calculate number of items if status is shell creation or Inactive
			if (oHeader.Status === Constants.subPlanShellCreationStatus ||
				oHeader.Status === Constants.subPlanInactiveStatus) {
				var ctrlength = oItems.filter(function (item) {
					return !item.DeletionFlag;
				}).length;
				oView.getModel("SubPlanHeader").setProperty("/NumberOfUnits", ctrlength.toString());
			} else {
				oView.getModel("SubPlanHeader").setProperty("/NumberOfUnits", oItems.length.toString());
			}
			var oEntry = {
				"Buttonflag": "STUB",
				"Status": oHeader.Status,
				"SalesOrganization": oHeader.SalesOrganization,
				"SubplanName": oHeader.SubplanName,
				"OfferSeqNbr": oHeader.OfferSeqNbr,
				"SubPlanID": oHeader.SubPlanID, //  "040858",
				"PromoID": oHeader.PromoID, //"514559",
				"PlanVersionDesc": oHeader.PlanVersionDesc,
				"PlanID": oHeader.PlanID,
				"PlanVersionNum": oHeader.PlanVersionNum,
				"MarketArea": oHeader.MarketArea,
				"ClntSrvcsTrackingCode": oHeader.ClntSrvcsTrackingCode,
				"BackendTrackCode": oHeader.BackendTrackCode,
				"SegmentCode": oHeader.SegmentCode,
				"SubSegmentCode": oHeader.SubSegmentCode,
				"PromiseDays": oHeader.PromiseDays,
				"PanelArea": oHeader.PanelArea,
				"NumberOfDays": oHeader.NumberOfDays,
				"NumberOfInstalls": oHeader.NumberOfInstalls,
				"NubrPmtsBefore": oHeader.NubrPmtsBefore,
				"PurchaseLimit": oHeader.PurchaseLimit,
				"InvAllocationCode": oHeader.InvAllocationCode,
				// "AmtPaidTriggPercent": oHeader.AmtPaidTriggPercent,
				"ShipIntervalDaysCC": oHeader.ShipIntervalDaysCC,
				"TrackingCodeFrom": oHeader.TrackingCodeFrom,
				"TrackingCodeTo": oHeader.TrackingCodeTo,
				// "StaticPromiseDate": oHeader.StaticPromiseDate,
				"ShipIntervalDayNonCC": oHeader.ShipIntervalDayNonCC,
				"ConsecutiveReturnCount": oHeader.ConsecutiveReturnCount,
				"PostageHandling": oHeader.PostageHandling,
				"PostageHandling2": oHeader.PostageHandling2,
				"CatalogID": oHeader.CatalogID,
				"Reportbreak": oHeader.Reportbreak,
				"SlidingScaleType": oHeader.SlidingScaleType,
				"NumberOfUnits": oHeader.NumberOfUnits, //oItems.length.toString(),
				"PercentReturnThres": oHeader.PercentReturnThres,
				"Category1": oHeader.Category1,
				"Category2": oHeader.Category2,
				"Category3": oHeader.Category3,
				"Category4": oHeader.Category4,
				"Category5": oHeader.Category5,
				"UnequalFirstInstallment": oHeader.UnequalFirstInstallment,
				"WEBOEFlag": oHeader.WEBOEFlag,
				"RolloutMaterial": oHeader.RolloutMaterial,
				"RolloutMaterialDes": oHeader.RolloutMaterialDes,
				"CatalogMaterial": oHeader.CatalogMaterial,
				"CatalogMaterialDes": oHeader.CatalogMaterialDes,
				"PerformTrackValidationFlag": oHeader.PerformTrackValidationFlag,
				"SubplanInboundNav": {
					"results": oItems
						// [{
						// 	"Material": "",
						// 	"SubPlanID": "",
						// 	"OfferSeqNbr": "3.00",
						// 	"TrackingCode": ""
						// }]
				}
			};
			if (oHeader.CTN) {
				oEntry.CTN = "X";
			} else {
				oEntry.CTN = "";
			}
			if (oHeader.Agedtrackingcode) {
				oEntry.Agedtrackingcode = "X";
			} else {
				oEntry.Agedtrackingcode = "";
			}
			if (oHeader.PromoplanFlag) {
				oEntry.PromoplanFlag = "X";
			} else {
				oEntry.PromoplanFlag = "";
			}
			//oData call to Get Stub Informations
			sPath = "/SubplanInboundHeadSet";
			that = this;
			subPlanItems = [];
			var subPlanItemObj = {};
			var oSuccess = function (oData) {
				sap.ui.core.BusyIndicator.hide();
				if (oData.Buttonflag !== "E") {
					// for (i = 0; i < oData.SubplanInboundNav.results.length; i++) {
					// 	subPlanItemObj = {};
					// 	subPlanItemObj.SubItemInternalID = oData.SubplanInboundNav.results[i].SubItemInternalID;
					// 	subPlanItemObj.SubPlanID = oData.SubplanInboundNav.results[i].SubPlanID;
					// 	subPlanItemObj.ProdID = oData.SubplanInboundNav.results[i].ProdID;
					// 	subPlanItemObj.Material = oData.SubplanInboundNav.results[i].Material;
					// 	subPlanItemObj.MaterialSubstitution = oData.SubplanInboundNav.results[i].MaterialSubstitution;
					// 	subPlanItemObj.MaterialDescription = oData.SubplanInboundNav.results[i].MaterialDescription;
					// 	subPlanItemObj.PanelArea = oData.SubplanInboundNav.results[i].PanelArea;
					// 	subPlanItemObj.PanelCode = oData.SubplanInboundNav.results[i].PanelCode;
					// 	subPlanItemObj.ProdSeqNum = oData.SubplanInboundNav.results[i].ProdSeqNum;
					// 	subPlanItemObj.ProdSellPrice = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].ProdSellPrice);
					// 	subPlanItemObj.ProdSellPriceCopy = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].ProdSellPrice);
					// 	subPlanItemObj.ProdSellPriceErrorState = "None";
					// 	subPlanItemObj.ProdSellPriceErrorText = "";
					// 	subPlanItemObj.PostageHandling = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].PostageHandling);
					// 	subPlanItemObj.PostageHandlingErrorState = "None";
					// 	subPlanItemObj.PostageHandlingErrorText = "";
					// 	subPlanItemObj.PostageHandling2 = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].PostageHandling2);
					// 	subPlanItemObj.PostageHandling2ErrorState = "None";
					// 	subPlanItemObj.PostageHandling2ErrorText = "";
					// 	subPlanItemObj.ProdAmtPaidTrigger = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].ProdAmtPaidTrigger);
					// 	subPlanItemObj.ProdAmtPaidTriggerErrorState = "None";
					// 	subPlanItemObj.ProdAmtPaidTriggerErrorText = "";
					// 	subPlanItemObj.FreeProduct = oData.SubplanInboundNav.results[i].FreeProduct;
					// 	subPlanItemObj.FreeProductState = i18n.getText("None");
					// 	subPlanItemObj.NumberOfInstalls = oData.SubplanInboundNav.results[i].NumberOfInstalls;
					// 	subPlanItemObj.NumberOfInstallsState = i18n.getText("None");
					// 	subPlanItemObj.NumberOfInstallsErrorText = "";
					// 	subPlanItemObj.NubrPmtsBefore = oData.SubplanInboundNav.results[i].NubrPmtsBefore;
					// 	subPlanItemObj.NubrPmtsBeforeState = i18n.getText("None");
					// 	subPlanItemObj.NubrPmtsBeforeErrorText = "";
					// 	subPlanItemObj.FirstInstallAmt = oData.SubplanInboundNav.results[i].FirstInstallAmt;
					// 	subPlanItemObj.InvAllocationCode = oData.SubplanInboundNav.results[i].InvAllocationCode;
					// 	subPlanItemObj.TmpltLineNbr = oData.SubplanInboundNav.results[i].TmpltLineNbr;
					// 	subPlanItemObj.OfferSeqNbr = oData.SubplanInboundNav.results[i].OfferSeqNbr;
					// 	subPlanItemObj.PurchaseLimit = oData.SubplanInboundNav.results[i].PurchaseLimit;
					// 	subPlanItemObj.SegmentCode = oData.SubplanInboundNav.results[i].SegmentCode;
					// 	subPlanItemObj.SegmentDescrip = oData.SubplanInboundNav.results[i].SegmentDescrip;
					// 	subPlanItemObj.SubSegmentCode = oData.SubplanInboundNav.results[i].SubSegmentCode;
					// 	subPlanItemObj.SubSegmentDescrip = oData.SubplanInboundNav.results[i].SubSegmentDescrip;
					// 	subPlanItemObj.SegmentCodeState = i18n.getText("None");
					// 	subPlanItemObj.SegmentCodeStateText = "";
					// 	subPlanItemObj.SubSegmentCodeState = i18n.getText("None");
					// 	subPlanItemObj.SubSegmentCodeStateText = "";
					// 	subPlanItemObj.PromiseDays = oData.SubplanInboundNav.results[i].PromiseDays;
					// 	subPlanItemObj.NumberOfDays = oData.SubplanInboundNav.results[i].NumberOfDays;
					// 	subPlanItemObj.DeletionFlag = oData.SubplanInboundNav.results[i].DeletionFlag;
					// 	subPlanItemObj.TBDFlag = oData.SubplanInboundNav.results[i].TBDFlag;
					// 	subPlanItemObj.ShipIntervalDaysCC = oData.SubplanInboundNav.results[i].ShipIntervalDaysCC;
					// 	subPlanItemObj.ShipIntervalDayNonCC = oData.SubplanInboundNav.results[i].ShipIntervalDayNonCC;
					// 	subPlanItemObj.MaterialSalesStatusDesc = oData.SubplanInboundNav.results[i].MaterialSalesStatusDesc;
					// 	subPlanItemObj.MaterialSalesStatus = oData.SubplanInboundNav.results[i].MaterialSalesStatus;
					// 	subPlanItemObj.UnequalFirstInstallment = oData.SubplanInboundNav.results[i].UnequalFirstInstallment;
					// 	subPlanItemObj.Category1 = oData.SubplanInboundNav.results[i].Category1;
					// 	subPlanItemObj.Category2 = oData.SubplanInboundNav.results[i].Category2;
					// 	subPlanItemObj.Category3 = oData.SubplanInboundNav.results[i].Category3;
					// 	subPlanItemObj.Category4 = oData.SubplanInboundNav.results[i].Category4;
					// 	subPlanItemObj.Category5 = oData.SubplanInboundNav.results[i].Category5;
					// 	subPlanItemObj.ShipIntervalDaysCCValState = i18n.getText("None");
					// 	subPlanItemObj.ShipIntervalDaysCCValText = "";
					// 	subPlanItemObj.ShipIntervalDayNonCCValState = i18n.getText("None");
					// 	subPlanItemObj.ShipIntervalDayNonCCValText = "";
					// 	subPlanItemObj.ProdSeqNumValueState = i18n.getText("None");
					// 	subPlanItemObj.ProdSeqNumStateText = "";
					// 	subPlanItemObj.PromiseDaysState = i18n.getText("None");
					// 	subPlanItemObj.PromiseDaysStateText = "";
					// 	subPlanItemObj.MaterialState = i18n.getText("None");
					// 	subPlanItemObj.MaterialValText = "";
					// 	if (oData.SubplanInboundNav.results[i].StaticPromiseDate !== "0000-00-00") {
					// 		subPlanItemObj.StaticPromiseDate = oData.SubplanInboundNav.results[i].StaticPromiseDate;
					// 		subPlanItemObj.StaticPromiseMiniDate = new Date();
					// 	}
					// 	/*
					// 	//fill Tracking code range in header from Priliminary tracking code
					// 	//commented by vishnu: 01-Sept-2020:
					// 	//commented reason: at time of stubing we need to use from to values
					// 	// if (i === 1) {
					// 	// 	oView.getModel("SubPlanHeader").setProperty("/TrackingCodeFrom", oData.SubplanInboundNav.results[i].PreliminarTracking);
					// 	// 	oView.getModel("SubPlanHeader").setProperty("/TrackingCodeTo", oData.SubplanInboundNav.results[i].PreliminarTracking);
					// 	// }
					// 	*/

					// 	subPlanItems.push(subPlanItemObj);
					// }
					//prepare Sub Plan items according to UI once we receive data from OData
					subPlanItems = oLogicHelper.prepareSubPlanItems(oData, oView, i18n);
					//set Items
					oView.getModel("SubPlanItemList").setData(subPlanItems);
					oView.getModel("SubPlanItemList").refresh
					oView.getModel("SubPlanHeader").setProperty("/TrackingCodeFrom", oData.TrackingCodeFrom);
					oView.getModel("SubPlanHeader").setProperty("/TrackingCodeTo", oData.TrackingCodeTo);
					that._fillSubPlanHeader(oData);
					//set Object Header Status based on OData received status
					// that.setObjectHederStatus(oData.Status);
				} else {
					oMsgBox.error(oData.Message1.Message);
				}
			};
			var oError = function (error) {
				sap.ui.core.BusyIndicator.hide();
				// // that.ErrorHandling(error);
			};
			sap.ui.core.BusyIndicator.show();
			this.getOwnerComponent().getModel().create(sPath, oEntry, {
				success: oSuccess,
				error: oError
			});
		},
		onFreeProductSelect: function (oEvt) {
			activateFlag = false;
			var oVal = oEvt.getParameters().selected;
			sPath = oEvt.getSource().getBindingContext("SubPlanItemList").sPath.split("/")[1];
			if (oVal) {
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/FreeProductState", i18n.getText("Information"));
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/FreeProduct", "X");
				// oEvt.getSource().setValueState();
			} else {
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/FreeProductState", i18n.getText("None"));;
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/FreeProduct", "");
			}
		},
		//naigation to Panel Code Fiori Ele App
		onPanelCodePress: function (oEvt) {
			var panelCode = oEvt.getSource().getText();
			var Material = oEvt.getSource().getTarget();
			oMsgBox.show(i18n.getText("NavgationWarn"), {
				icon: oMsgBox.Icon.WARNING,
				title: i18n.getText("Navigation"),
				actions: [oMsgBox.Action.YES, oMsgBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === oMsgBox.Action.YES) {
						oLogicHelper.navToPanelMaintenance(panelCode, Material);
					}
				}
			});
		},
		//Navigation to Material Factsheet
		onMaterialLinkPress: function (oEvt) {
			var material = oEvt.getSource().getText();
			oMsgBox.show(i18n.getText("NavgationWarn"), {
				icon: oMsgBox.Icon.WARNING,
				title: i18n.getText("Navigation"),
				actions: [oMsgBox.Action.YES, oMsgBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === oMsgBox.Action.YES) {
						oLogicHelper.navToMaterialFactSheet(material);
					}
				}
			});
		},
		//navigation to Tracking Maintenance app
		onTrackingCodeLinkPress: function (oEvt) {
			var trackingCode = oEvt.getSource().getText();
			var Material = oEvt.getSource().getTarget();
			oMsgBox.show(i18n.getText("NavgationWarn"), {
				icon: oMsgBox.Icon.WARNING,
				title: i18n.getText("Navigation"),
				actions: [oMsgBox.Action.YES, oMsgBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === oMsgBox.Action.YES) {
						oLogicHelper.navToTrackingMaintenance(trackingCode, Material);
					}
				}
			});
		},
		//to handle sub seg code change
		onSubSegCodeChange: function (oEvt) {
			var oValue = oEvt.getParameters().newValue;
			var oInput = oEvt.getSource();
			sPath = oInput.getBindingContext("SubPlanItemList").getPath();
			activateFlag = false;
			var SubSegCodes = [];
			if (oValue.trim() === "" || oValue === undefined) {
				oInput.setValueState(i18n.getText("Error"));
				oInput.setValueStateText(i18n.getText("InvalidEntry"));
			} else {
				var SubSegCodesData = oView.getModel("subSegmentCodeF4Collection").getData();
				SubSegCodes = $.grep(SubSegCodesData, function (ele) {
					if (ele.Value === oValue) {
						return ele;
					}
				});
				if (SubSegCodes.length === 0) {
					oInput.setValueState(i18n.getText("Error"));
					oInput.setValueStateText(i18n.getText("InvalidEntry"));
					oView.getModel("SubPlanItemList").setProperty(sPath + "/SubSegmentDescrip", "");
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"InvalidEntry"));
				} else {
					oView.getModel("SubPlanItemList").setProperty(sPath + "/SubSegmentDescrip", SubSegCodes[0].Description);
					oInput.setValueState(i18n.getText("None"));
					oInput.setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
			}
		},
		//to handle sub seg code change
		onSegCodeChange: function (oEvt) {
			var oValue = oEvt.getParameters().newValue;
			var oInput = oEvt.getSource();
			sPath = oInput.getBindingContext("SubPlanItemList").getPath();
			activateFlag = false;
			var SegCodes = [];
			if (oValue.trim() === "" || oValue === undefined) {
				oInput.setValueState(i18n.getText("Error"));
				oInput.setValueStateText(i18n.getText("InvalidEntry"));
			} else {
				var SegCodesData = oView.getModel("segmentCodeF4Collection").getData();
				SegCodes = $.grep(SegCodesData, function (ele) {
					if (ele.Value === oValue) {
						return ele;
					}
				});
				if (SegCodes.length === 0) {
					oInput.setValueState(i18n.getText("Error"));
					oInput.setValueStateText(i18n.getText("InvalidEntry"));
					oView.getModel("SubPlanItemList").setProperty(sPath + "/SegmentDescrip", "");
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"InvalidEntry"));
				} else {
					oView.getModel("SubPlanItemList").setProperty(sPath + "/SegmentDescrip", SegCodes[0].Description);
					oInput.setValueState(i18n.getText("None"));
					oInput.setValueStateText("");
					sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
					if (sameErrorCount === 0) {
						this.removeMessagePopoverObject(oEvt.getSource().getName());
					}
				}
			}
		},
		//check another same error exists in UI of sub plan Items 
		_checkAnotherUIErrorExists: function (name) {
			var oItems = oView.getModel("SubPlanItemList").getData(),
				i;
			sameErrorCount = 0;
			switch (name) {
			case i18n.getText("SegmentCode"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].SegmentCodeState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("SubSegmentCode"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].SubSegmentCodeState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("ProductPrice"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].ProdSellPriceErrorState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("PHPrice"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].PostageHandlingErrorState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("MultiPHPrice"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].PostageHandling2ErrorState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("ShipIntervalCC"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].ShipIntervalDaysCCValState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("ManualTrackCode"):
				oItems = oView.getModel("manualTrackCodesData").getData();
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].TCValueState === i18n.getText("Error") && oItems[i].TCValueText === i18n.getText("InvalidEntry")) {
						sameErrorCount += 1;
					}
				}
				break;

			case i18n.getText("SequenceNumber"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].ProdSeqNumValueState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("Numberinstalls"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].NumberOfInstallsState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("PromiseDays"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].PromiseDaysState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("StaticPromiseDate"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].StaticPromiseDateState === i18n.getText("Error")) {
						sameErrorCount += 1;
					}
				}
				break;
			}
			return sameErrorCount;
		},
		//check another same OData error exists
		_checkAnotherSameODATAErrorExists: function (name, eText) {
			var oItems = oView.getModel("SubPlanItemList").getData(),
				i;
			sameErrorCount = 0;
			switch (name) {
			case i18n.getText("ShipIntervalCC"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].ShipIntervalDaysCCValText === eText) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("ShipIntervalNonCC"):
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].ShipIntervalDayNonCCValText === eText) {
						sameErrorCount += 1;
					}
				}
				break;
			case i18n.getText("ManualTrackCode"):
				oItems = oView.getModel("manualTrackCodesData").getData();
				for (i = 0; i < oItems.length; i++) {
					if (oItems[i].TCValueText === eText) {
						sameErrorCount += 1;
					}
				}
				break;
			}
			return sameErrorCount;
		},
		//triggers when Price Changes
		onPriceChange: function (oEvt) {
			activateFlag = false;
			//validate price
			var oVal = oEvt.getSource().getValue(),
				amtPaidTrigger;
			sPath = oEvt.getSource().getBindingContext("SubPlanItemList").sPath.split("/")[1];
			if (oVal.trim().length > 0) {
				oVal = oFormatter.formatFloat(oVal);
				if (!oVal.match(regFloatExp)) {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPriceErrorState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPriceErrorText", i18n.getText("invalidPriceEntry"));
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"invalidPriceEntry"));
					return;
				} else {}
				if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPriceCopy") === oVal) {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPrice", oVal);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPriceErrorState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPriceErrorText", i18n.getText(""));
					sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
					if (sameErrorCount === 0) {
						this.removeMessagePopoverObject(oEvt.getSource().getName());
					}
				} else {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPrice", oVal);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPriceErrorState", i18n.getText("Warning"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPriceErrorText", i18n.getText("PriceCond"));
					sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
					if (sameErrorCount === 0) {
						this.removeMessagePopoverObject(oEvt.getSource().getName());
					}
				}
				//fill first installment amount
				this._fillFirstInstallment(sPath);
				//calulcate Amount Paid trigger
				if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandlingErrorState") !== i18n.getText("Error")) {
					amtPaidTrigger = parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPrice")) + parseFloat(oView.getModel(
						"SubPlanItemList").getProperty("/" + sPath + "/PostageHandling"));
					amtPaidTrigger = oFormatter.formatFloat(amtPaidTrigger);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", amtPaidTrigger);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorText", "");
					this.removeMessagePopoverObject(i18n.getText("AmountPaidTrigger"));
				} else {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", oVal);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorText", "");
					this.removeMessagePopoverObject(i18n.getText("AmountPaidTrigger"));
				}
			} else {
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPriceErrorState", i18n.getText("Error"));
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdSellPriceErrorText", i18n.getText("invalidPriceEntry"));
				this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
					"invalidPriceEntry"));
				return;
			}
		},
		//triggers when Shipping N Services Changes
		onShipNSerChange: function (oEvt) {
			activateFlag = false;
			//validate price
			var oVal = oEvt.getSource().getValue(),
				amtPaidTrigger;
			sPath = oEvt.getSource().getBindingContext("SubPlanItemList").sPath.split("/")[1];
			if (oVal.trim().length > 0) {
				oVal = oFormatter.formatFloat(oVal);
				if (!oVal.match(regFloatExp)) {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandlingErrorState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandlingErrorText", i18n.getText("invalidPriceEntry"));
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"invalidPriceEntry"));
					return;
				}
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling", oVal);
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandlingErrorState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandlingErrorText", i18n.getText(""));
				sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
				if (sameErrorCount === 0) {
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
				//fill first installment amount
				this._fillFirstInstallment(sPath);
				//calulcate Amount Paid trigger
				if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPriceErrorState") !== i18n.getText("Error")) {
					amtPaidTrigger = parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPrice")) + parseFloat(oView.getModel(
						"SubPlanItemList").getProperty("/" + sPath + "/PostageHandling"));
					amtPaidTrigger = oFormatter.formatFloat(amtPaidTrigger);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", amtPaidTrigger);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorText", "");
					this.removeMessagePopoverObject(i18n.getText("AmountPaidTrigger"));
				} else {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", oVal);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorText", "");
					this.removeMessagePopoverObject(i18n.getText("AmountPaidTrigger"));
				}
				//check Multi S & S value 
				if (oVal === "0.00") {
					if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandling2") === "0.00") {
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorState", i18n.getText("None"));
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorText", "");
						this.removeMessagePopoverObject(i18n.getText("MultiPHPrice"));
					} else {
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorState", i18n.getText("Warning"));
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorText", i18n.getText("MultiSS2GTSSZero"));
						this.fillMessagePopover(i18n.getText("Warning"), i18n.getText("MultiPHPrice"), i18n.getText("MultiPHPrice"), i18n.getText(
							"MultiSS2GTSSZero"));
					}
				} else if (parseFloat(oVal) > parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandling2"))) {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorState", i18n.getText("Warning"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorText", i18n.getText("MultiSS2GTSS"));
					this.fillMessagePopover(i18n.getText("Warning"), i18n.getText("MultiPHPrice"), i18n.getText("MultiPHPrice"), i18n.getText(
						"MultiSS2GTSS"));
				} else {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorText", "");
					this.removeMessagePopoverObject(i18n.getText("MultiPHPrice"));
				}
			} else {
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandlingErrorState", i18n.getText("Error"));
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandlingErrorText", i18n.getText("invalidPriceEntry"));
				this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
					"invalidPriceEntry"));
				return;
			}
		},
		//triggers when multi ship n service changes
		onMultiShipSrvChange: function (oEvt) {
			activateFlag = false;
			var oVal = oEvt.getSource().getValue();
			sPath = oEvt.getSource().getBindingContext("SubPlanItemList").sPath.split("/")[1];
			if (oVal.trim().length > 0) {
				oVal = oFormatter.formatFloat(oVal);
				if (!oVal.match(regFloatExp)) {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorText", i18n.getText("invalidPriceEntry"));
					this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"invalidPriceEntry"));
					return;
				}
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2", oVal);
				if (parseFloat(oVal) < parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandling"))) {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorState", i18n.getText("Warning"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorText", i18n.getText("MultiSS2GTSS"));
					this.fillMessagePopover(i18n.getText("Warning"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
						"MultiSS2GTSS"));
					return;
				}
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorText", i18n.getText(""));
				sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
				if (sameErrorCount === 0) {
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
			} else {
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorState", i18n.getText("Error"));
				oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/PostageHandling2ErrorText", i18n.getText("invalidPriceEntry"));
				this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
					"invalidPriceEntry"));
				return;
			}
		},
		//on Amout Paid trigger changes in the Item level
		onAmtPaidTriggerItemChange: function (oEvt) {
			activateFlag = false;
			var oVal = oEvt.getSource().getValue(),
				amtPaidTrigger;
			sPath = oEvt.getSource().getBindingContext("SubPlanItemList").sPath.split("/")[1];
			if (oVal.trim().length > 0) {
				oVal = oFormatter.formatFloat(oVal);
				amtPaidTrigger = parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPrice")) + parseFloat(oView.getModel(
					"SubPlanItemList").getProperty("/" + sPath + "/PostageHandling"));
				if (!oVal.match(regFloatExp)) {
					if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPriceErrorState") !== i18n.getText("Error")) {
						if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandlingErrorState") !== i18n.getText("Error")) {
							oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", amtPaidTrigger);
							oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorState", i18n.getText("None"));
							oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorText", "");
							oView.getModel("SubPlanItemList").refresh();
							// this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
							// 	"InvalidEntry"));
							return;
						}
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", oView.getModel("SubPlanItemList").getProperty(
							"/" + sPath + "/ProdSellPrice"));
					} else if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandlingErrorState") !== i18n.getText("Error")) {
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", oView.getModel("SubPlanItemList").getProperty(
							"/" + sPath + "/PostageHandling"));
					} else {
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", "0.00");
						// this.removeMessagePopoverObject(oEvt.getSource().getName());
					}
					return;
				}
				var oValFloat = parseFloat(oVal);
				if (oValFloat > amtPaidTrigger) {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", oVal);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorState", i18n.getText("Warning"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorText", i18n.getText("ValueExceed"));
					// this.fillMessagePopover(i18n.getText("Warning"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
					// 	"ValueExceed"));
				} else {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", oVal);
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTriggerErrorText", "");
					// this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
			} else {
				if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPriceErrorState") !== i18n.getText("Error")) {
					if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandlingErrorState") !== i18n.getText("Error")) {
						amtPaidTrigger = parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPrice")) + parseFloat(oView.getModel(
							"SubPlanItemList").getProperty("/" + sPath + "/PostageHandling"));
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", amtPaidTrigger);
						return;
					}
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", oView.getModel("SubPlanItemList").getProperty(
						"/" + sPath + "/ProdSellPrice"));
				} else if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandlingErrorState") !== i18n.getText("Error")) {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", oView.getModel("SubPlanItemList").getProperty(
						"/" + sPath + "/PostageHandling"));
				} else {
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/ProdAmtPaidTrigger", "0.00");
					// this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
			}
		},
		onDecimalInputChange: function (oEvt) {
			activateFlag = false;
			var oVal = oEvt.getSource().getValue();
			sPath = oEvt.getSource().getBindingContext("SubPlanItemList").sPath.split("/")[1];
			if (oVal.trim().length > 0) {
				oVal = oFormatter.formatFloat(oVal);
				if (!oVal.match(regFloatExp)) {
					oEvt.getSource().setValue("0.00");
				} else {
					oEvt.getSource().setValue(oVal);
					if (oEvt.getSource().getName() === i18n.getText("UnequalFirstInstallment")) {
						oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/FirstInstallAmt", oVal);
					}
				}
			} else {
				oEvt.getSource().setValue("0.00");
				if (oEvt.getSource().getName() === i18n.getText("UnequalFirstInstallment")) {
					this._fillFirstInstallment(sPath);
				}
			}
		},
		_fillFirstInstallment: function (sPath) {
			var firstInstallAmt = 0.00;
			if (parseFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/UnequalFirstInstallment")) === 0 || oView.getModel(
					"SubPlanItemList").getProperty("/" + sPath + "/UnequalFirstInstallment") === undefined) {
				if (oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/NumberOfInstalls")) {
					firstInstallAmt = parseFloat(oFormatter.formatFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/ProdSellPrice"))) +
						parseFloat(oFormatter.formatFloat(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/PostageHandling")));
					firstInstallAmt = firstInstallAmt / parseInt(oView.getModel("SubPlanItemList").getProperty("/" + sPath + "/NumberOfInstalls"));
					oView.getModel("SubPlanItemList").setProperty("/" + sPath + "/FirstInstallAmt", oFormatter.formatFloat(firstInstallAmt));
				} else {
					oMsgToast.show(i18n.getText("NumberOfInstallsForFirstInstallAmt"));
				}
			}
		},
		//to check error msgs in msg model
		checkErrorMsgModel: function () {
			errorCount = 0;
			var msgModel = oView.getModel("oMsgModel").getData();
			for (var m = 0; m < msgModel.length; m++) {
				if (msgModel[m].type === "Error" && msgModel[m].groupName === "UI") {
					errorCount = errorCount + 1;
				}
			}
		},
		//to do UI validation for Sub Plan Header on Shell Creation
		_UIvalidationsForSubPlanHeaderOnShellCreation: function () {
			var subPlanHeaderData = oView.getModel("SubPlanHeader").getData();
			var errorCount = 0;
			var errorText = "";
			errorText = errorText + i18n.getText("enterMandatoryHeader") + Constants.newLine + Constants.newLine;
			this.removeMessagePopoverObject(i18n.getText("Mandatory"));
			if (subPlanHeaderData.PlanVersionDesc === "" || subPlanHeaderData.PlanVersionDesc === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("planversiondesc") + Constants.newLine;
			}
			if (subPlanHeaderData.SubplanName === "" || subPlanHeaderData.SubplanName === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("SubplanName") + Constants.newLine;
			}
			//validations according to promo & non-promo
			//if it is promo sub plan include validations of promo id as well
			if (oView.getModel("SubPlanHeader").getProperty("/PromoplanFlag")) {
				if (subPlanHeaderData.PromoID === "" || subPlanHeaderData.PromoID === undefined) {
					errorCount += 1;
					errorText = errorText + i18n.getText("promoid") + Constants.newLine;
				}
				if (subPlanHeaderData.OfferSeqNbr === "" || subPlanHeaderData.OfferSeqNbr === undefined) {
					errorCount += 1;
					errorText = errorText + i18n.getText("OfferSeqNum") + Constants.newLine;
				}
			}
			//sales org validation & version num if they are editable
			if (oView.getModel("SubPlanHeader").getProperty("/EditFlag")) {
				if (subPlanHeaderData.SalesOrganization === "" || subPlanHeaderData.SalesOrganization === undefined) {
					errorCount += 1;
					errorText = errorText + i18n.getText("salesorganization") + Constants.newLine;
				}
				if (subPlanHeaderData.PlanVersionNum === "" || subPlanHeaderData.PlanVersionNum === undefined) {
					errorCount += 1;
					errorText = errorText + i18n.getText("planversionnum") + Constants.newLine;
				}
			}
			if (errorCount > 0) {
				this.fillMessagePopover(i18n.getText("Error"), i18n.getText("Mandatory"), i18n.getText("Mandatory"),
					i18n.getText("enterMandatoryHeader") + Constants.clickHere, errorText, "UI");
			} else {
				this.removeMessagePopoverObject(i18n.getText("Mandatory"));
			}
		},
		//to do UI validations for Sub Plan Header with mandatory fields
		_UIvalidationsForSubPlanHeader: function () {
			var subPlanHeaderData = oView.getModel("SubPlanHeader").getData();
			var errorCount = 0;
			var errorText = "";
			errorText = errorText + i18n.getText("enterMandatoryHeader") + Constants.newLine + Constants.newLine;
			this.removeMessagePopoverObject(i18n.getText("Mandatory"));
			if (subPlanHeaderData.PlanVersionDesc === "" || subPlanHeaderData.PlanVersionDesc === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("planversiondesc") + Constants.newLine;
			}
			if (subPlanHeaderData.SubplanName === "" || subPlanHeaderData.SubplanName === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("SubplanName") + Constants.newLine;
			}
			if (subPlanHeaderData.MarketArea === "" || subPlanHeaderData.MarketArea === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("MarketArea") + Constants.newLine;
			}
			if (subPlanHeaderData.TrackingCodeFrom === "" || subPlanHeaderData.TrackingCodeFrom === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("TrackingCodeFrom") + Constants.newLine;
			}
			// if (subPlanHeaderData.TrackingCodeTo === "" || subPlanHeaderData.TrackingCodeTo === undefined) {
			// 	errorCount += 1;
			// }
			if (subPlanHeaderData.BackendTrackCode === "" || subPlanHeaderData.BackendTrackCode === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("BackendTrackingCode") + Constants.newLine;
			}
			if (subPlanHeaderData.PromiseDays === "" || subPlanHeaderData.PromiseDays === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("PromiseDays") + Constants.newLine;
			}
			if (subPlanHeaderData.ShipIntervalDaysCC === "" || subPlanHeaderData.ShipIntervalDaysCC === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("ShipIntervalCC") + Constants.newLine;
			}
			if (subPlanHeaderData.ShipIntervalDayNonCC === "" || subPlanHeaderData.ShipIntervalDayNonCC === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("ShipIntervalNonCC") + Constants.newLine;
			}
			if (subPlanHeaderData.NumberOfInstalls === "" || subPlanHeaderData.NumberOfInstalls === undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("NumOfInstalls") + Constants.newLine;
			}
			if (subPlanHeaderData.PostageHandling === "0.00" || subPlanHeaderData.PostageHandling === "" || subPlanHeaderData.PostageHandling ===
				undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("SSPrice") + Constants.newLine;
			}
			if (subPlanHeaderData.PostageHandling2 === "0.00" || subPlanHeaderData.PostageHandling2 === "" || subPlanHeaderData.PostageHandling2 ===
				undefined) {
				errorCount += 1;
				errorText = errorText + i18n.getText("MultiSSPrice") + Constants.newLine;
			}
			//validations according to promo & non-promo
			//if it is promo sub plan include validations of promo id as well
			if (oView.getModel("SubPlanHeader").getProperty("/PromoplanFlag")) {
				if (subPlanHeaderData.PromoID === "" || subPlanHeaderData.PromoID === undefined) {
					errorCount += 1;
					errorText = errorText + i18n.getText("promoid") + Constants.newLine;
				}
				if (subPlanHeaderData.OfferSeqNbr === "" || subPlanHeaderData.OfferSeqNbr === undefined) {
					errorCount += 1;
					errorText = errorText + i18n.getText("OfferSeqNum") + Constants.newLine;
				}
			}
			//sales org validation & version num if they are editable
			if (oView.getModel("SubPlanHeader").getProperty("/EditFlag")) {
				if (subPlanHeaderData.SalesOrganization === "" || subPlanHeaderData.SalesOrganization === undefined) {
					errorCount += 1;
					errorText = errorText + i18n.getText("salesorganization") + Constants.newLine;
				}
				if (subPlanHeaderData.PlanVersionNum === "" || subPlanHeaderData.PlanVersionNum === undefined) {
					errorCount += 1;
					errorText = errorText + i18n.getText("planversionnum") + Constants.newLine;
				}
			}
			//CTN validation based on Market Area
			if (subPlanHeaderData.MarketArea === Constants.lc_web && subPlanHeaderData.CTN === false) {
				errorCount += 1;
				errorText = errorText + i18n.getText("ctnmustmarketareaweb") + Constants.newLine;
			}
			if (errorCount > 0) {
				this.fillMessagePopover(i18n.getText("Error"), i18n.getText("Mandatory"), i18n.getText("Mandatory"),
					i18n.getText("enterMandatoryHeader") + Constants.clickHere, errorText);
			} else {
				this.removeMessagePopoverObject(i18n.getText("Mandatory"));
			}
		},
		//to do UI validations on save/activate
		_UIvalidationsForItems: function () {
			var subPlanItems = oView.getModel("SubPlanItemList").getData();
			var seqMissed = false;
			for (var i = 0; i < subPlanItems.length; i++) {
				if (subPlanItems[i].ProdSeqNum === "" || subPlanItems[i].ProdSeqNum === undefined) {
					seqMissed = true;
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/ProdSeqNumValueState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/ProdSeqNumStateText", i18n.getText("Mandatory"));
					this.fillMessagePopover(i18n.getText("Error"), i18n.getText("SequenceNumber"), i18n.getText("SequenceNumber"), i18n.getText(
						"Mandatory"));
				}
				if (subPlanItems[i].Material === "" || subPlanItems[i].Material === undefined) {
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/MaterialState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/MaterialValText", i18n.getText("Mandatory"));
					this.fillMessagePopover(i18n.getText("Error"), i18n.getText("Material"), i18n.getText("Material"), i18n.getText(
						"Mandatory"));
				}
				if (subPlanItems[i].Material !== "" || subPlanItems[i].Material !== undefined) {
					if (subPlanItems[i].ProdSeqNum === "1" && subPlanItems[i].MaterialSalesStatus !== "Z3") {
						this.fillMessagePopover(i18n.getText("Error"), i18n.getText("Material"), i18n.getText("Material"), i18n.getText(
							"materialEnteredAtSeqNbrOneMustBePrimary"), i18n.getText("materialEnteredAtSeqNbrOneMustBePrimary"));

					}
				}
				if (subPlanItems[i].NumberOfInstalls === "" || subPlanItems[i].NumberOfInstalls === undefined) {
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/NumberOfInstallsState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/NumberOfInstallsErrorText", i18n.getText("Mandatory"));
					this.fillMessagePopover(i18n.getText("Error"), i18n.getText("Numberinstalls"), i18n.getText("Numberinstalls"), i18n.getText(
						"Mandatory"));
				}
				if (subPlanItems[i].ShipIntervalDayNonCC === "" || subPlanItems[i].ShipIntervalDayNonCC === undefined) {
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDayNonCCValState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDayNonCCValText", i18n.getText("Mandatory"));
					this.fillMessagePopover(i18n.getText("Error"), i18n.getText("ShipIntervalNonCC"), i18n.getText("ShipIntervalNonCC"), i18n.getText(
						"Mandatory"));
				}
				if (subPlanItems[i].ShipIntervalDaysCC === "" || subPlanItems[i].ShipIntervalDaysCC === undefined) {
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDaysCCValState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/ShipIntervalDaysCCValText", i18n.getText("Mandatory"));
					this.fillMessagePopover(i18n.getText("Error"), i18n.getText("ShipIntervalCC"), i18n.getText("ShipIntervalCC"), i18n.getText(
						"Mandatory"));
				}
				if (subPlanItems[i].PromiseDays === "" || subPlanItems[i].PromiseDays === undefined) {
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/PromiseDaysState", i18n.getText("Error"));
					oView.getModel("SubPlanItemList").setProperty("/" + i + "/PromiseDaysStateText", i18n.getText("Mandatory"));
					this.fillMessagePopover(i18n.getText("Error"), i18n.getText("PromiseDays"), i18n.getText("PromiseDays"), i18n.getText(
						"Mandatory"));
				} else {
					if (subPlanItems[i].StaticPromiseDate !== null) {
						var newStaticPromiseMiniDate = new Date();
						newStaticPromiseMiniDate.setDate(newStaticPromiseMiniDate.getDate() + parseInt(subPlanItems[i].PromiseDays));
						if (subPlanItems[i].StaticPromiseDate < newStaticPromiseMiniDate) {
							oView.getModel("SubPlanItemList").setProperty("/" + i + "/StaticPromiseDateState", i18n.getText("Error"));

							this.fillMessagePopover(i18n.getText("Error"), i18n.getText("StaticPromiseDate"), i18n.getText("StaticPromiseDate"), i18n.getText(
									"StaticPromiseDateMustExceed") + " i.e., " + newStaticPromiseMiniDate, i18n.getText("StaticPromiseDateMustExceed") +
								" i.e., " +
								newStaticPromiseMiniDate);
						}
					}
				}
			}
			if (!seqMissed) {
				var missingSeqNums = [],
					seqMsg = "";
				//for duplicate Prod Seq Number
				var valueArr = subPlanItems.map(function (item) {
					return item.ProdSeqNum;
				});
				var isDuplicate = valueArr.some(function (item, idx) {
					return valueArr.indexOf(item) != idx;
				});

				missingSeqNums = oLogicHelper.checkMissingProdSeqNums(valueArr);
				if (isDuplicate) {
					seqMsg = seqMsg + i18n.getText("SeqNumDuplicates") + Constants.newLine;
				}
				if (missingSeqNums.length > 0) {
					seqMsg = seqMsg + i18n.getText("SeqNumMissing") + " " + missingSeqNums.toString() + Constants.newLine;
				}
				if (seqMsg !== "") {
					this.fillMessagePopover(i18n.getText("Error"), i18n.getText("SequenceNumber"), i18n.getText("SequenceNumber"), seqMsg, seqMsg);

				} else {
					this.removeMessagePopoverObject(i18n.getText("SequenceNumber"));
				}
				// if (isDuplicate) {
				// 	this.fillMessagePopover(i18n.getText("Error"), i18n.getText("SequenceNumber"), i18n.getText("SequenceNumber"), i18n.getText(
				// 		"SeqNumDuplicates"));
				// 	// oMsgToast.show(i18n.getText("SeqNumDuplicates"));
				// } else {
				// 	this.removeMessagePopoverObject(i18n.getText("SequenceNumber"));
				// }
				// if (missingSeqNums.length > 0) {
				// 	this.fillMessagePopover(i18n.getText("Error"), i18n.getText("SequenceNumber"), i18n.getText("SequenceNumber"), i18n.getText(
				// 		"SeqNumMissing") + missingSeqNums.toString());
				// 	// oMsgToast.show(i18n.getText("SeqNumMissing"));
				// } else {
				// 	this.removeMessagePopoverObject(i18n.getText("SequenceNumber"));
				// }
			}
		},
		//UI validation on Header
		_UIvalidationsForTrackingCodes: function () {
			var errorCount = 0;
			var errorText = "";
			var subPlanHeaderData = oView.getModel("SubPlanHeader").getData();
			var trackingCodeFrom = subPlanHeaderData.TrackingCodeFrom;
			var trackingCodeTo = subPlanHeaderData.TrackingCodeTo;
			var trackingCodeFromNum = 0,
				trackingCodeToNum = 0;
			errorText = errorText + i18n.getText("DuplicateTrackingCodesText") + Constants.newLine + Constants.newLine;
			this.removeMessagePopoverObject(i18n.getText("DuplicateTrackingCodes"));
			var subPlanHeaderData = oView.getModel("SubPlanHeader").getData();
			//do tracking code validations
			var trackingCodesRange = [];
			trackingCodesRange = oView.getModel("FronendTrackCodesData").getData();
			//prepare manuall tracking codes
			var manualTrackingRange = oLogicHelper.getManualTrackingCodesArray(oView.getModel("manualTrackCodesData").getData());
			// if(manualTrackingRange.le)
			trackingCodesRange = trackingCodesRange.concat(manualTrackingRange);
			// .concat(oView.getModel("manualTrackCodesData").getData());
			// if (subPlanHeaderData.ClntSrvcsTrackingCode !== "" || subPlanHeaderData.ClntSrvcsTrackingCode !== undefined) {
			//check customer service tracking code & backend tracking code with Tracking code range
			for (var i = 0; i < trackingCodesRange.length; i++) {
				if (subPlanHeaderData.ClntSrvcsTrackingCode === trackingCodesRange[i].TrackingCode) {
					errorCount += 1;
					errorText = errorText + i18n.getText("CustSrvTrackingCodeAndFrontEndTrack") + Constants.newLine;
				}
				// else if (subPlanHeaderData.BackendTrackCode === trackingCodesRange[i].TrackingCode) {
				// 	errorCount += 1;
				// }
			}
			// }
			//check both cust service tracking & backend trackin
			if (subPlanHeaderData.ClntSrvcsTrackingCode === subPlanHeaderData.BackendTrackCode) {
				errorCount += 1;
				errorText = errorText + i18n.getText("CustSrvTrackingCodeAndBackendTrackCode") + Constants.newLine;
			}
			//now compare complete tracking range for duplicates
			var lookup = trackingCodesRange.reduce((a, e) => {
				a[e.TrackingCode] = ++a[e.TrackingCode] || 0;
				return a;
			}, {});
			var rangeDuplicates = trackingCodesRange.filter(e => lookup[e.TrackingCode]);
			if (rangeDuplicates.length > 0) {
				errorText = errorText + i18n.getText("trackingCodesRangeDuplicated") + Constants.newLine;
			}
			errorCount += rangeDuplicates.length;
			// }

			//validate tracking code from & to value
			if ((trackingCodeFrom !== "" && trackingCodeFrom !== undefined) && (trackingCodeTo !== "" && trackingCodeTo !== undefined)) {
				if (trackingCodeFrom !== "" && trackingCodeFrom !== undefined) {
					trackingCodeFromNum = trackingCodeFrom.match(/(\d+)/)[0];
				}
				if (trackingCodeTo !== "" && trackingCodeTo !== undefined) {
					trackingCodeToNum = trackingCodeTo.match(/(\d+)/)[0];
				}
				if (parseInt(trackingCodeToNum) < parseInt(trackingCodeFromNum)) {
					errorCount += 1;
					errorText = errorText + i18n.getText("TrackingCodeToExceedTrackingCodeFrom") + Constants.newLine;
				}
				if (errorCount > 0) {
					this.fillMessagePopover(i18n.getText("Error"), i18n.getText("DuplicateTrackingCodes"), i18n.getText("DuplicateTrackingCodes"),
						i18n.getText("DuplicateTrackingCodesText") + Constants.clickHere, errorText);
				} else {
					this.removeMessagePopoverObject(i18n.getText("DuplicateTrackingCodes"));
				}
			}
		},
		//to handle Save functionality
		onSave: function () {
			var tCodes = [],
				trackCodeRange = [],
				manualTrackCodes = [],
				i;
			var itemObj = {},
				oItems = [],
				trackObj = {},
				oTracks = [],
				t;
			var subPlanHeaderData = oView.getModel("SubPlanHeader").getData();
			if (subPlanHeaderData.SubPlanID !== "") {
				//check UI validations on Save/activate for Header
				//	this._UIvalidationsForSubPlanHeader();
				this._UIvalidationsForSubPlanHeaderOnShellCreation();
				//check UI validations on Save/activate for Items
				// this._UIvalidationsForItems();
				//check error msgs from msg model
				this.checkErrorMsgModel();
				if (errorCount !== 0) {
					return;
				}
				//get tracking codes range
				oLogicHelper._setTrackingRangeData(oView);
				trackCodeRange = oView.getModel("FronendTrackCodesData").getData();
				if (oView.getModel("manualTrackCodesData").getData()) {
					manualTrackCodes = oView.getModel("manualTrackCodesData").getData().split(/\r?\n/);
				}
				if (trackCodeRange.length > Constants.lc_99) {
					oMsgBox.information(i18n.getText("FrontendTrackingCodeRangeLimit"));
					return;
				}
				// check UI validations on Save/activate
				this._UIvalidationsForTrackingCodes();
				// check error msgs from msg model
				this.checkErrorMsgModel();
				if (errorCount !== 0) {
					return;
				}
				// var trackingCodeFrom = subPlanHeaderData.TrackingCodeFrom;
				// var trackingCodeTo = subPlanHeaderData.TrackingCodeTo;
				// if (trackingCodeFrom !== "" && trackingCodeFrom !== undefined) {
				// 	trackingCodeFrom = trackingCodeFrom.toUpperCase();
				// 	trackingCodeTo = trackingCodeTo.toUpperCase();
				// 	//extarct number from Strin
				// 	// var str = "jhkj7682834";
				// 	var trackingCodeFromNum = trackingCodeFrom.match(/(\d+)/);
				// 	if (trackingCodeFromNum !== null) {
				// 		trackingCodeFromNum = parseInt(trackingCodeFromNum[0]);
				// 		var tcFromText = trackingCodeFrom.split(trackingCodeFromNum, 1);
				// 		if (tcFromText.length > 0) tcFromText = tcFromText[0];
				// 		var obj = {};
				// 		obj.TrackingCode = trackingCodeFrom;
				// 		tCodes.push(obj);
				// 		//check tracking code To validation, if it is empty use only tracking code from
				// 		if (trackingCodeTo !== "" && trackingCodeTo !== undefined) {
				// 			var trackingCodeToNum = trackingCodeTo.match(/(\d+)/);
				// 			trackingCodeToNum = trackingCodeToNum[0];
				// 			for (i = trackingCodeFromNum + 1; i < trackingCodeToNum; i++) {
				// 				obj = {};
				// 				obj.TrackingCode = tcFromText.concat(i);
				// 				tCodes.push(obj);
				// 			}
				// 			obj = {};
				// 			obj.TrackingCode = trackingCodeTo;
				// 			tCodes.push(obj);
				// 		}
				// 		trackCodeRange = tCodes;
				// 		manualTrackCodes = oView.getModel("manualTrackCodesData").getData();
				// 		// for (i = 0; i < manualTrackCodes.length; i++) {
				// 		// 	obj = {};
				// 		// 	obj.TrackingCode = manualTrackCodes[i].TrackingCode;
				// 		// 	tCodes.push(obj);
				// 		// }

				// 		// if (manualTrackCodes.length > 0) {
				// 		// 	tCodes = tCodes.concat(manualTrackCodes);
				// 		// }
				// 		var rangeTrack = new sap.ui.model.json.JSONModel(tCodes);
				// 		this.getView().getModel("TrackRangeDataDisplay").setData(rangeTrack);
				// 	}
				// }

				//adding backend track code
				if (subPlanHeaderData.BackendTrackCode !== "" && subPlanHeaderData.BackendTrackCode !== undefined) {
					var subplanItems = oView.getModel("SubPlanItemList").getData();
					for (var j = 0; j < subplanItems.length; j++) {
						if (subplanItems[j].SequenceNumber !== "1") {
							oView.getModel("SubPlanItemList").setProperty("/" + j + "/TrackingCode", subPlanHeaderData.BackendTrackCode);
							// subplanItems[i].TrackingCode = subPlanHeaderData.BackendTrackCode;
						}
					}
				}
				var oHeader = oView.getModel("SubPlanHeader").getData();
				var subPlanItems = oView.getModel("SubPlanItemList").getData();
				// var trackingData = oView.getModel("TrackRangeDataDisplay").getData();
				for (i = 0; i < subPlanItems.length; i++) {
					if (subPlanItems[i].Material) {
						itemObj = {};
						itemObj.SubItemInternalID = subPlanItems[i].SubItemInternalID;
						itemObj.SubPlanID = oHeader.SubPlanID;
						itemObj.ProdID = subPlanItems[i].ProdID;
						itemObj.Material = subPlanItems[i].Material;
						itemObj.MaterialSubstitution = subPlanItems[i].MaterialSubstitution;
						itemObj.CatalogMaterial = subPlanItems[i].CatalogMaterial;
						itemObj.MaterialDescription = subPlanItems[i].MaterialDescription;
						itemObj.ProdSeqNum = subPlanItems[i].ProdSeqNum;
						itemObj.TrackingCode = subPlanItems[i].TrackingCode;
						itemObj.PanelArea = subPlanItems[i].PanelArea;
						itemObj.PanelCode = subPlanItems[i].PanelCode;
						itemObj.ProdSellPrice = subPlanItems[i].ProdSellPrice;
						itemObj.PostageHandling = subPlanItems[i].PostageHandling;
						itemObj.PostageHandling2 = subPlanItems[i].PostageHandling2;
						itemObj.ProdAmtPaidTrigger = subPlanItems[i].ProdAmtPaidTrigger;
						itemObj.FreeProduct = subPlanItems[i].FreeProduct;
						itemObj.NumberOfInstalls = subPlanItems[i].NumberOfInstalls;
						itemObj.FirstInstallAmt = subPlanItems[i].FirstInstallAmt;
						itemObj.InvAllocationCode = subPlanItems[i].InvAllocationCode;
						itemObj.TmpltLineNbr = subPlanItems[i].TmpltLineNbr;
						itemObj.OfferSeqNbr = subPlanItems[i].OfferSeqNbr;
						itemObj.DeletionFlag = subPlanItems[i].DeletionFlag;
						itemObj.TBDFlag = subPlanItems[i].TBDFlag;
						itemObj.PromiseDays = subPlanItems[i].PromiseDays;
						itemObj.NumberOfDays = subPlanItems[i].NumberOfDays;
						itemObj.PurchaseLimit = subPlanItems[i].PurchaseLimit;
						itemObj.SegmentCode = subPlanItems[i].SegmentCode;
						itemObj.SegmentDescrip = subPlanItems[i].SegmentDescrip;
						itemObj.SubSegmentCode = subPlanItems[i].SubSegmentCode;
						itemObj.SubSegmentDescrip = subPlanItems[i].SubSegmentDescrip;
						itemObj.NubrPmtsBefore = subPlanItems[i].NubrPmtsBefore;
						itemObj.Category1 = subPlanItems[i].Category1;
						itemObj.Category2 = subPlanItems[i].Category2;
						itemObj.Category3 = subPlanItems[i].Category3;
						itemObj.Category4 = subPlanItems[i].Category4;
						itemObj.Category5 = subPlanItems[i].Category5;
						itemObj.UnequalFirstInstallment = subPlanItems[i].UnequalFirstInstallment;
						itemObj.CreatedByUser = subPlanItems[i].CreatedByUser;
						itemObj.CreationDate = subPlanItems[i].CreationDate;
						itemObj.CreationTime = subPlanItems[i].CreationTime;
						itemObj.ChangeUser = subPlanItems[i].ChangeUser;
						itemObj.ChangeDate = subPlanItems[i].ChangeDate;
						itemObj.ChangeTime = subPlanItems[i].ChangeTime;
						if (subPlanItems[i].StaticPromiseDate === "") {
							itemObj.StaticPromiseDate = null;
						} else {
							itemObj.StaticPromiseDate = subPlanItems[i].StaticPromiseDate;
						}
						itemObj.ShipIntervalDayNonCC = subPlanItems[i].ShipIntervalDayNonCC;
						itemObj.ShipIntervalDaysCC = subPlanItems[i].ShipIntervalDaysCC;
						//add tracking codes
						if (itemObj.ProdSeqNum === "1") {
							// add manual tracking codes to Item array
							for (t = 0; t < manualTrackCodes.length; t++) {
								trackObj = {};
								if (manualTrackCodes[t]) {
									trackObj.Prodid = subPlanItems[i].ProdID;
									trackObj.SubPlanID = oHeader.SubPlanID;
									trackObj.PlanVersionNum = oHeader.PlanVersionNum;
									trackObj.Material = subPlanItems[i].Material;
									trackObj.ManualTrackingRange = manualTrackCodes[t]; //.TrackingCode;
									oTracks.push(trackObj);
								}
							}
							// add Range Tracking Codes to Item array
							for (t = 0; t < trackCodeRange.length; t++) {
								trackObj = {};
								trackObj.Prodid = subPlanItems[i].ProdID;
								trackObj.SubPlanID = oHeader.SubPlanID;
								trackObj.PlanVersionNum = oHeader.PlanVersionNum;
								trackObj.Material = subPlanItems[i].Material;
								trackObj.TrackingRange = trackCodeRange[t].TrackingCode;
								oTracks.push(trackObj);
							}

							itemObj.SubPlanTrackingCodesNav = oTracks;
						}
						//delete status columns
						// delete subPlanItems[i].Status;
						// delete subPlanItems[i].StatusText;
						oItems.push(itemObj);
					}
				}
				//calculate number of items if status is shell creation or Inactive
				if (oHeader.Status === Constants.subPlanShellCreationStatus ||
					oHeader.Status === Constants.subPlanInactiveStatus) {
					var ctrlength = oItems.filter(function (item) {
						return !item.DeletionFlag;
					}).length;
					oView.getModel("SubPlanHeader").setProperty("/NumberOfUnits", ctrlength.toString());
				} else {
					oView.getModel("SubPlanHeader").setProperty("/NumberOfUnits", oItems.length.toString());
				}
				// var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				// 	pattern: "yyyy-MM-ddTHH:mm:ss",
				// 	UTC: true
				// });
				// var date = oHeader.StaticPromiseDate;
				var oEntry = {
					"Buttonflag": "SAVE", //ACTI
					"Status": oHeader.Status, //I
					"SalesOrganization": oHeader.SalesOrganization,
					"SubPlanID": oHeader.SubPlanID, //  "040858",
					"OfferSeqNbr": oHeader.OfferSeqNbr,
					"PromoID": oHeader.PromoID,
					"PlanID": oHeader.PlanID,
					"PlanVersionDesc": oHeader.PlanVersionDesc,
					"SubplanName": oHeader.SubplanName,
					"PlanVersionNum": oHeader.PlanVersionNum,
					"MarketArea": oHeader.MarketArea,
					"ClntSrvcsTrackingCode": oHeader.ClntSrvcsTrackingCode,
					"BackendTrackCode": oHeader.BackendTrackCode,
					// "SegmentCode": oHeader.SegmentCode,
					// "SubSegmentCode": oHeader.SubSegmentCode,
					"PromiseDays": oHeader.PromiseDays,
					"PanelArea": oHeader.PanelArea,
					"ShipIntervalDaysCC": oHeader.ShipIntervalDaysCC,
					"TrackingCodeFrom": oHeader.TrackingCodeFrom,
					"TrackingCodeTo": oHeader.TrackingCodeTo,
					// "StaticPromiseDate": oHeader.StaticPromiseDate,
					"ShipIntervalDayNonCC": oHeader.ShipIntervalDayNonCC,
					"NumberOfDays": oHeader.NumberOfDays,
					"NumberOfInstalls": oHeader.NumberOfInstalls,
					"NubrPmtsBefore": oHeader.NubrPmtsBefore,
					"PurchaseLimit": oHeader.PurchaseLimit,
					"InvAllocationCode": oHeader.InvAllocationCode,
					"ConsecutiveReturnCount": oHeader.ConsecutiveReturnCount,
					"PostageHandling": oHeader.PostageHandling,
					"PostageHandling2": oHeader.PostageHandling2,
					"CatalogID": oHeader.CatalogID,
					"Reportbreak": oHeader.Reportbreak,
					"SlidingScaleType": oHeader.SlidingScaleType,
					"NumberOfUnits": oHeader.NumberOfUnits, //oItems.length.toString(),
					"PercentReturnThres": oHeader.PercentReturnThres,
					"Category1": oHeader.Category1,
					"Category2": oHeader.Category2,
					"Category3": oHeader.Category3,
					"Category4": oHeader.Category4,
					"Category5": oHeader.Category5,
					"UnequalFirstInstallment": oHeader.UnequalFirstInstallment,
					"WEBOEFlag": oHeader.WEBOEFlag,
					"RolloutMaterial": oHeader.RolloutMaterial,
					"RolloutMaterialDes": oHeader.RolloutMaterialDes,
					"CatalogMaterial": oHeader.CatalogMaterial,
					"CatalogMaterialDes": oHeader.CatalogMaterialDes,
					"PerformTrackValidationFlag": oHeader.PerformTrackValidationFlag,
					"CreatedByUser": oHeader.CreatedByUser,
					"CreationDate": oHeader.CreationDate,
					"CreationTime": oHeader.CreationTime,
					"ChangeUser": oHeader.ChangeUser,
					"ChangeDate": oHeader.ChangeDate,
					"ChangeTime": oHeader.ChangeTime,
					"SubplanInboundNav": {
						"results": oItems
					}
				};
				if (oHeader.CTN) {
					oEntry.CTN = "X";
				} else {
					oEntry.CTN = "";
				}
				if (oHeader.Agedtrackingcode) {
					oEntry.Agedtrackingcode = "X";
				} else {
					oEntry.Agedtrackingcode = "";
				}
				if (oHeader.PromoplanFlag) {
					oEntry.PromoplanFlag = "X";
				} else {
					oEntry.PromoplanFlag = "";
				}
				sPath = "/SubplanInboundHeadSet";
				that = this;
				// var subPlanItems = [];
				// var subPlanItemObj = {};
				var oSuccess = function (oData) {
					activateFlag = true;
					if (subPlanAction === "COPY") {
						copyFlag = true;
					}
					sap.ui.core.BusyIndicator.hide();
					//handle error message
					oMsgs = [];
					oView.getModel("oMsgModel").setData(oMsgs);
					if (oData.Message1.Type === "E") {
						that.fillMessagePopover(i18n.getText("Error"), oData.Message1.Message, oData.Message1.Message, oData.Message1.MessageV1,
							oData.Message1
							.MessageV1,
							"OData");
					}
					for (i = 0; i < oData.SubplanInboundNav.results.length; i++) {
						if (oData.SubplanInboundNav.results[i].Message2.Type === "E") {
							that.fillMessagePopover(i18n.getText("Error"), oData.SubplanInboundNav.results[i].Message2.Message, oData.SubplanInboundNav.results[
								i].Message2.Message, oData.SubplanInboundNav.results[
								i].Message2.MessageV1, oData.SubplanInboundNav.results[i].Message2.MessageV1, "OData");
						}
					}
					if (oView.getModel("oMsgModel").getData().length === 0) {
						oMsgBox.show(i18n.getText("SubPlanSaveSuccess"), {
							icon: oMsgBox.Icon.SUCCESS,
							title: "Success",
							actions: [oMsgBox.Action.OK],
							onClose: function (oAction) {
								if (oAction === oMsgBox.Action.OK) {
									that.navToDisplay();
									// that.navToMain();
								}
							}
						});
					}
				};
				var oError = function (error) {
					sap.ui.core.BusyIndicator.hide();
					// // that.ErrorHandling(error);
				};
				sap.ui.core.BusyIndicator.show();
				this.getOwnerComponent().getModel().create(sPath, oEntry, {
					success: oSuccess,
					error: oError
				});
			} else if (subPlanHeaderData.SubPlanID === "") {
				//check UI validations on Save/activate for Header
				this._UIvalidationsForSubPlanHeaderOnShellCreation();
				//check error msgs from msg model
				this.checkErrorMsgModel();
				if (errorCount !== 0) {
					return;
				}
				// if (subPlanHeaderData.OfferSeqNbr === "") {
				// 	subPlanHeaderData.OfferSeqNbr = "0.00";
				// }
				var oEntry = {
					"Buttonflag": "SHEL",
					"Status": subPlanHeaderData.Status,
					"SalesOrganization": subPlanHeaderData.SalesOrganization,
					"SubPlanID": subPlanHeaderData.SubPlanID,
					"SubplanName": subPlanHeaderData.SubplanName,
					"OfferSeqNbr": subPlanHeaderData.OfferSeqNbr,
					"PromoID": subPlanHeaderData.PromoID,
					"PlanID": subPlanHeaderData.PlanID,
					"PlanVersionDesc": subPlanHeaderData.PlanVersionDesc,
					"PlanVersionNum": subPlanHeaderData.PlanVersionNum,
					"RolloutMaterial": subPlanHeaderData.RolloutMaterial,
					"RolloutMaterialDes": subPlanHeaderData.RolloutMaterialDes,
					// "CatalogMaterial": oHeader.CatalogMaterial,
					// "CatalogMaterialDes": oHeader.CatalogMaterialDes,
					// "CreatedByUser": oHeader.CreatedByUser,
					// "CreationDate": oHeader.CreationDate,
					// "CreationTime": oHeader.CreationTime,
					// "ChangeUser": oHeader.ChangeUser,
					// "ChangeDate": oHeader.ChangeDate,
					// "ChangeTime": oHeader.ChangeTime,
					"SubplanInboundNav": {
						"results": [{
							"Material": "",
							"SubPlanID": "",
							"OfferSeqNbr": "3.00",
							"TrackingCode": ""
						}]
					}
				};
				if (!oView.getModel("SubPlanHeader").getProperty("/PromoplanFlag")) {
					oEntry.OfferSeqNbr = "0.00";
				}

				if (subPlanHeaderData.PromoplanFlag) {
					oEntry.PromoplanFlag = "X";
				} else {
					oEntry.PromoplanFlag = "";
				}
				sPath = "/SubplanInboundHeadSet";
				that = this;
				var oSuccess = function (oData) {
					sap.ui.core.BusyIndicator.hide();
					that._fillSubPlanHeader(oData);
					//set Object Header Status based on OData received status
					that.setObjectHederStatus(oData.Status);
					oView.getModel("SubPlanHeader").setProperty("/GetStubFlag", true);
					oView.getModel("SubPlanHeader").setProperty("/TrackingCodeFrom", oData.TrackingCodeFrom);
					oView.getModel("SubPlanHeader").setProperty("/TrackingCodeTo", oData.TrackingCodeTo);
					oView.getModel("SubPlanHeader").setProperty("/ManualSubPlanFlag", false);
					oMsgBox.success("Subplan created succssfully " + oData.SubPlanID + ".");
					activateFlag = true;
					oView.byId("ObjectPageHeader").setText(i18n.getText("EditSubPlan") + " " + oData.SubPlanID);
					oView.byId("subPlanManAddBtn").setEnabled(true);
				};
				var oError = function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				};
				sap.ui.core.BusyIndicator.show();
				this.getOwnerComponent().getModel().create(sPath, oEntry, {
					success: oSuccess,
					error: oError
				});
			}
		},
		//navigation main
		navToMain: function () {
			this.oRouter.navTo("Main", {});
		},
		//display
		goToDisplay: function (salesorganization, subplanid, status, planversionnum) {
			this.oRouter.navTo("DisplaySubPlan", {
				salesorganization: salesorganization,
				subplanid: subplanid,
				status: status,
				planversionnum: planversionnum
			});
		},
		//navigation to display mode
		navToDisplay: function () {
			var copiedData = oView.getModel("SubPlanHeader").getData();
			if (subPlanAction === "EDIT") {
				this.goToDisplay(selectedData.salesorganization, selectedData.subplanid, selectedData.status, selectedData.planversionnum);
			}
			if (subPlanAction === "COPY") {
				if (copyFlag === true) {
					this.goToDisplay(copiedData.SalesOrganization, copiedData.SubPlanID, copiedData.Status, copiedData.PlanVersionNum);
				} else {
					this.goToDisplay(selectedData.salesorganization, selectedData.subplanid, selectedData.status, selectedData.planversionnum);
				}
			}
			if (subPlanAction === "CREATE") {
				this.goToDisplay(copiedData.SalesOrganization, copiedData.SubPlanID, copiedData.Status, copiedData.PlanVersionNum);
			}
		},
		onNavBack: function (oEvt) {
			if (subPlanAction === "EDIT" || subPlanAction === "COPY") {
				if (activateFlag) {
					this.navToDisplay();
				} else {
					oMsgBox.show(i18n.getText("goBackDisplay"), {
						icon: oMsgBox.Icon.WARNING,
						title: i18n.getText("Discard"),
						actions: [oMsgBox.Action.YES, oMsgBox.Action.NO],
						onClose: function (oAction) {
							if (oAction === oMsgBox.Action.YES) {
								that.navToDisplay();
							}
						}

					});
				}
			} else if (subPlanAction === "CREATE") {
				if (activateFlag) {
					that.navToMain();
				} else {
					oMsgBox.show(i18n.getText("goBackDisplay"), {
						icon: oMsgBox.Icon.WARNING,
						title: i18n.getText("Discard"),
						actions: [oMsgBox.Action.YES, oMsgBox.Action.NO],
						onClose: function (oAction) {
							if (oAction === oMsgBox.Action.YES) {
								that.navToMain();
							}
						}
					});
				}
			}
		},
		//on Activate button
		onActivate: function () {
			var itemObj = {},
				manualTrackCodes = [],
				trackCodeRange = [],
				trackObj = {},
				oItems = [],
				tCodes = [],
				oTracks = [],
				i, t;
			var oHeader = oView.getModel("SubPlanHeader").getData();
			var subPlanItems = oView.getModel("SubPlanItemList").getData();
			if (subPlanItems.length === 0) {
				oMsgBox.information(i18n.getText("SubPlanItemsMustForActivate"));
				return;
			}

			//get tracking codes range
			oLogicHelper._setTrackingRangeData(oView);
			trackCodeRange = oView.getModel("FronendTrackCodesData").getData();
			if (oView.getModel("manualTrackCodesData").getData()) {
				manualTrackCodes = oView.getModel("manualTrackCodesData").getData().split(/\r?\n/);
			}
			if (trackCodeRange.length > Constants.lc_99) {
				oMsgBox.information(i18n.getText("FrontendTrackingCodeRangeLimit"));
				return;
			}
			//check UI validations on Save/activate
			this._UIvalidationsForTrackingCodes();
			//check error msgs from msg model
			// this.checkErrorMsgModel();
			// if (errorCount !== 0) {
			// 	return;
			// }

			//check UI validations on Save/activate
			//check UI validations for Header
			this._UIvalidationsForSubPlanHeader();
			this._UIvalidationsForItems();
			//check error msgs from msg model
			this.checkErrorMsgModel();
			if (errorCount !== 0) {
				return;
			}
			//adding backend track code
			if (oHeader.BackendTrackCode !== "" && oHeader.BackendTrackCode !== undefined) {
				var subplanItems = oView.getModel("SubPlanItemList").getData();
				for (var j = 0; j < subplanItems.length; j++) {
					if (subplanItems[j].SequenceNumber !== "1") {
						oView.getModel("SubPlanItemList").setProperty("/" + j + "/TrackingCode", oHeader.BackendTrackCode);
						// subplanItems[i].TrackingCode = subPlanHeaderData.BackendTrackCode;
					}
				}
			}
			for (i = 0; i < subPlanItems.length; i++) {

				if (subPlanItems[i].Material) {
					itemObj = {};
					itemObj.SubItemInternalID = subPlanItems[i].SubItemInternalID;
					itemObj.SubPlanID = oHeader.SubPlanID;
					itemObj.ProdID = subPlanItems[i].ProdID;
					itemObj.Material = subPlanItems[i].Material;
					itemObj.MaterialSubstitution = subPlanItems[i].MaterialSubstitution;
					itemObj.CatalogMaterial = subPlanItems[i].CatalogMaterial;
					itemObj.MaterialDescription = subPlanItems[i].MaterialDescription;
					itemObj.ProdSeqNum = subPlanItems[i].ProdSeqNum;
					itemObj.TrackingCode = subPlanItems[i].TrackingCode;
					itemObj.PanelArea = subPlanItems[i].PanelArea;
					itemObj.PanelCode = subPlanItems[i].PanelCode;
					itemObj.ProdSellPrice = subPlanItems[i].ProdSellPrice;
					itemObj.PostageHandling = subPlanItems[i].PostageHandling;
					itemObj.PostageHandling2 = subPlanItems[i].PostageHandling2;
					itemObj.ProdAmtPaidTrigger = subPlanItems[i].ProdAmtPaidTrigger;
					itemObj.FreeProduct = subPlanItems[i].FreeProduct;
					itemObj.NumberOfInstalls = subPlanItems[i].NumberOfInstalls;
					itemObj.FirstInstallAmt = subPlanItems[i].FirstInstallAmt;
					itemObj.InvAllocationCode = subPlanItems[i].InvAllocationCode;
					itemObj.TmpltLineNbr = subPlanItems[i].TmpltLineNbr;
					itemObj.OfferSeqNbr = subPlanItems[i].OfferSeqNbr;
					itemObj.DeletionFlag = subPlanItems[i].DeletionFlag;
					itemObj.TBDFlag = subPlanItems[i].TBDFlag;
					itemObj.PromiseDays = subPlanItems[i].PromiseDays;
					itemObj.NumberOfDays = subPlanItems[i].NumberOfDays;
					itemObj.PurchaseLimit = subPlanItems[i].PurchaseLimit;
					itemObj.SegmentCode = subPlanItems[i].SegmentCode;
					itemObj.SegmentDescrip = subPlanItems[i].SegmentDescrip;
					itemObj.SubSegmentCode = subPlanItems[i].SubSegmentCode;
					itemObj.SubSegmentDescrip = subPlanItems[i].SubSegmentDescrip;
					itemObj.NubrPmtsBefore = subPlanItems[i].NubrPmtsBefore;
					itemObj.UnequalFirstInstallment = subPlanItems[i].UnequalFirstInstallment;
					itemObj.Category1 = subPlanItems[i].Category1;
					itemObj.Category2 = subPlanItems[i].Category2;
					itemObj.Category3 = subPlanItems[i].Category3;
					itemObj.Category4 = subPlanItems[i].Category4;
					itemObj.Category5 = subPlanItems[i].Category5;
					itemObj.CreatedByUser = subPlanItems[i].CreatedByUser;
					itemObj.CreationDate = subPlanItems[i].CreationDate;
					itemObj.CreationTime = subPlanItems[i].CreationTime;
					itemObj.ChangeUser = subPlanItems[i].ChangeUser;
					itemObj.ChangeDate = subPlanItems[i].ChangeDate;
					itemObj.ChangeTime = subPlanItems[i].ChangeTime;
					if (subPlanItems[i].StaticPromiseDate === "") {
						itemObj.StaticPromiseDate = null;
					} else {
						itemObj.StaticPromiseDate = subPlanItems[i].StaticPromiseDate;
					}
					itemObj.ShipIntervalDayNonCC = subPlanItems[i].ShipIntervalDayNonCC;
					itemObj.ShipIntervalDaysCC = subPlanItems[i].ShipIntervalDaysCC;
					//add tracking codes
					if (itemObj.ProdSeqNum === "1") {
						// add manual tracking codes to Item array
						for (t = 0; t < manualTrackCodes.length; t++) {
							trackObj = {};
							if (manualTrackCodes[t]) {
								trackObj.Prodid = subPlanItems[i].ProdID;
								trackObj.SubPlanID = oHeader.SubPlanID;
								trackObj.PlanVersionNum = oHeader.PlanVersionNum;
								trackObj.Material = subPlanItems[i].Material;
								trackObj.ManualTrackingRange = manualTrackCodes[t]; //.TrackingCode;
								oTracks.push(trackObj);
							}
						}
						// add Range Tracking Codes to Item array
						for (t = 0; t < trackCodeRange.length; t++) {
							trackObj = {};
							trackObj.Prodid = subPlanItems[i].ProdID;
							trackObj.SubPlanID = oHeader.SubPlanID;
							trackObj.PlanVersionNum = oHeader.PlanVersionNum;
							trackObj.Material = subPlanItems[i].Material;
							trackObj.TrackingRange = trackCodeRange[t].TrackingCode;
							oTracks.push(trackObj);
						}

						itemObj.SubPlanTrackingCodesNav = oTracks;
					}
					//delete status columns
					// delete itemObj[i].Status;
					// delete itemObj[i].StatusText;
					oItems.push(itemObj);
				}
			}
			//calculate number of items if status is shell creation or Inactive
			if (oHeader.Status === Constants.subPlanShellCreationStatus ||
				oHeader.Status === Constants.subPlanInactiveStatus) {
				var ctrlength = oItems.filter(function (item) {
					return !item.DeletionFlag;
				}).length;
				oView.getModel("SubPlanHeader").setProperty("/NumberOfUnits", ctrlength.toString());
			} else {
				oView.getModel("SubPlanHeader").setProperty("/NumberOfUnits", oItems.length.toString());
			}
			var oEntry = {
				"Buttonflag": "ACTI", //ACTI
				"Status": oHeader.Status, //I
				"SalesOrganization": oHeader.SalesOrganization,
				"SubPlanID": oHeader.SubPlanID, //  "040858",
				"OfferSeqNbr": oHeader.OfferSeqNbr,
				"PromoID": oHeader.PromoID,
				"PlanID": oHeader.PlanID,
				"PlanVersionDesc": oHeader.PlanVersionDesc,
				"SubplanName": oHeader.SubplanName,
				"PlanVersionNum": oHeader.PlanVersionNum,
				"MarketArea": oHeader.MarketArea,
				"ClntSrvcsTrackingCode": oHeader.ClntSrvcsTrackingCode,
				"BackendTrackCode": oHeader.BackendTrackCode,
				// "SegmentCode": oHeader.SegmentCode,
				// "SubSegmentCode": oHeader.SubSegmentCode,
				"PromiseDays": oHeader.PromiseDays,
				"PanelArea": oHeader.PanelArea,
				"ShipIntervalDaysCC": oHeader.ShipIntervalDaysCC,
				"TrackingCodeFrom": oHeader.TrackingCodeFrom,
				"TrackingCodeTo": oHeader.TrackingCodeTo,
				// "StaticPromiseDate": oHeader.StaticPromiseDate,
				"ShipIntervalDayNonCC": oHeader.ShipIntervalDayNonCC,
				"NumberOfDays": oHeader.NumberOfDays,
				"NumberOfInstalls": oHeader.NumberOfInstalls,
				"NubrPmtsBefore": oHeader.NubrPmtsBefore,
				"PurchaseLimit": oHeader.PurchaseLimit,
				"InvAllocationCode": oHeader.InvAllocationCode,
				"ConsecutiveReturnCount": oHeader.ConsecutiveReturnCount,
				"PostageHandling": oHeader.PostageHandling,
				"PostageHandling2": oHeader.PostageHandling2,
				"CatalogID": oHeader.CatalogID,
				"Reportbreak": oHeader.Reportbreak,
				"SlidingScaleType": oHeader.SlidingScaleType,
				"NumberOfUnits": oHeader.NumberOfUnits, //oItems.length.toString(),
				"PercentReturnThres": oHeader.PercentReturnThres,
				"Category1": oHeader.Category1,
				"Category2": oHeader.Category2,
				"Category3": oHeader.Category3,
				"Category4": oHeader.Category4,
				"Category5": oHeader.Category5,
				"UnequalFirstInstallment": oHeader.UnequalFirstInstallment,
				"WEBOEFlag": oHeader.WEBOEFlag,
				"RolloutMaterial": oHeader.RolloutMaterial,
				"RolloutMaterialDes": oHeader.RolloutMaterialDes,
				"CatalogMaterial": oHeader.CatalogMaterial,
				"CatalogMaterialDes": oHeader.CatalogMaterialDes,
				"PerformTrackValidationFlag": oHeader.PerformTrackValidationFlag,
				"CreatedByUser": oHeader.CreatedByUser,
				"CreationDate": oHeader.CreationDate,
				"CreationTime": oHeader.CreationTime,
				"ChangeUser": oHeader.ChangeUser,
				"ChangeDate": oHeader.ChangeDate,
				"ChangeTime": oHeader.ChangeTime,
				"SubplanInboundNav": {
					"results": oItems
				}
			};
			if (oHeader.CTN) {
				oEntry.CTN = "X";
			} else {
				oEntry.CTN = "";
			}
			if (oHeader.Agedtrackingcode) {
				oEntry.Agedtrackingcode = "X";
			} else {
				oEntry.Agedtrackingcode = "";
			}
			if (oHeader.PromoplanFlag) {
				oEntry.PromoplanFlag = "X";
			} else {
				oEntry.PromoplanFlag = "";
			}
			sPath = "/SubplanInboundHeadSet";
			that = this;
			// var subPlanItems = [];
			// var subPlanItemObj = {};
			var oSuccess = function (oData) {
				activateFlag = true;
				oView.getModel("SubPlanHeader").setProperty("/Status", oData.Status);
				//handle error message
				oMsgs = [];
				oView.getModel("oMsgModel").setData(oMsgs);
				if (oData.Message1.Type === "E") {
					that.fillMessagePopover(i18n.getText("Error"), oData.Message1.Message, oData.Message1.Message, oData.Message1.MessageV1, oData
						.Message1
						.MessageV1,
						"OData");
				}
				for (i = 0; i < oData.SubplanInboundNav.results.length; i++) {
					if (oData.SubplanInboundNav.results[i].Message2.Type === "E") {
						that.fillMessagePopover(i18n.getText("Error"), oData.SubplanInboundNav.results[i].Message2.Message, oData.SubplanInboundNav.results[
							i].Message2.Message, oData.SubplanInboundNav.results[
							i].Message2.MessageV1, oData.SubplanInboundNav.results[i].Message2.MessageV1, "OData");
					}
				}
				sap.ui.core.BusyIndicator.hide();
				if (oView.getModel("oMsgModel").getData().length === 0) {
					oMsgBox.show(i18n.getText("SubPlanActivationSuccess"), {
						icon: oMsgBox.Icon.SUCCESS,
						title: "Success",
						actions: [oMsgBox.Action.OK],
						onClose: function (oAction) {
							if (oAction === oMsgBox.Action.OK) {
								that.navToDisplay();
								// that.navToMain();
							}
						}
					});
				}
			};
			var oError = function (error) {
				sap.ui.core.BusyIndicator.hide();
				// // that.ErrorHandling(error);
			};
			sap.ui.core.BusyIndicator.show();
			this.getOwnerComponent().getModel().create(sPath, oEntry, {
				success: oSuccess,
				error: oError
			});
		},
		//triggers when user clicks on Cancel in Tracking Range Dialog
		ontrackCodeRangeDisplayDialogCancel: function (oEvt) {
			this._trackCodeRangeDisplayDialog.close();
		},
		onDisplayTrackCodesDialog: function () {
			// create value help dialog
			if (!this._trackCodeRangeDisplayDialog) {
				this._trackCodeRangeDisplayDialog = sap.ui.xmlfragment(
					"com.itell.bradford.ZSD_SUBPLAN_MAINT.fragments.TrackCodeRangeDisplay",
					this
				);
				this.getView().addDependent(this._trackCodeRangeDisplayDialog);
			}
			this._trackCodeRangeDisplayDialog.open();
		},
		//on numeric fields change at header level
		onDefaultsTabNumericFieldsChange: function (oEvt) {
			activateFlag = false;
			oLogicHelper.defTabNumFieldValidations(oEvt, i18n, this);
		},
		//header decimal fields change
		onHeaderDecimalFieldChange: function (oEvt) {
			activateFlag = false;
			var oName = oEvt.getSource().getName();
			var oVal = oEvt.getSource().getValue();
			switch (oName) {
			case i18n.getText("OfferSeqNum"):
				if (oVal.trim().length > 0) {
					oVal = parseFloat(oVal).toFixed(3);
					if (!oVal.match(regFloatExp)) {
						oEvt.getSource().setValueState("Error");
						oEvt.getSource().setValueStateText(i18n.getText("invalidPriceEntry"));
						this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
							"invalidPriceEntry"));
						return;
					}
					oView.getModel("SubPlanHeader").setProperty("/OfferSeqNbr", oVal);
					oEvt.getSource().setValueState("None");
					oEvt.getSource().setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
				break;
			case i18n.getText("SSPrice"):
				if (oVal.trim().length > 0) {
					oVal = parseFloat(oVal).toFixed(2);
					if (!oVal.match(regFloatExp)) {
						oEvt.getSource().setValueState("Error");
						oEvt.getSource().setValueStateText(i18n.getText("invalidPriceEntry"));
						this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), i18n.getText("invalidPriceEntry"));
						return;
					}
					if (oVal === "0.00") {
						if (oView.getModel("SubPlanHeader").getProperty("/PostageHandling2") === "0.00") {
							oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorState", i18n.getText("None"));
							oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorText", "");
							this.removeMessagePopoverObject(i18n.getText("MultiSSPrice"));
						} else {
							oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorState", i18n.getText("Warning"));
							oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorText", i18n.getText("MultiSS2GTSSZero"));
							this.fillMessagePopover(i18n.getText("Warning"), i18n.getText("MultiSSPrice"), i18n.getText("MultiSSPrice"), i18n.getText(
								"MultiSS2GTSSZero"));
						}
					} else if (parseFloat(oView.getModel("SubPlanHeader").getProperty("/PostageHandling2")) < parseFloat(oVal)) {
						oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorState", i18n.getText("Warning"));
						oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorText", i18n.getText("MultiSS2GTSS"));
						this.fillMessagePopover(i18n.getText("Warning"), i18n.getText("MultiSSPrice"), i18n.getText("MultiSSPrice"), i18n.getText(
							"MultiSS2GTSS"));
						// return;
					} else {
						this.removeMessagePopoverObject(i18n.getText("MultiSSPrice"));
					}
					oView.getModel("SubPlanHeader").setProperty("/PostageHandling", oVal);
					oEvt.getSource().setValueState("None");
					oEvt.getSource().setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				} else {
					oView.getModel("SubPlanHeader").setProperty("/PostageHandling", parseFloat(0).toFixed(2));
					oEvt.getSource().setValueState("None");
					oEvt.getSource().setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
				break;
			case i18n.getText("MultiSSPrice"):
				if (oVal.trim().length > 0) {
					oVal = parseFloat(oVal).toFixed(2);
					if (!oVal.match(regFloatExp)) {
						oEvt.getSource().setValueState("Error");
						oEvt.getSource().setValueStateText(i18n.getText("invalidPriceEntry"));
						this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
							"invalidPriceEntry"));
						return;
					}
					if (parseFloat(oVal) < parseFloat(oView.getModel("SubPlanHeader").getProperty("/PostageHandling"))) {
						oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorState", i18n.getText("Warning"));
						oView.getModel("SubPlanHeader").setProperty("/PostageHandling2ErrorText", i18n.getText("MultiSS2GTSS"));
						this.fillMessagePopover(i18n.getText("Warning"), i18n.getText("MultiSSPrice"), i18n.getText("MultiSSPrice"), i18n.getText(
							"MultiSS2GTSS"));
						oView.getModel("SubPlanHeader").setProperty("/PostageHandling2", oVal);
						return;
					}
					oView.getModel("SubPlanHeader").setProperty("/PostageHandling2", oVal);
					oEvt.getSource().setValueState("None");
					oEvt.getSource().setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				} else {
					oView.getModel("SubPlanHeader").setProperty("/PostageHandling2", parseFloat(0).toFixed(2));
					oEvt.getSource().setValueState("None");
					oEvt.getSource().setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
				break;
			case i18n.getText("UnequalFirstInstallment"):
				if (oVal.trim().length > 0) {
					oVal = parseFloat(oVal).toFixed(2);
					if (!oVal.match(regFloatExp)) {
						oEvt.getSource().setValueState("Error");
						oEvt.getSource().setValueStateText(i18n.getText("invalidPriceEntry"));
						this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
							"invalidPriceEntry"));
						return;
					}
					oView.getModel("SubPlanHeader").setProperty("/UnequalFirstInstallment", oVal);
					oEvt.getSource().setValueState("None");
					oEvt.getSource().setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				} else {
					oView.getModel("SubPlanHeader").setProperty("/UnequalFirstInstallment", parseFloat(0).toFixed(2));
					oEvt.getSource().setValueState("None");
					oEvt.getSource().setValueStateText("");
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
				break;
			}
		},
		//on Rollout Material Change:
		onRolloutMaterialChange: function (oEvt) {
			var oVal = oEvt.getSource().getValue();
			this._oSource = oEvt.getSource();
			//check if given material is valid to DB or not
			sPath = "/MaterialF4HelpSet";
			aFilters = [];
			aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oVal));
			aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oView.getModel("SubPlanHeader").getProperty(
				"/SalesOrganization")));
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					if (response.results.length > 0) {
						oView.getModel("SubPlanHeader").setProperty("/RolloutMaterial", response.results[0].Material);
						oView.getModel("SubPlanHeader").setProperty("/RolloutMaterialDes", response.results[0].MaterialDescription);
						this._oSource.setValueState(i18n.getText("None"));
						this._oSource.setValueStateText("");
					} else {
						this._oSource.setValue("");
						oView.getModel("SubPlanHeader").setProperty("/RolloutMaterialDes", "");
						oMsgToast.show(i18n.getText("enterValidMaterial"));
					}
				}.bind(this))
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				});
		},

		//on Catalog Material Change:
		onCatalogMaterialChange: function (oEvt) {
			var oVal = oEvt.getSource().getValue();
			this._oSource = oEvt.getSource();
			var marketArea = oView.getModel("SubPlanHeader").getProperty("/MarketArea");
			if (marketArea === "" || marketArea === undefined || marketArea === null) {
				oMsgBox.information(i18n.getText("enterMarketAreaFirst"));
				oEvt.getSource().setValue("");
				return;
			}
			//check if given material is valid to DB or not
			sPath = "/MaterialF4HelpSet";
			aFilters = [];
			aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oVal));
			aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oView.getModel("SubPlanHeader").getProperty(
				"/SalesOrganization")));
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					if (response.results.length > 0) {
						oView.getModel("SubPlanHeader").setProperty("/CatalogMaterial", response.results[0].Material);
						oView.getModel("SubPlanHeader").setProperty("/CatalogMaterialDes", response.results[0].MaterialDescription);
						this._oSource.setValueState(i18n.getText("None"));
						this._oSource.setValueStateText("");
					} else {
						this._oSource.setValue("");
						oView.getModel("SubPlanHeader").setProperty("/CatalogMaterialDes", "");
						oMsgToast.show(i18n.getText("enterValidMaterial"));
					}
					oView.byId("TrackingCodeFromInp").fireLiveChange();
					oView.byId("TrackingCodeToInp").fireLiveChange();
				}.bind(this))
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				});
		},

		//on CatalogId Change
		onCatalogChange: function (oEvent) {
			var oVal = oEvent.getSource().getValue();
			this._aSource = oEvent.getSource();
			var marketArea = oView.getModel("SubPlanHeader").getProperty("/MarketArea");
			if (marketArea === "" || marketArea === undefined || marketArea === null) {
				oMsgBox.information(i18n.getText("enterMarketAreaFirst"));
				oEvent.getSource().setValue("");
				return;
			}
			sPath = "/CatalogIDF4HelpSet";
			aFilters = [];
			aFilters.push(new sap.ui.model.Filter("CatalogID", sap.ui.model.FilterOperator.EQ, oVal));
			aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oView.getModel("SubPlanHeader").getProperty(
				"/SalesOrganization")));
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					if (response.results.length > 0) {
						oView.getModel("SubPlanHeader").setProperty("/CatalogID", response.results[0].CatalogID);
						// oView.getModel("SubPlanHeader").setProperty("/ConditonType", response.results[0].MaterialDescription);
						this._aSource.setValueState(i18n.getText("None"));
						this._aSource.setValueStateText("");
					} else {
						this._aSource.setValue("");
						oView.getModel("SubPlanHeader").setProperty("/CatalogID", "");
						oMsgToast.show(i18n.getText("enterValidCatalog"));
					}
				}.bind(this))
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				});

		},

		//on SS Type Change Function
		onSlidingScaleChange: function (oEvent) {
			var oVal = oEvent.getSource().getValue();
			this._bSource = oEvent.getSource();
			var marketArea = oView.getModel("SubPlanHeader").getProperty("/MarketArea");
			if (marketArea === "" || marketArea === undefined || marketArea === null) {
				oMsgBox.information(i18n.getText("enterMarketAreaFirst"));
				oEvent.getSource().setValue("");
				return;
			}
			sPath = "/SlidingScaleHelpSet";
			aFilters = [];
			aFilters.push(new sap.ui.model.Filter("Value", sap.ui.model.FilterOperator.EQ, oVal));
			// aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oView.getModel("SubPlanHeader").getProperty(
			// "/SalesOrganization")));
			sap.ui.core.BusyIndicator.show();
			oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					if (response.results.length > 0) {
						oView.getModel("SubPlanHeader").setProperty("/Value", response.results[0].Value);
						// oView.getModel("SubPlanHeader").setProperty("/ConditonType", response.results[0].MaterialDescription);
						this._bSource.setValueState(i18n.getText("None"));
						this._bSource.setValueStateText("");
					} else {
						this._bSource.setValue("");
						oView.getModel("SubPlanHeader").setProperty("/Value", "");
						oMsgToast.show(i18n.getText("enterValidSliding"));
					}
				}.bind(this))
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				});

		},

		// //OData validation for payment terms
		// _paymentTermValidations: function (oEvt, paymentTermValue) {
		// 	var oVal = oEvt.getSource().getValue();
		// 	var oHeaderModel = oView.getModel("SubPlanHeader");
		// 	oEventSrc = oEvt.getSource();
		// 	aFilters = [];
		// 	aFilters.push(new sap.ui.model.Filter("PlanVersionNum", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().PlanVersionNum));
		// 	aFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SubPlanID));
		// 	aFilters.push(new sap.ui.model.Filter("OfferSeqNbr", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().OfferSeqNbr));
		// 	aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SalesOrganization));
		// 	sPath = "/FieldValidationSet";
		// 	aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, Constants.paymentTerms));
		// 	aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, paymentTermValue));
		// 	that = this;
		// 	oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
		// 		.then(function (response) {
		// 			debugger;
		// 			if (response.results[0].Message1.Type === "E") {
		// 				oMsgBox.error(response.results[0].Message1.MessageV1);
		// 				oEventSrc.setValue("");
		// 				oEventSrc.setValueState(i18n.getText("None"));
		// 				oEventSrc.setValueStateText("");
		// 			} else {}
		// 		})
		// 		.catch(function (error) {
		// 			// that.ErrorHandling(error);
		// 		});
		// },
		//Input fields validation on Item level
		onSubPlanItemFieldChange: function (oEvt) {
			activateFlag = false;
			this._oSource = oEvt.getSource();
			var oName = oEvt.getSource().getName();
			var oHeaderModel = oView.getModel("SubPlanHeader");
			var oVal = oEvt.getSource().getValue();
			var path = oEvt.getSource().getBindingContext("SubPlanItemList").getPath();
			errorText = oEvt.getSource().getValueStateText();
			oEventSrc = oEvt.getSource();
			var paymentTermValue = "";
			aFilters = [];
			aFilters.push(new sap.ui.model.Filter("PlanVersionNum", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().PlanVersionNum));
			aFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SubPlanID));
			aFilters.push(new sap.ui.model.Filter("OfferSeqNbr", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().OfferSeqNbr));
			aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SalesOrganization));
			switch (oName) {
			case i18n.getText("Numberinstalls"):
				if (oVal !== "") {
					//this will validate data type and max lengtg of the field
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oEvt.getSource().setValueState(i18n.getText("None"));
						oEvt.getSource().setValueStateText("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					} else {
						if (oVal === "0") {
							oEvt.getSource().setValue("");
							oEvt.getSource().setValueState(i18n.getText("None"));
							oEvt.getSource().setValueStateText("");
							oMsgToast.show(oName + " " + i18n.getText("cannotBeZero"));
						} else {
							//validate agnist  paymets before shipment
							var NubrPmtsBefore = this.getView().getModel("SubPlanItemList").getProperty(path + "/NubrPmtsBefore");
							if (NubrPmtsBefore) {
								if (parseInt(NubrPmtsBefore) > parseInt(oVal)) {
									that.getView().getModel("SubPlanItemList").setProperty(path + "/NubrPmtsBefore", "");
									that.getView().getModel("SubPlanItemList").setProperty(path + "/NubrPmtsBefore", "0");
									that.getView().getModel("SubPlanItemList").refresh();
									oMsgToast.show(i18n.getText("NumOfInstallsShouldbeLess"));
								}
							}
							// oLogicHelper.defTabNumFieldValidations(oEvt, i18n, this);
							//then normal data validation comes here
							if (oHeaderModel.getProperty("/NumberOfInstalls") !== "" && oHeaderModel.getProperty("/NumberOfInstalls") !== oEvt.getSource()
								.getValue()) {
								oEvt.getSource().setValueState("Warning");
								oEvt.getSource().setValueStateText(i18n.getText("defalultValMatchWarning"));
								// this.fillMessagePopover(i18n.getText("Warning"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
								// 	"defalultValMatchWarning"));
								paymentTermValue = oVal + Constants.comma + this.getView().getModel("SubPlanItemList").getProperty(path + "/NubrPmtsBefore");
								oLogicHelper._paymentTermValidations(oView, oDataModel, i18n, oEvt, paymentTermValue);
								sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
								if (sameErrorCount === 0) {
									this.removeMessagePopoverObject(oEvt.getSource().getName());
								}
							} else {
								oEvt.getSource().setValueState("None");
								oEvt.getSource().setValueStateText("");
								sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
								if (sameErrorCount === 0) {
									this.removeMessagePopoverObject(oEvt.getSource().getName());
								}
								//oData validations
								paymentTermValue = oVal + Constants.comma + this.getView().getModel("SubPlanItemList").getProperty(path + "/NubrPmtsBefore");
								oLogicHelper._paymentTermValidations(oView, oDataModel, i18n, oEvt, paymentTermValue);
							}
							//fill first installment amount
							// var iPath2 = path.split("/")[1];
							this._fillFirstInstallment(path.split("/")[1]);
						}
					}
				}
				break;
			case i18n.getText("NubrPmtsBefore"):
				var NumberOfInstalls = this.getView().getModel("SubPlanItemList").getProperty(path + "/NumberOfInstalls");
				if (NumberOfInstalls === undefined || NumberOfInstalls === "") {
					oMsgToast.show(i18n.getText("enterNumberOfInstallsFirst"));
					oEvt.getSource().setValue("");
					return;
				}
				if (oVal !== "") {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oEvt.getSource().setValueState(i18n.getText("None"));
						oEvt.getSource().setValueStateText("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					} else {
						//validate agnist  number of installs
						var NumberOfInstalls = this.getView().getModel("SubPlanItemList").getProperty(path + "/NumberOfInstalls");
						if (NumberOfInstalls !== undefined || NumberOfInstalls !== "") {
							if (parseInt(oVal) > parseInt(NumberOfInstalls)) {
								this.getView().getModel("SubPlanItemList").setProperty(path + "/NubrPmtsBefore", "");
								// that.getView().getModel("SubPlanItemList").setProperty(path + "/NubrPmtsBefore", "0");
								this.getView().getModel("SubPlanItemList").refresh();
								oMsgToast.show(i18n.getText("NumOfInstallsShouldbeLess"));
							} else {
								paymentTermValue = NumberOfInstalls + Constants.comma + this.getView().getModel("SubPlanItemList").getProperty(path +
									"/NubrPmtsBefore");
								oLogicHelper._paymentTermValidations(oView, oDataModel, i18n, oEvt, paymentTermValue);

							}
						}
					}
				}
				break;
			case i18n.getText("PromiseDays"):
				if (oVal !== "") {
					//this will validate data type and max lenght of the field
					oLogicHelper.defTabNumFieldValidations(oEvt, i18n, this);
					//then normal data validation comes here
					oView.getModel("SubPlanItemList").setProperty(path + "/PromiseDaysState", i18n.getText("None"));
					oView.getModel("SubPlanItemList").setProperty(path + "/PromiseDaysStateText", "");
					// if (oView.getModel("SubPlanItemList").getProperty(path + "/PromiseDays")) {
					// 	// this._setStaticPromiseMiniDate(oView.getModel("SubPlanItemList").getProperty(path + "/PromiseDays"), path);
					// }
					sameErrorCount = this._checkAnotherUIErrorExists(i18n.getText("PromiseDays"));
					if (sameErrorCount === 0) {
						this.removeMessagePopoverObject(i18n.getText("PromiseDays"));
					}
				}
				break;
			case i18n.getText("StaticPromiseDate"):
				if (oVal !== "") {
					//then normal data validation comes here
					oView.getModel("SubPlanItemList").setProperty(path + "/StaticPromiseDateState", i18n.getText("None"));
					sameErrorCount = this._checkAnotherUIErrorExists(i18n.getText("StaticPromiseDate"));
					if (sameErrorCount === 0) {
						this.removeMessagePopoverObject(i18n.getText("StaticPromiseDate"));
					}
				}
				break;
			case i18n.getText("ShipIntervalCC"):
				if (oVal !== "") {
					//this will validate data type and max lenght of the field
					oLogicHelper.defTabNumFieldValidations(oEvt, i18n, this);
					//then normal data validation comes here
					this.removeMessagePopoverObject(i18n.getText("ShipIntervalCC"));
					sPath = "/FieldValidationSet";
					aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, "SHIPINTERVALDAYSCC"));
					aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, oVal));
					that = this;
					sap.ui.core.BusyIndicator.show();
					oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
						.then(function (response) {
							sap.ui.core.BusyIndicator.hide();
							for (var i = 0; i < response.results.length; i++) {
								if (response.results[i].Message1.Type === "E") {
									that.removeMessagePopoverObject(errorText);
									errorText = response.results[i].Message1.MessageV1;
									that.fillMessagePopover(i18n.getText("Error"), errorText, response.results[i].Message1.MessageV1,
										response.results[i].Message1.Message, response.results[i].Message1.Message, "UI");
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDaysCCValState", i18n.getText("Error"));
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDaysCCValText", errorText);
								} else if (response.results[i].Message1.Type === "W") {
									that.removeMessagePopoverObject(errorText);
									errorText = response.results[i].Message1.MessageV1;
									that.fillMessagePopover(i18n.getText("Warning"), errorText, response.results[i].Message1.MessageV1,
										response.results[i].Message1.Message, response.results[i].Message1.Message, "UI");
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDaysCCValState", i18n.getText("Warning"));
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDaysCCValText", errorText);
								} else {
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDaysCCValState", i18n.getText("None"));
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDaysCCValText", "");
									sameErrorCount = that._checkAnotherSameODATAErrorExists(oEventSrc.getName(), errorText);
									if (sameErrorCount === 0) {
										that.removeMessagePopoverObject(errorText);
									}
								}
							}
						})
						.catch(function (error) {
							sap.ui.core.BusyIndicator.hide();
							// that.ErrorHandling(error);
						});
				}
				break;
			case i18n.getText("ShipIntervalNonCC"):
				if (oVal !== "") {
					//this will validate data type and max lenght of the field
					oLogicHelper.defTabNumFieldValidations(oEvt, i18n, this);
					//then normal data validation comes here
					this.removeMessagePopoverObject(i18n.getText("ShipIntervalNonCC"));
					sPath = "/FieldValidationSet";
					aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, "SHIPINTERVALDAYSNONCC"));
					aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, oVal));
					that = this;
					sap.ui.core.BusyIndicator.show();
					oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
						.then(function (response) {
							sap.ui.core.BusyIndicator.hide();
							for (var i = 0; i < response.results.length; i++) {
								if (response.results[i].Message1.Type === "E") {
									that.removeMessagePopoverObject(errorText);
									errorText = response.results[i].Message1.MessageV1;
									that.fillMessagePopover(i18n.getText("Error"), errorText, response.results[i].Message1.MessageV1,
										response.results[i].Message1.Message, response.results[i].Message1.Message, "UI");
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDayNonCCValState", i18n.getText("Error"));
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDayNonCCValText", errorText);
								} else if (response.results[i].Message1.Type === "W") {
									that.removeMessagePopoverObject(errorText);
									errorText = response.results[i].Message1.MessageV1;
									that.fillMessagePopover(i18n.getText("Warning"), errorText, response.results[i].Message1.MessageV1,
										response.results[i].Message1.Message, response.results[i].Message1.Message, "UI");
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDayNonCCValState", i18n.getText("Warning"));
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDayNonCCValText", errorText);
								} else {
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDayNonCCValState", i18n.getText("None"));
									oView.getModel("SubPlanItemList").setProperty(path + "/ShipIntervalDayNonCCValText", "");
									sameErrorCount = that._checkAnotherSameODATAErrorExists(oEventSrc.getName(), errorText);
									if (sameErrorCount === 0) {
										that.removeMessagePopoverObject(errorText);
									}
								}
							}
						})
						.catch(function (error) {
							sap.ui.core.BusyIndicator.hide();
							// that.ErrorHandling(error);
						});
				}
				break;
			case i18n.getText("SequenceNumber"):
				var oItems = oView.getModel("SubPlanItemList").getData();
				// var count = 0;
				var cPath = parseInt(path.split("/")[1]);
				if (cPath !== 0 && oVal === "1") {
					oMsgBox.warning(i18n.getText("seqOneNotAllowed"));
					oEventSrc.setValue("");
					return;
				}
				// for (var i = 0; i < oItems.length; i++) {
				// 	if (parseInt(oItems[i].ProdSeqNum) === parseInt(oVal) && cPath !== i) {
				// 		count += 1;
				// 	}
				// }
				// if (count > 0) {
				// 	oEventSrc.setValueState(i18n.getText("Error"));
				// 	oEventSrc.setValueStateText(i18n.getText("ProdSeqNumExists"));
				// 	this.fillMessagePopover(i18n.getText("Error"), oEvt.getSource().getName(), oEvt.getSource().getName(), i18n.getText(
				// 		"ProdSeqNumExists"));
				// } else {
				oEventSrc.setValueState(i18n.getText("None"));
				oEventSrc.setValueStateText("");
				sameErrorCount = this._checkAnotherUIErrorExists(oEvt.getSource().getName());
				if (sameErrorCount === 0) {
					this.removeMessagePopoverObject(oEvt.getSource().getName());
				}
				// }
				//get sorted sub plan items based on Prod Seq number
				oItems = oLogicHelper.getSubPlanSortedItems(oItems);
				oView.getModel("SubPlanItemList").setData(oItems);
				break;
			case i18n.getText("Material"):
				oView.getModel("SubPlanHeader").setProperty("/PerformTrackValidationFlag", Constants.lc_x);
				this.removeMessagePopoverObject(i18n.getText("Material"));
				oView.getModel("SubPlanItemList").setProperty(path + "/MaterialState", i18n.getText("None"));
				oView.getModel("SubPlanItemList").setProperty(path + "/MaterialValText", "");
				//do material validations
				//check if given material is valid to DB or not
				sPath = "/MaterialF4HelpSet";
				aFilters = [];
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oVal));
				aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oView.getModel("SubPlanHeader").getProperty(
					"/SalesOrganization")));
				sap.ui.core.BusyIndicator.show();
				oLogicHelper.callGETOData(oDataModel, sPath, aFilters)
					.then(function (response) {
						sap.ui.core.BusyIndicator.hide();
						var tPath = this._oSource.getBindingContext("SubPlanItemList").getPath();
						if (response.results.length > 0) {
							var matCheck = false;
							if (tPath !== "/0") {
								matCheck = this._checkMatExistsAtSeqNumberOne(response.results[0].Material);
							}
							//check if the prod seq numb if it is one then material status must be primary
							// if (oView.getModel("SubPlanItemList").getProperty(tPath + "/ProdSeqNum") === "1" &&
							// 	response.results[0].MaterialSalesStatus !== "Z3") {
							// 	this._oSource.setValue("");
							// 	oMsgToast.show(i18n.getText("materialEnteredAtSeqNbrOneMustBePrimary"));
							// 	oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialDescription", "");
							// 	oView.getModel("SubPlanItemList").setProperty(tPath + "/ProdSellPrice", "");
							// 	oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSubstitution", "");
							// 	oView.getModel("SubPlanItemList").setProperty(tPath + "/TBDFlag", false);
							// 	oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSalesStatusDesc", "");
							// 	oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSalesStatus", "");
							// 	return;
							// }
							if (matCheck) {
								this._oSource.setValue("");
								oMsgToast.show(i18n.getText("materialEnteredAtSeqNbrOne"));
								oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialDescription", "");
								oView.getModel("SubPlanItemList").setProperty(tPath + "/ProdSellPrice", "");
								oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSubstitution", "");
								oView.getModel("SubPlanItemList").setProperty(tPath + "/TBDFlag", false);
								oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSalesStatusDesc", "");
								oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSalesStatus", "");
								return;
							} else {
								oView.getModel("SubPlanItemList").setProperty(tPath + "/Material", response.results[0].Material);
								oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialDescription", response.results[0].MaterialDescription);
								oView.getModel("SubPlanItemList").setProperty(tPath + "/ProdSellPrice", response.results[0].ProdSellPrice);
								oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSubstitution", response.results[0].MaterialSubstitution);
								oView.getModel("SubPlanItemList").setProperty(tPath + "/TBDFlag", response.results[0].TBDFlag);
								oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSalesStatusDesc", response.results[0].MaterialSalesStatusDesc);
								oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSalesStatus", response.results[0].MaterialSalesStatus);
							}
						} else {
							this._oSource.setValue("");
							oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialDescription", "");
							oView.getModel("SubPlanItemList").setProperty(tPath + "/ProdSellPrice", "");
							oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSubstitution", "");
							oView.getModel("SubPlanItemList").setProperty(tPath + "/TBDFlag", false);
							oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSalesStatusDesc", "");
							oView.getModel("SubPlanItemList").setProperty(tPath + "/MaterialSalesStatus", "");
							oMsgToast.show(i18n.getText("enterValidMaterial"));
						}
					}.bind(this))
					.catch(function (error) {
						// that.ErrorHandling(error);
					});
				break;
			}
		},

		_setStaticPromiseMiniDate: function (promiseDays, path) {
			var newStaticPromiseMiniDate = new Date();
			newStaticPromiseMiniDate.setDate(newStaticPromiseMiniDate.getDate() + parseInt(promiseDays));
			oView.getModel("SubPlanItemList").setProperty(path + "/StaticPromiseMiniDate", newStaticPromiseMiniDate);
		},
		//material exits at sequence number one 
		_checkMatExistsAtSeqNumberOne: function (Material) {
			var matCheck = false;
			var oItems = oView.getModel("SubPlanItemList").getData();
			for (var i = 0; i < oItems.length; i++) {
				if (oItems[i].ProdSeqNum === "1" && oItems[i].Material === Material) {
					matCheck = true;
				}
			}
			return matCheck;
		},
		//handle message popover for errors and warnings
		handleMessagePopoverPress: function (e) {
			if (!this.oMP) {
				this.createMessagePopover();
			}
			this.oMP.toggle(e.getSource());
		},
		createMessagePopover: function () {
			this.oMP = new oMsgPop({
				items: {
					path: "oMsgModel>/",
					template: new oMsgItem({
						title: "{oMsgModel>title}",
						subtitle: "{oMsgModel>subtitle}",
						description: "{oMsgModel>description}",
						type: "{oMsgModel>type}"
					})
				},
				groupItems: true
			});
			this.getView().byId("popover").addDependent(this.oMP);
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
			 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.CreateSubPlan
			 */
			//	onBeforeRendering: function() {
			//
			//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.CreateSubPlan
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.itell.bradford.ZSD_SUBPLAN_MAINT.view.CreateSubPlan
		 */
		//	onExit: function() {
		//
		//	}

	});

});