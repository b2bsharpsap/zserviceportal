sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "zserviceportal/utils/MyUtilityModule"
], (Controller, UIComponent, MessageBox, JSONModel, MyUtilityModule) => {
    "use strict";

    return Controller.extend("zserviceportal.controller.ServiceRequest", {
        onInit() {
            debugger;
            console.log("ServiceRequest View controller initialized >>> ");

            var oModel = new sap.ui.model.odata.v2.ODataModel(
                "/sap/opu/odata/SAP/ZSD_B2B_SERVICE_SRV/"
            );

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("routeServiceRequest").attachPatternMatched(this._onObjectMatched, this);

            this.getView().setModel(oModel, "modelB2BService");
            this.getUser();

            var oTable1 = this.getView().byId("idTblServiceRequest");
            oTable1.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable1.setVisibleRowCount(10);

            var oTable2 = this.getView().byId("idStatusHistoryTable");
            oTable2.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
            oTable2.setVisibleRowCount(3);


        },

        _onObjectMatched: function (oEvent) {
            //var sEmployeeId = oEvent.getParameter("arguments").customer;
            debugger;
            console.log("ServiceRequest _onObjectMatched .... ");

            var oGlobalModel = this.getOwnerComponent().getModel("modelGlobal");
            var oCustomerData = oGlobalModel.getProperty("/CustomerData");

            if (oCustomerData) {
                //this.byId("txtCustomerDetails").setText(oCustomerData.CustomerID);
                this.byId("txtCustomerDetails").setText(oCustomerData.CustomerName);
                this.byId("idTxtAddress11").setText(oCustomerData.Address);
                this.customerId = oCustomerData.CustomerID;

            }

            //var oGlobalModel = this.getOwnerComponent().getModel("modelGlobal");
            var aSelectedEquipmentList =
                oGlobalModel.getProperty("/selectedEquipmentList");

            console.log("Selected Equipment List:", aSelectedEquipmentList);
            this.getServiceRequestList();

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

        getServiceRequestList: function (oEvent) {

            //DO not delete
            //var sServiceRequest = "";

            //var oModel = this.getView().getModel("modelB2BService");
            //var sPath = "/SrvOrderListSet";
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

            console.log("Service  -  this.customerId : " + this.customerId);
            //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&//
            aFilters = [
                new sap.ui.model.Filter("IvSoldTo", sap.ui.model.FilterOperator.EQ, this.customerId),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, this.SAPEPUser),
                new sap.ui.model.Filter("IvOpen", sap.ui.model.FilterOperator.EQ, "O")

            ];

            if (aEqFilters.length > 0) {
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: aEqFilters,
                        and: false
                    }))
            }

            this._loadServiceRequestsList(aFilters);

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
                    var arrServiceReq = [];

                    var oSrvModel = new sap.ui.model.json.JSONModel({
                        results: oData.results
                    });

                    let intLength = oData.results.length;
                    let strTabHeader = "Service Request List (" + intLength + ")";
                    that.getView().byId("ttlSerReqList").setText(strTabHeader);	

                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("idTblServiceRequest").getBinding("items")?.refresh();
                },
                error: function (oError) {

                    let oSrvModel = new sap.ui.model.json.JSONModel();
                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("idTblServiceRequest").getBinding("items")?.refresh();

                    sap.ui.core.BusyIndicator.hide();
                    console.error("Error:", oError);

                }
            });
            */


        },

        searchServiceRequests: function () {

            //DO not delete
            //var sServiceRequest = "";

            //var oModel = this.getView().getModel("modelB2BService");
            //var sPath = "/SrvOrderListSet";
            var aFilters = [];

            let sEquipmentId = this.byId("inpServEquipmentId").getValue();
            let sCustEquipId = this.byId("inpCustEquipmentId").getValue();
            let sModel = this.byId("inpServModel").getValue();
            let sSerial = this.byId("inpServSerial").getValue();

            let sSharpReqId = this.byId("inpSharpReqId").getValue();


            let sFromDate = this.byId("idServFromDate").getValue();
            let sToDate = this.byId("idServToDate").getValue();

            console.log("Service  -  sFromDate : " + sFromDate);
            console.log("Service  -  sToDate : " + sToDate);
            //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&//
            aFilters = [
                new sap.ui.model.Filter("IvSoldTo", sap.ui.model.FilterOperator.EQ, this.customerId),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, this.SAPEPUser),
                new sap.ui.model.Filter("IvOpen", sap.ui.model.FilterOperator.EQ, "O"),

                new sap.ui.model.Filter("IvOrder", sap.ui.model.FilterOperator.EQ, sSharpReqId),

                new sap.ui.model.Filter("IvEqId", sap.ui.model.FilterOperator.EQ, sEquipmentId),
                new sap.ui.model.Filter("IvCustEq", sap.ui.model.FilterOperator.EQ, sCustEquipId),
                new sap.ui.model.Filter("IvModel", sap.ui.model.FilterOperator.EQ, sModel),
                new sap.ui.model.Filter("IvSerial", sap.ui.model.FilterOperator.EQ, sSerial),

                new sap.ui.model.Filter("IvFromDate", sap.ui.model.FilterOperator.EQ, sFromDate),
                new sap.ui.model.Filter("IvToDate", sap.ui.model.FilterOperator.EQ, sToDate)

                //new sap.ui.model.Filter("IvFromDate", sap.ui.model.FilterOperator.EQ, "20230101"),
                //new sap.ui.model.Filter("IvToDate", sap.ui.model.FilterOperator.EQ, "20230201")

            ];

            /*

            if (aEqFilters.length > 0) {
                aFilters.push(
                    new sap.ui.model.Filter({
                        filters: aEqFilters,
                        and: false
                    }))
            }
            */

            this._loadServiceRequestsList(aFilters);


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
                    var arrServiceReq = [];

                    var oSrvModel = new sap.ui.model.json.JSONModel({
                        results: oData.results
                    });

                    let intLength = oData.results.length;
                    let strTabHeader = "Service Request List (" + intLength + ")";
                    that.getView().byId("ttlSerReqList").setText(strTabHeader);	

                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("idTblServiceRequest").getBinding("items")?.refresh();
                },
                error: function (oError) {

                    let oSrvModel = new sap.ui.model.json.JSONModel();
                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("idTblServiceRequest").getBinding("items")?.refresh();

                    sap.ui.core.BusyIndicator.hide();
                    console.error("Error:", oError);

                }
            });
            */

        },


        _loadServiceRequestsList: function (aFilters) {

            //DO not delete
            //var sServiceRequest = "";

            var oModel = this.getView().getModel("modelB2BService");
            var sPath = "/SrvOrderListSet";

            /*
            let sEquipmentId = this.byId("inpServEquipmentId").getValue();
            let sCustEquipId = this.byId("inpCustEquipmentId").getValue();
            let sModel = this.byId("inpServModel").getValue();
            let sSerial = this.byId("inpServSerial").getValue();

            let sSharpReqId = this.byId("inpSharpReqId").getValue();

            console.log("Service  -  this.customerId : " + this.customerId);

              var aFiltersXX = [];  
            //&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&//
            aFiltersXX = [
                new sap.ui.model.Filter("IvSoldTo", sap.ui.model.FilterOperator.EQ, this.customerId),
                new sap.ui.model.Filter("IvUser", sap.ui.model.FilterOperator.EQ, this.SAPEPUser),
                new sap.ui.model.Filter("IvOpen", sap.ui.model.FilterOperator.EQ, "O"),

                new sap.ui.model.Filter("IvOrder", sap.ui.model.FilterOperator.EQ, sSharpReqId),

                new sap.ui.model.Filter("IvEqId", sap.ui.model.FilterOperator.EQ, sEquipmentId),
                new sap.ui.model.Filter("IvCustEq", sap.ui.model.FilterOperator.EQ, sCustEquipId),
                new sap.ui.model.Filter("IvModel", sap.ui.model.FilterOperator.EQ, sModel),
                new sap.ui.model.Filter("IvSerial", sap.ui.model.FilterOperator.EQ, sSerial)
               
            ];
           
            */
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
                    var arrServiceReq = [];

                    var oSrvModel = new sap.ui.model.json.JSONModel({
                        results: oData.results
                    });

                    let intLength = oData.results.length;
                    let strTabHeader = "Service Request List (" + intLength + ")";
                    that.getView().byId("ttlSerReqList").setText(strTabHeader);

                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("idTblServiceRequest").getBinding("items")?.refresh();
                },
                error: function (oError) {

                    let oSrvModel = new sap.ui.model.json.JSONModel();
                    that.getView().setModel(oSrvModel, "modelServiceReq");
                    // Optional: Refresh table binding
                    that.byId("idTblServiceRequest").getBinding("items")?.refresh();

                    sap.ui.core.BusyIndicator.hide();
                    console.error("Error:", oError);

                }
            });

        },
        //Start Excel Functionality %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%//

        onExportToExcel: function () {

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
                        "ServiceList"
                    );

                    flagExcelData = true;
                }
            }

            if (!flagExcelData) {
                MessageBox.error("Excel export is not possible because no data to export.");
            }
        },

        //End Excel Functionality %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%//

        onSharpRequestPress: function (oEvent) {

            var oContext = oEvent.getSource().getBindingContext("modelServiceReq");

            if (!oContext) { return; }

            var oSelectedData = oContext.getObject();

            console.log("Selected Service Request :", oSelectedData);

            // Populate Details Panel
            var oDetailModel = new sap.ui.model.json.JSONModel(
                oSelectedData.EtOrderList
            );

            this.getView().setModel(oDetailModel, "modelServiceDetails");

            // Load Status History
            this.getServiceDetails(oSelectedData.EtOrderList.Order);
            this.getAdditionalInfo(oSelectedData.EtOrderList.Order);
        },

        getAdditionalInfo: function (sSharpReqID) {

            var oModel = this.getView().getModel("modelB2BService");
            var sPath = "/SrvOrderTextSet";
            var sUserId = this.SAPEPUser; // Use the SAP EP user ID obtained from getSAPEPUserDetails

            console.log("Additional Info sSharpReqID >>>  " + sSharpReqID);

            var aFilters = [
                new sap.ui.model.Filter("IvOrder", sap.ui.model.FilterOperator.EQ, sSharpReqID)
            ];

            var that = this;

            oModel.read(sPath, {
                filters: aFilters,
                success: function (oData) {
                    debugger;
                    console.log(" /SrvOrderTextSet Success:", oData);

                    let sAdditionalInfo = "";
                    let sRequestNotes = "";

                    if (oData.results[0]) {
                        if (oData.results[0].EtText.Tdid === "AINF") {
                            sAdditionalInfo = oData.results[0].EtText.Tdline;
                        }
                        if (oData.results[0].EtText.Tdid === "REQN") {
                            sRequestNotes = oData.results[0].EtText.Tdline;
                        }

                    }
                    let modSerqReq = that.getView().getModel("modelServReq");

                    if (!modSerqReq) {
                        modSerqReq = new sap.ui.model.json.JSONModel();
                        that.getView().setModel(modSerqReq, "modelServReq");
                    }

                    if (modSerqReq) {
                        modSerqReq.setProperty("/AdditionalInfo", sAdditionalInfo);
                        modSerqReq.setProperty("/RequestNotes", sRequestNotes);
                    }

                    debugger;
                },
                error: function (oError) {
                    console.error("Error:", oError);
                }
            });
        },
        //********************************* */

        onRequestSelection: function (oEvent) {

            debugger;
            var oTable = oEvent.getSource();
            var iIndex = oTable.getSelectedIndex();
            var oContext = oTable.getContextByIndex(iIndex);

            if (oContext) {
                var oSelectedData = oContext.getObject();

                console.log("oSelectedData.SharpReqID :  " + oSelectedData.SharpReqID);

                if (oSelectedData.EtOrderList) {
                    this.getServiceDetails(oSelectedData.EtOrderList.Order);
                    //this.getOwnerComponent().getModel("viewModel").setProperty("/showServiceTab", true);


                    var oDetailModel = new sap.ui.model.json.JSONModel(
                        oSelectedData.EtOrderList
                    );
                    this.getView().setModel(oDetailModel, "modelServiceDetails");
                }

            }
        },

        getServiceDetails: function (sServiceRequest) {

            var oModel = this.getView().getModel("modelB2BService");

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
                    console.log("Success SrvOrderDetailSet :", oData);
                    debugger;
                    var arrStatusInfo = [];
                    if (oData.results) {

                        if (oData.results.length > 0) {
                            for (var i = 0; i < oData.results.length; i++) {

                                arrStatusInfo.push({
                                    "RecordNo": oData.results[i].EtStatus.RecordNo,
                                    "MobileStatus": oData.results[i].EtStatus.MobileStatus,
                                    "StatusTs": oData.results[i].EtStatus.StatusTs,
                                    "Status": oData.results[i].EtStatus.Status,
                                    "FlagActive": oData.results[i].EtStatus.FlagActive,
                                    "CreatedBy": oData.results[i].EtStatus.CreatedBy,
                                    "CreatedTs": oData.results[i].EtStatus.CreatedTs
                                })
                            }
                        }
                        var modelStatusInfo = new JSONModel({ "StatusCollection": arrStatusInfo });
                        that.getView().setModel(modelStatusInfo, "modelStatusHis");

                        if (oData.results && oData.results.length > 0) {

                            //*************************************** */
                            const oOrderInfo = oData.results[0].EsOrderInfo;
                            const oModelServReq = new sap.ui.model.json.JSONModel(oOrderInfo);
                            that.getView().setModel(oModelServReq, "modelServReq");

                            //***************************************** */
                            /*
                            var modelServReq = new sap.ui.model.json.JSONModel(
                                {
                                    Status: oData.results[0].EsOrderInfo.Status,
                                    StatusTs: oData.results[0].EsOrderInfo.StatusTs,

                                    CreateDate: oData.results[0].EsOrderInfo.CreateDate,
                                    Reference: oData.results[0].EsOrderInfo.Reference

                                }
                            );
                            that.getView().setModel(modelServReq, "modelServReq");
                            */
                        }

                    }

                    debugger;
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