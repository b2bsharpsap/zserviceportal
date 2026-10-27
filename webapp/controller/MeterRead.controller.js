sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], (Controller, UIComponent, MessageBox, JSONModel, Fragment) => {
    "use strict";

    return Controller.extend("zserviceportal.controller.MeterRead", {
        onInit() {
            debugger;
            console.log("EquipmentListMain controller initialized");

            var oModel = new sap.ui.model.odata.v2.ODataModel(
                "/sap/opu/odata/SAP/ZSD_B2B_SERVICE_SRV/"
            );


            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("routeServiceRequest").attachPatternMatched(this._onObjectMatched, this);



            this.getView().setModel(oModel, "modelB2BService");
            this.getUser();

            this.getServiceRequestList();

            
            var oTable1 = this.getView().byId("tblMeterRead");
            oTable1.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable1.setVisibleRowCount(10);
           
            /*
            var oTable2 = this.getView().byId("idStatusHistoryTable");
            oTable2.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable2.setVisibleRowCount(3);
            */
        },

        _onObjectMatched: function (oEvent) {
            var sEmployeeId = oEvent.getParameter("arguments").customer;

            // Read data using the ID
            console.log(sEmployeeId);
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

            if (sCustomer === null || sCustomer === undefined || sCustomer === "") {
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

        getSAPEPUserDetails: function () {

            var userIDPortal = jQuery.sap.getUriParameters().get("epuser");
            if (userIDPortal != null && userIDPortal != undefined) {
                this.SAPEPUser = userIDPortal;
            }
            else {
                this.SAPEPUser = "SHAIKD";
            }
            console.log("SAP EP User ID:", this.SAPEPUser);

            // Inside a view controller method
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("modelGlobal");
            oGlobalModel.setProperty("/sapEPUser", this.SAPEPUser);


        },
        
        openEquipmentListPopup: function (oEvent) {
            debugger;

            var oView = this.getView();
            if (!this._oEquipmentDialog) {
                Fragment.load({
                    name: "zserviceportal.view.EquipPopup",
                    controller: this
                }).then(function (oDialog) {

                    this._oEquipmentDialog = oDialog;
                    oView.addDependent(oDialog);
                    oDialog.open();

                }.bind(this));

            } else {
                this._oEquipmentDialog.open();
            }
        },

        onDialogClose: function () {
            this._oEquipmentDialog.close();
        },


        getServiceRequestList: function (oEvent) {

            var sServiceRequest = "";

            var oModel = this.getView().getModel("modelB2BService");
            var sPath = "/SrvOrderListSet";
            var aFilters = [];

            // if (sServiceRequest) {

            //console.log("sServiceRequest :", sServiceRequest);

            aFilters = [
                new sap.ui.model.Filter("IvSoldTo", sap.ui.model.FilterOperator.EQ, "846100"),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, this.SAPEPUser),

                new sap.ui.model.Filter("IvOpen", sap.ui.model.FilterOperator.EQ, "C"),
                // new sap.ui.model.Filter("IvEqId", sap.ui.model.FilterOperator.EQ, "108979018"),
                //new sap.ui.model.Filter("IvOrder", sap.ui.model.FilterOperator.EQ, "8064549471")

                new sap.ui.model.Filter("IvFromDate", sap.ui.model.FilterOperator.EQ, "20230101"),
                new sap.ui.model.Filter("IvToDate", sap.ui.model.FilterOperator.EQ, "20230201")


            ];
            //  }
            var that = this;
            console.log("Filter Info :", aFilters);
            debugger;
            oModel.read(sPath, {
                filters: aFilters,
                success: function (oData) {
                    console.log(" SrvOrderListSet  Success:", oData);
                    debugger;
                    var arrServiceReq = [];
                    if (oData.results) {
                        if (oData.results.length > 0) {

                            for (var i = 0; i < oData.results.length; i++) {

                                arrServiceReq.push({
                                    "Order": oData.results[i].EtOrderList.Order,
                                    "EquipmentId": oData.results[i].EtOrderList.EquipmentId,
                                    "Description": oData.results[i].EtOrderList.Description,
                                    "Sernr": oData.results[i].EtOrderList.Sernr,
                                    "City1": oData.results[i].EtOrderList.City1,
                                    "Region": oData.results[i].EtOrderList.Region,
                                    "Country": oData.results[i].EtOrderList.Country,

                                    "CustEquip": oData.results[i].EtOrderList.CustEquip,
                                    "Location": oData.results[i].EtOrderList.Location,
                                    "Model": oData.results[i].EtOrderList.Model,
                                    "PostCode1": oData.results[i].EtOrderList.PostCode1,

                                    "Status": oData.results[i].EtOrderList.Status,
                                    "Street": oData.results[i].EtOrderList.Street
                                })

                            }
                        }

                        debugger;
                        var modelServiceReqInfo = new JSONModel({ "ServiceReqCollection": arrServiceReq });
                        // Bind to JSON model for UI
                        var oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
                        that.getView().setModel(modelServiceReqInfo, "modelServiceReq");


                    }
                },
                error: function (oError) {
                    console.error("Error:", oError);
                }
            });


        },


        onRequestSelection: function (oEvent) {



            debugger;
            var oTable = oEvent.getSource();
            var iIndex = oTable.getSelectedIndex();
            var oContext = oTable.getContextByIndex(iIndex);

            if (oContext) {
                var oSelectedData = oContext.getObject();

                var oModel = this.getView().getModel("modelServiceDetails");

                if (!oModel) {
                    oModel = new sap.ui.model.json.JSONModel();
                    this.getView().setModel(oModel, "modelServiceDetails");
                }

                oModel.setProperty("/selectedService", oSelectedData);
                oModel.setProperty("/equipmentDetailsVisible", true);

            }
        },


        onSelectCustomer: function (oEvent) {

            var keyCustomer = oEvent.getParameters().selectedItem.getKey();
            console.log("Selected Customer : " + keyCustomer);
            this.getView().byId("inpCustomer").setValue(oEvent.getParameters().selectedItem.getKey());
            //oView.byId("dealername").setText(oEvent.getParameters().selectedItem.getText());
        },




        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        onViewRequests: function () {
            console.log("NavTo Inventory Inquiry Page");

            this.getRouter().navTo("routeServiceRequest");
        }

    });
});