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
        this.intervalMonitor = 100000;
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
        // for user
        var userId = window.sessionStorage.getItem("id");
        var url = '/core-metadata/api/v2/device/all?labels=' + userId;
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
            rowData += "<td>" + dateToString(v.created) + "</td>";
            rowData += '<td><button class="btn btn-info fa fa-terminal" onclick="lightApp.gotoCommand(\'' + v.name + '\', \'' + nameDisplay + '\')"></button></td>';
            rowData += "</tr>";
            $("#light-device-list-table table tbody").append(rowData);
        });
    }

    // Device end  -----------------------------------------

    // Command start  -----------------------------------------
    Light.prototype.gotoCommand = function (name, nameDisplay) {
        light.currentSelectDevice = name;
        $('#light-currentDevice').html(nameDisplay);

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

var i = 1;
function btn_first() {
    var property = document.getElementById('button_first');
    if (i == 0) {
        property.style.backgroundColor = "#82b74b"
        $('#button_first').text('BẬT');
        i = 1;
    }
    else {
        property.style.backgroundColor = "#c94c4c"
        $('#button_first').text('TẮT');
        i = 0;
    }
}

var j = 1;
function btn_second() {
    console.log("btn_first");
    var property = document.getElementById('button_second');
    if (j == 0) {
        property.style.backgroundColor = "#80ced6"
        j = 1;
    }
    else {
        property.style.backgroundColor = "#f18973"
        j = 0;
    }
}