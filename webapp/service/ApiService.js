sap.ui.define([], function () {
    "use strict";

    const CONFIG = {
        //BASE_URL: "/api/v1"
        //BASE_URL: "/api/odata/v4/dispatcher"
        // BASE_URL: "http://localhost:4004/odata/v4/dispatcher"
        BASE_URL:  "https://7a89bf9atrial-dev-dispatcherservice-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/dispatcher"
        
    };

    return {

        async get(endpoint) {
            const response = await fetch(
                `${CONFIG.BASE_URL}${endpoint}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to retrieve data (${response.status})`
                );
            }

            return response.json();
        },

        async post(endpoint, payload) {

            const response = await fetch(
                `${CONFIG.BASE_URL}${endpoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                const error =
                    await response.json();

                throw new Error(
                    error.message ||
                    "Backend service error"
                );
            }

            return response.json();
        },

        async put(endpoint, payload) {

            const response = await fetch(
                `${CONFIG.BASE_URL}${endpoint}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                throw new Error("Update failed");
            }

            return response.json();
        },

        async delete(endpoint) {

            const response = await fetch(
                `${CONFIG.BASE_URL}${endpoint}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error("Delete failed");
            }

            return response.json();
        }
    };
});