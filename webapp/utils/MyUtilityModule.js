sap.ui.define([
   	"sap/ui/export/library",
    "sap/ui/export/Spreadsheet",

], function(ExportLibrary,Spreadsheet) {
    "use strict";
    const EdmType = ExportLibrary.EdmType;
    return {
        anotherValue: "Hello from module!",
        //Method
        myUtilityFunction: function(message) {
            console.log("In Service Portal myUtilityFunction() Parameter : -> ", message);
            return message;
        },

	    generateExcelReport : function(arrColNames, excelFileData, strExcelName){

			debugger;

			var newDate = new Date();
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyyMMdd"
			});
			var subFromDate = oDateFormat.format(newDate);
			var oTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "HHmmss"
			});
			var subFromTime = oTimeFormat.format(newDate);

			var fileName1 = strExcelName + "_" + subFromDate + "_" + subFromTime;

				const aCols = this.createExcelColumnConfig(arrColNames);
				const oSettings = {
					workbook: {
						columns: aCols,
						hierarchyLevel: "Level",
						sheetName: strExcelName
					},
					dataSource: excelFileData,
					fileName: fileName1,
					worker: false
				 // We need to disable worker because we are using a MockServer as OData Service
				};	
				const oSheet = new Spreadsheet(oSettings);
				oSheet.build().finally(function() {
					oSheet.destroy();
				});

		},

	createExcelColumnConfig: function(arrColumnNames) {
			
			const aCols = [];	
			/*
			var stringArray = ["BillDoc", "CreatedOn", "SalesDoc",
				 "PONumber","NetAmt", "FreightAmt", "TotalAmt"];
			*/
    		arrColumnNames.forEach((element) => {
        		console.log(element); 
				// `element` directly represents each string
				aCols.push({
					label: element,
					property: element,
					type: EdmType.String
				});	

  			  });	

				return aCols;
		}
        //End of Methods...

        };
    });

   