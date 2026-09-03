sap.ui.define([
    "./ApiService"
], function (ApiService) {

    "use strict";

    return {

        getAll() {
            return ApiService.get(
                "/GetFreightOrders"
            );
        },

        getById(id) {
            return ApiService.get(
                `/GetFreightOrders/${id}`
            );
        }
    };
});