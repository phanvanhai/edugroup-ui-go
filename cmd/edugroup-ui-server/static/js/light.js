$(document).ready(function () {
    //init loading data.
    $.ajaxSetup({
        cache: false,//prevent browser cache result to redirect  failed.
        headers: { "X-Session-Token": window.sessionStorage.getItem("X_Session_Token") },
        statusCode: {
            302: function () {
                console.log("Lỗi xác thực!");
                window.location.href = '/login.html?ran=' + Math.random(); //prevent browser cache result to redirect  failed.
            },
            403: function () {
                console.log("Lỗi xác thực!");
                window.location.href = '/login.html?ran=' + Math.random(); //prevent browser cache result to redirect  failed.
            }
        }
    });
    lightApp.loadDevice();
});

lightApp = (function () {
    "use strict";

    function Light() {
        this.Profile = "Water-Device-Profile";
        this.DeviceService = "device-mqtt";
        this.MapCommand = {
            GetAll: "all",
            Bom: "bom",
            Vantu: "vantu",
            RelayAC: "relayAC",
            Relay1: "relay1",
            Relay2: "relay2",
            BomVantu: "bom-vantu",
            BomRelay1: "bom-relay1"
        };
        this.MapResource = {
            WaterVolume1: "water_v1",
            WaterVolume2: "water_v2",
            WaterFlow1: "water_f1",
            WaterFlow2: "water_f2",
            WaterFlow3: "water_f3",
            WaterFlow4: "water_f4",
            WaterFlow5: "water_f5",
            Tds1: "tds1",
            Tds2: "tds2",
            Tds3: "tds3",
            Tds4: "tds4",
            PowerKw: "power_kw",
            PowerKwh: "power_kwh",
            PowerU: "power_u",
            PowerI: "power_i",
            Apcao1: "apcao1",
            Apcao2: "apcao2",
            Apthap: "apthap",
            Bom: "bom",
            Vantu: "vantu",
            RelayAC: "relayAC",
            Relay1: "relay1",
            Relay2: "relay2"
        };
        this.currentSelectDevice = "";
        this.currentProtocols = null;
        this.currentDescription = "";
        this.monitorTimer = null;
        this.intervalMonitor = 10000;

        this.currentRelayACState = true;
        this.currentRelayXaState = false;
    }

    Light.prototype = {
        constructor: Light,

        // Device
        loadDevice: null,
        renderDevice: null,
        editDevice: null,
        addDevice: null,
        cancelAddOrUpdateDevice: null,
        uploadDevice: null,
        deleteDevice: null,

        // Command
        gotoCommand: null,
        cancelCommand: null,

        // monitor
        monitor_get_data: null,
        renderData: null,

        command_onoff_relayAC: null,
        command_onoff_bom_relay1: null,
    }

    var light = new Light();
    // Device start  -----------------------------------------
    Light.prototype.loadDevice = function () {
        // for admin
        var url = '/core-metadata/api/v2/device/profile/name/' + light.Profile;
        // for user
        // var userId = window.sessionStorage.getItem("id");
        // var url = '/core-metadata/api/v2/device/all?labels=' + userId;
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                light.renderDevice(data.devices);
            },
            statusCode: {},
            error: function (xhr, status, error) {
                console.log(error + '\n' + xhr.responseText);
            }
        });
    }

    Light.prototype.renderDevice = function (devices) {
        $('#light-command-main').hide();
        $('#light-device-list').show();

        $("#light-device-list-table table tbody").empty();
        $("#light-device-list-table table tfoot").hide();
        if (!devices || devices.length == 0) {
            $("#light-device-list-table table tfoot").show();
            return;
        }
        $.each(devices, function (i, v) {
            if (!("mqtt" in v.protocols)) {
                return true; // continue
            }

            if (!("Name" in v.protocols["mqtt"])) {
                return true; // continue
            }

            var nameDisplay = v.protocols["mqtt"]["Name"];

            var rowData = "<tr>";
            rowData += "<td>" + (i + 1) + "</td>";
            rowData += "<td>" + nameDisplay + "</td>";
            var description = "";
            if (v.hasOwnProperty('description')) {
                description = v.description;
                if (v.description != "") {
                    if (v.description.length > 50) {
                        rowData += "<td>" + v.description.substring(0, 50) + "..." + "</td>";
                    } else {
                        rowData += "<td>" + v.description + "</td>";
                    }

                } else {
                    rowData += "<td></td>";
                }
            } else {
                rowData += "<td></td>";
            }

            rowData += "<td>" + dateToString(v.created) + "</td>";
            rowData += "<td>" + dateToString(v.modified) + "</td>";
            rowData += '<td><button class="btn btn-info fa fa-terminal" onclick="lightApp.gotoCommand(\'' + v.name + '\', \'' + nameDisplay + '\', \'' + description + '\')"></button></td>';
            rowData += '<td class="device-edit-icon"><input type="hidden" value=\'' + JSON.stringify(v) + '\'><div class="btn btn-warning fa fa-edit"></div></td>';
            rowData += '<td class="device-delete-icon"><input type="hidden" value=\'' + JSON.stringify(v.name) + '\'><div class="btn btn-danger fa fa-trash"></div></td>';
            rowData += "</tr>";
            $("#light-device-list-table table tbody").append(rowData);
        });

        $("#light-device-list-table .device-delete-icon").on('click', function () {
            var device = JSON.parse($(this).children('input').val());
            light.deleteDevice(device);
        });

        $("#light-device-list-table .device-edit-icon").on('click', function () {
            var device = JSON.parse($(this).children('input').val());
            light.editDevice(device);
        });
    }

    Light.prototype.editDevice = function (device) {
        light.currentProtocols = device.protocols;
        $('#light-deviceID').val(device.name);
        $('#light-deviceName').val(device.protocols["mqtt"]["Name"]);
        $('#light-deviceLabels').val(device.labels ? device.labels.join(',') : '');
        $('#light-deviceDescription').val(device.description);

        $('#light-mac').val("");
        if ("mqtt" in device.protocols) {
            if ("MAC" in device.protocols["mqtt"]) {
                $('#light-mac').val(device.protocols["mqtt"]["MAC"]);
            }
        }

        $('#light-command-main').hide();
        $('#light-device-list').hide();
        $("#light-device-update-or-add .add-device").hide();
        $("#light-device-update-or-add .update-device").show();

        $('#update-add-title').html("Sửa đổi thiết bị");
        $("#light-device-update-or-add").show();
    };

    Light.prototype.addDevice = function () {
        $('#light-command-main').hide();
        $('#light-device-list').hide();
        $("#light-device-update-or-add").show();
        $("#light-device-update-or-add .update-device").hide();

        $('#update-add-title').html("Thêm thiết bị mới");
        $("#light-device-update-or-add .add-device").show();

        // $(".edgexfoundry-device-form")[0].reset();
        $('#add-or-update-device').trigger("reset");
        $('#light-deviceID').val("");
        $('#light-deviceName').val("");
        $('#light-deviceDescription').val("");
        $('#light-deviceLabels').val("");
        $('#light-mac').val("");
    };

    Light.prototype.cancelAddOrUpdateDevice = function () {
        $("#light-device-update-or-add").hide();
        $('#light-command-main').hide();
        $('#light-device-list').show();
    };

    Light.prototype.uploadDevice = function (type) {
        var method;
        var name;

        if ($('#light-deviceName').val() == "") {
            bootbox.alert({
                title: "Error",
                message: "Tên không được để trống!",
                className: 'red-green-buttons'
            })
            return;
        }

        if ($('#light-mac').val() == "") {
            bootbox.alert({
                title: "Error",
                message: "MAC không được để trống!",
                className: 'red-green-buttons'
            })
            return;
        }

        if (type == "new") {
            method = "POST";
            name = uuidv4();
            light.currentProtocols = {};
        } else {
            method = "PATCH";
            name = $('#light-deviceID').val();
        }

        var property = {
            "MAC": $('#light-mac').val(),
            "Name": $('#light-deviceName').val().trim()
        }
        light.currentProtocols["mqtt"] = property;

        var device = {
            name: name,
            adminState: 'UNLOCKED',
            operatingState: 'UP',
            protocols: light.currentProtocols,
            serviceName: light.DeviceService,
            profileName: light.Profile,
        };

        if ($('#light-deviceDescription').val() != "") {
            device.description = $('#light-deviceDescription').val();
        }

        if ($('#light-deviceLabels').val() != "") {
            device.labels = $('#light-deviceLabels').val().split(',');
        }

        console.log(JSON.stringify([{ "apiVersion": "v2", "device": device }]));

        $.ajax({
            url: '/core-metadata/api/v2/device',
            type: method,
            contentType: 'application/json',
            data: JSON.stringify([{ "apiVersion": "v2", "device": device }]),
            success: function () {
                light.cancelAddOrUpdateDevice();
                light.loadDevice();
                bootbox.alert({
                    message: "commit success!",
                    className: 'red-green-buttons'
                });
            },
            statusCode: {
                400: function () {
                    bootbox.alert({
                        title: "Error",
                        message: "Thông tin yêu cầu không hợp lệ!",
                        className: 'red-green-buttons'
                    });
                },
                409: function () {
                    bootbox.alert({
                        title: "Error",
                        message: "Tên thiết bị đã tồn tại! Vui lòng sử dụng tên khác.",
                        className: 'red-green-buttons'
                    });
                },
                500: function () {
                    bootbox.alert({
                        title: "Error",
                        message: "Gặp lỗi chưa biết!",
                        className: 'red-green-buttons'
                    });
                }
            }
        });
    }

    Light.prototype.deleteDevice = function (deviceName) {
        bootbox.confirm({
            title: "confirm",
            message: "Bạn có chắc chắn muốn xoá thiết bị không?",
            className: 'green-red-buttons',
            callback: function (result) {
                if (result) {
                    $.ajax({
                        url: '/core-metadata/api/v2/device/name/' + deviceName,
                        type: 'DELETE',
                        success: function () {
                            bootbox.alert({
                                message: "Xóa thiết bị thành công",
                                className: 'red-green-buttons'
                            });
                            light.loadDevice();
                        },
                        statusCode: {
                            400: function () {
                                bootbox.alert({
                                    title: "Error",
                                    message: "Thông tin yêu cầu không hợp lệ!",
                                    className: 'red-green-buttons'
                                });
                            },
                            404: function () {
                                bootbox.alert({
                                    title: "Error",
                                    message: "Thiết bị không tìm thấy trong hệ thống!",
                                    className: 'red-green-buttons'
                                });
                            },
                        }
                    });
                }
            }
        });
    }
    // Device end  -----------------------------------------

    // Command start  -----------------------------------------
    Light.prototype.gotoCommand = function (name, nameDisplay, description) {
        light.currentSelectDevice = name;
        light.currentDescription = description;
        $('#light-currentDevice').html(nameDisplay);
        $('#info-set').val(description);

        $('#light-device-list').hide();
        $('#light-command-main').show("fast");
        light.monitor_get_data();
        light.monitorTimer = window.setInterval("lightApp.monitor_get_data()", light.intervalMonitor);
    }
    Light.prototype.cancelCommand = function () {
        $('#light-command-main').hide("fast");
        $('#light-device-list').show();
        window.clearInterval(light.monitorTimer);
    }

    Light.prototype.monitor_get_data = function () {
        $.ajax({
            url: '/core-command/api/v2/device/name/' + light.currentSelectDevice + '/' + light.MapCommand.GetAll,
            type: 'GET',
            dataType: 'json',
            success: function (data) {
                console.log(data.event.readings);
                if (data.event.readings.length > 0) light.renderData(data.event.readings);
            },
        });
    }

    Light.prototype.renderData = function (readings) {
        for (const reading of readings) {
            var resource = reading.resourceName;
            var value = reading.value;
            let val = 0;
            let tds1 = 0, tds2 = 0, tds3 = 0, tds4 = 0;

            switch (resource) {
                case light.MapResource.Apcao1:
                    if (value == "0") {
                        value = "off"
                    } else { value = "on" };
                    // $('#monitor_apcao1').bootstrapToggle(value);
                    break;
                case light.MapResource.Apcao2:
                    if (value == "0") {
                        value = "off"
                    } else { value = "on" };
                    // $('#monitor_apcao2').bootstrapToggle(value);
                    break;
                case light.MapResource.Apthap:
                    if (value == "0") {
                        value = "off"
                    } else { value = "on" };
                    // $('#monitor_apthap').bootstrapToggle(value);
                    break;
                case light.MapResource.Bom:
                    if (value == "0") {
                        value = "off"
                    } else { value = "on" };
                    // $('#monitor_bom').bootstrapToggle(value);
                    break;
                case light.MapResource.Vantu:
                    if (value == "0") {
                        value = "off"
                    } else { value = "on" };
                    // $('#monitor_vantu').bootstrapToggle(value);
                    break;
                case light.MapResource.Relay1:
                    if (value == "0") {
                        this.currentRelayXaState = false;
                    } else { this.currentRelayXaState = true; };
                    relayXa_state(this.currentRelayXaState);
                    break;
                case light.MapResource.Relay2:
                    if (value == "0") {
                        value = "off"
                    } else { value = "on" };
                    // $('#monitor_relay2').bootstrapToggle(value);
                    break;
                case light.MapResource.RelayAC:
                    if (value == "0") {
                        this.currentRelayACState = false;
                    } else { this.currentRelayACState = true };
                    relayAC_state(this.currentRelayACState);
                    break;
                case light.MapResource.PowerI:
                    val = parseFloat(value).toFixed(2);
                    $("#monitor_power_i").text(val);
                    break;
                case light.MapResource.PowerKw:
                    val = parseFloat(value).toFixed(3);
                    if (val >= 1000) val = parseFloat(value).toFixed(0)
                    else if (val >= 100) val = parseFloat(value).toFixed(1);
                    else if (val >= 10) val = parseFloat(value).toFixed(2);
                    $("#monitor_power_kw").text(val);
                    break;
                case light.MapResource.PowerKwh:
                    val = parseFloat(value).toFixed(3);
                    if (val >= 1000) val = parseFloat(value).toFixed(0)
                    else if (val >= 100) val = parseFloat(value).toFixed(1);
                    else if (val >= 10) val = parseFloat(value).toFixed(2);
                    $("#monitor_power_kwh").text(val);
                    break;
                case light.MapResource.PowerU:
                    // $('#monitor_power_u').val(value);
                    break;
                case light.MapResource.Tds1:
                    val = parseFloat(value).toFixed(0);
                    $("#monitor_tds1").text(val);
                    tds1 = val;
                    break;
                case light.MapResource.Tds2:
                    val = parseFloat(value).toFixed(0);
                    $("#monitor_tds2").text(val);
                    tds2 = val;
                    break;
                case light.MapResource.Tds3:
                    val = parseFloat(value).toFixed(0);
                    $("#monitor_tds3").text(val);
                    tds3 = val;
                    break;
                case light.MapResource.Tds4:
                    val = parseFloat(value).toFixed(0);
                    $("#monitor_tds4").text(val);
                    tds4 = val;
                    break;
                case light.MapResource.WaterFlow1:
                    val = parseFloat(value).toFixed(1);
                    $("#monitor_flow1").text(val);
                    break;
                case light.MapResource.WaterFlow2:
                    val = parseFloat(value).toFixed(1);
                    $("#monitor_flow2").text(val);
                    break;
                case light.MapResource.WaterFlow3:
                    val = parseFloat(value).toFixed(1);
                    $("#monitor_flow3").text(val);
                    break;
                case light.MapResource.WaterFlow4:
                    val = parseFloat(value).toFixed(1);
                    $("#monitor_flow4").text(val);
                    break;
                case light.MapResource.WaterFlow5:
                    val = parseFloat(value).toFixed(1);
                    $("#monitor_flow5").text(val);
                    break;
                case light.MapResource.WaterVolume1:
                    val = parseFloat(value).toFixed(3);
                    if (val >= 1000) val = parseFloat(value).toFixed(0)
                    else if (val >= 100) val = parseFloat(value).toFixed(1);
                    else if (val >= 10) val = parseFloat(value).toFixed(2);
                    $("#monitor_volume1").text(val);
                    break;
                case light.MapResource.WaterVolume2:
                    val = parseFloat(value).toFixed(3);
                    val = parseFloat(value).toFixed(3);
                    if (val >= 1000) val = parseFloat(value).toFixed(0)
                    else if (val >= 100) val = parseFloat(value).toFixed(1);
                    else if (val >= 10) val = parseFloat(value).toFixed(2);
                    $("#monitor_volume2").text(val);
                    break;
                default:
                    break;
            }

            // xu ly so sanh TDS
            let tds1_color = "white", tds2_color = "white", tds3_color = "white",  tds4_color = "white";
            if (tds4 > 30) {
                tds4_color = "red";
            }

            if (tds3 >= 0.6 * tds2) {
                tds2_color = tds3_color = "red";
            }

            if (tds2 >= 0.6 * tds1) {
                tds1_color = tds2_color = "red";
            }

            $("#monitor_tds1").css("color", tds1_color);
            $("#monitor_tds2").css("color", tds2_color);
            $("#monitor_tds3").css("color", tds3_color);
            $("#monitor_tds4").css("color", tds4_color);
        }
    }

    Light.prototype.command_onoff_relayAC = function () {
        this.currentRelayACState = !this.currentRelayACState;
        var resource = light.MapResource.RelayAC;
        var body = {
            [resource]: this.currentRelayACState ? 1 : 0
        };

        console.log(JSON.stringify(body));
        $.ajax({
            url: '/core-command/api/v2/device/name/' + light.currentSelectDevice + '/' + light.MapCommand.RelayAC,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function (data) {
                relayAC_state(this.currentRelayACState);
                light.monitor_get_data();
            },
            error: function () {
                alert("Gửi yêu cầu không thành công!");
                this.currentRelayACState = !this.currentRelayACState;
                relayAC_state(this.currentRelayACState);
            }
        });
    }

    Light.prototype.command_onoff_bom_relay1 = function () {
        if (!this.currentRelayACState) {
            alert("Không thể thực hiện do thiết bị chưa được bật nguồn!");
            return;
        }

        this.currentRelayXaState = !this.currentRelayXaState;

        var body = {
            [light.MapResource.Bom]: this.currentRelayXaState ? 1 : 0,
            [light.MapResource.Relay1]: this.currentRelayXaState ? 1 : 0
        };
        console.log(JSON.stringify(body))

        $.ajax({
            url: '/core-command/api/v2/device/name/' + light.currentSelectDevice + '/' + light.MapCommand.BomRelay1,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function (data) {
                relayXa_state(this.currentRelayXaState);
                light.monitor_get_data();
            }, error: function () {
                alert("Gửi yêu cầu không thành công!");
                this.currentRelayXaState = !this.currentRelayXaState;
                relayXa_state(this.currentRelayXaState);
            }
        });
    }

    // Command end  -----------------------------------------

    return light;

})();

function relayAC_state(state) {
    var property = document.getElementById('monitor_relay_ac');
    if (state == true) {
        property.style.backgroundColor = "#82b74b"
        $('#monitor_relay_ac').text('BẬT');
    }
    else {
        property.style.backgroundColor = "#c94c4c"
        $('#monitor_relay_ac').text('TẮT');
    }
}

function relayXa_state(state) {
    var property = document.getElementById('monitor_relay1');
    if (state == true) {
        property.style.backgroundColor = "#80ced6"
    }
    else {
        property.style.backgroundColor = "#f18973"
    }
}