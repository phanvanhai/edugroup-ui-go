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
        this.intervalMonitor = 5000;

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
        // var url = '/core-metadata/api/v2/device/profile/name/' + light.Profile;
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
            rowData += "<td>" + dateToString(v.modified) + "</td>";
            rowData += '<td><button class="btn btn-info fa fa-terminal" onclick="lightApp.gotoCommand(\'' + v.name + '\', \'' + nameDisplay + '\', \'\')"></button></td>';
            rowData += "</tr>";
            $("#light-device-list-table table tbody").append(rowData);
        });
    }

    // Device end  -----------------------------------------

    // Command start  -----------------------------------------
    Light.prototype.gotoCommand = function (name, nameDisplay, description) {
        light.currentSelectDevice = name;
        $('#light-currentDevice').html(nameDisplay);

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
                    } else { this.currentRelayACState = true};
                    relayAC_state(this.currentRelayACState);
                    break;
                case light.MapResource.PowerI:
                    val = parseFloat(value).toFixed(2);
                    $("#monitor_power_i").text(val);
                    break;
                case light.MapResource.PowerKw:
                    val = parseFloat(value).toFixed(3);
                    if(val >= 1000) val = parseFloat(value).toFixed(0)
                    else if(val >= 100) val = parseFloat(value).toFixed(1);
                    else if(val >= 10) val = parseFloat(value).toFixed(2);
                    $("#monitor_power_kw").text(val);
                    break;
                case light.MapResource.PowerKwh:
                    val = parseFloat(value).toFixed(3);
                    if(val >= 1000) val = parseFloat(value).toFixed(0)
                    else if(val >= 100) val = parseFloat(value).toFixed(1);
                    else if(val >= 10) val = parseFloat(value).toFixed(2);
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
                    if(val >= 1000) val = parseFloat(value).toFixed(0)
                    else if(val >= 100) val = parseFloat(value).toFixed(1);
                    else if(val >= 10) val = parseFloat(value).toFixed(2);
                    $("#monitor_volume1").text(val);
                    break;
                case light.MapResource.WaterVolume2:
                    val = parseFloat(value).toFixed(3);
                    val = parseFloat(value).toFixed(3);
                    if(val >= 1000) val = parseFloat(value).toFixed(0)
                    else if(val >= 100) val = parseFloat(value).toFixed(1);
                    else if(val >= 10) val = parseFloat(value).toFixed(2);
                    $("#monitor_volume2").text(val);
                    break;
                default:
                    break;
            }

            // xu ly so sanh TDS
            let tds1_color = "white", tds2_color = "white", tds3_color = "white",  tds4_color = "white";
            if(tds4 > 30) {
                tds4_color = "red";
            }

            if(tds3 >= 0.6*tds2) {
                tds2_color = tds3_color = "red";
            }

            if(tds2 >= 0.6*tds1) {
                tds1_color = tds2_color = "red";
            }

            $("#monitor_tds1").css("color", tds1_color);
            $("#monitor_tds2").css("color", tds2_color);
            $("#monitor_tds3").css("color", tds3_color);
            $("#monitor_tds4").css("color", tds4_color);
        }
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