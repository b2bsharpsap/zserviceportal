sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "zserviceportal/model/formatter"

], (Controller, UIComponent, MessageBox, JSONModel, formatter) => {
    "use strict";

    return Controller.extend("zserviceportal.controller.EquipmentListMain", {
        formatter: formatter,
        onInit() {

            console.log("EquipmentListMain controller initialized");
            var oModel = new sap.ui.model.odata.v2.ODataModel(
                "/sap/opu/odata/SAP/ZSD_B2B_SERVICE_SRV/"
            );

            this.getView().setModel(oModel, "modelB2BService");

            // this.getSAPEPUserDetails();    
            this.getUser();
            this.callUserRefSet();

            //var sCustomer = this.byId("inpCustomer").getValue();
            debugger;

            var oTable1 = this.getView().byId("idStatusTable");
            oTable1.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable1.setVisibleRowCount(5);

            var oTable2 = this.getView().byId("idPartsTable");
            oTable2.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable2.setVisibleRowCount(3);

            var objModel = new sap.ui.model.json.JSONModel({
                showServiceTab : false,
                showOrderTab: false
            });
            this.getOwnerComponent().setModel(objModel, "viewModel");

        },
        validateCustomerInput: function (oEvent) {

            var sCustomer = this.byId("inpCustomer").getValue();
            console.log("validateCustomerInput  : " + sCustomer);

            if (!sCustomer) {
                MessageBox.error("Please enter a valid Customer Number.");
                return false;
            }
            else {
                this.CustomerID = sCustomer;
                return true;
            }
        },

        getUser: function () {

            var oGlobalModel = this.getOwnerComponent().getModel("modelGlobal");

            this.SAPEPUser = oGlobalModel.getProperty("/sapEPUser");
            console.log("EquipmentListMain SAPEPUser --> ", this.SAPEPUser);

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

        callUserRefSet: function () {

            debugger;
            var oModel = this.getView().getModel("modelB2BService");
            var sPath = "/UserRefSet";
            var sUserId = this.SAPEPUser; // Use the SAP EP user ID obtained from getSAPEPUserDetails

            var aFilters = [
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, sUserId)
            ];

            var that = this;

            oModel.read(sPath, {
                filters: aFilters,
                success: function (oData) {
                    console.log("Success:", oData);
                    var arrLength;
                    var vSoldTo;

                    debugger;
                    if (oData.results && oData.results.length > 0) {
                        console.log("Results Length  : " + oData.results.length);
                        console.log("Name : " + oData.results[0].EtSoldTo.Account);

                        arrLength = oData.results.length;
                        if (arrLength === 1 && oData.results[0].EtSoldTo.Account === "*") {

                            //that.byId("txtCustomer").setVisible(false);
                            that.byId("inpCustomer").setVisible(true);

                            that.byId("idLblAddress").setVisible(false);
                            that.byId("idTxtAddress").setVisible(false);
                            that.byId("idBtnSearchEquip").setVisible(true);
                        }
                        else {
                            //******Start --    Customer  DropDown  */                   


                            var arrCustomers = [];
                            var sDesc = "";
                            var sAddress = "";
                            for (var i = 0; i < arrLength; i++) {
                                if (oData.results[i].EtSoldTo.Account != "*") {


                                    sDesc = oData.results[i].EtSoldTo.Account +
                                        " - " +
                                        oData.results[i].EtSoldTo.Name1;
                                    sAddress = oData.results[i].EtSoldTo.Street +
                                        ", " +
                                        oData.results[i].EtSoldTo.Region +
                                        ", " +
                                        oData.results[i].EtSoldTo.Country +
                                        ", " +
                                        oData.results[i].EtSoldTo.PostCode1;
                                        
                                    arrCustomers.push({
                                        "Account": oData.results[i].EtSoldTo.Account,
                                        "Name": oData.results[i].EtSoldTo.Name1,
                                        "Description": sDesc,
                                        "Address": sAddress
                                    });
                                    if (i === 0) {
                                        that.byId("idTxtAddress").setText(sAddress);
                                    }
                                }

                            }
                            debugger;
                            var tableModel = new JSONModel({ "CustomerCollection": arrCustomers });
                            // Bind to JSON model for UI
                            //var oJsonModel = new sap.ui.model.json.JSONModel(oData.results);
                            that.getView().setModel(tableModel, "modelCustomers");

                            //Start************ Solution *****- 09Sep2026   


                            // Select first customer
                            if (arrCustomers.length > 0) {

                                that.byId("idCustomerDrp")
                                    .setSelectedKey(arrCustomers[0].Account);

                                that.byId("inpCustomer").setValue(
                                    arrCustomers[0].Account

                                );

                                console.log("Test CustomerID : " + arrCustomers[0].Account);

                                if (arrCustomers[0].Account) {
                                    that.CustomerID = arrCustomers[0].Account;
                                }

                                // Set address
                                that.byId("idTxtAddress").setText(
                                    arrCustomers[0].Address
                                );


                                //Setting Customer Details to Component Controller   
                                let oGlobalModel = that.getOwnerComponent().getModel("modelGlobal");

                                oGlobalModel.setProperty("/CustomerData", {

                                    CustomerID: arrCustomers[0].Account,
                                    CustomerName: arrCustomers[0].Description,
                                    Address: arrCustomers[0].Address

                                });


                                // Call Open Activity
                                that.onOpenActivity();

                            }
                            //End************ Solution *****- 09Sep2026  
                        }
                    }
                },
                error: function (oError) {
                    console.error("Error:", oError);
                }
            });
        },

        onSelectCustomer: function (oEvent) {

            debugger;

            var keyCustomer = oEvent.getParameters().selectedItem.getKey();
            console.log("Selected Customer : " + keyCustomer);

            if (keyCustomer) {
                this.CustomerID = keyCustomer;
            }

            this.getView().byId("inpCustomer").setValue(oEvent.getParameters().selectedItem.getKey());
            //oView.byId("dealername").setText(oEvent.getParameters().selectedItem.getText());

            var modelCust = this.getView().getModel("modelCustomers");

            console.log("Model Customer : " + modelCust);
            // Get selected row/object from model
            var oSelectedItem = oEvent.getParameter("selectedItem");
            var oContext = oSelectedItem.getBindingContext("modelCustomers");

            var oCustomer = oContext.getObject();
            // Set address text

            this.byId("idTxtAddress").setText(oCustomer.Address);
            console.log("Address:", oCustomer.Address);

            //Setting Customer Details to Component Controller   
            let oGlobalModel = this.getOwnerComponent().getModel("modelGlobal");

            oGlobalModel.setProperty("/CustomerData", {

                CustomerID: this.CustomerID,
                CustomerName: oCustomer.Description,
                Address: oCustomer.Address

            });
        },
        onOpenActivity: function (oEvent) {

            debugger;


        this.getOwnerComponent().getModel("viewModel").setProperty("/showServiceTab", false);
		this.getOwnerComponent().getModel("viewModel").setProperty("/showOrderTab", false);
            

            if (this.validateCustomerInput()) {

                var sCustomer = this.byId("inpCustomer").getValue();
                let sEquipmentId = this.byId("inpEquipmentId").getValue();
                let sCustomerEquipId = this.byId("inpCustomerEquipId").getValue();
                let sSerial = this.byId("inpSerial").getValue();
                let sModel = this.byId("inpModel").getValue();

                var oFilterData = {
                    SoldTo: this.CustomerID,
                    User: this.SAPEPUser,
                    OpenType: "O",
                    EquipmentId: sEquipmentId,
                    SerialNo: sSerial,
                    Model: sModel,
                    CustomerEquip: sCustomerEquipId
                };

                this.byId("vwEquipmentList").getController()
                    .loadEquipmentFilter(oFilterData);
            }

        },

        onAllAssignedEquipment: function (oEvent) {

            if (this.validateCustomerInput()) {
                this.loadEquipment("A");
            }
        },
        onUnAssignedEquipment: function (oEvent) {

            if (this.validateCustomerInput()) {
                this.loadEquipment("U");
            }
        },
        //************************************ */
        loadEquipment: function (sOpenType) {


            let sEquipmentId = this.byId("inpEquipmentId").getValue();
            let sCustomerEquipId = this.byId("inpCustomerEquipId").getValue();
            let sSerial = this.byId("inpSerial").getValue();

            var oFilterData = {
                SoldTo: this.CustomerID,
                User: this.SAPEPUser,
                OpenType: sOpenType,

                EquipmentId: sEquipmentId,
                SerialNo: sSerial,
                CustomerEquip: sCustomerEquipId
            };
            this.byId("vwEquipmentList").getController()
                .loadEquipmentFilter(oFilterData);

        },

        //************************************* */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        onViewRequests: function () {
            console.log("NavTo View Request Page");

            this.getOwnerComponent().getRouter().navTo("routeServiceRequest", {
                customer: "1001",
                equipmentId: "113680759"
            });
            //this.getRouter().navTo("routeServiceRequest");
        },

        onCreateRequest: function () {
            console.log("NavTo Create Request Page");

            this.getRouter().navTo("routeServiceRequestAI");
        },


        onCreateServiceRequest: function () {
            console.log("NavTo Create Service Request Page");
            this.getRouter().navTo("routeServiceReqCreate");
        },

        onCreateOrder: function () {
            console.log("NavTo Create order Page");
            this.getRouter().navTo("routeCreateOrder");
        },

        onMeterRead: function () {
            console.log("NavTo Meter Read Page");
            this.getRouter().navTo("routeMeterRead");
        },

        onServiceRequestAI: function () {
            console.log("NavTo Service Request AI");
            this.getRouter().navTo("routeServiceRequestAI");
        },

        onViewOrdersList: function () {
            console.log("NavTo View Orders List Page");

            this.getOwnerComponent().getRouter().navTo("routeConsOrderList", {
                customer: "1001",
                equipmentId: "113680759"
            });
            //this.getRouter().navTo("routeServiceRequest");
        }

    });
});