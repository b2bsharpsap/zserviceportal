sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (JSONModel, Device) {
    "use strict";

    return {

        /**
         * Provides a Device model
         * @returns {sap.ui.model.json.JSONModel} Device model
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        /**
         * Provides the main view model with default data
         * @returns {sap.ui.model.json.JSONModel} View model
         */
        createViewModel: function () {
            return new JSONModel({
                custName:         "",
                custAddress:      "",
                userName:         "",
                soldTo:           "",
                noAccess:         false,
                detailVisible:    false,
                busy:             false,
                requestsBusy:     false,
                detailBusy:       false,
                requests:         [],
                filteredRequests: [],
                detail:           {},
                statusHistory:    [],
                columns: [
                    { key: "SharpReq",      label: "Sharp Request",         visible: true  },
                    { key: "Date",          label: "Date",                  visible: true  },
                    { key: "Description",   label: "Description",           visible: true  },
                    { key: "AddInfo",       label: "Additional Info",       visible: true  },
                    { key: "ReqRef",        label: "Request Reference",     visible: true  },
                    { key: "Status",        label: "Last Status",           visible: true  },
                    { key: "StatusTime",    label: "Status Time",           visible: true  },
                    { key: "EquipId",       label: "Equipment ID",          visible: true  },
                    { key: "CustEquipId",   label: "Customer Equipment ID", visible: true  },
                    { key: "Model",         label: "Model",                 visible: true  },
                    { key: "Serial",        label: "Serial",                visible: true  },
                    { key: "Location",      label: "Location",              visible: true  },
                    { key: "Address",       label: "Address",               visible: true  },
                    { key: "City",          label: "City",                  visible: true  },
                    { key: "State",         label: "State",                 visible: true  },
                    { key: "ContractTerms", label: "Contract Terms",        visible: false },
                    { key: "ModelDesc",     label: "Model Description",     visible: false },
                    { key: "ContactName",   label: "Contact Name",          visible: false },
                    { key: "ContactNum",    label: "Contact Number",        visible: false }
                ]
            });
        }
    };
});
