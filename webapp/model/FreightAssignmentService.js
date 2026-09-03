sap.ui.define([], function () {
    "use strict";

    var DEFAULT_BASE_URL = "/api/dispatcher";
    
    function normalizeData(payload) {
        var data = payload || {};

        return {
            selectedFO: null,
            selectedDriver: null,
            proposals: [],
            validUsers: data.validUsers || [{ userId: "admin", password: "Welcome123", name: "Administrator" }],
            drivers: Array.isArray(data.drivers) ? data.drivers : [],
            vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
            freightOrders: Array.isArray(data.freightOrders) ? data.freightOrders : [],
            assignments: Array.isArray(data.assignments) ? data.assignments : [],
            Vehassignments: Array.isArray(data.Vehassignments) ? data.Vehassignments : [],
            currentUser: null,
            filters: data.filters || {},
            isServiceLoaded: true,
            lastUpdated: new Date().toISOString()
        };
    }

    function readJson(url) {
        return fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }).then(function (response) {
            if (!response.ok) {
                throw new Error("Request failed with status " + response.status);
            }
            return response.json();
        });
    }

    return {
        baseUrl: DEFAULT_BASE_URL,

        setBaseUrl: function (baseUrl) {
            if (baseUrl) {
                this.baseUrl = baseUrl;
            }
            return this;
        },

        loadDashboardData: function () {
            var serviceUrl = this.baseUrl + "/dashboard";

            return readJson(serviceUrl)
                .then(function (response) {
                    return normalizeData(response);
                })
                .catch(function () {
                    return normalizeData({
                        drivers: [],
                        vehicles: [],
                        freightOrders: [],
                        assignments: [],
                        Vehassignments: []
                    });
                });
        },

        saveAssignment: function (payload) {
            return fetch(this.baseUrl + "/assignments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload || {})
            }).then(function (response) {
                if (!response.ok) {
                    throw new Error("Assignment creation failed");
                }
                return response.json();
            });
        }
    };
});
