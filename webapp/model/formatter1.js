sap.ui.define([], function () {
    "use strict";

    /**
     * Maps backend status codes / raw values to user-friendly display labels.
     */
    var STATUS_MAP = {
        // Backend codes
        "OPEN":   "Open",
        "CLOS":   "Closed",
        "CREAT":  "Request Created",
        "TECH":   "Technician Assigned",
        "AWAIT":  "Awaiting Parts",
        "SCHED":  "Scheduled",
        "WRKORD": "Work Order Created",
        "COMPLT": "Completed",
        "CANCEL": "Cancelled",
        "DISP":   "Dispatched",
        "ENRTE":  "Technician En Route",
        "ONSITE": "Technician On-Site",
        "WKCOMP": "Work Completed",
        "CLSING": "Closing",
        // Pass-through friendly values (already mapped by backend)
        "Request Created":     "Request Created",
        "Technician Assigned": "Technician Assigned",
        "Awaiting Parts":      "Awaiting Parts",
        "Scheduled":           "Scheduled",
        "Completed":           "Completed",
        "Closed":              "Closed",
        "Open":                "Open",
        "Work Order Created":  "Work Order Created",
        "Cancelled":           "Cancelled"
    };

    /**
     * Maps status values to SAP ObjectStatus states.
     */
    var STATUS_STATE_MAP = {
        "Open":                "Information",
        "Request Created":     "Information",
        "Technician Assigned": "Success",
        "Dispatched":          "Success",
        "Technician En Route": "Success",
        "Technician On-Site":  "Success",
        "Scheduled":           "Warning",
        "Awaiting Parts":      "Warning",
        "Work Order Created":  "Warning",
        "Work Completed":      "Success",
        "Closing":             "Success",
        "Completed":           "None",
        "Closed":              "Error",
        "Cancelled":           "Error"
    };

    return {

        /**
         * Returns a user-friendly status label from a backend code or raw value.
         * @param {string} sStatus  Raw status value from OData
         * @returns {string}        Friendly display label
         */
        statusText: function (sStatus) {
            if (!sStatus) { return ""; }
            return STATUS_MAP[sStatus] || sStatus;
        },

        /**
         * Returns the SAP ObjectStatus state for a given status value.
         * @param {string} sStatus
         * @returns {string}  One of: None | Information | Success | Warning | Error
         */
        statusState: function (sStatus) {
            var sFriendly = STATUS_MAP[sStatus] || sStatus;
            return STATUS_STATE_MAP[sFriendly] || "None";
        },

        /**
         * Formats an OData date string or Date object for display.
         * Input may be "/Date(milliseconds)/", ISO string, or Date.
         * @param {string|Date} vDate
         * @param {boolean}     bTimeOnly  If true, return time portion only
         * @returns {string}
         */
        formatDate: function (vDate, bTimeOnly) {
            if (!vDate) { return ""; }
            var oDate;
            if (typeof vDate === "string") {
                // OData v2 date: /Date(1234567890000)/
                var oMatch = vDate.match(/\/Date\((\d+)([+-]\d{4})?\)\//);
                if (oMatch) {
                    oDate = new Date(parseInt(oMatch[1], 10));
                } else {
                    oDate = new Date(vDate);
                }
            } else if (vDate instanceof Date) {
                oDate = vDate;
            } else {
                return String(vDate);
            }
            if (isNaN(oDate.getTime())) { return String(vDate); }

            var sDate = (oDate.getMonth() + 1).toString().padStart(2, "0") + "/" +
                        oDate.getDate().toString().padStart(2, "0")         + "/" +
                        oDate.getFullYear();
            var sTime = oDate.getHours().toString().padStart(2, "0")   + ":" +
                        oDate.getMinutes().toString().padStart(2, "0");

            if (bTimeOnly) { return sTime; }

            // If the source was date-only (time is 00:00), return date only
            if (oDate.getHours() === 0 && oDate.getMinutes() === 0 && oDate.getSeconds() === 0) {
                return sDate;
            }
            return sDate + " " + sTime;
        },

        /**
         * Returns the first 50 characters of a string, appending "…" if truncated.
         * @param {string} sText
         * @returns {string}
         */
        truncate50: function (sText) {
            if (!sText) { return ""; }
            return sText.length > 50 ? sText.substring(0, 50) + "…" : sText;
        },

        /**
         * Returns true if the value is NOT empty/blank (used for NoAccess visibility).
         * Buttons are shown only when NoAccess is blank.
         * @param {string} sValue
         * @returns {boolean}
         */
        isAccessAllowed: function (sValue) {
            return !sValue;
        },

        /**
         * Builds a Google Maps URL from address parts.
         * @param {string} sAddress
         * @param {string} sCity
         * @param {string} sState
         * @param {string} sZip
         * @returns {string}  URL
         */
        googleMapsUrl: function (sAddress, sCity, sState, sZip) {
            var sParts = [sAddress, sCity, sState, sZip].filter(Boolean).join(", ");
            return "https://maps.google.com/?q=" + encodeURIComponent(sParts);
        }
    };
});
