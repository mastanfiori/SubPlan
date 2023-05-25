sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		// currencyValue: function (sValue) {
		// 	if (!sValue) {
		// 		return "";
		// 	}

		// 	return parseFloat(sValue).toFixed(2);
		// },
		// requestStatus: function (value1, value2) {
		// 	if (value1) {

		// 		return value1 + "-" + value2;
		// 	} else
		// 		return "";
		// },
		// removeZero: function (item) {
		// 	if (item) {
		// 		return item.replace(/^0+/, '');
		// 	} else {
		// 		return "";
		// 	}
		// },
		// formatInteger: function (val) {
		// 	if (!val)
		// 		return "";
		// 	else
		// 		return parseInt(val);
		// },
		formatFloat: function (val) {
			if (!val) {
				return "0.00";
			} else if (val === "NaN") {
				val = "0.000";
				return parseFloat(val).toFixed(2);
			} else {
				return parseFloat(val).toFixed(2);
			}
		},
		materialSalesStatusFormat: function (MaterialSalesStatusDesc, MaterialSalesStatus) {
			if (MaterialSalesStatus) {
				return MaterialSalesStatusDesc + " (" + MaterialSalesStatus + ")";
			}
		}

		// formatFloat: function (val) {
		// 	return parseFloat(val).toFixed(2);
		// },

	};

});