sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    return {

        /**
         * Combine City, State, Zip into "CITY, STATE, ZIP".
         * Empty parts are skipped.
         */
        cityStateZip: function (sCity, sState, sZip) {
            //debugger;
            return [sCity, sState, sZip]
                .filter(function (s) { return s && String(s).trim().length; })
                .join(", ");
        },

        /**
         * Build a Google Maps URL for the equipment row's address.
         * Used by the hidden column referenced from the Address hyperlink.
         */
        googleMapsUrl: function (sStreet, sCity, sState) {
            var parts = [sStreet, sCity, sState]
                .filter(function (s) { return s && String(s).trim().length; });
            if (!parts.length) {
                return "";
            }
            return "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(parts.join(", "));
        },

        /**
         * Format an ISO/JS date as a date-only string.
         */
        formatDate: function (vDate) {
            if (!vDate) { return ""; }
            var d = vDate instanceof Date ? vDate : new Date(vDate);
            if (isNaN(d.getTime())) { return String(vDate); }
            return DateFormat.getDateInstance({ style: "medium" }).format(d);
        },

        /**
         * Format an ISO/JS date as a date + time string.
         */
        formatDateTime: function (vDate) {
            if (!vDate) { return ""; }
            var d = vDate instanceof Date ? vDate : new Date(vDate);
            if (isNaN(d.getTime())) { return String(vDate); }
            return DateFormat.getDateTimeInstance({ style: "medium" }).format(d);
        },

        /**
         * Map technical status codes to user-friendly text.
         * Extend the map as more statuses are defined.
         */
        statusText: function (sStatus) {
            if (!sStatus) { return ""; }
            var mMap = {
                "CREATED":      "Request created",
                "ASSIGNED":     "Technician Assigned",
                "INPROGRESS":   "In Progress",
                "CLOSED":       "Closed",
                "OPEN":         "Open",
                "SHIPPED":      "Shipped"
            };
            return mMap[String(sStatus).toUpperCase()] || sStatus;
        },

        /**
         * Truthiness for the No Access flag - the OData service
         * returns 'X' for true and '' for false.
         */
        noAccessFlag: function (sValue) {
            return String(sValue || "").toUpperCase() === "X";
        }
    };
});
