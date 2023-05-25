sap.ui.define(["sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/util/formatter",
	"com/itell/bradford/ZSD_SUBPLAN_MAINT/util/Constants"
], function (JSONModel, oMsgToast, oMsgBox, oFormatter, Constants) {
	return {
		callGETOData: function (oDataModel, sPath, oFilters) {
			return new Promise(function (resolve, reject) {
				oDataModel.read(sPath, {
					filters: oFilters,
					success: function (response) {
						resolve(response);
					},
					error: function (error) {
						reject(error);
					}
				});
			});
		},
		getSubPlanVersions: function (subPlanID, that) {
			if (subPlanID) {
				var oModel = new JSONModel();
				that.getView().setModel(oModel, "AvailbleVersionsData");
				var sPath = "/SubplanVersionF4HelpSet";
				var oFilters = [];
				oFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, subPlanID));
				var oDataModel = that.getOwnerComponent().getModel();
				sap.ui.core.BusyIndicator.show();
				var that1 = that;
				var that = this;
				this.callGETOData(oDataModel, sPath, oFilters)
					.then(function (response) {
						sap.ui.core.BusyIndicator.hide();
						that1.getView().getModel("AvailbleVersionsData").setData(response.results);
					})
					.catch(function (error) {
						sap.ui.core.BusyIndicator.hide();
					});
			}
		},
		//navigation to external apps
		//tracking maintenance app 
		navToTrackingMaintenance: function (trackingCode, Material) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				// unhide the back button before navigation
				sap.ui.getCore().byId("backBtn").setVisible(true);
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "ZTRACKING_RAP_FE",
						action: "display"
					},
					params: {
						TrackingCode: trackingCode,
						Material: Material
					}
				});
			}
		},
		//Material Fact sheet
		navToMaterialFactSheet: function (material) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				// unhide the back button before navigation
				sap.ui.getCore().byId("backBtn").setVisible(true);
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "Material",
						action: "displayFactSheet"
					},
					params: {
						Material: material
					}
				});
			}
		},
		//nav to Panel Maintenance
		navToPanelMaintenance: function (panelCode, Material) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				// unhide the back button before navigation
				sap.ui.getCore().byId("backBtn").setVisible(true);
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "ZPANEL_RAP_FE",
						action: "display"
					},
					params: {
						PanelCode: panelCode,
						Material: Material
					}
				});
			}
		},
		//prepare Sub Plan items according to UI once we receive data from OData
		prepareSubPlanItems: function (oData, oView, i18n) {
			var subPlanItemObj = {},
				trackObj = {};
			var allItemtrackCodes = [],
				subPlanItems = [],
				manualTrackCodesForItems = [];
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
				subPlanItemObj.ProdSellPriceCopy = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].ProdSellPrice);
				subPlanItemObj.ProdSellPriceErrorState = i18n.getText("None");
				subPlanItemObj.ProdSellPriceErrorText = "";
				subPlanItemObj.PostageHandling = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].PostageHandling);
				subPlanItemObj.PostageHandlingErrorState = i18n.getText("None");
				subPlanItemObj.PostageHandlingErrorText = "";
				subPlanItemObj.PostageHandling2 = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].PostageHandling2);
				subPlanItemObj.PostageHandling2ErrorState = i18n.getText("None");
				subPlanItemObj.PostageHandling2ErrorText = "";
				subPlanItemObj.ProdAmtPaidTrigger = oFormatter.formatFloat(oData.SubplanInboundNav.results[i].ProdAmtPaidTrigger);
				subPlanItemObj.ProdAmtPaidTriggerErrorState = i18n.getText("None");
				subPlanItemObj.ProdAmtPaidTriggerErrorText = "";
				subPlanItemObj.FreeProduct = oData.SubplanInboundNav.results[i].FreeProduct;
				if (subPlanItemObj.FreeProduct === "X") {
					subPlanItemObj.FreeProductState = i18n.getText("Information");
				} else {
					subPlanItemObj.FreeProductState = i18n.getText("None");
				}
				subPlanItemObj.NumberOfInstalls = oData.SubplanInboundNav.results[i].NumberOfInstalls;
				subPlanItemObj.NumberOfInstallsState = i18n.getText("None");
				subPlanItemObj.NumberOfInstallsErrorText = "";
				subPlanItemObj.FirstInstallAmt = oData.SubplanInboundNav.results[i].FirstInstallAmt;
				subPlanItemObj.NubrPmtsBeforeState = i18n.getText("None");
				subPlanItemObj.NubrPmtsBeforeErrorText = "";
				subPlanItemObj.InvAllocationCode = oData.SubplanInboundNav.results[i].InvAllocationCode;
				subPlanItemObj.TmpltLineNbr = oData.SubplanInboundNav.results[i].TmpltLineNbr;
				subPlanItemObj.OfferSeqNbr = oData.SubplanInboundNav.results[i].OfferSeqNbr;
				subPlanItemObj.PurchaseLimit = oData.SubplanInboundNav.results[i].PurchaseLimit;
				subPlanItemObj.SegmentCode = oData.SubplanInboundNav.results[i].SegmentCode;
				subPlanItemObj.SegmentDescrip = oData.SubplanInboundNav.results[i].SegmentDescrip;
				subPlanItemObj.SubSegmentCode = oData.SubplanInboundNav.results[i].SubSegmentCode;
				subPlanItemObj.SubSegmentDescrip = oData.SubplanInboundNav.results[i].SubSegmentDescrip;
				subPlanItemObj.SegmentCodeState = i18n.getText("None");
				subPlanItemObj.SegmentCodeStateText = "";
				subPlanItemObj.SubSegmentCodeState = i18n.getText("None");
				subPlanItemObj.SubSegmentCodeStateText = "";
				subPlanItemObj.PromiseDays = oData.SubplanInboundNav.results[i].PromiseDays;
				subPlanItemObj.DeletionFlag = oData.SubplanInboundNav.results[i].DeletionFlag;
				subPlanItemObj.TBDFlag = oData.SubplanInboundNav.results[i].TBDFlag;
				subPlanItemObj.NumberOfDays = oData.SubplanInboundNav.results[i].NumberOfDays;
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
				// create & change log info
				subPlanItemObj.CreatedByUser = oData.SubplanInboundNav.results[i].CreatedByUser;
				subPlanItemObj.CreationDate = oData.SubplanInboundNav.results[i].CreationDate;
				subPlanItemObj.CreationTime = oData.SubplanInboundNav.results[i].CreationTime;
				subPlanItemObj.ChangeUser = oData.SubplanInboundNav.results[i].ChangeUser;
				subPlanItemObj.ChangeDate = oData.SubplanInboundNav.results[i].ChangeDate;
				subPlanItemObj.ChangeTime = oData.SubplanInboundNav.results[i].ChangeTime;
				subPlanItemObj.ShipIntervalDaysCCValState = i18n.getText("None");
				subPlanItemObj.ShipIntervalDaysCCValText = "";
				subPlanItemObj.ShipIntervalDayNonCCValState = i18n.getText("None");
				subPlanItemObj.ShipIntervalDayNonCCValText = "";
				subPlanItemObj.ProdSeqNumValueState = i18n.getText("None");
				subPlanItemObj.ProdSeqNumStateText = "";
				subPlanItemObj.PromiseDaysState = i18n.getText("None");
				subPlanItemObj.PromiseDaysStateText = "";
				subPlanItemObj.MaterialState = i18n.getText("None");
				subPlanItemObj.MaterialValText = "";
				subPlanItemObj.StaticPromiseDateState = i18n.getText("None");
				// subPlanItemObj.ConsecutiveReturnCount = oData.SubplanInboundNav.results[i].ConsecutiveReturnCount;
				if (oData.SubplanInboundNav.results[i].StaticPromiseDate !== "0000-00-00") {
					subPlanItemObj.StaticPromiseDate = oData.SubplanInboundNav.results[i].StaticPromiseDate;
					subPlanItemObj.StaticPromiseMiniDate = new Date();
				}
				//get Tracking Codes
				if (oData.SubplanInboundNav.results[i].ProdSeqNum === "1") {
					//pull out manual tracking codes and assign to Manual Tracking display model
					var manualTrackingCodes = "";
					if (oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results) {
						for (var j = 0; j < oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results.length; j++) {
							trackObj = {};
							// manual tracking codes preparation for item level	: only display 				
							trackObj.TrackingCode = oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results[j].ManualTrackingRange;
							if (trackObj.TrackingCode !== "") {
								manualTrackCodesForItems.push(trackObj);
							}
							// manual tracking codes preparation for Header level text area
							if (oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results[j].ManualTrackingRange) {
								manualTrackingCodes = manualTrackingCodes + oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results[j].ManualTrackingRange +
									Constants.newLine;
							}
						}
						oView.getModel("manualTrackCodesData").setData(manualTrackingCodes);
						oView.getModel("manualTrackCodesData").refresh();
						//pull out all Range tracking code
						for (j = 0; j < oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results.length; j++) {
							trackObj = {};
							trackObj.TrackingCode = oData.SubplanInboundNav.results[i].SubPlanTrackingCodesNav.results[j].TrackingRange;
							if (trackObj.TrackingCode !== "") {
								allItemtrackCodes.push(trackObj);
							}
						}
						allItemtrackCodes = allItemtrackCodes.concat(manualTrackCodesForItems);
						oView.getModel("TrackRangeDataDisplay").setData(allItemtrackCodes);
						oView.getModel("TrackRangeDataDisplay").refresh();
					}
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
			if (subPlanItems.length > 0) {
				subPlanItems = this.getSubPlanSortedItems(subPlanItems);
			}
			return subPlanItems;
		},
		//sort Sub Plan based on Prod Seq number
		getSubPlanSortedItems: function (subPlanItems) {
			subPlanItems = subPlanItems.sort(function (a, b) {
				return parseInt(a.ProdSeqNum) - parseInt(b.ProdSeqNum);
			});
			return subPlanItems;
		},
		//create sub plan Item object
		getSubPlanItemObject: function (that) {
			var sunPlanItemObj = {};
			//Fetch i18n Model
			var i18n = that.getOwnerComponent().getModel("i18n").getResourceBundle();
			sunPlanItemObj.SubPlanID = "";
			sunPlanItemObj.ProdID = "";
			sunPlanItemObj.Material = "";
			sunPlanItemObj.MaterialSubstitution = "";
			sunPlanItemObj.MaterialDescription = "";
			sunPlanItemObj.PanelArea = "";
			sunPlanItemObj.PanelCode = "";
			sunPlanItemObj.ProdSeqNum = "";
			sunPlanItemObj.TrackingCode = "";
			sunPlanItemObj.ProdSellPrice = "0.00";
			sunPlanItemObj.ProdSellPriceErrorState = i18n.getText("None");
			sunPlanItemObj.ProdSellPriceErrorText = "";
			sunPlanItemObj.PostageHandling = "0.00";
			sunPlanItemObj.PostageHandlingErrorState = i18n.getText("None");
			sunPlanItemObj.PostageHandlingErrorText = "";
			sunPlanItemObj.PostageHandling2 = "0.00";
			sunPlanItemObj.PostageHandling2ErrorState = i18n.getText("None");
			sunPlanItemObj.PostageHandling2ErrorText = "";
			sunPlanItemObj.ProdAmtPaidTrigger = "0.00";
			sunPlanItemObj.ProdAmtPaidTriggerErrorState = i18n.getText("None");
			sunPlanItemObj.ProdAmtPaidTriggerErrorText = "";
			sunPlanItemObj.FreeProduct = "";
			sunPlanItemObj.FreeProductState = i18n.getText("None");
			sunPlanItemObj.NumberOfInstalls = "";
			sunPlanItemObj.FirstInstallAmt = "0.00";
			sunPlanItemObj.InvAllocationCode = "";
			sunPlanItemObj.TmpltLineNbr = "0.00";
			sunPlanItemObj.OfferSeqNbr = "0.00";
			sunPlanItemObj.UnequalFirstInstallment = "0.00";
			sunPlanItemObj.PurchaseLimit = "";
			sunPlanItemObj.SegmentCode = "";
			sunPlanItemObj.SegmentDescrip = "";
			sunPlanItemObj.SubSegmentCode = "";
			sunPlanItemObj.SubSegmentDescrip = "";
			sunPlanItemObj.SegmentCodeState = i18n.getText("None");
			sunPlanItemObj.SegmentCodeStateText = "";
			sunPlanItemObj.SubSegmentCodeState = i18n.getText("None");
			sunPlanItemObj.SubSegmentCodeStateText = "";
			sunPlanItemObj.PromiseDays = "";
			sunPlanItemObj.DeletionFlag = false;
			sunPlanItemObj.TBDFlag = false;
			sunPlanItemObj.NumberOfDays = "";
			sunPlanItemObj.NubrPmtsBefore = "0";
			sunPlanItemObj.ShipIntervalDaysCC = "";
			sunPlanItemObj.ShipIntervalDayNonCC = "";
			sunPlanItemObj.ShipIntervalDaysCCValState = i18n.getText("None");
			sunPlanItemObj.ShipIntervalDaysCCValText = "";
			sunPlanItemObj.ShipIntervalDayNonCCValState = i18n.getText("None");
			sunPlanItemObj.ShipIntervalDayNonCCValText = "";
			sunPlanItemObj.Status = i18n.getText("None");
			sunPlanItemObj.StatusText = "";

			sunPlanItemObj.StaticPromiseDate = null; //new Date();
			sunPlanItemObj.ProdSeqNumValueState = i18n.getText("None");
			sunPlanItemObj.ProdSeqNumStateText = "";
			sunPlanItemObj.Category1 = "";
			sunPlanItemObj.Category2 = "";
			sunPlanItemObj.Category3 = "";
			sunPlanItemObj.Category4 = "";
			sunPlanItemObj.Category5 = "";
			return sunPlanItemObj;
		},
		//to set manual and range traking code data
		_setTrackingRangeData: function (oView) {
			var tCodes = [],
				// trackCodeRange = [],
				// manualTrackCodes = [],
				i;

			oView.getModel("FronendTrackCodesData").setData(tCodes);
			var subPlanHeaderData = oView.getModel("SubPlanHeader").getData();
			var trackingCodeFrom = subPlanHeaderData.TrackingCodeFrom;
			var trackingCodeTo = subPlanHeaderData.TrackingCodeTo;
			if (trackingCodeFrom !== "" && trackingCodeFrom !== undefined) {
				trackingCodeFrom = trackingCodeFrom.toUpperCase();
				//extarct number from Strin
				// var str = "jhkj7682834";
				var trackingCodeFromNum = trackingCodeFrom.match(/(\d+)/)[0];
				if (trackingCodeFromNum !== null) {
					trackingCodeFromNum = parseInt(trackingCodeFromNum);
					var tcFromText = trackingCodeFrom.split(trackingCodeFromNum, 1);
					if (tcFromText.length > 0) tcFromText = tcFromText[0];
					var obj = {};
					obj.TrackingCode = trackingCodeFrom;
					tCodes.push(obj);
					//check tracking code To validation, if it is empty use only tracking code from
					if (trackingCodeTo !== "" && trackingCodeTo !== undefined) {
						trackingCodeTo = trackingCodeTo.toUpperCase();
						if (trackingCodeTo !== trackingCodeFrom) {
							var trackingCodeToNum = trackingCodeTo.match(/(\d+)/)[0];
							trackingCodeToNum = parseInt(trackingCodeToNum);
							for (i = trackingCodeFromNum + 1; i < trackingCodeToNum; i++) {
								obj = {};
								obj.TrackingCode = tcFromText.concat(i);
								tCodes.push(obj);
							}
							obj = {};
							obj.TrackingCode = trackingCodeTo;
							tCodes.push(obj);
						} else {
							oView.getModel("SubPlanHeader").setProperty("/TrackingCodeTo", "");
						}
					}
					// trackCodeRange = tCodes;
					// manualTrackCodes = oView.getModel("manualTrackCodesData").getData();
					// for (i = 0; i < manualTrackCodes.length; i++) {
					// 	obj = {};
					// 	obj.TrackingCode = manualTrackCodes[i].TrackingCode;
					// 	tCodes.push(obj);
					// }

					// if (manualTrackCodes.length > 0) {
					// 	tCodes = tCodes.concat(manualTrackCodes);
					// }
					// var rangeTrack = new sap.ui.model.json.JSONModel(tCodes);
					// oView.getModel("TrackRangeDataDisplay").setData(rangeTrack);
					oView.getModel("FronendTrackCodesData").setData(tCodes);
				}
			}
		},
		//prepare manual tracking codes as array object
		getManualTrackingCodesArray: function (manualTrackingString) {
			var result = manualTrackingString.split(/\r?\n/);
			var trackObj = {};
			var manualTrackingArray = [];
			for (var i = 0; i < result.length; i++) {
				if (result[i]) {
					trackObj = {};
					trackObj.TrackingCode = result[i];
					manualTrackingArray.push(trackObj);
				}
			}
			return manualTrackingArray;
		},
		//numeric field validation at header level
		defTabNumFieldValidations: function (oEvt, i18n, that) {
			var oName = oEvt.getSource().getName();
			var oVal = oEvt.getSource().getValue();
			var regIntExp = /^[0-9]{1,10}$/g;
			var regAlphaNumExp = /^[a-z0-9]+$/i;
			var paymentTermValue = "";
			switch (oName) {
			case i18n.getText("PanelArea"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regAlphaNumExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("AlphapositiveNumeric"));
					}
				}
				break;
			case i18n.getText("ReportBreak"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regAlphaNumExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("AlphapositiveNumeric"));
					}
				}
				break;
			case i18n.getText("PromiseDays"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					} else if (oVal === "0") {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("cannotBeZero"));
					}
				}
				break;
			case i18n.getText("ShipIntervalCC"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					} else if (oVal === "0") {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("cannotBeZero"));
					}
				}
				break;
			case i18n.getText("ShipIntervalNonCC"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					} else if (oVal === "0") {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("cannotBeZero"));
					}
				}
				break;
			case i18n.getText("NumberOfDays"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					} else if (oVal === "0") {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("cannotBeZero"));
					}
				}
				break;
			case i18n.getText("NumOfInstalls"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					} else if (oVal === "0") {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("cannotBeZero"));
					} else {
						var NubrPmtsBefore = that.getView().getModel("SubPlanHeader").getProperty("/NubrPmtsBefore");
						if (NubrPmtsBefore) {
							if (parseInt(NubrPmtsBefore) > parseInt(oVal)) {
								that.getView().getModel("SubPlanHeader").setProperty("/NubrPmtsBefore", "");
								// that.getView().getModel("SubPlanHeader").setProperty("/NubrPmtsBefore", "0");
								that.getView().getModel("SubPlanHeader").refresh();
								oMsgToast.show(i18n.getText("NumOfInstallsShouldbeLess"));
							}
						}
						//OData validations
						paymentTermValue = oVal + Constants.comma + NubrPmtsBefore;
						this._paymentTermValidations(that.getView(), that.getOwnerComponent().getModel(), i18n, oEvt, paymentTermValue);
					}
				}
				break;
			case i18n.getText("NubrPmtsBefore"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					} else {
						var NumOfInstalls = that.getView().getModel("SubPlanHeader").getProperty("/NumberOfInstalls");
						if (NumOfInstalls) {
							if (parseInt(oVal) > parseInt(NumOfInstalls)) {
								that.getView().getModel("SubPlanHeader").setProperty("/NubrPmtsBefore", "");
								// that.getView().getModel("SubPlanHeader").setProperty("/NubrPmtsBefore", "0");
								that.getView().getModel("SubPlanHeader").refresh();
								oMsgToast.show(i18n.getText("NumOfInstallsShouldbeLess"));
							} else {
								//OData validations
								paymentTermValue = NumOfInstalls + Constants.comma + oVal;
								this._paymentTermValidations(that.getView(), that.getOwnerComponent().getModel(), i18n, oEvt, paymentTermValue);

							}
						}
					}
				}
				break;
			case i18n.getText("PurchaseLimit"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					}
				}
				break;
			case i18n.getText("Category1"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					}
				}
				break;
			case i18n.getText("Category2"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					}
				}
				break;
			case i18n.getText("Category3"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					}
				}
				break;
			case i18n.getText("Category4"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					}
				}
				break;
			case i18n.getText("Category5"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					}
				}
				break;
			case i18n.getText("InvAllocationCode"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regAlphaNumExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("AlphapositiveNumeric"));
					}
				}
				break;
			case i18n.getText("PercentReturnThres"):
				if (oVal.trim().length > 0) {
					if (!oVal.match(regIntExp)) {
						oEvt.getSource().setValue("");
						oMsgToast.show(oName + " " + i18n.getText("positiveNumeric"));
					}
				}
				break;
			}
		},
		//Function to find missing prod seq numbers
		checkMissingProdSeqNums: function (prodSeqNums) {
			var missing = [];
			for (let n = 1; n <= prodSeqNums.length; n++) {
				if (prodSeqNums.indexOf(n.toString()) === -1)
					missing.push(n);
			}
			return missing;
		},
		//OData validation for payment terms
		_paymentTermValidations: function (oView, oDataModel, i18n, oEvt, paymentTermValue) {
			var oVal = oEvt.getSource().getValue();
			var oHeaderModel = oView.getModel("SubPlanHeader");
			var oEventSrc = oEvt.getSource();
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("PlanVersionNum", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().PlanVersionNum));
			aFilters.push(new sap.ui.model.Filter("SubPlanID", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SubPlanID));
			aFilters.push(new sap.ui.model.Filter("OfferSeqNbr", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().OfferSeqNbr));
			aFilters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, oHeaderModel.getData().SalesOrganization));
			var sPath = "/FieldValidationSet";
			aFilters.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, Constants.paymentTerms));
			aFilters.push(new sap.ui.model.Filter("FieldValue", sap.ui.model.FilterOperator.EQ, paymentTermValue));
			// var that = this;
			sap.ui.core.BusyIndicator.show();
			this.callGETOData(oDataModel, sPath, aFilters)
				.then(function (response) {
					sap.ui.core.BusyIndicator.hide();
					if (response.results[0].Message1.Type === "E") {
						oMsgBox.error(response.results[0].Message1.MessageV1);
						oEventSrc.setValue("");
						oEventSrc.setValueState(i18n.getText("None"));
						oEventSrc.setValueStateText("");
						oEventSrc.focus();
						// oEventSrc.onfocusin();
					} else {}
				})
				.catch(function (error) {
					sap.ui.core.BusyIndicator.hide();
					// that.ErrorHandling(error);
				});
		},
	};

});