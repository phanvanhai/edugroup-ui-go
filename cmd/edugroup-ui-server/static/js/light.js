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
        this.monitorTimer = null;
        this.intervalMonitor = 10000;
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
        $.ajax({
            url: '/core-metadata/api/v2/device/profile/name/' + light.Profile,
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
            var rowData = "<tr>";
            rowData += "<td>" + (i + 1) + "</td>";
            rowData += "<td>" + v.name + "</td>";
            rowData += "<td>" + v.description.substring(0, 50) + "..." + "</td>";
            rowData += "<td>" + dateToString(v.created) + "</td>";
            rowData += "<td>" + dateToString(v.modified) + "</td>";
            rowData += '<td><button class="btn btn-info fa fa-terminal" onclick="lightApp.gotoCommand(\'' + v.name + '\', \'' + v.protocols.mqtt.MAC + '\')"></button></td>';
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
        $('#light-deviceID').val(device.id);
        $('#light-deviceName').val(device.name);
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
        if (type == "new") {
            method = "POST";
            light.currentProtocols = {};
        } else {
            method = "PATCH";
        }

        var property = {
            "MAC": $('#light-mac').val()
        }
        light.currentProtocols["mqtt"] = property;

        var device = {
            id: $('#light-deviceID').val(),
            name: $('#light-deviceName').val().trim(),
            description: $('#light-deviceDescription').val(),
            labels: $('#light-deviceLabels').val().split(','),
            adminState: 'UNLOCKED',
            operatingState: 'UP',
            protocols: light.currentProtocols,
            serviceName: light.DeviceService,
            profileName: light.Profile,
        };

        if (device.name == "") {
            bootbox.alert({
                title: "Error",
                message: "Tên không được để trống!",
                className: 'red-green-buttons'
            })
            return;
        }

        if (method == "PATCH") {
            device.id = $('#light-deviceID').val();
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
    Light.prototype.gotoCommand = function (name, mac) {
        light.currentSelectDevice = name;
        $('#light-currentDevice').html(name);

        $('#light-onoff-status').val("");
        $('#light-dimming-status').val("");
        $('#light-onoffScheduleTable tbody').empty();
        $('#light-dimmingScheduleTable tbody').empty();
        $('#light-groupTable tbody').empty();
        $('#light-scenarioTable tbody').empty();

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

            switch (resource) {
                case light.MapResource.Apcao1:
                    if (value = "0") {
                        value = "off"
                    } else { value = "on" };
                    $('#monitor_apcao1').bootstrapToggle(value);
                    break;
                case light.MapResource.Apcao2:
                    if (value = "0") {
                        value = "off"
                    } else { value = "on" };
                    $('#monitor_apcao2').bootstrapToggle(value);
                    break;
                case light.MapResource.Apthap:
                    if (value = "0") {
                        value = "off"
                    } else { value = "on" };
                    $('#monitor_apthap').bootstrapToggle(value);
                    break;
                case light.MapResource.Bom:
                    if (value = "0") {
                        value = "off"
                    } else { value = "on" };
                    $('#monitor_bom').bootstrapToggle(value);
                    break;
                case light.MapResource.Vantu:
                    if (value = "0") {
                        value = "off"
                    } else { value = "on" };
                    $('#monitor_vantu').bootstrapToggle(value);
                    break;
                case light.MapResource.Relay1:
                    if (value = "0") {
                        value = "off"
                    } else { value = "on" };
                    $('#monitor_relay1').bootstrapToggle(value);
                    break;
                case light.MapResource.Relay2:
                    if (value = "0") {
                        value = "off"
                    } else { value = "on" };
                    $('#monitor_relay2').bootstrapToggle(value);
                    break;
                case light.MapResource.RelayAC:
                    if (value = "0") {
                        value = "off"
                    } else { value = "on" };
                    console.log("change AC");
                    $('#monitor_relay_ac').bootstrapToggle(value);
                    break;
                case light.MapResource.PowerI:
                    $('#monitor_power_i').val(value);
                    break;
                case light.MapResource.PowerKw:
                    $('#monitor_power_kw').val(value);
                    break;
                case light.MapResource.PowerKwh:
                    $('#monitor_power_kwh').val(value);
                    break;
                case light.MapResource.PowerU:
                    $('#monitor_power_u').val(value);
                    break;
                case light.MapResource.Tds1:
                    $('#monitor_tds1').val(value);
                    break;
                case light.MapResource.Tds2:
                    $('#monitor_tds2').val(value);
                    break;
                case light.MapResource.Tds3:
                    $('#monitor_tds3').val(value);
                    break;
                case light.MapResource.Tds4:
                    $('#monitor_tds4').val(value);
                    break;
                case light.MapResource.WaterFlow1:
                    $('#monitor_flow1').val(value);
                    break;
                case light.MapResource.WaterFlow2:
                    $('#monitor_flow2').val(value);
                    break;
                case light.MapResource.WaterFlow3:
                    $('#monitor_flow3').val(value);
                    break;
                case light.MapResource.WaterFlow4:
                    $('#monitor_flow4').val(value);
                    break;
                case light.MapResource.WaterFlow5:
                    $('#monitor_flow5').val(value);
                    break;
                case light.MapResource.WaterVolume1:
                    $('#monitor_volume1').val(value);
                    break;
                case light.MapResource.WaterVolume2:
                    $('#monitor_volume2').val(value);
                    break;
                default:
                    break;
            }
        }
    }

    Light.prototype.command_onoff_relayAC = function () {
        var isChecked = $('#monitor_relay_ac').prop("checked");
        var resource = light.MapResource.RelayAC;
        var body = {
            [resource]: isChecked ? 1 : 0
        };

        console.log(JSON.stringify(body));
        $.ajax({
            url: '/core-command/api/v2/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.RelayAC,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function (data) {
                light.monitor_get_data();
            },
            error: function () {
                $('#monitor_relay_ac').bootstrapToggle(isChecked ? "off" : "on");
            }
        });
    }

    Light.prototype.command_onoff_bom_relay1 = function () {
        var isChecked = $('#monitor_relay_ac').prop("checked");
        if (!isChecked) {
            alert("Không thể thực hiện do thiết bị chưa được bật nguồn!");
            return;
        }

        isChecked = $('#monitor_relay1').prop("checked");
        var body = {
            [light.MapResource.Bom]: isChecked ? 1 : 0,
            [light.MapResource.Relay1]: isChecked ? 1 : 0
        };

        console.log(JSON.stringify(body));
        $.ajax({
            url: '/core-command/api/v2/device/name/' + light.currentSelectDevice + '/command/' + light.MapCommand.BomRelay1,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(body),
            dataType: 'text',
            success: function (data) {
                light.monitor_get_data();
            }, error: function () {
                $('#monitor_relay1').bootstrapToggle(isChecked ? "off" : "on");
            }
        });
    }

    // Command end  -----------------------------------------

    return light;

})();