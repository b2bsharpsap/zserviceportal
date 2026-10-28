sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "zserviceportal/utils/MyUtilityModule"
], (Controller, UIComponent, MessageBox, JSONModel, MyUtilityModule) => {
    "use strict";

    return Controller.extend("zserviceportal.controller.ConsOrderList", {
        onInit() {
            //debugger;
            //console.log("ConsOrdersList controller initialized");

            var oModel = new sap.ui.model.odata.v2.ODataModel(
                "/sap/opu/odata/SAP/ZSD_B2B_SERVICE_SRV/"
            );

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("routeConsOrderList").attachPatternMatched(this._onObjectMatched, this);

            this.getView().setModel(oModel, "modelB2BService");
            this.getUser();

            var oTable1 = this.getView().byId("tblConsOrdersList");
            oTable1.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable1.setVisibleRowCount(10);

            var oTable2 = this.getView().byId("tblProduct");
            oTable2.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable2.setVisibleRowCount(3);

        },

        _onObjectMatched: function (oEvent) {
            //var sEmployeeId = oEvent.getParameter("arguments").customer;
            debugger;
            console.log("Order List  _onObjectMatched .... ");

            var oGlobalModel = this.getOwnerComponent().getModel("modelGlobal");
            var oCustomerData = oGlobalModel.getProperty("/CustomerData");

            if (oCustomerData) {
                //------  >>>  this.byId("txtCustomerDetails").setText(oCustomerData.CustomerID);
                this.byId("txtOrderCustName").setText(oCustomerData.CustomerName);
                this.byId("txtOrderCustAddress").setText(oCustomerData.Address);
                this.customerId = oCustomerData.CustomerID;

            }

            //var oGlobalModel = this.getOwnerComponent().getModel("modelGlobal");
            var aSelectedEquipmentList =
                oGlobalModel.getProperty("/selectedEquipmentList");


            let modelEmpty = new JSONModel();
            this.getView().setModel(modelEmpty, "modelOrderParts");

            console.log("Selected Equipment List:", aSelectedEquipmentList);
            this.getConsOrderList();

        },

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        onPressBackButton: function () {
            console.log("NavTo EquipmentListMain");

            this.getRouter().navTo("routeEquipmentListMain");
        },
        validateCustomerInput: function (oEvent) {

            var sCustomer = this.byId("inpCustomer").getValue();
            console.log("validateCustomerInput  : " + sCustomer);

            if (!sCustomer) {
                MessageBox.error("Please enter a valid Customer Number.");
                return false;
            }
            else {
                this.customerId = sCustomer;
                return true;
            }
        },

        getUser: function () {

            var oGlobalModel = this.getOwnerComponent().getModel("modelGlobal");

            this.SAPEPUser = oGlobalModel.getProperty("/sapEPUser");
            console.log("EquipList SAPEPUser --> ", this.SAPEPUser);

        },

        getConsOrderList: function (oEvent) {

            //var sServiceRequest = "";


            var aFilters = [];

            var oGlobalModel =
                this.getOwnerComponent().getModel("modelGlobal");

            var aEquipmentList =
                oGlobalModel.getProperty("/selectedEquipmentList") || [];

            var aEqFilters = aEquipmentList.map(function (sEqId) {
                return new sap.ui.model.Filter(
                    "IvEqId",
                    sap.ui.model.FilterOperator.EQ,
                    sEqId
                );
            });
            console.log("Order List  -  this.customerId : " + this.customerId);
            //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&//
            aFilters = [
                new sap.ui.model.Filter("IvSoldTo", sap.ui.model.FilterOperator.EQ, this.customerId),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, this.SAPEPUser),
                new sap.ui.model.Filter("IvOpen", sap.ui.model.FilterOperator.EQ, "O"),
                /*
                //new sap.ui.model.Filter("IvFromDate", sap.ui.model.FilterOperator.EQ, "20230101"),
                //new sap.ui.model.Filter("IvToDate", sap.ui.model.FilterOperator.EQ, "20230201")                
               
                */
            ];

            if (aEqFilters.length > 0) {
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: aEqFilters,
                        and: false
                    }))
            }


            this._loadConsOrderList(aFilters);
            /*
            sap.ui.core.BusyIndicator.show();
            var that = this;
            console.log("Filter Info :", aFilters);
            debugger;
            oModel.read(sPath, {
                filters: aFilters,
                success: function (oData) {
                    console.log(" SrvOrderListSet  Success:", oData);
                    sap.ui.core.BusyIndicator.hide();
                    debugger;
                    //var arrServiceReq = [];

                    var oSrvModel = new sap.ui.model.json.JSONModel({
                        results: oData.results
                    });


                    let intLength = oData.results.length;
                    let strTabHeader = "Consumable Orders List (" + intLength + ")";
                    that.getView().byId("ttlConsOrdersList").setText(strTabHeader);	

                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("tblConsOrdersList").getBinding("items")?.refresh();
                },
                error: function (oError) {

                    let oSrvModel = new sap.ui.model.json.JSONModel();
                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("tblConsOrdersList").getBinding("items")?.refresh();

                    sap.ui.core.BusyIndicator.hide();
                    console.error("Error:", oError);
                }
            });

            */


        },


        searchConsOrderList: function () {

            //DO not delete
            //var sServiceRequest = "";

            //var oModel = this.getView().getModel("modelB2BService");
            //var sPath = "/SrvOrderListSet";
            var aFilters = [];

            let sEquipmentId = this.byId("inpSharpEquipId").getValue();
            let sOrderRefer = this.byId("inpOrderRef").getValue();
            let sModel = this.byId("inpOrderModel").getValue();
            let sSerial = this.byId("inpOrderSerial").getValue();

            let sSharpReqId = this.byId("inpSharpOrder").getValue();


            let sFromDate = this.byId("idOrderFromDate").getValue();
            let sToDate = this.byId("idOrderToDate").getValue();

            console.log("Order  -  sFromDate : " + sFromDate);
            console.log("Order  -  sToDate : " + sToDate);
            //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&//
            aFilters = [
                new sap.ui.model.Filter("IvSoldTo", sap.ui.model.FilterOperator.EQ, this.customerId),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, this.SAPEPUser),
                new sap.ui.model.Filter("IvOpen", sap.ui.model.FilterOperator.EQ, "O"),

                new sap.ui.model.Filter("IvOrder", sap.ui.model.FilterOperator.EQ, sSharpReqId),

                new sap.ui.model.Filter("IvEqId", sap.ui.model.FilterOperator.EQ, sEquipmentId),
                new sap.ui.model.Filter("IvReferance", sap.ui.model.FilterOperator.EQ, sOrderRefer),
                new sap.ui.model.Filter("IvModel", sap.ui.model.FilterOperator.EQ, sModel),
                new sap.ui.model.Filter("IvSerial", sap.ui.model.FilterOperator.EQ, sSerial),

                new sap.ui.model.Filter("IvFromDate", sap.ui.model.FilterOperator.EQ, sFromDate),
                new sap.ui.model.Filter("IvToDate", sap.ui.model.FilterOperator.EQ, sToDate)

                //new sap.ui.model.Filter("IvFromDate", sap.ui.model.FilterOperator.EQ, "20230101"),
                //new sap.ui.model.Filter("IvToDate", sap.ui.model.FilterOperator.EQ, "20230201")

            ];


              this._loadConsOrderList(aFilters);

        },

        _loadConsOrderList: function (aFilters) {

            var oDataService = this.getView().getModel("modelB2BService");
            var sPath = "/ConsOrderListSet";

            sap.ui.core.BusyIndicator.show();
            var that = this;
            console.log("Filter Info :", aFilters);
            debugger;
            oDataService.read(sPath, {
                filters: aFilters,
                success: function (oData) {
                    console.log(" ConsOrderListSet  Success:", oData);
                    sap.ui.core.BusyIndicator.hide();
                    debugger;
                    //var arrServiceReq = [];

                    var oSrvModel = new sap.ui.model.json.JSONModel({
                        results: oData.results
                    });


                    let intLength = oData.results.length;
                    let strTabHeader = "Consumable Orders List (" + intLength + ")";
                    that.getView().byId("ttlConsOrdersList").setText(strTabHeader);

                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("tblConsOrdersList").getBinding("items")?.refresh();
                },
                error: function (oError) {

                    let oSrvModel = new sap.ui.model.json.JSONModel();
                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("tblConsOrdersList").getBinding("items")?.refresh();

                    sap.ui.core.BusyIndicator.hide();
                    console.error("Error:", oError);
                }
            });



        },

        //Start - Excel Export &&&&&&&&&&&&&&&&&&&&&&&&&&&&&//

        onExportToExcel: function () {

            debugger;

            var arrColumns = [
                "Order",
                "CreateDate",
                "Description",
                "ExRef",
                "Status",
                "StatusDate",
                "EquipmentId",
                "CustEquip",
                "Model",
                "Sernr",
                "Location",
                "Street",
                "City1",
                "Region",
                "Description",
                "ServContact",
                "ServPhone"
            ];

            var oModel = this.getView().getModel("modelServiceReq");
            var flagExcelData = false;

            if (oModel) {

                var excelData = oModel.getData().results.map(function (oRecord) {
                    return oRecord.EtOrderList;
                });

                if (excelData && excelData.length > 0) {

                    MyUtilityModule.generateExcelReport(
                        arrColumns,
                        excelData,
                        "ConsOrderList"
                    );

                    flagExcelData = true;
                }
            }

            if (!flagExcelData) {
                MessageBox.error("Excel export is not possible because no data to export.");
            }
        },


        //End - Excel Export &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&//
        onRequestSelection: function (oEvent) {
            debugger;
            var oTable = oEvent.getSource();
            var iIndex = oTable.getSelectedIndex();
            var oContext = oTable.getContextByIndex(iIndex);

            if (oContext) {
                var oSelectedData = oContext.getObject();

                console.log("oSelectedData.SharpReqID :  " + oSelectedData.SharpReqID);

                if (oSelectedData.EtOrderList) {
                    this.getOrderDetails(oSelectedData.EtOrderList.Order);

                    var oDetailModel = new sap.ui.model.json.JSONModel(
                        oSelectedData.EtOrderList
                    );
                    this.getView().setModel(oDetailModel, "modelServiceDetails");

                }
            }
        },

        onSharpOrderPress: function (oEvent) {

            var oContext = oEvent.getSource()
                .getBindingContext("modelServiceReq");

            var oRowData = oContext.getObject();
            var sOrderNo = oRowData.EtOrderList.Order;

            console.log("Sharp Order ID:", sOrderNo);

            // Display details section
            this.getOrderDetails(sOrderNo);

            // Populate Order Details panel
            var oDetailModel = new sap.ui.model.json.JSONModel(
                oRowData.EtOrderList
            );

            this.getView().setModel(
                oDetailModel,
                "modelServiceDetails"
            );
        },

        getOrderDetails: function (sOrderReference) {
            var oModel = this.getView().getModel("modelB2BService");
            var oParentView = this.getView().getParent();
            var oModelEquipDetails = oParentView.getModel("modelEquipDetails");
            //var sExRefSrv = oModelEquipDetails.getProperty("/selectedEquipment/ExRefSrv");

            var sPath = "/ConsOrderDetailSet";
            var aFilters = [
                new sap.ui.model.Filter("IvOrder", sap.ui.model.FilterOperator.EQ, sOrderReference),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, this.SAPEPUser)
            ];

            var that = this;

            oModel.read(sPath, {
                filters: aFilters,
                success: function (oData) {
                    console.log("Success:", oData);
                    debugger;

                    if (oData.results) {
                        oModelEquipDetails.setProperty("/orderDetails", oData.results[0].EtItems);
                        that.getOwnerComponent().setModel(oModelEquipDetails, "modelEquipDetails");

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
                        that.getView().setModel(modelPartsInfo, "modelOrderParts");
                        /*
                        Verify and remove code.
                        var modelDetails = new sap.ui.model.json.JSONModel(
                            {
                                Status: oData.results[0].EsOrderInfo.Status,
                                StatusTs: oData.results[0].EsOrderInfo.StatusTs
                            }
                        );
                        that.getOwnerComponent().setModel(modelDetails, "modelOrder");
                        */
                    }
                },
                error: function (oError) {
                    console.error("Error:", oError);
                }
            });

        },

        onSelectCustomer: function (oEvent) {

            var keyCustomer = oEvent.getParameters().selectedItem.getKey();
            console.log("Selected Customer : " + keyCustomer);
            this.getView().byId("inpCustomer").setValue(oEvent.getParameters().selectedItem.getKey());
            //oView.byId("dealername").setText(oEvent.getParameters().selectedItem.getText());
        },

        onViewRequests: function () {
            console.log("NavTo Inventory Inquiry Page");

            this.getRouter().navTo("routeServiceRequest");
        }

    });
});