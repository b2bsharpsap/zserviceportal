/**
 * Service_Requests.controller.js
 * Sharp Service Portal – Service Requests Application
 *
 * OData services used:
 *   (A) ZMOB_USER_PROFILE_SRV / UserProfileSet  – user & Sold-To lookup
 *   (B) ZSD_SERVICE_APP_SRV  / GetOpenRequestSet – list of service requests
 *   (C) ZSD_SERVICE_APP_SRV  / GetRequestDetailSet – single request detail
 *   (D) ZSD_SERVICE_APP_SRV  / CreateRequestSet   – POST create request
 *   (E) ZSD_SERVICE_APP_SRV  / CreateConsOrderSet  – POST create order
 *   (F) ZSD_SERVICE_APP_SRV  / GetOpenOrdersSet    – read orders
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/UIComponent",     
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/ViewSettingsDialog",
    "sap/m/ViewSettingsItem",
    "sap/m/ViewSettingsFilterItem",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "zserviceportal/model/models",
    "zserviceportal/model/formatter"
], function (
    Controller,
    JSONModel,
    UIComponent,    
    Filter,
    FilterOperator,
    Sorter,
    MessageBox,
    MessageToast,
    ViewSettingsDialog,
    ViewSettingsItem,
    ViewSettingsFilterItem,
    SelectDialog,
    StandardListItem,
    Spreadsheet,
    exportLibrary,
    models,
    formatter
) {
    "use strict";

    /* ── OData base paths ───────────────────────────────── */
    var USER_PROFILE_SRV = "/sap/opu/odata/SAP/ZMOB_USER_PROFILE_SRV";
    var SERVICE_APP_SRV  = "/sap/opu/odata/SAP/ZSD_SERVICE_APP_SRV";

    /* ── Column metadata used for export & config dialog ── */
    var COLUMN_DEFS = [
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
    ];

    /* ── Column key → view XML Column ID map ── */
    var COLUMN_ID_MAP = {
        SharpReq:      "colSharpReq",
        Date:          "colDate",
        Description:   "colDescription",
        AddInfo:       "colAddInfo",
        ReqRef:        "colReqRef",
        Status:        "colStatus",
        StatusTime:    "colStatusTime",
        EquipId:       "colEquipId",
        CustEquipId:   "colCustEquipId",
        Model:         "colModel",
        Serial:        "colSerial",
        Location:      "colLocation",
        Address:       "colAddress",
        City:          "colCity",
        State:         "colState",
        ContractTerms: "colContractTerms",
        ModelDesc:     "colModelDesc",
        ContactName:   "colContactName",
        ContactNum:    "colContactNum"
    };

    /* ═══════════════════════════════════════════════════════
       CONTROLLER
    ════════════════════════════════════════════════════════ */
    return Controller.extend("zserviceportal.controller.ServiceRequestAI", {

        /* ── expose formatter to view ── */
        formatter: formatter,

        /* ════════════════════════════════════════════════════
           LIFECYCLE
        ═════════════════════════════════════════════════════*/
        onInit: function () {
            /* Create and attach the view model */
            var oViewModel = models.createViewModel();
            this.getView().setModel(oViewModel, "view");

            /* Apply content density class */
            this.getView().addStyleClass(
                this.getOwnerComponent().getContentDensityClass()
            );

            /* Track current sort/filter state for re-applying after data refresh */
            this._oCurrentSorter  = null;
            this._aCurrentFilters = [];
            this._sTableSearchQuery = "";
            this._oColConfigDialog  = null;
            this._oSortDialog       = null;
            this._oFilterDialog     = null;

            /* Column visibility state (deep-copy from defs) */
            this._aColDefs = COLUMN_DEFS.map(function (c) {
                return { key: c.key, label: c.label, visible: c.visible };
            });

            /* Set default dates */
            this._initDates();

            /* Step (A): Load user profile, then trigger request list */
            this._loadUserProfile();
        },


        getRouter : function () {
			return UIComponent.getRouterFor(this);
		},

        onPressBackButton: function (){			
			console.log("NavTo EquipmentListMain");

			this.getRouter().navTo("routeEquipmentListMain");			
		},


        /* ════════════════════════════════════════════════════
           DATE INITIALISATION
        ═════════════════════════════════════════════════════*/
        _initDates: function () {
            var oToday = new Date();
            var oFrom  = new Date(oToday);
            oFrom.setDate(oFrom.getDate() - 90);

            var oFromPicker = this.byId("dpFromDate");
            var oToPicker   = this.byId("dpToDate");

            oFromPicker.setDateValue(oFrom);
            oToPicker.setDateValue(oToday);
        },

        _getDateString: function (oPicker) {
            var oDate = oPicker.getDateValue();
            if (!oDate) { return ""; }
            return oDate.getFullYear() + "-" +
                   String(oDate.getMonth() + 1).padStart(2, "0") + "-" +
                   String(oDate.getDate()).padStart(2, "0");
        },

        /* ════════════════════════════════════════════════════
           (A) USER PROFILE LOAD
        ═════════════════════════════════════════════════════*/
        _loadUserProfile: function () {
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/busy", true);

            /* Derive user ID from SAP logon user.
               In a real deployment this comes from sap.ushell or the Fiori launchpad. */
            var sUserId = this._getCurrentUserId();
            var sUrl    = USER_PROFILE_SRV +
                          "/UserProfileSet(IvUserId='" + encodeURIComponent(sUserId) + "')";

            jQuery.ajax({
                url:         sUrl,
                type:        "GET",
                dataType:    "json",
                headers:     { "Accept": "application/json" },
                xhrFields:   { withCredentials: true },
                success: function (oData) {
                    var d = oData && oData.d ? oData.d : {};
                    oViewModel.setProperty("/custName",   d.SOLDTO_NAME || "");
                    oViewModel.setProperty("/custAddress", d.ADDRESS     || "");
                    oViewModel.setProperty("/soldTo",      d.SOLDTO      || "");
                    oViewModel.setProperty("/userName",    d.BNAME       || sUserId);
                    oViewModel.setProperty("/noAccess",    !!d.NO_ACCESS);
                    oViewModel.setProperty("/busy", false);

                    /* Step (B): Load open requests */
                    this._loadRequests({ init: true });
                }.bind(this),
                error: function () {
                    /* Fallback to mock data */
                    this._useMockUserProfile(sUserId);
                }.bind(this)
            });
        },

        _useMockUserProfile: function (sUserId) {
            var oViewModel = this.getView().getModel("view");
            /* Load local mock file */
            jQuery.ajax({
                url:      "localService/mockdata/UserProfileSet.json",
                type:     "GET",
                dataType: "json",
                success: function (oData) {
                    var d = oData && oData.d ? oData.d : {};
                    oViewModel.setProperty("/custName",   d.SOLDTO_NAME || "Sharp Business Systems");
                    oViewModel.setProperty("/custAddress", d.ADDRESS     || "");
                    oViewModel.setProperty("/soldTo",      d.SOLDTO      || "286337");
                    oViewModel.setProperty("/userName",    d.BNAME       || sUserId);
                    oViewModel.setProperty("/noAccess",    !!d.NO_ACCESS);
                }.bind(this),
                complete: function () {
                    oViewModel.setProperty("/busy", false);
                    this._loadRequests({ init: true });
                }.bind(this)
            });
        },

        _getCurrentUserId: function () {
            /* Try SAP Unified Shell first, then fall back */
            try {
                var oUshellContainer = sap.ushell && sap.ushell.Container;
                if (oUshellContainer) {
                    return oUshellContainer.getService("UserInfo").getId();
                }
            } catch (e) { /* ignore */ }
            return "BTHIRUMALA"; // dev default
        },

        /* ════════════════════════════════════════════════════
           (B) LOAD SERVICE REQUESTS
        ═════════════════════════════════════════════════════*/
        /**
         * @param {object} oOptions
         *   init          {boolean} – true when called from onInit (use OPEN only)
         *   filterOverride {object}  – optional filter values (from Search button)
         */
        _loadRequests: function (oOptions) {
            oOptions = oOptions || {};
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/requestsBusy", true);

            var sSoldTo   = oViewModel.getProperty("/soldTo");
            var sFromDate = this._getDateString(this.byId("dpFromDate"));
            var sToDate   = this._getDateString(this.byId("dpToDate"));

            /* Build OData $filter string */
            var aFilters = [
                "IvSoldTo eq '" + sSoldTo   + "'",
                "IvDateFrom eq '" + sFromDate + "'",
                "IvDateTo eq '"   + sToDate   + "'"
            ];

            if (oOptions.init) {
                /* Default: OPEN only */
                aFilters.push("status eq 'OPEN'");
            } else {
                /* From search: combine status checkboxes */
                var bOpen   = this.byId("chkOpen").getSelected();
                var bClosed = this.byId("chkClosed").getSelected();

                if (!bOpen && !bClosed) {
                    MessageBox.warning(this._i18n("msgSelectOpenClosed"));
                    oViewModel.setProperty("/requestsBusy", false);
                    return;
                }

                var aStatusFilters = [];
                if (bOpen)   { aStatusFilters.push("status eq 'OPEN'"); }
                if (bClosed) { aStatusFilters.push("status eq 'CLOSED'"); }
                aFilters.push("(" + aStatusFilters.join(" or ") + ")");

                /* Optional search fields */
                var sSharpReq  = this.byId("inSharpReq").getValue().trim();
                var sReqRef    = this.byId("inReqRef").getValue().trim();
                var sEquipId   = this.byId("inEquipId").getValue().trim();
                var sCustEquip = this.byId("inCustEquipId").getValue().trim();
                var sModel     = this.byId("inModel").getValue().trim();
                var sSerial    = this.byId("inSerial").getValue().trim();

                if (sSharpReq)  { aFilters.push("IvOrder eq '" + sSharpReq  + "'"); }
                if (sReqRef)    { aFilters.push("ReqRef eq '"   + sReqRef    + "'"); }
                if (sEquipId)   { aFilters.push("IvEquipment eq '" + sEquipId + "'"); }
                if (sCustEquip) { aFilters.push("CustEquip eq '" + sCustEquip + "'"); }
                if (sModel)     { aFilters.push("Model eq '"    + sModel     + "'"); }
                if (sSerial)    { aFilters.push("Serial eq '"   + sSerial    + "'"); }
            }

            var sFilter  = aFilters.join(" and ");
            var sUrl     = SERVICE_APP_SRV + "/GetOpenRequestSet?$filter=" +
                           encodeURIComponent(sFilter) + "&$format=json";

            jQuery.ajax({
                url:       sUrl,
                type:      "GET",
                dataType:  "json",
                headers:   { "Accept": "application/json" },
                xhrFields: { withCredentials: true },
                success: function (oData) {
                    var aResults = (oData && oData.d && oData.d.results) ? oData.d.results : [];
                    this._applyRequestsToModel(aResults, oOptions.init);
                }.bind(this),
                error: function () {
                    this._useMockRequestData(oOptions.init);
                }.bind(this)
            });
        },

        _useMockRequestData: function (bInit) {
            jQuery.ajax({
                url:      "localService/mockdata/GetOpenRequestSet.json",
                type:     "GET",
                dataType: "json",
                success: function (oData) {
                    var aResults = (oData && oData.d && oData.d.results) ? oData.d.results : [];
                    this._applyRequestsToModel(aResults, bInit);
                }.bind(this),
                error: function () {
                    this._applyRequestsToModel([], bInit);
                }.bind(this)
            });
        },

        _applyRequestsToModel: function (aResults, bAutoSelectFirst) {
            var oViewModel = this.getView().getModel("view");
            /* Normalise rows */
            var aRows = aResults.map(this._normaliseRow.bind(this));
            oViewModel.setProperty("/requests",         aRows);
            oViewModel.setProperty("/filteredRequests", aRows.slice());
            oViewModel.setProperty("/requestsBusy",     false);

            if (aRows.length === 0) {
                MessageToast.show(this._i18n("msgNoResults"));
                return;
            }

            /* (C) Auto-show detail for first row on init, or if only one result */
            if (bAutoSelectFirst || aRows.length === 1) {
                this._loadRequestDetail(aRows[0].SharpReq);
            }
        },

        /* ════════════════════════════════════════════════════
           (C) LOAD REQUEST DETAIL
        ═════════════════════════════════════════════════════*/
        _loadRequestDetail: function (sSharpReq) {
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/detailBusy", true);

            var sUrl = SERVICE_APP_SRV + "/GetRequestDetailSet?$filter=" +
                       encodeURIComponent("IvOrder eq '" + sSharpReq + "'") +
                       "&$format=json";

            jQuery.ajax({
                url:       sUrl,
                type:      "GET",
                dataType:  "json",
                headers:   { "Accept": "application/json" },
                xhrFields: { withCredentials: true },
                success: function (oData) {
                    var aResults = oData && oData.d && oData.d.results ? oData.d.results : [];
                    if (aResults.length > 0) {
                        this._applyDetailToModel(aResults[0]);
                    } else {
                        /* Fall back to row data if detail is empty */
                        var aRows  = oViewModel.getProperty("/requests");
                        var oMatch = aRows.find(function (r) { return r.SharpReq === sSharpReq; });
                        if (oMatch) { this._applyDetailToModel(oMatch); }
                    }
                }.bind(this),
                error: function () {
                    /* Try mock */
                    this._useMockDetailData(sSharpReq);
                }.bind(this)
            });
        },

        _useMockDetailData: function (sSharpReq) {
            var oViewModel = this.getView().getModel("view");
            jQuery.ajax({
                url:      "localService/mockdata/GetRequestDetailSet.json",
                type:     "GET",
                dataType: "json",
                success: function (oData) {
                    var aResults = oData && oData.d && oData.d.results ? oData.d.results : [];
                    /* Find matching record or use first */
                    var oMatch = aResults.find(function (r) { return r.SharpReq === sSharpReq; })
                                 || aResults[0];
                    if (oMatch) {
                        this._applyDetailToModel(oMatch);
                    } else {
                        /* Fall back to row from requests list */
                        var aRows   = oViewModel.getProperty("/requests");
                        var oRowMatch = aRows.find(function (r) { return r.SharpReq === sSharpReq; });
                        if (oRowMatch) { this._applyDetailToModel(oRowMatch); }
                    }
                }.bind(this),
                complete: function () {
                    oViewModel.setProperty("/detailBusy", false);
                }.bind(this)
            });
        },

        _applyDetailToModel: function (oRaw) {
            var oViewModel = this.getView().getModel("view");
            var oDetail    = this._normaliseDetail(oRaw);

            /* Compose City, State, Zip display string */
            oDetail._cityStateZip = [oDetail.City, oDetail.State, oDetail.Zip]
                .filter(Boolean).join(", ");

            oViewModel.setProperty("/detail",        oDetail);
            oViewModel.setProperty("/statusHistory", oDetail.StatusHistory || []);
            oViewModel.setProperty("/noAccess",      !!oDetail.NoAccess);
            oViewModel.setProperty("/detailVisible", true);
            oViewModel.setProperty("/detailBusy",    false);

            /* Scroll the detail panel into view */
            this.byId("detailPanel").focus();
        },

        /* ════════════════════════════════════════════════════
           DATA NORMALISATION
        ═════════════════════════════════════════════════════*/
        _normaliseRow: function (d) {
            return {
                SharpReq:      String(d.SharpReq     || d.IvOrder    || ""),
                Date:          d.Date                 || d.IvDate      || "",
                Description:   d.Description          || "",
                AddInfo:       d.AddInfo               || d.AdditionalInfo || "",
                ReqRef:        d.ReqRef                || d.RequestReference || "",
                Status:        d.Status                || d.LastStatus  || "",
                StatusTime:    d.StatusTime            || "",
                EquipId:       String(d.EquipId        || d.Equipment   || ""),
                CustEquipId:   String(d.CustEquipId    || ""),
                Model:         d.Model                 || "",
                Serial:        d.Serial                || "",
                Location:      d.Location              || "",
                Address:       d.Address               || "",
                City:          d.City                  || "",
                State:         d.State                 || "",
                Zip:           d.Zip                   || "",
                ContractTerms: d.ContractTerms         || "",
                ModelDesc:     d.ModelDesc             || "",
                ContactName:   d.ContactName           || "",
                ContactNum:    String(d.ContactNum      || ""),
                TrackingUrl:   d.TrackingUrl            || ""
            };
        },

        _normaliseDetail: function (d) {
            var oBase = this._normaliseRow(d);
            return Object.assign(oBase, {
                ServiceCategory: d.ServiceCategory || "",
                ServiceItem:     d.ServiceItem     || "",
                ReqNotes:        d.ReqNotes        || "",
                NoAccess:        d.NoAccess        || "",
                StatusHistory:   Array.isArray(d.StatusHistory) ? d.StatusHistory :
                    (d.StatusHistory && d.StatusHistory.results) ? d.StatusHistory.results : []
            });
        },

        /* ════════════════════════════════════════════════════
           SEARCH PANEL ACTIONS
        ═════════════════════════════════════════════════════*/
        onSearch: function () {
            this._loadRequests({ init: false });
        },

        onClear: function () {
            this.byId("inSharpReq").setValue("");
            this.byId("inReqRef").setValue("");
            this.byId("inEquipId").setValue("");
            this.byId("inCustEquipId").setValue("");
            this.byId("inModel").setValue("");
            this.byId("inSerial").setValue("");
            this.byId("chkOpen").setSelected(true);
            this.byId("chkClosed").setSelected(false);
            this.byId("srSearch").setValue("");
            this._initDates();
        },

        /* ════════════════════════════════════════════════════
           TABLE TOOLBAR ACTIONS
        ═════════════════════════════════════════════════════*/
        /**
         * Live-search: filters filteredRequests in the view model.
         */
        onTableSearch: function (oEvent) {
            this._sTableSearchQuery = oEvent.getParameter("newValue") || "";
            this._applyClientFilters();
        },

        _applyClientFilters: function () {
            var oViewModel = this.getView().getModel("view");
            var aAll       = oViewModel.getProperty("/requests");
            var sQuery     = this._sTableSearchQuery.toLowerCase();

            var aFiltered = aAll.filter(function (oRow) {
                if (!sQuery) { return true; }
                return Object.values(oRow).some(function (v) {
                    return String(v).toLowerCase().indexOf(sQuery) !== -1;
                });
            });

            oViewModel.setProperty("/filteredRequests", aFiltered);
        },

        /* ── Sort Dialog ── */
        onOpenSortDialog: function () {
            if (!this._oSortDialog) {
                this._oSortDialog = new ViewSettingsDialog({
                    title:  "Sort",
                    sortItems: COLUMN_DEFS.map(function (c) {
                        return new ViewSettingsItem({ key: c.key, text: c.label });
                    }),
                    confirm: this._onSortConfirm.bind(this),
                    cancel:  function () { this._oSortDialog.close(); }.bind(this)
                });
                this.getView().addDependent(this._oSortDialog);
            }
            this._oSortDialog.open();
        },

        _onSortConfirm: function (oEvent) {
            var oViewModel = this.getView().getModel("view");
            var oParams    = oEvent.getParameters();
            var sSortKey   = oParams.sortItem ? oParams.sortItem.getKey() : null;
            var bDesc      = oParams.sortDescending;

            if (!sSortKey) { return; }

            var aData = oViewModel.getProperty("/filteredRequests");
            aData.sort(function (a, b) {
                var va = String(a[sSortKey] || "").toLowerCase();
                var vb = String(b[sSortKey] || "").toLowerCase();
                if (va < vb) { return bDesc ? 1 : -1; }
                if (va > vb) { return bDesc ? -1 : 1; }
                return 0;
            });
            oViewModel.setProperty("/filteredRequests", aData);
        },

        /* ── Filter Dialog ── */
        onOpenFilterDialog: function () {
            if (!this._oFilterDialog) {
                /* Build filter items with distinct values from current data */
                var oViewModel = this.getView().getModel("view");
                var aAll       = oViewModel.getProperty("/requests");

                var aFilterCols = ["Status", "Model", "City", "State", "ContractTerms", "Location"];
                var aFilterItems = aFilterCols.map(function (sCol) {
                    var oFilterItem = new ViewSettingsFilterItem({
                        key:  sCol,
                        text: COLUMN_DEFS.find(function (c) { return c.key === sCol; }).label
                    });
                    /* Distinct values */
                    var aVals = [...new Set(aAll.map(function (r) { return String(r[sCol] || ""); }))].sort();
                    aVals.forEach(function (sVal) {
                        oFilterItem.addItem(new ViewSettingsItem({ key: sVal, text: sVal || "(blank)" }));
                    });
                    return oFilterItem;
                });

                this._oFilterDialog = new ViewSettingsDialog({
                    title:       "Filter",
                    filterItems: aFilterItems,
                    confirm:     this._onFilterConfirm.bind(this),
                    cancel:      function () { this._oFilterDialog.close(); }.bind(this)
                });
                this.getView().addDependent(this._oFilterDialog);
            }
            this._oFilterDialog.open();
        },

        _onFilterConfirm: function (oEvent) {
            var oViewModel = this.getView().getModel("view");
            var oParams    = oEvent.getParameters();
            var aAll       = oViewModel.getProperty("/requests");
            var sQuery     = this._sTableSearchQuery.toLowerCase();

            /* Collect selected filter values */
            var oFilterMap = {}; // col -> Set of selected values
            if (oParams.filterItems && oParams.filterItems.length) {
                oParams.filterItems.forEach(function (oItem) {
                    var sPart   = oItem.getKey();
                    var sParent = oItem.getParent ? oItem.getParent().getKey() : sPart;
                    var sKey    = sParent || sPart;
                    if (!oFilterMap[sKey]) { oFilterMap[sKey] = new Set(); }
                    oFilterMap[sKey].add(oItem.getText());
                });
            }

            var aFiltered = aAll.filter(function (oRow) {
                /* Apply column filter */
                var bColPass = Object.keys(oFilterMap).every(function (sCol) {
                    return oFilterMap[sCol].has(String(oRow[sCol] || ""));
                });
                /* Apply text search */
                var bSearchPass = !sQuery || Object.values(oRow).some(function (v) {
                    return String(v).toLowerCase().indexOf(sQuery) !== -1;
                });
                return bColPass && bSearchPass;
            });

            oViewModel.setProperty("/filteredRequests", aFiltered);
        },

        /* ── Export to Excel ── */
        onExport: function () {
            var oViewModel = this.getView().getModel("view");
            var aData      = oViewModel.getProperty("/filteredRequests");

            if (!aData || aData.length === 0) {
                MessageToast.show(this._i18n("msgNoResults"));
                return;
            }

            var EdmType    = exportLibrary.EdmType;
            var aColDefs   = this._aColDefs.filter(function (c) { return c.visible; });

            var aColumns = aColDefs.map(function (c) {
                var oCol = { label: c.label, property: c.key, type: EdmType.String };
                if (c.key === "Date" || c.key === "StatusTime") {
                    oCol.type = EdmType.String; // pre-formatted strings
                }
                return oCol;
            });

            /* Format dates before export */
            var aExportData = aData.map(function (oRow) {
                var oFormatted = Object.assign({}, oRow);
                oFormatted.Date       = formatter.formatDate(oRow.Date);
                oFormatted.StatusTime = formatter.formatDate(oRow.StatusTime);
                oFormatted.Status     = formatter.statusText(oRow.Status);
                oFormatted.AddInfo    = formatter.truncate50(oRow.AddInfo);
                return oFormatted;
            });

            var oSettings = {
                workbook:  { columns: aColumns },
                dataSource: aExportData,
                fileName:  "Service_Requests_Export",
                worker:    false
            };

            var oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .then(function () { MessageToast.show("Export complete."); })
                .finally(function () { oSheet.destroy(); });
        },

        /* ── Column Configuration Dialog ── */
        onColumnSettings: function () {
            var oView = this.getView();

            if (!this._oColConfigDialog) {
                /* Build a dialog with a list of checkboxes for each column */
                var aItems = this._aColDefs.map(function (c) {
                    return new StandardListItem({
                        title:    c.label,
                        selected: c.visible
                    });
                });

                var oList = new sap.m.List({
                    mode:  "MultiSelect",
                    items: aItems
                });
                /* Pre-select visible ones */
                aItems.forEach(function (oItem, i) {
                    if (this._aColDefs[i].visible) { oList.setSelectedItem(oItem, true, true); }
                }.bind(this));

                this._oColConfigDialog = new sap.m.Dialog({
                    title: this._i18n("dialogColumnsTitle"),
                    content: [oList],
                    beginButton: new sap.m.Button({
                        text: this._i18n("dialogColumnsApply"),
                        type: "Emphasized",
                        press: function () {
                            var aSelected = new Set(oList.getSelectedItems().map(function (item) {
                                return item.getTitle();
                            }));
                            this._aColDefs.forEach(function (c) {
                                c.visible = aSelected.has(c.label);
                                var sColId = COLUMN_ID_MAP[c.key];
                                if (sColId) {
                                    var oCol = this.byId(sColId);
                                    if (oCol) { oCol.setVisible(c.visible); }
                                }
                            }.bind(this));
                            this._oColConfigDialog.close();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text:  this._i18n("dialogColumnsCancel"),
                        press: function () { this._oColConfigDialog.close(); }.bind(this)
                    })
                });
                oView.addDependent(this._oColConfigDialog);
            }
            this._oColConfigDialog.open();
        },

        /* ════════════════════════════════════════════════════
           TABLE ROW EVENTS
        ═════════════════════════════════════════════════════*/
        onRowPress: function (oEvent) {
            /* Clicking a row (not a hyperlink) also loads the detail */
            var oContext = oEvent.getSource().getBindingContext("view");
            if (oContext) {
                var sSharpReq = oContext.getProperty("SharpReq");
                this._loadRequestDetail(sSharpReq);
            }
        },

        onRowSelectionChange: function (oEvent) {
            /* Nothing extra needed – selections are read when action buttons pressed */
        },

        /* ── Sharp Request hyperlink ── */
        onSharpReqPress: function (oEvent) {
            var oContext  = oEvent.getSource().getBindingContext("view");
            var sSharpReq = oContext.getProperty("SharpReq");
            this._loadRequestDetail(sSharpReq);
        },

        /* ── Equipment ID / Customer Equipment ID hyperlinks ── */
        onEquipIdPress: function (oEvent) {
            /* Scrolls to detail section and loads that request's detail */
            var oContext  = oEvent.getSource().getBindingContext("view");
            var sSharpReq = oContext.getProperty("SharpReq");
            this._loadRequestDetail(sSharpReq);
        },

        /* ── Address link in table (Google Maps) ── */
        onAddressPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("view");
            var sAddress = oContext.getProperty("Address");
            var sCity    = oContext.getProperty("City");
            var sState   = oContext.getProperty("State");
            var sZip     = oContext.getProperty("Zip");
            var sUrl     = formatter.googleMapsUrl(sAddress, sCity, sState, sZip);
            sap.m.URLHelper.redirect(sUrl, true);
        },

        /* ── Address link in Detail panel (Google Maps) ── */
        onDetailAddressPress: function () {
            var oViewModel = this.getView().getModel("view");
            var oDetail    = oViewModel.getProperty("/detail");
            var sUrl       = formatter.googleMapsUrl(
                oDetail.Address, oDetail.City, oDetail.State, oDetail.Zip
            );
            sap.m.URLHelper.redirect(sUrl, true);
        },

        /* ── Tracking Info link ── */
        onTrackingPress: function () {
            var oViewModel = this.getView().getModel("view");
            var sUrl       = oViewModel.getProperty("/detail/TrackingUrl");
            if (sUrl) { sap.m.URLHelper.redirect(sUrl, true); }
        },

        /* ════════════════════════════════════════════════════
           ACTION BUTTONS
        ═════════════════════════════════════════════════════*/
        /**
         * Returns an array of selected row data objects.
         */
        _getSelectedRows: function () {
            var oTable      = this.byId("srTable");
            var aSelected   = oTable.getSelectedItems();
            var oViewModel  = this.getView().getModel("view");
            return aSelected.map(function (oItem) {
                return oItem.getBindingContext("view").getObject();
            });
        },

        /**
         * Fetches a CSRF token from the service layer.
         * @returns {Promise<string>}
         */
        _fetchCsrfToken: function () {
            return new Promise(function (resolve) {
                jQuery.ajax({
                    url:       SERVICE_APP_SRV + "/$metadata",
                    type:      "GET",
                    headers:   { "X-CSRF-Token": "Fetch" },
                    xhrFields: { withCredentials: true },
                    success: function (data, status, xhr) {
                        resolve(xhr.getResponseHeader("X-CSRF-Token") || "");
                    },
                    error: function () { resolve(""); }
                });
            });
        },

        /* ── Create Request ── */
        onCreateRequest: function () {
            var aRows = this._getSelectedRows();
            if (aRows.length > 1) {
                MessageBox.warning(this._i18n("msgSelectOneRequest"));
                return;
            }

            var oViewModel = this.getView().getModel("view");
            var sSoldTo    = oViewModel.getProperty("/soldTo");
            var sEquipId   = aRows.length === 1 ? aRows[0].EquipId : "";

            var oPayload = { IvSoldTo: sSoldTo, IvEquipment: sEquipId };

            this._fetchCsrfToken().then(function (sToken) {
                jQuery.ajax({
                    url:         SERVICE_APP_SRV + "/CreateRequestSet",
                    type:        "POST",
                    contentType: "application/json",
                    dataType:    "json",
                    data:        JSON.stringify(oPayload),
                    headers:     {
                        "Accept":       "application/json",
                        "X-CSRF-Token": sToken
                    },
                    xhrFields: { withCredentials: true },
                    success: function (oData) {
                        MessageBox.success(this._i18n("msgCreateRequestSuccess"), {
                            onClose: function () {
                                /* Refresh the request list */
                                this._loadRequests({ init: false });
                            }.bind(this)
                        });
                    }.bind(this),
                    error: function (xhr) {
                        var sMsg = this._extractODataError(xhr) ||
                                   "Create Request failed. Status: " + xhr.status;
                        MessageBox.error(sMsg);
                    }.bind(this)
                });
            }.bind(this));
        },

        /* ── Create Order ── */
        onCreateOrder: function () {
            var aRows = this._getSelectedRows();
            if (aRows.length > 1) {
                MessageBox.warning(this._i18n("msgSelectOneOrder"));
                return;
            }

            var oViewModel = this.getView().getModel("view");
            var sSoldTo    = oViewModel.getProperty("/soldTo");
            var oPayload   = { IvSoldTo: sSoldTo, IvShippingInstruct: "" };
            if (aRows.length === 1) { oPayload.IvEquipment = aRows[0].EquipId; }

            this._fetchCsrfToken().then(function (sToken) {
                jQuery.ajax({
                    url:         SERVICE_APP_SRV + "/CreateConsOrderSet",
                    type:        "POST",
                    contentType: "application/json",
                    dataType:    "json",
                    data:        JSON.stringify(oPayload),
                    headers:     {
                        "Accept":       "application/json",
                        "X-CSRF-Token": sToken
                    },
                    xhrFields: { withCredentials: true },
                    success: function () {
                        MessageBox.success(this._i18n("msgCreateOrderSuccess"));
                    }.bind(this),
                    error: function (xhr) {
                        var sMsg = this._extractODataError(xhr) ||
                                   "Create Order failed. Status: " + xhr.status;
                        MessageBox.error(sMsg);
                    }.bind(this)
                });
            }.bind(this));
        },

        /* ── View Orders ── */
        onViewOrders: function () {
            var aRows      = this._getSelectedRows();
            var oViewModel = this.getView().getModel("view");
            var sSoldTo    = oViewModel.getProperty("/soldTo");

            var sEquipFilter = "";
            if (aRows.length > 0) {
                var aParts = aRows.map(function (r) {
                    return "IvEquipment eq '" + r.EquipId + "'";
                });
                sEquipFilter = " and (" + aParts.join(" or ") + ")";
            }

            var sFilter = "IvSoldTo eq '" + sSoldTo + "'" + sEquipFilter;
            var sUrl    = SERVICE_APP_SRV +
                          "/GetOpenOrdersSet?$filter=" + encodeURIComponent(sFilter) +
                          "&$format=json";

            /* Navigate in same window (as per spec) */
            window.location.href = sUrl;
        },

        /* ── View Requests (filtered by selected equipment) ── */
        onViewRequests: function () {
            var aRows      = this._getSelectedRows();
            var oViewModel = this.getView().getModel("view");
            var sSoldTo    = oViewModel.getProperty("/soldTo");
            var sFromDate  = this._getDateString(this.byId("dpFromDate"));
            var sToDate    = this._getDateString(this.byId("dpToDate"));

            var aBaseFilters = [
                "IvSoldTo eq '" + sSoldTo   + "'",
                "IvDateFrom eq '" + sFromDate + "'",
                "IvDateTo eq '"   + sToDate   + "'"
            ];

            if (aRows.length > 0) {
                var aParts = aRows.map(function (r) {
                    return "IvEquipment eq '" + r.EquipId + "'";
                });
                aBaseFilters.push("(" + aParts.join(" or ") + ")");
            }

            var sFilter = aBaseFilters.join(" and ");
            var sUrl    = SERVICE_APP_SRV +
                          "/GetOpenRequestSet?$filter=" + encodeURIComponent(sFilter) +
                          "&$format=json";

            window.location.href = sUrl;
        },

        /* ── Meter Readings ── */
        onMeterReadings: function () {
            var aRows = this._getSelectedRows();
            var sEquipIds = aRows.map(function (r) { return r.EquipId; })
                                 .filter(Boolean).join(",");

            /* Navigate to the Meter_Readings application (sibling SAPUI5 app) */
            var sTarget = "../Meter_Readings/index.html";
            if (sEquipIds) {
                sTarget += "?equipmentIds=" + encodeURIComponent(sEquipIds);
            }
            window.location.href = sTarget;
        },

        /* ════════════════════════════════════════════════════
           UTILITIES
        ═════════════════════════════════════════════════════*/
        /**
         * Returns a translated text string from the i18n model.
         */
        _i18n: function (sKey, aParams) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            return oBundle.getText(sKey, aParams);
        },

        /**
         * Extracts a user-readable error message from an OData error XHR response.
         */
        _extractODataError: function (xhr) {
            try {
                var oResp = JSON.parse(xhr.responseText);
                return oResp.error && oResp.error.message && oResp.error.message.value
                    ? oResp.error.message.value
                    : null;
            } catch (e) {
                return null;
            }
        }
    });
});
