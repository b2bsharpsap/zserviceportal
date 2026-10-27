sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",    
    "zserviceportal/model/models"
], (UIComponent, JSONModel, Device, models) => {
    "use strict";

    return UIComponent.extend("zserviceportal.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            this.getSAPEPUserDetails();      
          

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
            /*
            // Inside a view controller method
            var oComponent = this.getOwnerComponent();
            var oGlobalModel = oComponent.getModel("modelGlobal");
            oGlobalModel.setProperty("/sapEPUser", this.SAPEPUser);
            */

            // 1. Define your shared data object
            var oSharedData = {
                sapEPUser: this.SAPEPUser
            };

            // 2. Create the JSONModel
            var oModel = new JSONModel(oSharedData);

            // 3. Set the model on the component with a specific name (e.g., "global")
            this.setModel(oModel, "modelGlobal");



        },    








       /**
         * This method can be called to determine whether the sapUiSizeCompact or
         * sapUiSizeCozy design mode class should be set, which influences the size
         * of most SAP UI5 controls.
         * @public
         * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no class should be set
         */
        getContentDensityClass: function () {
            if (this._sContentDensityClass === undefined) {
                if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        }


    });
});