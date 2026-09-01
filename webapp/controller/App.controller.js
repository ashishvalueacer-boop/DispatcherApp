sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/Title",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/List",
    "sap/m/CustomListItem",
    "sap/m/ObjectStatus",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat"
], function (Controller, MessageToast, MessageBox, Dialog, Button,
    Toolbar,
    ToolbarSpacer,
    Title,
    Text,
    VBox,
    HBox,
    List,
    CustomListItem,
    ObjectStatus, Filter, FilterOperator, DateFormat) {
    "use strict";

  return BaseController.extend("dispatcherns.dispatcherapp.controller.App", {
      onInit: function () {
            this._render();
            this.byId("fromDate").setDateValue(new Date());
            this.byId("toDate").setDateValue(new Date(new Date().setDate(new Date().getDate() + 1)));
            // document.getElementById("foStatusFilter").addEventListener("change", this.onFilter.bind(this));
            // document.getElementById("foSearch").addEventListener("input", this.onFilter.bind(this));         

            this._bFreightOrdersAscending = true;
            this._bDriversAscending = true;
        },
        //****************************Login Code******************************* */
        onLogin: function () {
            var userId = this.byId("loginUserId").getValue().trim();
            var password = this.byId("loginPassword").getValue();
            var loginError = this.byId("loginError");
            var user = this.getView().getModel().getProperty("/validUsers").find(function (item) {
                return item.userId === userId && item.password === password;
            });

            if (!user) {
                loginError.setText("Enter a valid user ID and password.");
                loginError.setVisible(true);
                return;
            }
            loginError.setVisible(false);
            this.byId("loginPassword").setValue("");
            this.getView().getModel().setProperty("/currentUser", { userId: user.userId, name: user.name });
            this.byId("appNavigator").to(this.byId("dashboardPage").getId(), "show");
            setTimeout(this._render.bind(this), 0);
        },
        onLogout: function () {
            this.getView().getModel().setProperty("/currentUser", null);
            this.byId("loginUserId").setValue("");
            this.byId("loginPassword").setValue("");
            this.byId("loginError").setVisible(false);
            this.byId("appNavigator").backToPage(this.byId("loginPage").getId());
        },
        onExpandUnassignedFO: function () {
            var oController = this;
            var oModel = this.getView().getModel();

            if (!oModel) {
                MessageBox.error("Freight Order model is not available.");
                return;
            }

            var aFreightOrders = oModel.getProperty("/freightOrders") || [];
            var aUnassignedFO = aFreightOrders.filter(function (oFO) {
                return oFO.status === "Unassigned";
            });
            /*
             * Create Dialog only once
             */
            if (!this._oUnassignedFODialog) {
                this._oUnassignedFODialog =
                    new Dialog({
                        title: "UNASSIGNED FREIGHT ORDERS",
                        stretch: true,
                        contentWidth: "100%",
                        contentHeight: "100%",
                        horizontalScrolling: false,
                        verticalScrolling: true,
                        draggable: false,
                        resizable: false,
                        content: [
                            new VBox({
                                width: "100%",
                                fitContainer: true,
                                items: [
                                    new Toolbar({
                                        content: [
                                            new Text({
                                                text:
                                                    "Select a Freight Order to view details or assign a driver."
                                            }),

                                            new ToolbarSpacer(),
                                            new Button({
                                                icon: "sap-icon://refresh",
                                                tooltip: "Refresh Freight Orders",
                                                press: function () {
                                                    oController
                                                        ._refreshUnassignedFODialog();
                                                }
                                            })
                                        ]
                                    }),

                                    new List({
                                        id: this.getView().createId(
                                            "unassignedFOFullScreenList"
                                        ),
                                        width: "100%",
                                        mode: "SingleSelectMaster",
                                        growing: true,
                                        growingThreshold: 50,
                                        noDataText: "No Unassigned Freight Orders",
                                        selectionChange:
                                            function (oEvent) {

                                                var oItem =
                                                    oEvent.getParameter(
                                                        "listItem"
                                                    );

                                                if (!oItem) {
                                                    return;
                                                }

                                                var oFO =
                                                    oItem
                                                        .getBindingContext()
                                                        .getObject();

                                                /*
                                                 * Use your existing
                                                 * Freight Order details
                                                 */
                                                oController._showFO(oFO);

                                                /*
                                                 * Select the FO in the
                                                 * main Gantt as well.
                                                 */
                                                oController
                                                    ._highlightFreightOrder(oFO.id);

                                            }
                                    })
                                ]
                            })
                        ],
                        endButton: new Button({
                            text: "Close",
                            icon: "sap-icon://decline",
                            press: function () {
                                oController
                                    ._oUnassignedFODialog
                                    .close();
                            }
                        })
                    });
                this.getView().addDependent(
                    this._oUnassignedFODialog
                );
            }
            /*
             * Bind the list every time the dialog opens
             */
            this._refreshUnassignedFODialog();
            this._oUnassignedFODialog.open();
        },
        _refreshUnassignedFODialog: function () {

            if (!this._oUnassignedFODialog) {
                return;
            }

            var oList = sap.ui.getCore()
                .byId(
                    this.getView().createId(
                        "unassignedFOFullScreenList"
                    )
                );

            if (!oList) {
                return;
            }

            var oModel = this.getView().getModel();

            if (!oModel) {
                return;
            }

            /*
             * Filter only Unassigned Freight Orders
             */
            var oFilter = new sap.ui.model.Filter(
                "status",
                sap.ui.model.FilterOperator.EQ,
                "Unassigned"
            );

            oList.bindItems({

                path: "/freightOrders",

                filters: [oFilter],

                template: new sap.m.CustomListItem({

                    content: [

                        new sap.m.HBox({

                            width: "100%",

                            justifyContent:
                                "SpaceBetween",

                            alignItems:
                                "Center",

                            items: [

                                new sap.m.VBox({

                                    items: [

                                        new sap.m.Title({

                                            text: "{id}",

                                            level: "H4"

                                        }),

                                        new sap.m.Text({

                                            text: {
                                                parts: [
                                                    { path: "origin" },
                                                    { path: "destination" }
                                                ],

                                                formatter:
                                                    function (
                                                        sOrigin,
                                                        sDestination
                                                    ) {

                                                        return (
                                                            (sOrigin || "-") +
                                                            " → " +
                                                            (sDestination || "-")
                                                        );

                                                    }
                                            }

                                        }),

                                        new sap.m.Text({

                                            text: {
                                                parts: [
                                                    { path: "startTime" },
                                                    { path: "endTime" }
                                                ],

                                                formatter:
                                                    function (
                                                        sStart,
                                                        sEnd
                                                    ) {

                                                        return (
                                                            (sStart || "-") +
                                                            " - " +
                                                            (sEnd || "-")
                                                        );

                                                    }
                                            }

                                        })

                                    ]

                                }),

                                new sap.m.ObjectStatus({

                                    text: "{status}",

                                    state: "Warning",

                                    inverted: true

                                })

                            ]

                        })

                    ]

                })

            });
        },
        _highlightFreightOrder: function (sFOId) {

            var oFOHost =
                document.getElementById("foGantt");

            if (!oFOHost) {
                return;
            }

            /*
             * Remove previous selection
             */
            oFOHost
                .querySelectorAll(".selectedFO")
                .forEach(function (oElement) {

                    oElement.classList.remove(
                        "selectedFO"
                    );

                });

            /*
             * Find selected FO
             */
            var oFOBar =
                oFOHost.querySelector(
                    '[data-fo="' + sFOId + '"]'
                );

            if (oFOBar) {

                oFOBar.classList.add(
                    "selectedFO"
                );

                oFOBar.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        },
        //****************************Login Code******************************* */
        _onSortFO: function (bAscending) {
            this._bFreightOrdersAscending = bAscending;
            var m = this.getView().getModel();
            var aFreightOrders = m.getProperty("/freightOrders");

            aFreightOrders.sort(function (a, b) {
                return bAscending ? a.start - b.start : b.start - a.start;
            }.bind(this));

            m.setProperty("/freightOrders", aFreightOrders);
            this._render();
        },

        _onSortDrivers: function (bAscending) {
            this._bDriversAscending = bAscending;
            var m = this.getView().getModel();
            var aDrivers = m.getProperty("/drivers");

            aDrivers.sort(function (a, b) {
                return bAscending ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
            });
            m.setProperty("/drivers", aDrivers);
            this._render();
        },

        onAfterRendering: function () {
            this._render();
        },
        onToggleDriverPanel: function () {
            this._togglePanel("driverPanel", "driverPanelToggle", "navigation-left-arrow", "navigation-right-arrow", "Expand driver panel", "Collapse driver panel");
        },
        onToggleDetailsPanel: function () {
            this._togglePanel("detailsPanel", "detailsPanelToggle", "navigation-right-arrow", "navigation-left-arrow", "Expand details panel", "Collapse details panel");
        },
        _togglePanel: function (panelId, toggleId, expandedIcon, collapsedIcon, expandedTooltip, collapsedTooltip) {
            var panel = this.byId(panelId),
                button = this.byId(toggleId),
                collapsed = panel.hasStyleClass("panelCollapsed");
            panel.toggleStyleClass("panelCollapsed", !collapsed);
            button.setIcon("sap-icon://" + (collapsed ? expandedIcon : collapsedIcon));
            button.setTooltip(collapsed ? expandedTooltip : collapsedTooltip);
        },
        _wireResize: function () {
            var main = document.querySelector(".mainArea"),
                driver = this.byId("driverPanel"),
                details = this.byId("detailsPanel"),
                driverHandle = document.querySelector(".driverResizeHandle"),
                detailsHandle = document.querySelector(".detailsResizeHandle");
            if (!main || !driver || !details || !driverHandle || !detailsHandle)
                return;
            if (driverHandle.dataset.resizeWired === "true" && detailsHandle.dataset.resizeWired === "true")
                return;

            var resize = function (handle, event) {
                event.preventDefault();
                // var resizingDriver = handle === driverHandle, panel = resizingDriver ? driver : details; panel.removeStyleClass("panelCollapsed");
                // var button = this.byId(resizingDriver ? "driverPanelToggle" : "detailsPanelToggle");
                // button.setIcon("sap-icon://" + (resizingDriver ? "navigation-left-arrow" : "navigation-right-arrow"));
                // button.setTooltip(resizingDriver ? "Collapse driver panel" : "Collapse details panel");

                var bResizingDriver = handle === driverHandle,
                    oPanel = bResizingDriver ? driver : details,
                    oButton = this.byId(bResizingDriver ? "driverPanelToggle" : "detailsPanelToggle"),
                    bCollapsed = oPanel.hasStyleClass("panelCollapsed");

                oPanel.toggleStyleClass("panelCollapsed", !bCollapsed);
                oButton.setIcon(
                    "sap-icon://" +
                    (bCollapsed
                        ? (bResizingDriver ? "navigation-left-arrow" : "navigation-right-arrow")
                        : (bResizingDriver ? "navigation-right-arrow" : "navigation-left-arrow"))
                );
                oButton.setTooltip(
                    bCollapsed
                        ? (bResizingDriver ? "Collapse driver panel" : "Collapse details panel")
                        : (bResizingDriver ? "Expand driver panel" : "Expand details panel")
                );
            }.bind(this); driverHandle.addEventListener("pointerdown", resize.bind(this, driverHandle));
            detailsHandle.addEventListener("pointerdown", resize.bind(this, detailsHandle));
            driverHandle.dataset.resizeWired = "true";
            detailsHandle.dataset.resizeWired = "true";
        },
        onDriverSearch: function (e) {
            var v = e.getParameter("newValue");
            this.byId("driverList").getBinding("items").filter(v ? [new Filter("name", FilterOperator.Contains, v)] : []);
        },
        onDriverSelect: function (e) {
            var d = e.getParameter("listItem").getBindingContext().getObject();
            this.getView().getModel().setProperty("/selectedDriver", d);
            this.byId("driverTitle").setText(d.name);
            this.byId("driverStatus").setText(d.status);
            this.byId("driverStatus").setState(
                d.status === "Available" ? "Success" : "Warning"
            );

            this.byId("driverId").setText("Driver ID: " + d.id);
            this.byId("driverLocation").setText("Home Location: " + d.location);
            this.byId("driverVehicle").setText("Vehicle: " + d.vehicle);
            this.byId("driverType").setText("Driver Type: " + d.type);

        },

        _setDateValue: function () {
            var oDateFormat = DateFormat.getDateInstance({ pattern: "dd MMM yyyy HH:mm" });
            var oFromDate = this.byId("fromDate").getDateValue();
            var oToDate = this.byId("toDate").getDateValue();

            this.byId("foDate").setText(oDateFormat.format(oFromDate) + " - " + oDateFormat.format(oToDate));
            this.byId("driverDate").setText(oDateFormat.format(oFromDate) + " - " + oDateFormat.format(oToDate));
        },
        onFilter: function () {
            MessageToast.show("Filters applied");
            this._render();
        },
        //*********************** * START USE AI PROPOSAL ************************************************************
        onUseAIProposal: function () {
            var m = this.getView().getModel(),
                input = this._getAIProposalInput();
            this.byId("aiProposalButton").setEnabled(false);
            this._requestAIProposals(input)
                .then(function (proposals) {
                    m.setProperty("/proposals", proposals);
                    this._setProposalActions(proposals.length > 0);
                    this._render(); MessageToast.show(proposals.length ? "Review the AI suggestions on the Driver Gantt chart." : "No feasible assignments found.");
                }.bind(this)).
                catch(function (error) {
                    var message = error.name === "TypeError" ? "Network or CORS error while contacting the configured AI provider. Check the endpoint in config/ai-models.json." : error.message; MessageBox.error("Unable to generate AI proposals. "
                        + message);
                }).finally(function () {
                    this.byId("aiProposalButton").setEnabled(true);

                }.bind(this));
        },
        onAcceptAIProposal: function () { this._acceptProposals(); },
        onRejectAIProposal: function () { this._rejectProposals(); },
        _setProposalActions: function (showReview) {
            this.byId("aiProposalButton").setVisible(!showReview);
            this.byId("acceptAIButton").setVisible(showReview);
            this.byId("rejectAIButton").setVisible(showReview);
        },
        /**************************************************************************************************** */
        _getAIProposalInput: function () {
            var checkedfo = this.byId("fochecked").getSelected();
            var checkeddrv = this.byId("drvchecked").getSelected();


            var m = this.getView().getModel(),
                assignments = m.getProperty("/assignments") || [],
                freightOrders = m.getProperty("/freightOrders")
                    .filter(function (fo) {
                        return fo.status === "Unassigned" && !assignments.some(function (a) { return a.foId === fo.id; });
                    }),
                drivers = m.getProperty("/drivers")
                    .filter(function (driver) {
                        return driver.status === "Available";

                    }),
                selectedFO = m.getProperty("/selectedFO"),
                selectedDriver = m.getProperty("/selectedDriver");
            return {
                //freightOrders: selectedFO && selectedFO.status === "Unassigned" ? [selectedFO] : freightOrders, 
                freightOrders: checkedfo ? [selectedFO] : freightOrders,
                freightOrders,
                drivers: selectedDriver && selectedDriver.status === "Available" ? [selectedDriver] : drivers,
                assignments: assignments
            };
        },
        _requestAIProposals: function (input) {
            return fetch("config/ai-models.json").then(function (response) {
                if (!response.ok) throw new Error("Unable to load config/ai-models.json.");
                return response.json();
            }).then(function (settings) {
                var provider = settings.providers && settings.providers[settings.activeProvider],
                    providerName = settings.activeProvider;
                if (!provider)
                    return Promise.reject(new Error("No configuration found for AI provider: " + providerName));

                if (["openai", "openrouter", "huggingface"].indexOf(providerName) < 0)
                    return Promise.reject(new Error("Unsupported AI provider: " + providerName));
                if (!provider.apiKey)
                    return Promise.reject(new Error("Set the API key for " + providerName + " in config/ai-models.json first."));

                return fetch("prompts/ai-proposal.txt").then(function (response) {
                    if (!response.ok) throw new Error("Unable to load prompts/ai-proposal.txt.");
                    return response.text();
                }).then(function (systemPrompt) {
                    var userPrompt = "Unassigned Freight Orders:\n" + JSON.stringify(input.freightOrders) + "\n\nAvailable Drivers:\n" + JSON.stringify(input.drivers) + "\n\nExisting Assignments:\n" + JSON.stringify(input.assignments);

                    var requestBody = ["openai", "openrouter"].indexOf(providerName) >= 0 ? { model: provider.model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0, response_format: { type: "json_object" } } : { inputs: systemPrompt + "\n\n" + userPrompt, parameters: { temperature: 0, max_new_tokens: 1000, return_full_text: false } };
                    return fetch(provider.endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + provider.apiKey }, body: JSON.stringify(requestBody) });
                }).then(function (response) {
                    if (!response.ok)
                        return response.json()
                            .catch(function () { return {}; })
                            .then(function (body) {
                                if (response.status === 401 || response.status === 403)
                                    throw new Error("Invalid or unauthorized " + providerName + " API key. Replace it in config/ai-models.json.");
                                if (response.status === 429) throw new Error(providerName + " rate limit reached for the selected model. Wait and retry, or choose another model in config/ai-models.json.");
                                if (response.status === 503) throw new Error(providerName + " could not provide the selected model. Try again shortly or choose another model in config/ai-models.json.");
                                var providerError = body.error && (body.error.message || body.error.code) || body.message; throw new Error(providerError || providerName + " returned HTTP " + response.status + ".");
                            });
                    return response.json();
                }).then(function (body) {
                    var content = ["openai", "openrouter"].indexOf(providerName) >= 0 ? body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content : body.generated_text || (Array.isArray(body) && body[0] && body[0].generated_text);
                    if (!content) throw new Error(providerName + " returned an empty response.");
                    content = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
                    var result = JSON.parse(content), proposals = Array.isArray(result) ? result : result.proposals;
                    if (!Array.isArray(proposals)) throw new Error(providerName + " returned an invalid proposal format.");
                    var freightOrders = input.freightOrders || [],
                        drivers = input.drivers || [],
                        existingAssignments = input.assignments || [],
                        usedFreightOrders = {};

                    return proposals.filter(function (proposal) {
                        var foId = proposal && String(proposal.foId),
                            driverId = proposal && String(proposal.driverId),
                            start = Number(proposal && proposal.start),
                            end = Number(proposal && proposal.end),
                            freightOrder = freightOrders.find(function (fo) { return fo.id === foId; }),
                            driver = drivers.find(function (item) { return item.id === driverId; }),
                            overlapsExistingAssignment;

                        if (!freightOrder || !driver || usedFreightOrders[foId] || !Number.isFinite(start) || !Number.isFinite(end) || start < 6 || end > 22 || start >= end) {
                            return false;
                        }

                        overlapsExistingAssignment = existingAssignments.some(function (assignment) {
                            return assignment.driverId === driverId && start < assignment.end && end > assignment.start;
                        });
                        if (overlapsExistingAssignment) {
                            return false;
                        }

                        usedFreightOrders[foId] = true;
                        return true;
                    }).map(function (proposal) {
                        return { foId: String(proposal.foId), driverId: String(proposal.driverId), start: Number(proposal.start), end: Number(proposal.end) };
                    });
                });
            });
        },
        _acceptProposals: function () {
            var m = this.getView().getModel(), proposals = m.getProperty("/proposals") || [], fos = m.getProperty("/freightOrders"), assignments = m.getProperty("/assignments");
            proposals.forEach(function (p) {
                var fo = fos.find(function (f) { return f.id === p.foId; });
                if (fo && fo.status === "Unassigned" && !assignments.some(function (a) {
                    return a.foId === p.foId;
                })) {
                    assignments.push({ driverId: p.driverId, foId: p.foId, start: p.start, end: p.end });
                    fo.status = "Assigned";
                }
            }); m.setProperty("/proposals", []);
            this._setProposalActions(false); m.refresh(true);
            this._render(); MessageToast.show("AI assignments accepted");
        },
        _rejectProposals: function () {
            this.getView().getModel().setProperty("/proposals", []);
            this._setProposalActions(false); this._render();
            MessageToast.show("AI assignment proposal rejected");
        },
        _reviewProposal: function (proposal) {
            var m = this.getView().getModel(), fo = m.getProperty("/freightOrders")
                .find(function (item) {
                    return item.id === proposal.foId;
                }),
                driver = m.getProperty("/drivers")
                    .find(function (item) {
                        return item.id === proposal.driverId;
                    });
            MessageBox.confirm("Accept AI suggestion for " + fo.id + " and assign it to " + driver.name + "?",
                {
                    title: "AI Suggestion",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (action) {
                        if (action === MessageBox.Action.OK) this._commitProposal(proposal);
                        else this._removeProposal(proposal);
                    }.bind(this)
                });
        },
        _commitProposal: function (proposal) {
            var m = this.getView().getModel(), fo = m.getProperty("/freightOrders")
                .find(function (item) {
                    return item.id === proposal.foId;
                }),
                assignments = m.getProperty("/assignments");
            if (fo && fo.status === "Unassigned") {
                assignments.push({ driverId: proposal.driverId, foId: proposal.foId, start: proposal.start, end: proposal.end });
                fo.status = "Assigned";
            }
            this._removeProposal(proposal);
            m.refresh(true);
            MessageToast.show(proposal.foId + " assigned from AI suggestion");
        },
        _removeProposal: function (proposal) {
            var m = this.getView().getModel(), proposals = (m.getProperty("/proposals") || [])
                .filter(function (item) { return item.foId !== proposal.foId; });
            m.setProperty("/proposals", proposals);
            this._setProposalActions(proposals.length > 0);
            this._render();
        },
        //************************ END USE AI PROPOSAL ************************************************************
        onShiftEarlier: function () { this._shiftFO(-1); },
        onShiftLater: function () { this._shiftFO(1); },
        _shiftFO: function (delta) {
            var m = this.getView().getModel(),
                fo = m.getProperty("/selectedFO");
            if (!fo || fo.status !== "Unassigned") {
                MessageBox.warning("Select an unassigned freight order first.");
                return;
            }
            var newStart = fo.start + delta, newEnd = fo.end + delta;
            if (newStart < 6 || newEnd > 22) {
                MessageBox.warning("Freight orders must remain between 06:00 and 22:00.");
                return;
            }
            fo.start = newStart;
            fo.end = newEnd;
            m.refresh(true);
            this._showFO(fo); this._render();
            MessageToast.show(fo.id + " shifted to " + fo.start + ":00 - " + fo.end + ":00");
        },
        /**************************************************************************************************** */
        _buildProposals: function () {
            var oModel = this.getView().getModel();

            var aAssignments = oModel.getProperty("/assignments");
            var aFreightOrders = oModel.getProperty("/freightOrders");
            var aDrivers = oModel.getProperty("/drivers");
            var aProposals = [];

            // Get unassigned freight orders
            var aOpenFOs = aFreightOrders.filter(function (oFO) {
                return (
                    oFO.status === "Unassigned" &&
                    !aAssignments.some(function (oAssignment) {
                        return oAssignment.foId === oFO.id;
                    })
                );
            });

            // Get available drivers
            var aAvailableDrivers = aDrivers.filter(function (oDriver) {
                return oDriver.status === "Available";
            });

            // Prioritize High priority freight orders first
            aOpenFOs.sort(function (a, b) {
                if (a.priority !== b.priority) {
                    return a.priority === "High" ? -1 : 1;
                }
                return a.start - b.start;
            });

            aOpenFOs.forEach(function (oFO) {

                var aCandidates = aAvailableDrivers
                    .map(function (oDriver) {

                        var bOccupied = aAssignments
                            .concat(aProposals)
                            .some(function (oAssignment) {
                                return (
                                    oAssignment.driverId === oDriver.id &&
                                    oFO.start < oAssignment.end &&
                                    oFO.end > oAssignment.start
                                );
                            });

                        if (bOccupied) {
                            return null;
                        }

                        var iCurrentLoad =
                            aAssignments.filter(function (oAssignment) {
                                return oAssignment.driverId === oDriver.id;
                            }).length +
                            aProposals.filter(function (oProposal) {
                                return oProposal.driverId === oDriver.id;
                            }).length;

                        var iScore =
                            (oDriver.location === oFO.from ? 0 : 1) * 10 +
                            iCurrentLoad;

                        return {
                            driver: oDriver,
                            score: iScore
                        };
                    })
                    .filter(Boolean)
                    .sort(function (a, b) {
                        return a.score - b.score;
                    });

                if (aCandidates.length > 0) {
                    aProposals.push({
                        foId: oFO.id,
                        driverId: aCandidates[0].driver.id,
                        start: oFO.start,
                        end: oFO.end
                    });
                }
            });

            return aProposals;
        },

        _acceptProposals: function () {
            var oModel = this.getView().getModel();

            var aProposals = oModel.getProperty("/proposals") || [];
            var aFreightOrders = oModel.getProperty("/freightOrders");
            var aAssignments = oModel.getProperty("/assignments");
            var aDrivers = oModel.getProperty("/drivers");

            aProposals.forEach(function (oProposal) {

                var oFreightOrder = aFreightOrders.find(function (oFO) {
                    return oFO.id === oProposal.foId;
                });

                if (!oFreightOrder) {
                    return;
                }

                var oDriver = aDrivers.find(function (oDriverItem) {
                    return oDriverItem.id === oProposal.driverId;
                });

                if (!oDriver || oDriver.status !== "Available" || oFreightOrder.status !== "Unassigned") {
                    return;
                }

                var bAlreadyAssigned = aAssignments.some(function (oAssignment) {
                    return oAssignment.foId === oProposal.foId;
                });

                if (bAlreadyAssigned) {
                    return;
                }

                var bDriverOccupied = aAssignments.some(function (oAssignment) {
                    return oAssignment.driverId === oProposal.driverId && oProposal.start < oAssignment.end && oProposal.end > oAssignment.start;
                });

                if (bDriverOccupied) {
                    return;
                }

                aAssignments.push({
                    driverId: oProposal.driverId,
                    foId: oProposal.foId,
                    start: oProposal.start,
                    end: oProposal.end
                });

                oFreightOrder.status = "Assigned";
            });

            oModel.setProperty("/proposals", []);

            this._setProposalActions(false);

            oModel.refresh(true);
            this._render();

            MessageToast.show("AI assignments accepted");
        },

        _rejectProposals: function () {
            this.getView().getModel().setProperty("/proposals", []);
            this._setProposalActions(false);
            this._render(); MessageToast.show("AI assignment proposal rejected");
        },

        _reviewProposal: function (oProposal) {
            var oModel = this.getView().getModel();

            var oFreightOrder = oModel.getProperty("/freightOrders").find(function (oFO) {
                return oFO.id === oProposal.foId;
            });

            var oDriver = oModel.getProperty("/drivers").find(function (oDriverItem) {
                return oDriverItem.id === oProposal.driverId;
            });

            var sMessage =
                "Accept AI suggestion for " +
                oFreightOrder.id +
                " and assign it to " +
                oDriver.name +
                "?";

            MessageBox.confirm(sMessage, {
                title: "AI Suggestion",
                actions: [
                    MessageBox.Action.OK,
                    MessageBox.Action.CANCEL
                ],
                emphasizedAction: MessageBox.Action.OK,

                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        this._commitProposal(oProposal);
                        return;
                    }

                    this._removeProposal(oProposal);
                }.bind(this)
            });
        },
        _commitProposal: function (proposal) {
            var m = this.getView().getModel(), fo = m.getProperty("/freightOrders").find(function (item) { return item.id === proposal.foId; }), assignments = m.getProperty("/assignments");
            if (fo && fo.status === "Unassigned") {
                assignments.push({ driverId: proposal.driverId, foId: proposal.foId, start: proposal.start, end: proposal.end });
                fo.status = "Assigned";
            }
            this._removeProposal(proposal); m.refresh(true); MessageToast.show(proposal.foId + " assigned from AI suggestion");
        },
        _removeProposal: function (proposal) {
            var m = this.getView().getModel(), proposals = (m.getProperty("/proposals") || []).filter(function (item) { return item.foId !== proposal.foId; }); m.setProperty("/proposals", proposals);
            this._setProposalActions(proposals.length > 0);
            this._render();
        },
        /**************************************************************************************************** */
        onAssign: function () {
            var m = this.getView().getModel(),
                fo = m.getProperty("/selectedFO"),
                did = this.byId("driverSelect").getSelectedKey();

            if (fo && did)
                this._assign(fo, did);
            else MessageBox.warning("Select a freight order and driver.");
        },

        _assign: function (fo, did) {
            var m = this.getView().getModel(),
                as = m.getProperty("/assignments"),

                driver = m.getProperty("/drivers")
                    .find(d => d.id === did);

                //  vehassn = m.getProperty("/Vehassignments")
                //     .find(v => v.vehid === vid),
                // veh = m.getProperty("/vehicles")
                //     .find(v => v.vehid === vid);

           

            // //var a = this._assignFO(fo.id, driver.id, fo.id);
            // if (a)
            //     return;

            // if (!veh || veh.license != "Valid" ) {
            //     MessageBox.error(veh ? veh.vehid + " is not available for assignment." : "Select an available Vehicle.");
            //     return;
            // }

            if (!driver || driver.status !== "Available") {
                MessageBox.error(driver ? driver.name + " is not available for assignment." : "Select an available driver.");
                return;
            }
            if (!fo || fo.status !== "Unassigned") {
                MessageBox.error("Only unassigned freight orders can be assigned.");
                return;
            }
            var conflict = as.some(a => a.driverId === did && fo.start < a.end && fo.end > a.start);

            if (conflict) {
                MessageBox.error(driver.name + " is occupied during " + fo.start + ":00 - " + fo.end + ":00.");
                return;
            }
            MessageBox.confirm("Assign " + fo.id + " to " + driver.name + " for " + fo.start + ":00 - " + fo.end + ":00?",
                {
                    title: "Confirm Driver Assignment", onClose: function (a) {
                        if (a !== MessageBox.Action.OK) return;
                        as.push({ driverId: did, foId: fo.id, start: fo.start, end: fo.end });
                        fo.status = "Assigned"; m.refresh(true);
                        MessageToast.show(fo.id + " assigned to " + driver.name);
                        this._render();
                    }.bind(this)
                });
        },
        _confirmUnassign: function (sFoId) {
            var m = this.getView().getModel();
            var assignments = m.getProperty("/assignments");
            var assignmentIndex = assignments.findIndex(function (assignment) {
                return assignment.foId === sFoId;
            });
            if (assignmentIndex === -1) return;

            var assignment = assignments[assignmentIndex];
            var fo = m.getProperty("/freightOrders").find(function (order) {
                return order.id === sFoId;
            });
            var driver = m.getProperty("/drivers").find(function (item) {
                return item.id === assignment.driverId;
            });
            if (!fo) return;

            MessageBox.confirm(
                "Unassign " + fo.id + " from " + (driver ? driver.name : assignment.driverId) + "? The freight order will return to the unassigned list.",
                {
                    title: "Confirm Unassignment",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function (action) {
                        if (action !== MessageBox.Action.OK) return;
                        assignments.splice(assignmentIndex, 1);
                        fo.status = "Unassigned";
                        m.refresh(true);
                        this._showFO(fo);
                        this.byId("driverSelect").setSelectedKey("");
                        MessageToast.show(fo.id + " unassigned successfully");
                        this._render();
                    }.bind(this)
                }
            );
        },
        _showFO: function (fo) {
            var m = this.getView().getModel();
            m.setProperty("/selectedFO", fo);
            this.byId("foTitle").setText(fo.id);
            this.byId("foStatus").setText(fo.status); this.byId("foStatus").setState(fo.priority === "High" ? "Error" : "Success");
            this.byId("foRoute").setText("Route: " + fo.from + " → " + fo.to); this.byId("foTime").setText("Planned Time: " + fo.start + ":00 - " + fo.end + ":00");
            this.byId("foDistance").setText("Distance: " + fo.distance);
            this.byId("foCarrier").setText("Carrier: " + fo.carrier);
            this.byId("foPriority").setText("Priority: " + fo.priority);
            this.byId("foMode").setText("Mode: " + fo.mode);
            this.byId("foWeight").setText("Weight: " + fo.weight);
        },
        _empty: function () {
            return "<div class='ganttCells'>" + Array.from({ length: 16 }, () => "<div class='gridLine'></div>").join("") + "</div>";
        },
        _bar: function (s, e, c, t) {
            return "<div class='ganttBar " + c + "' style='left:" + ((s - 6) / 16 * 100) + "%;width:" + ((e - s) / 16 * 100) + "%'>" + t + "</div>";
        },
        _occupiedBar: function (s, e, sFoId) {
            return "<div class='ganttBar occupiedBar' data-fo-id='" + sFoId + "' style='left:" + ((s - 6) / 16 * 100) + "%;width:" + ((e - s) / 16 * 100) + "%'>" +
                "<span>" + sFoId + "</span><button type='button' class='unassignButton' title='Unassign freight order " + sFoId + "' aria-label='Unassign freight order " + sFoId + "'>&#10005;</button></div>";
        },
        _vehicleOccupiedBar: function (
            sStart, sEnd, sFoId, sDriverId
        ) {
            return `
            <div
                class="ganttBar vehicleOccupiedBar"
                data-fo-id="${sFoId}"
                data-driver-id="${sDriverId}"
                draggable="true"
                    style="
                        left:${((sStart - 6) / 16 * 100)}%;
                        width:${((sEnd - sStart) / 16 * 100)}%;
                    "
                    title="FO: ${sFoId} | Driver: ${sDriverId}">
                <span>${sFoId}</span></div>`;
        },

        onVehicleSelect: function (oEvent) {
            var sVehicleId = oEvent.currentTarget.dataset.vehicle;
            var oModel = this.getView().getModel();
            var aVehicles = oModel.getProperty("/vehicles") || [];
            var oVehicle = aVehicles.find(function (oVehicle) {
                return oVehicle.vehid === sVehicleId;
            });
            if (!oVehicle) {
                return;
            }
            this._showVehicle(oVehicle);
        },
        _showVehicle: function (oVehicle) {

            var oModel = this.getView().getModel();
            oModel.setProperty("/selectedVehicle", oVehicle);
            var aVehicleAssignments = oModel.getProperty("/Vehassignments") || [];
            var aAssignments = aVehicleAssignments.filter(function (oAssignment) {
                return oAssignment.vehid === oVehicle.vehid;
            });

            // Vehicle title
            this.byId("foTitle").setText("Vehicle " + oVehicle.vehid);
            // Status
            this.byId("foStatus").setText(oVehicle.license === "Valid" ? "Available" : "License Invalid");

            this.byId("foStatus").setState(oVehicle.license === "Valid" ? "Success" : "Error");
            // Vehicle information
            this.byId("foRoute").setText("Vehicle Number: " + oVehicle.vehicle);

            this.byId("foTime").setText("Vehicle Type: " + oVehicle.type);

            this.byId("foDistance").setText("Vehicle ID: " + oVehicle.vehid);

            this.byId("foCarrier").setText("License Status: " + oVehicle.license);

            this.byId("foPriority").setText("Total Assignments: " + aAssignments.length);

            if (aAssignments.length > 0) {
                var sAssignments = aAssignments.map(function (oAssignment) {
                    return (
                        oAssignment.foId + " | Driver: " + oAssignment.driverId + " | " + this._formatTime(oAssignment.start) + " - " + this._formatTime(oAssignment.end));
                }.bind(this)).join(" ; ");

                this.byId("foMode").setText("Assignments: " + sAssignments);
            } else {
                this.byId("foMode").setText("Assignments: None");
            }

            this.byId("foWeight").setText("Vehicle Status: " + (aAssignments.length > 0 ? "Assigned" : "Available"));
        },
        /*
         * Returns true when a vehicle has a scheduling conflict
         * with the supplied time range.
         */
        _isVehicleOccupied: function (sVehicleId, fStart, fEnd, sIgnoreFoId) {

            var oModel = this.getView().getModel();
            var aAssignments = oModel.getProperty("/Vehassignments") || [];
            return aAssignments.some(function (oAssignment) {
                if (oAssignment.vehid !== sVehicleId) {
                    return false;
                }
                if (sIgnoreFoId && oAssignment.foId === sIgnoreFoId) {
                    return false;
                }
                return (
                    Number(fStart) < Number(oAssignment.end) && Number(fEnd) > Number(oAssignment.start)
                );
            });
        },

        /*
         * Creates/updates a vehicle assignment after validating
         * vehicle availability.
         */
        _assignVehicle: function (oVehicle, oFO, sDriverId) {
            // Always use the controller's context
            var oController = this;
            if (!oVehicle || !oFO || !sDriverId) {
                MessageBox.warning("Please select a Freight Order, Driver and Vehicle.");
                return false;
            }

            // Validate vehicle license
            if (oVehicle.license !== "Valid") {
                MessageBox.error(oVehicle.vehid + " cannot be assigned because its license is not valid.");
                return false;
            }

            // Validate Freight Order
            if (oFO.status !== "Unassigned") {
                MessageBox.error(oFO.id + " is already assigned.");
                return false;
            }

            // Check vehicle time conflict
            if (
                oController._isVehicleOccupied(oVehicle.vehid, oFO.start, oFO.end, oFO.id)) {
                MessageBox.error(oVehicle.vehid + " is already occupied between " + oController._formatTime(oFO.start) + " and " + oController._formatTime(oFO.end) + ".");
                return false;
            }

            var oModel = oController.getView().getModel();
            var aAssignments = oModel.getProperty("/Vehassignments") || [];

            // Create new vehicle assignment
            aAssignments.push({
                vehid: oVehicle.vehid,
                driverId: sDriverId,
                foId: oFO.id,
                start: Number(oFO.start),
                end: Number(oFO.end)
            });
            // Update model
            oModel.setProperty("/Vehassignments", aAssignments);
            // Refresh UI
            oModel.refresh(true);
            // Re-render Gantt
            oController._render();
            MessageToast.show(oFO.id + " assigned to " + oVehicle.vehid);

            return true;
        },

        _formatTime: function (fHour) {
            var iHours = Math.floor(fHour);
            var iMinutes = Math.round((fHour - iHours) * 60);
            return (String(iHours).padStart(2, "0") + ":" + String(iMinutes).padStart(2, "0"));
        },
        _header: function (label, sSortTarget) {
            var sSortLabel = sSortTarget === "freightOrders" ? "planned start time" : "driver ID";
            return "<div class='ganttHeader'><div class='rowLabel ganttHeaderLabel'><h3>" + label + "</h3>" +
                "<div class='sortActions' aria-label='Sort " + label + " by " + sSortLabel + "'>" +
                "<button type='button' class='sortButton' data-sort-target='" + sSortTarget + "' data-sort-direction='asc' title='Sort " + label + " ascending by " + sSortLabel + "' aria-label='Sort " + label + " ascending'>" +
                "<svg viewBox='0 0 16 16' aria-hidden='true'><path d='M8 2l4 5H9v7H7V7H4z'/></svg></button>" +
                "<button type='button' class='sortButton' data-sort-target='" + sSortTarget + "' data-sort-direction='desc' title='Sort " + label + " descending by " + sSortLabel + "' aria-label='Sort " + label + " descending'>" +
                "<svg viewBox='0 0 16 16' aria-hidden='true'><path d='M8 14l-4-5h3V2h2v7h3z'/></svg></button></div></div><div class='timeGrid'>" + Array.from({ length: 16 }, (_, i) => "<div class='timeCell'>" + String(i + 6).padStart(2, "0") +
                    ":00" + (i === 15 ? " - 22:00" : "") + "</div>").join("") + "</div></div>";
        },
        _wireSortButtons: function (oHost) {
            oHost.querySelectorAll(".sortButton").forEach(function (oButton) {
                oButton.addEventListener("click", function () {
                    var bAscending = oButton.dataset.sortDirection === "asc";
                    if (oButton.dataset.sortTarget === "freightOrders") {
                        this._onSortFO(bAscending);
                    } else {
                        this._onSortDrivers(bAscending);
                    }
                }.bind(this));
            }.bind(this));
        },

        _render: function () {
            var oController = this;
            var m = oController.getView().getModel(); if (!m) return; setTimeout(function () {
                var fos = m.getProperty("/freightOrders"),
                    ds = m.getProperty("/drivers"),
                    as = m.getProperty("/assignments"),
                    veh = m.getProperty("/vehicles"),
                    ps = m.getProperty("/proposals"),
                    vehass = m.getProperty("/Vehassignments")

                        || [];

                var fh = document.getElementById("foGantt"),
                    vh = document.getElementById("vehicleGantt"),
                    dh = document.getElementById("driverGantt");


                var aUnassignedFOs = fos.filter(function (oFO) {
                    return oFO.status === "Unassigned";
                });

                var aUnassignedVeh = veh.filter(function (oVEH) {
                    return oVEH.license === "Valid";
                })

                var sRows = aUnassignedFOs.map(function (oFO) {
                    var sAssignmentIcon = this._getFOAssignmentIcon(oFO.id);

                    return `
                        <div id="foTooltip" class="foTooltip"></div>
                        <div class="ganttRow foRow" data-fo="${oFO.id}">
                            <div class="rowLabel">                                                                  
                                <div class="foDetails">
                                    <input type="checkBox" checked id="fochecked"/>                                                                        
                                    <span class="foTitleRow"><b>${sAssignmentIcon}${oFO.id}</b></span>                                                   
                                    <span> ${oFO.route || ""}</span>
                                </div>
                            </div>           
                            <div class="timeGrid" >
                                ${this._empty()}                                
                                ${this._bar(oFO.start, oFO.end, "foBar", `${this._formatTime(oFO.start)} - ${this._formatTime(oFO.end)}`)}
                                
                             </div>
                        </div>`;
                }.bind(this)).join("");

                fh.innerHTML = this._header("Freight Orders", "freightOrders") + sRows;
                this._wireSortButtons(fh);
                /**************************************************************************************************** */

                var sDriverRows = ds.map(function (oDriver) {
                    var iCurrentHour = 6;
                    var sRow = `
                        <div class="ganttRow driverRow"  data-driver="${oDriver.id}">
                            <div class="rowLabel">     
                             <input type="checkBox" checked id="drvchecked"/>                                   
                                <b>${oDriver.name}</b>
                                <span style="font-size:8px;">(${oDriver.id})</span>
                            </div>
                             ${this._empty()}
                            <div class="timeGrid">`;
                    // Driver unavailable
                    if (oDriver.status !== "Available") {
                        sRow += this._bar(6, 22, "breakBar", "On Break");
                        return sRow + `</div></div>`;
                    }

                    // Driver assignments
                    var aAssignments = as
                        .filter(function (oAssignment) {
                            return oAssignment.driverId === oDriver.id;
                        })
                        .sort(function (a, b) {
                            return a.start - b.start;
                        });

                    aAssignments.forEach(function (oAssignment) {
                        if (iCurrentHour < oAssignment.start) {
                            sRow += this._bar(iCurrentHour, oAssignment.start, "availableBar", "Available");
                        }
                        sRow += this._occupiedBar(oAssignment.start, oAssignment.end, oAssignment.foId);
                        iCurrentHour = oAssignment.end;

                    }.bind(this));

                    ps.filter(function (proposal) {
                        return proposal.driverId === oDriver.id;
                    }).forEach(function (proposal) {
                        sRow += this._bar(proposal.start, proposal.end, "aiSuggestionBar", "AI Suggestion: " + proposal.foId)
                            .replace("<div ", "<div data-proposal-fo='" + proposal.foId + "' ");
                    }.bind(this));

                    // Remaining available time
                    if (iCurrentHour < 22) {
                        sRow += this._bar(
                            iCurrentHour,
                            22,
                            "availableBar",
                            "Available"
                        );
                    }
                    return sRow + `</div></div>`;
                }.bind(this)).join("");

                dh.innerHTML = this._header("Drivers", "drivers") + sDriverRows;
                this._wireSortButtons(dh);

                /**************************************************************************************************** */

                var sVRows = aUnassignedVeh.map(function (oVEH) {
                    var aVehicleAssignments = vehass.filter(function (oAssignment) {
                        return oAssignment.vehid === oVEH.vehid;
                    });

                    var sVehicleBars = "";
                    var iCurrentHour = 6;

                    // Sort vehicle assignments by start time
                    aVehicleAssignments.sort(function (a, b) {
                        return a.start - b.start;
                    });

                    aVehicleAssignments.forEach(function (oAssignment) {

                        // Available time before assignment
                        if (iCurrentHour < oAssignment.start) {
                            sVehicleBars += this._bar(iCurrentHour,oAssignment.start,"availableBar","Available");
                        }
                        // Vehicle assignment
                        sVehicleBars += this._vehicleOccupiedBar(oAssignment.start, oAssignment.end, oAssignment.foId, oAssignment.driverId);
                        iCurrentHour = oAssignment.end;
                    }.bind(this));

                    // Remaining available time
                    if (iCurrentHour < 22) {
                        sVehicleBars += this._bar(iCurrentHour, 22, "availableBar", "Available");
                    }
                    return `
                        <div class="ganttRow vehRow" data-vehicle="${oVEH.vehid}">
                            <div class="rowLabel">
                                <div class="foDetails">
                                    <b>${oVEH.vehid}</b>
                                    <span style="font-size:9px;">
                                        (${oVEH.vehicle})
                                    </span>                                                                        
                                </div>
                            </div>
                            <div class="timeGrid">
                                ${this._empty()}
                                ${sVehicleBars}
                            </div>
                        </div>`;
                }.bind(this)).join("");
                vh.innerHTML = this._header("Vehicles") + sVRows;
                /**************************************************************************************************** */
                /* Vehicle row selection */
                vh.querySelectorAll(".vehRow").forEach(function (oRow) {

                    oRow.addEventListener("click", function (oEvent) {
                        oEvent.stopPropagation();
                        var sVehicleId = oRow.dataset.vehicle;
                        var oModel = oController.getView().getModel();
                        var oVehicle = (oModel.getProperty("/vehicles") || [])
                            .find(function (oItem) {
                                return oItem.vehid === sVehicleId;
                            });
                        if (oVehicle) {
                            oController._showVehicle(oVehicle);
                        }
                    });

                });
                /* Vehicle assignment-bar click*/
                vh.querySelectorAll(".vehicleOccupiedBar").forEach(function (oBar) {

                    oBar.addEventListener("click", function () {
                        var sVehicleId = oBar.closest(".vehRow").dataset.vehicle;
                        var sFoId = oBar.dataset.foId;
                        var oVehicle = oController.getView().getModel()
                            .getProperty("/vehicles")
                            .find(function (oItem) {
                                return oItem.vehid === sVehicleId;
                            });
                        if (oVehicle) {
                            oController._showVehicle(oVehicle, sFoId);
                        }
                    });
                });


                this._wireDrag(fh, dh, vh);
                this._wireResize();
                this._wireScroll(fh, dh);
            }.bind(this), 0);
        },
        _wireScroll: function (fh, dh) {
            if (!fh || !dh) return;
            if (fh._ganttScrollHandler) fh.removeEventListener("scroll", fh._ganttScrollHandler);
            if (dh._ganttScrollHandler) dh.removeEventListener("scroll", dh._ganttScrollHandler);
            var syncing = false;
            fh._ganttScrollHandler = function () {
                if (syncing) return; syncing = true; dh.scrollLeft = fh.scrollLeft; syncing = false;
            };
            dh._ganttScrollHandler = function () {
                if (syncing) return;
                syncing = true; fh.scrollLeft = dh.scrollLeft; syncing = false;
            };
            fh.addEventListener("scroll", fh._ganttScrollHandler);
            dh.addEventListener("scroll", dh._ganttScrollHandler);
        },

        _confirmFOShift: function (fo, delta) {
            var newStart = fo.start + delta, newEnd = fo.end + delta;
            if (newStart < 6 || newEnd > 22) {
                MessageBox.warning("Freight orders must remain between 06:00 and 22:00.");
                return;
            }
            MessageBox.confirm("Change " + fo.id + " to " + newStart + ":00 - " + newEnd + ":00?",
                {
                    title: "Confirm Freight Order Time Change",
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL], emphasizedAction: MessageBox.Action.OK,
                    onClose: function (action) {
                        if (action === MessageBox.Action.OK) {
                            fo.start = newStart;
                            fo.end = newEnd;
                            var m = this.getView().getModel(); m.refresh(true);
                            this._showFO(fo);
                            this._render();
                            MessageToast.show(fo.id + " shifted to " + fo.start + ":00 - " + fo.end + ":00");
                        }
                    }.bind(this)
                });
        },

        _wireDrag: function (fh, dh, veh) {
            if (!fh || !dh || !veh) return;

            var timelineStartHour = 6;
            var timelineEndHour = 22;
            var timelineSlotCount = timelineEndHour - timelineStartHour;

            fh.querySelectorAll(".foBar").forEach(function (bar) {
                bar.draggable = true;
                bar.addEventListener("mouseenter", e => {
                    this.showTooltip = true;
                    var id = bar.closest(".foRow").dataset.fo;
                    var fo = this.getView().getModel().getProperty("/freightOrders")
                        .find(function (order) {
                            return order.id === id;
                        });

                    const tooltip = document.getElementById("foTooltip");
                    tooltip.innerHTML = `
                        <span class='title'><b> ${fo.id}</b></span><br>
                        From: -${fo.from} → ${fo.to}<br>
                        To: ${fo.distance}<br>
                        Carrier: ${fo.carrier} <br>
                        Mode:  ${fo.mode} <br>
                        Weight: ${fo.weight} <br>                        
                        Start: ${this._formatTime(fo.start)} -
                        End: ${this._formatTime(fo.end)} <br>
                        Duration:- ${fo.duration}
                    `;
                    tooltip.style.display = "block";
                });

                bar.addEventListener("mousemove", e => {
                    const tooltip = document.getElementById("foTooltip");
                    tooltip.style.left = (e.clientX + 10) + "px";
                    tooltip.style.top = (e.clientY + 10) + "px";
                });

                bar.addEventListener("mouseleave", () => {
                    document.getElementById("foTooltip").style.display = "none";
                });

                bar.addEventListener("click", function () {
                    var id = bar.closest(".foRow").dataset.fo;
                    var fo = this.getView().getModel().getProperty("/freightOrders")
                        .find(function (order) { return order.id === id; });
                    if (fo)
                        this._showFO(fo);
                }.bind(this));

                bar.addEventListener("dragstart", function (event) {
                    event.dataTransfer.setData("text/plain", bar.closest(".foRow").dataset.fo);
                    event.dataTransfer.effectAllowed = "move";
                    bar.classList.add("dropTarget");
                });
                bar.addEventListener("dragend", function () {
                    bar.classList.remove("dropTarget", "sameRow");
                });
            }.bind(this));

            fh.querySelectorAll(".foRow .timeGrid").forEach(function (grid) {
                grid.addEventListener("dragover", function (event) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    grid.classList.add("dropTarget");
                });

                grid.addEventListener("dragleave", function (event) {
                    if (!grid.contains(event.relatedTarget)) {
                        grid.classList.remove("dropTarget");
                    }
                });

                grid.addEventListener("drop", function (event) {
                    event.preventDefault();
                    grid.classList.remove("dropTarget");

                    var foId = event.dataTransfer.getData("text/plain");
                    var model = this.getView().getModel();
                    var fo = model.getProperty("/freightOrders")
                        .find(function (order) { return order.id === foId; });
                    if (!fo) return;

                    var duration = fo.end - fo.start;
                    var gridRect = grid.getBoundingClientRect();
                    var gridLines = Array.from(grid.querySelectorAll(".gridLine"));

                    var slotIndex = gridLines.findIndex(function (line) {
                        var lineRect = line.getBoundingClientRect();
                        return event.clientX >= lineRect.left && event.clientX < lineRect.right;
                    });
                    if (slotIndex === -1) {
                        slotIndex = event.clientX >= gridRect.right ? timelineSlotCount - 1 : 0;
                    }

                    var newStart = timelineStartHour + slotIndex;

                    newStart = Math.max(timelineStartHour, Math.min(newStart, timelineEndHour - duration));
                    var newEnd = newStart + duration;
                    var oldTime = this._formatTime(fo.start) + " - " + this._formatTime(fo.end);
                    var newTime = this._formatTime(newStart) + " - " + this._formatTime(newEnd);

                    MessageBox.confirm(
                        "Change the time slot for " + fo.id + " from " + oldTime + " to " + newTime + "?",
                        {
                            title: "Confirm Time Slot Change",
                            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                            onClose: function (action) {
                                if (action !== MessageBox.Action.OK) return;
                                fo.start = newStart;
                                fo.end = newEnd;
                                model.refresh(true);
                                this._showFO(fo);
                                this._render();
                                MessageBox.success("Time slot for " + fo.id + " was changed to " + newTime + ".", {
                                    title: "Time Slot Updated"
                                });
                            }.bind(this)
                        }
                    );
                }.bind(this));
            }.bind(this));

            dh.querySelectorAll(".aiSuggestionBar").forEach(function (bar) {
                bar.addEventListener("click", function () {
                    var driverId = bar.closest(".driverRow").dataset.driver,
                        proposalFoId = bar.dataset.proposalFo,
                        proposal = this.getView()
                            .getModel()
                            .getProperty("/proposals")
                            .find(function (item) {
                                return item.driverId === driverId && item.foId === proposalFoId;
                            });
                    if (proposal)
                        this._reviewProposal(proposal);
                }
                    .bind(this));
            });

            dh.querySelectorAll(".driverRow").forEach(r => {
                r.addEventListener("dragover", e => {
                    e.preventDefault();
                    r.classList.add("dropTarget");
                });

                r.addEventListener("dragleave", () => r.classList.remove("dropTarget"));

                r.addEventListener("drop", e => {
                    e.preventDefault();
                    r.classList.remove("dropTarget");
                    var id = e.dataTransfer.getData("text/plain"),
                        fo = this.getView()
                            .getModel()
                            .getProperty("/freightOrders")
                            .find(x => x.id === id);

                    if (fo) {
                        this._showFO(fo);
                        this.byId("driverSelect").setSelectedKey(r.dataset.driver);
                        this._assign(fo, r.dataset.driver);
                    }
                });
            });

            veh.querySelectorAll(".vehRow").forEach(v => {

                v.addEventListener("dragover", e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    v.classList.add("dropTarget");
                });

                v.addEventListener("dragleave", e => {

                    if (!v.contains(e.relatedTarget)) {
                        v.classList.remove("dropTarget");
                    }
                });

                v.addEventListener("drop", e => {
                    e.preventDefault();
                    e.stopPropagation();
                    v.classList.remove("dropTarget");
                    var oModel =  this.getView().getModel();

                    var foid = e.dataTransfer.getData("text/plain"),
                        fo = oModel
                            .getProperty("/freightOrders")
                            .find(x => x.id === foid);

                    if (fo) {
                        this._showFO(fo);

                        var sVehicleId = v.dataset.vehicle;
                        if (!sVehicleId) {
                            MessageBox.error("Vehicle could not be identified.");
                            return;
                        }

                        // -----------------------------------------------------
                        // 5. Get Vehicle object
                        // -----------------------------------------------------
                        var oVehicle = (oModel.getProperty("/vehicles") || [])
                            .find(function (oItem) {
                                return oItem.vehid === sVehicleId;
                            });

                        if (!oVehicle) {
                            MessageBox.error("Vehicle " + sVehicleId + " was not found.");
                            return;
                        }

                        var sDriverId = this.byId("driverSelect").setSelectedKey(v.dataset.driver)

                        var bAssigned = this._assignVehicle(oVehicle, fo, sDriverId);

                        if (bAssigned) {
                            //MessageToast.show(fo.id + " assigned to Driver " + sDriverId + " and Vehicle " + sVehicleId);
                            MessageToast.show(fo.id + " assigned to Vehicle " + sVehicleId);
                        }                        
                        this._assign(fo, sDriverId);
                    }
                });
            });

            dh.querySelectorAll(".occupiedBar").forEach(b => {
                b.draggable = false;
                b.addEventListener("mouseover", () => {
                    var id = b.dataset.foId;
                    var fo = this.getView().getModel().getProperty("/freightOrders").find(function (order) {
                        return order.id === id;
                    });
                    if (fo) this._showFO(fo);
                });
                b.addEventListener("dragstart", e => {
                    e.dataTransfer.setData("text/plain", b.dataset.foId);
                    e.dataTransfer.effectAllowed = "move";
                });
            });

            dh.querySelectorAll(".unassignButton").forEach(function (button) {
                button.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    this._confirmUnassign(button.closest(".occupiedBar").dataset.foId);
                }.bind(this));
                button.addEventListener("dragstart", function (event) {
                    event.preventDefault();
                });
            }.bind(this));
        },

        onDateChange: function () {
            this._setDateValue();
        },

        /*********************FO TO VEHICLES************************** */

        _getFOAssignmentStatus: function (sFOId) {

            var oModel = this.getView().getModel();
            var aAssignments = oModel.getProperty("/Vehassignments") || [];

            var aFOAssignments = aAssignments.filter(function (oAssignment) {
                return oAssignment.foId === sFOId;
            });
            var oAssignment = aFOAssignments[0];
            if (!oAssignment) {
                return {
                    assigned: false,
                    driverAssigned: false,
                    vehicleAssigned: false,
                    driverId: null,
                    vehicleId: null,
                    status: "Not Assigned"
                };
            }
            var bDriverAssigned = !!oAssignment.driverId;
            var bVehicleAssigned = !!oAssignment.vehid;

            return {
                assigned: bDriverAssigned && bVehicleAssigned,
                driverAssigned: bDriverAssigned,
                vehicleAssigned: bVehicleAssigned,
                driverId: oAssignment.driverId || null,
                vehicleId: oAssignment.vehid || null,
                status: bDriverAssigned && bVehicleAssigned ? "Assigned" : "Not Assigned"
            };
        },

        _getFOAssignmentIcon: function (sFOId) {

            var oStatus = this._getFOAssignmentStatus(sFOId);
            if (oStatus.driverAssigned && oStatus.vehicleAssigned) {
                return `
                    <span
                        class="foAssignmentStatus assigned"
                        title="Driver and Vehicle assigned">
                        &#xe05b;
                    </span>`;
            }
            if (oStatus.driverAssigned) {
                return `
                <span
                    class="foAssignmentStatus partial"
                    title="Driver assigned, Vehicle not assigned">
                    &#xe089;
                </span>`;
            }

            return `
                <span
                    class="foAssignmentStatus notAssigned"
                    title="Driver and Vehicle not assigned">
                    &#xe0b1;
                </span>`;
        },

        _assignFOToVehicle: function (sFOId, sVehicleId, sDriverId) {
            var oModel = this.getView().getModel();
            var aFOs = oModel.getProperty("/freightOrders") || [];
            var aDrivers = oModel.getProperty("/drivers") || [];
            var aVehicles = oModel.getProperty("/vehicles") || [];
            var aAssignments = oModel.getProperty("/Vehassignments") || [];

            var oFO = aFOs.find(function (oItem) {
                return oItem.id === sFOId;
            });

            var oVehicle = aVehicles.find(function (oItem) {
                return oItem.vehid === sVehicleId;
            });
            var oDriver = aDrivers.find(function (oItem) {
                return oItem.id === sDriverId;
            });
            if (!oFO) {
                MessageBox.error("Freight Order " + sFOId + "was not found.");
                return false;
            }
            if (!oDriver) {
                MessageBox.error("Driver not found.");
                return false;
            }
            if (!oVehicle) {
                MessageBox.error("Vehicle " + sVehicleId + " was not found.");
                return false;
            }
            /*
             * Vehicle license validation
             */
            if (oVehicle.license !== "Valid") {

                MessageBox.error("Vehicle " + sVehicleId + " cannot be assigned because the license is invalid.");
                return false;
            }
            /*
             * Vehicle scheduling conflict
             */
            if (this._isVehicleOccupied(sVehicleId, oFO.start, oFO.end, sFOId)) {
                MessageBox.error("Vehicle " + sVehicleId + " is already assigned during " + this._formatTime(oFO.start) + " - " + this._formatTime(oFO.end));
                return false;
            }
            /*
             * Find existing FO assignment
             */
            var oExisting = aAssignments.find(function (oAssignment) {
                return oAssignment.foId === sFOId;
            });

            if (oExisting) {
                /*
                 * Update existing assignment
                 */
                oExisting.vehid = sVehicleId;
                oExisting.driverId = sDriverId || oExisting.driverId;
                oExisting.start = oFO.start;
                oExisting.end = oFO.end;
            } else {
                /*
                 * Create new assignment
                 */
                aAssignments.push({
                    foId: sFOId,
                    driverId: sDriverId || null,
                    vehid: sVehicleId,
                    start: oFO.start,
                    end: oFO.end
                });
            }
            /*
             * Update model
             */
            oModel.setProperty("/Vehassignments", aAssignments);
            /*
             * Update FO status
             */
            oFO.status = "Assigned";
            oModel.refresh(true);
            /*
             * Re-render Gantt
             */
            this._render();
            MessageToast.show(sFOId + " assigned to Driver " + sDriverId + " and Vehicle " + sVehicleId);
            return true;
        },

        _assignFO: function (sFOId, sDriverId, sVehicleId) {

            if (!sDriverId) {
                MessageBox.warning("Please assign a Driver first.");
                return false;
            }

            if (!sVehicleId) {
                MessageBox.warning("Please assign a Vehicle.");
                return false;
            }
            return this._assignFOToVehicle(sFOId, sVehicleId, sDriverId);
        },

        _getFOAssignmentIndicators: function (sFOId) {
            var oStatus = this._getFOAssignmentStatus(sFOId);
            return `<span
            class="foAssignmentIndicator
                   ${oStatus.driverAssigned
                    ? "indicatorAssigned"
                    : "indicatorMissing"}"
            title="${oStatus.driverAssigned
                    ? "Driver assigned"
                    : "Driver not assigned"
                }">
            👤
        </span>

        <span
            class="foAssignmentIndicator
                   ${oStatus.vehicleAssigned
                    ? "indicatorAssigned"
                    : "indicatorMissing"}"
            title="${oStatus.vehicleAssigned
                    ? "Vehicle assigned"
                    : "Vehicle not assigned"
                }">
            🚚
        </span> `;
        },
  });
});