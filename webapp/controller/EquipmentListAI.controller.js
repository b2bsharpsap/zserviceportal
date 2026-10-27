sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"


], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("zserviceportal.controller.EquipmentListAI", {

        // =====================================================================
        // GRID HELPERS  (public API consumed by the parent main view controller)
        // =====================================================================

        /**
         * Returns the equipment data objects of the currently selected rows.
         * Used by the parent controller's action handlers (Create Request,
         * View Orders, Meter Readings, etc.).
         */

        onInit() {
            console.log("EquipmentList controller initialized --> ");
            debugger;
            var oModel = new sap.ui.model.odata.v2.ODataModel(
                "/sap/opu/odata/SAP/ZSD_B2B_SERVICE_SRV/"
            );

            this.getView().setModel(oModel, "modelB2BService");

            var oTable = this.getView().byId("tblEquipmentList");
            oTable.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable.setVisibleRowCount(10);
            this.getUser();

        },

        getUser: function () {

            var oGlobalModel = this.getOwnerComponent().getModel("modelGlobal");
            this.SAPEPUser = oGlobalModel.getProperty("/sapEPUser");
            console.log("EquipList SAPEPUser --> ", this.SAPEPUser);

        },

        loadEquipmentFilter: function (oFilterData) {
            var sSoldTo   = oFilterData.SoldTo;
            var sUser     = oFilterData.User;
            var sOpenType = oFilterData.OpenType;
            

            var sEquipmentId = oFilterData.EquipmentId;
            var sSerial          = oFilterData.SerialNo;
            var sCustomerEquipId = oFilterData.CustomerEquip;


            var oCompModel = new JSONModel();
            this.getOwnerComponent().setModel(oCompModel, "modelEquipDetails");

            this._loadEquipmentList(sSoldTo, sUser, sOpenType, 
                sEquipmentId, sSerial,sCustomerEquipId );
        },

        _loadEquipmentList: function (strSoldTo, strUser, strOpenType, 
                                    strEquipmentId, strSerial, strCustomerEquipId  ) {

            debugger;
            var oModel = this.getView().getModel("modelB2BService");

            var sPath = "/EquipListSet";

            var aFilters = [
                new sap.ui.model.Filter("IvSoldTo", sap.ui.model.FilterOperator.EQ, strSoldTo),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, strUser),
                new sap.ui.model.Filter("IvOpenType", sap.ui.model.FilterOperator.EQ, strOpenType),

                //new sap.ui.model.Filter("IvEquipId", sap.ui.model.FilterOperator.EQ, strEquipmentId),
                //new sap.ui.model.Filter("IvSerNo",   sap.ui.model.FilterOperator.EQ, strSerial),
                //new sap.ui.model.Filter("IvCustEquip", sap.ui.model.FilterOperator.EQ, strCustomerEquipId)
            ];

            var that = this;
            sap.ui.core.BusyIndicator.show();
            oModel.read(sPath, {
                filters: aFilters,
                /*
                urlParameters: {
                    "$top": "20",
                    "$skip": "20"
                    },
                    */
                success: function (oData) {
                    console.log("Success:", oData);
                    debugger;
                     sap.ui.core.BusyIndicator.hide();
                    if (oData.results) {


                        console.log("Records:", oData.results.length);
                        console.log("Next Link:", oData.__next);
                        console.log("Count:", oData.__count);

                        var arrEquipmentList = [];
                        var intLength = oData.results.length;

                        for (var i = 0; i < intLength; i++) {

                            arrEquipmentList.push({
                                "ProductId": oData.results[i].EtEqList.ProductId,
                                "CustEquip": oData.results[i].EtEqList.CustEquip, 
                                "SerialNumber": oData.results[i].EtEqList.Sernr,
                                "Model":     oData.results[i].EtEqList.Model,
                                "ModelDesc": oData.results[i].EtEqList.ProdrefShtext,
                                "ContactName":    oData.results[i].EtEqList.SrvContact,
                                "State":     oData.results[i].EtEqList.Region,
                                "Street":   oData.results[i].EtEqList.Street,
                                "City":     oData.results[i].EtEqList.City1,
                                "Location2": oData.results[i].EtEqList.Location2,
                                "Region":    oData.results[i].EtEqList.Region,
                                "PostalCode": oData.results[i].EtEqList.PostCode1,
                                "Phone":      oData.results[i].EtEqList.Phone,
                                "ReqRef": oData.results[i].EtEqList.ExtRefSrv,
                                "OrderRef": oData.results[i].EtEqList.ExRefCons,
                                "SharpReqID": oData.results[i].EtEqList.SrvOrder,
                                "Terms":    oData.results[i].EtEqList.Terms,
                                "SharpOrderID": oData.results[i].EtEqList.ConsOrder

                            });
                        }
                    }
                    debugger;
                    var tableModel = new JSONModel({ "EquipmentCollection": arrEquipmentList });
                    // Bind to JSON model for UI
                    var oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
                    that.getView().setModel(tableModel, "modelEquipment");
                },
                error: function (oError) {
                     sap.ui.core.BusyIndicator.hide();
                    console.error("Error:", oError);
                }
            });
        },

        getSelectedRows: function () {
            var oTable = this.byId("tblEquipmentList");
            if (!oTable) { return []; }
            var aIndices = oTable.getSelectedIndices() || [];
            return aIndices.map(function (i) {
                var oCtx = oTable.getContextByIndex(i);
                return oCtx ? oCtx.getObject() : null;
            }).filter(Boolean);
        },

        /**
         * Apply a free-text filter to the grid - searches across the visible
         * text columns. Called from the parent controller's search field.
         */
        applySearch: function (sQuery) {
            var oTable = this.byId("tblEquipmentList");
            var oBinding = oTable && oTable.getBinding("rows");
            if (!oBinding) { return; }

            if (!sQuery) {
                oBinding.filter([]);
                return;
            }
            var aSearchProps = [
                "EquipmentId", "CustomerEquipmentId", "Model", "Serial",
                "OpenServiceRequest", "OpenRequestReference",
                "OpenOrder", "OpenOrderReference",
                "Location", "Address", "City", "State",
                "ContractTerms", "ModelDescription", "ContactName", "ContactNumber"
            ];
            var aFilters = aSearchProps.map(function (p) {
                return new Filter(p, FilterOperator.Contains, sQuery);
            });
            oBinding.filter(new Filter({ filters: aFilters, and: false }));
        },

        // =====================================================================
        // TOOLBAR EVENT HANDLERS
        // =====================================================================

        onSearch: function (oEvent) {
            this.applySearch(oEvent.getParameter("query") || "");
        },

        onSearchLive: function (oEvent) {
            this.applySearch(oEvent.getParameter("newValue") || "");
        },

        /**
         * Export to Excel - uses the standard sap.ui.export.Spreadsheet helper
         * loaded on demand to avoid bloating the initial bundle.
         */
        onExportToExcel: function () {
            sap.ui.require([
                "sap/ui/export/Spreadsheet",
                "sap/ui/export/library"
            ], function (Spreadsheet, exportLibrary) {
                var EdmType = exportLibrary.EdmType;
                var oTable = this.byId("tblEquipmentList");
                var aRows = (oTable.getModel().getProperty("/equipmentList")) || [];

                var aCols = [
                    { label: "Equipment ID", property: "EquipmentId", type: EdmType.String },
                    { label: "Customer Equipment ID", property: "CustomerEquipmentId", type: EdmType.String },
                    { label: "Model", property: "Model", type: EdmType.String },
                    { label: "Serial", property: "Serial", type: EdmType.String },
                    { label: "Open Service Request", property: "OpenServiceRequest", type: EdmType.String },
                    { label: "Open Request Ref", property: "OpenRequestReference", type: EdmType.String },
                    { label: "Open Order", property: "OpenOrder", type: EdmType.String },
                    { label: "Open Order Ref", property: "OpenOrderReference", type: EdmType.String },
                    { label: "Location", property: "Location", type: EdmType.String },
                    { label: "Address", property: "Address", type: EdmType.String },
                    { label: "City", property: "City", type: EdmType.String },
                    { label: "State", property: "State", type: EdmType.String },
                    { label: "Contract Terms", property: "ContractTerms", type: EdmType.String },
                    { label: "Model Description", property: "ModelDescription", type: EdmType.String },
                    { label: "Contact Name", property: "ContactName", type: EdmType.String },
                    { label: "Contact Number", property: "ContactNumber", type: EdmType.String },
                    { label: "No Access", property: "NoAccess", type: EdmType.Boolean }
                ];

                new Spreadsheet({
                    workbook: { columns: aCols, hierarchyLevel: "Level" },
                    dataSource: aRows,
                    fileName: "EquipmentList.xlsx"
                }).build().finally(function () { /* spreadsheet built */ });
            }.bind(this));
        },

        /**
         * Configure columns - opens the standard column visibility dialog
         * (sap.m.p13n is the modern personalization API).
         */
        onConfigureColumns: function () {
            var oTable = this.byId("tblEquipmentList");
            sap.ui.require([
                "sap/m/p13n/Engine",
                "sap/m/p13n/SelectionController",
                "sap/m/p13n/MetadataHelper"
            ], function (Engine, SelectionController, MetadataHelper) {
                // Lightweight inline dialog: list columns with checkboxes
                if (this._oColDialog) { this._oColDialog.open(); return; }
                sap.ui.require([
                    "sap/m/Dialog",
                    "sap/m/Button",
                    "sap/m/List",
                    "sap/m/StandardListItem"
                ], function (Dialog, Button, List, StandardListItem) {
                    var oList = new List({ mode: "MultiSelect" });
                    oTable.getColumns().forEach(function (oCol) {
                        var sLbl = oCol.getLabel() && oCol.getLabel().getText && oCol.getLabel().getText();
                        var oItem = new StandardListItem({
                            title: sLbl || oCol.getId(),
                            selected: oCol.getVisible()
                        });
                        oItem.data("columnId", oCol.getId());
                        oList.addItem(oItem);
                    });
                    this._oColDialog = new Dialog({
                        title: "Configure Columns",
                        contentWidth: "20rem",
                        content: [oList],
                        endButton: new Button({
                            text: "OK",
                            press: function () {
                                oList.getItems().forEach(function (oItem) {
                                    var sId = oItem.data("columnId");
                                    var oCol = sap.ui.getCore().byId(sId);
                                    if (oCol) { oCol.setVisible(oItem.getSelected()); }
                                });
                                this._oColDialog.close();
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this._oColDialog);
                    this._oColDialog.open();
                }.bind(this));
            }.bind(this));
        },

        // =====================================================================
        // ROW INTERACTIONS  (hyperlink presses are forwarded to the parent)
        // =====================================================================

        onEquipmentIdPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) { return; }
            var oParent = this._getMainController();
            if (oParent) { oParent.onEquipmentIdPress(oCtx.getObject()); }
        },

        onOpenServiceRequestPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) { return; }
            var oParent = this._getMainController();
            if (oParent) { oParent.onOpenServiceRequestPress(oCtx.getObject()); }
        },

        onOpenOrderPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            if (!oCtx) { return; }
            var oParent = this._getMainController();
            if (oParent) { oParent.onOpenOrderPress(oCtx.getObject()); }
        },

        onRowSelectionChange: function (oEvent) {
            // Hook reserved for future logic - e.g. enabling/disabling
            // action buttons in the parent based on the selection count.
            debugger;
            var oTable = oEvent.getSource();
            var iIndex = oTable.getSelectedIndex();
            var oContext = oTable.getContextByIndex(iIndex);

            if (oContext) {
                var oSelectedData = oContext.getObject();
                
                /*
                // get parent view
                var oParentView1 = this.getView().getParent();
                // get parent model (default model)
                var oModel = oParentView1.getModel("modelEquipDetails");

                if (!oModel) {
                    oModel = new sap.ui.model.json.JSONModel();
                    oParentView1.setModel(oModel, "modelEquipDetails");
                }

                oModel.setProperty("/selectedEquipment", oSelectedData);
                //oModel.setProperty("/equipmentDetailsVisible", true);
                oModel.refresh(true);
                */

                var oCompModel = this.getOwnerComponent().getModel("modelEquipDetails");

                if (!oCompModel) {
                    oCompModel = new JSONModel();
                    this.getOwnerComponent().setModel(oCompModel, "modelEquipDetails");
                }

                oCompModel.setProperty("/selectedEquipment", oSelectedData);
                oCompModel.refresh(true);
                
               
                if (oSelectedData.SharpReqID != null && oSelectedData.SharpReqID != undefined && oSelectedData.SharpReqID != "") {
                    this.getServiceDetails(oSelectedData.SharpReqID);
                }
                 /*
                if (oSelectedData.SharpOrderID != null && oSelectedData.SharpOrderID != undefined && oSelectedData.SharpOrderID != "") {
                    this.getOrderDetails(oSelectedData.SharpOrderID);
                }
                */
               // oParentView1.setModel(oModel, "modelEquipDetails");
                
            }
           
            debugger;
        },

        getServiceDetails: function (sServiceRequest) {

            var oModel = this.getView().getModel("modelB2BService");
            var oParentView = this.getView().getParent();
            var oModelEquipDetails = oParentView.getModel("modelEquipDetails");
            // var sSrvOrder = oModelEquipDetails.getProperty("/selectedEquipment/SrvOrder");

            
            var sPath = "/SrvOrderDetailSet";
            var aFilters = [];

            if (sServiceRequest) {

                console.log("sServiceRequest :", sServiceRequest);

                aFilters = [
                    new sap.ui.model.Filter("IvOrder", sap.ui.model.FilterOperator.EQ, sServiceRequest),
                    new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, this.SAPEPUser)
                ];
            }
            var that = this;
            console.log("Filter Info :", aFilters);
            debugger;
            oModel.read(sPath, {
                filters: aFilters,
                success: function (oData) {
                    console.log("Success:", oData);
                    debugger;
                    var arrStatusInfo = [];
                    if (oData.results) {

                        if (oData.results.length > 0) {
                            for (var i = 0; i < oData.results.length; i++) {

                                arrStatusInfo.push({
                                    "RecordNo": oData.results[i].EtStatus.RecordNo,
                                    "MobileStatus": oData.results[i].EtStatus.MobileStatus,
                                    "StatusTs": oData.results[i].EtStatus.StatusTs,
                                    "FlagActive": oData.results[i].EtStatus.FlagActive,
                                    "CreatedBy": oData.results[i].EtStatus.CreatedBy,
                                    "CreatedTs": oData.results[i].EtStatus.CreatedTs
                                })

                            }
                        }                      
                        var modelStatusInfo = new JSONModel({ "StatusCollection": arrStatusInfo });
                        // Bind to JSON model for UI
                        var oJsonModel = new sap.ui.model.json.JSONModel(oData.results);

                        that.getOwnerComponent().setModel(modelStatusInfo, "modelStatus");
                        //that.getView().getParent().setModel(modelStatusInfo, "modelStatus");

                         oModelEquipDetails.setProperty("/ServiceCategory", oData.results[0].EvCategory1);
                         oModelEquipDetails.setProperty("/ServiceItems", oData.results[0].EvCategory2);
                    }

                    that.getView().getParent().setModel(oModelEquipDetails, "modelEquipDetails");  
                    debugger;

                },
                error: function (oError) {
                    console.error("Error:", oError);
                }
            });

            oParentView.setModel(oModelEquipDetails, "modelEquipDetails");

        },

        getOrderDetails: function (sOrderReference) {
            var oModel = this.getView().getModel("modelB2BService");
            var oParentView = this.getView().getParent();
            var oModelEquipDetails = oParentView.getModel("modelEquipDetails");
            var sExRefSrv = oModelEquipDetails.getProperty("/selectedEquipment/ExRefSrv");

            var sPath = "/ConsOrderDetailSet";
            var aFilters = [
                new sap.ui.model.Filter("IvOrder", sap.ui.model.FilterOperator.EQ, "8064473532"),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, "PURCIAT")
            ];

            var that = this;

            oModel.read(sPath, {
                filters: aFilters,
                success: function (oData) {
                    console.log("Success:", oData);
                    debugger;

                    if (oData.results) {
                        oModelEquipDetails.setProperty("/orderDetails", oData.results[0].EtItems);
                        oParentView.setModel(oModelEquipDetails, "modelEquipDetails");

                        var arrPartsInfo = [];
                        if (oData.results.length > 0) {

                            for (var i = 0; i < oData.results.length; i++) {

                                arrPartsInfo.push({
                                    "ProductId": oData.results[i].EtItems.ProductId,
                                    "Description": oData.results[i].EtItems.ProductDescr,
                                    "Quantity": oData.results[i].EtItems.Quantity

                                })

                            }
                        }
                        var modelPartsInfo = new JSONModel({ "PartsCollection": arrPartsInfo });
                        // Bind to JSON model for UI
                        var oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
                        that.getView().getParent().setModel(modelPartsInfo, "modelParts");




                    }
                },
                error: function (oError) {
                    console.error("Error:", oError);
                }
            });

            //oParentView.setModel(oModelEquipDetails, "modelEquipDetails");

        },

        // =====================================================================
        // INTERNALS
        // =====================================================================

        _getMainController: function () {
            // Walk up the parent chain to the EquipmentListMainView controller.
            var oView = this.getView();
            while (oView) {
                var oParent = oView.getParent();
                if (!oParent) { break; }
                if (oParent.getController && typeof oParent.getController === "function") {
                    var oCtrl = oParent.getController();
                    if (oCtrl && oCtrl.onEquipmentIdPress) {
                        return oCtrl;
                    }
                }
                oView = oParent;
            }
            return null;
        }
    });
});
