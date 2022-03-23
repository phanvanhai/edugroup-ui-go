/*******************************************************************************
 * Copyright © 2017-2018 VMware, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 *
 * @author: Huaqiao Zhang, <huaqiaoz@vmware.com>
 *******************************************************************************/
/*
 * Date format  yyyy-MM-dd hh:mm:ss
 */
var dateToString = function (num){
	var date = new Date();
	date.setTime(num);
	var y = date.getFullYear();
	var M = date.getMonth() + 1;
	M = (M < 10) ? ('0' + M) : M ;
	var d = date.getDate();
	d = (d < 10) ? ('0' + d) : d ;
	var hh = date.getHours();
	hh = (hh < 10 )? ('0' + hh) : hh ;
	var mm = date.getMinutes();
	mm = (mm < 10 )? ('0' + mm) : mm ;
	var ss = date.getSeconds();
	ss = (ss < 10) ?('0' + ss) : ss ;

	var str = y + '-' + M + '-' + d + ' ' + hh + ':' + mm + ':' + ss
	return str;
};

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, // Month
        "d+": this.getDate(), // Day
        "h+": this.getHours(), // Hour
        "m+": this.getMinutes(), // Minute
        "s+": this.getSeconds(), // Second
        "q+": Math.floor((this.getMonth() + 3) / 3), // Quarter
        "S": this.getMilliseconds() // Millisecond
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

//ISO 8601 format (YYYYMMDD'T'HHmmss)
var ISO8601DateStrToLocalDateStr = function (iso8601String) {
    var year = iso8601String.substring(0,4);
    var month = iso8601String.substring(4,6);
    var day = iso8601String.substring(6,8);
    var hour = iso8601String.substring(9,11);
    var minute = iso8601String.substring(11,13);
    var second = iso8601String.substring(13);
    return new Date(Date.UTC(year,month-1,day,hour,minute,second)).Format("yyyy-MM-dd hh:mm:ss");
};

//YYYYMMDD'T'HHmmss
var LocalDateStrToISO8601DateStr = function (localString) {
    //iso8601 YYYY-MM-DDTHH:mm:ss.sssZ
    return new Date(localString).toISOString().replace(/\..+/,'').replace(/[-:]/g,"")
};

var uuidv4 = function () {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  


function btn_uv() {
    document.getElementById("info-detail").innerHTML = "";
}

function btn_t33() {
    document.getElementById("info-detail").innerHTML = "T33: Có chứa than hoạt tính dạng xốp nén tích hợp vật liệu Nano bạc."

        + "<br>Chức năng: Cân bằng độ PH, mềm nước, tạo khoáng mang lại cảm giác nước uống ngon ngọt hơn."

        + "<br>K33: Lõi lọc nước có chức năng bổ sung thêm các khoáng chất như K, Mg, P, Ca... thiết yếu cho cơ thể.";
}

function btn_pump()
{
    document.getElementById("info-detail").innerHTML = "Điện áp 36V - 2A."
        + "<br>Lưu lượng: 3.4-4LPM.";
}

function btn_ro() {
    document.getElementById("info-detail").innerHTML = "Màng lọc RO là lõi quan trọng nhất trong máy lọc nước được cấu tạo bởi các sợi tổng hợp polyamid."
        + "<br>Màng lọc này có các khe siêu nhỏ 0.0001micron, nhỏ hơn hàng trăm lần vi khuẩn."

        + "<br>Chức năng: Màng lọc RO cho khả năng lọc bỏ được các tạp chất, bụi bẩn, vi khuẩn độc hại, kim loại nặng, ion kim loại ảnh hưởng không tốt đối với sức khỏe để cho ra nguồn nước sạch và tinh khiết";
    document.getElementById("info-detail").style.fontSize = "1.6vh";
}

function btn_pp() {
    document.getElementById("info-detail").innerHTML = "Lõi lọc số 1 được cấu tạo bởi các sợi bông xốp của nhựa polypropylene, khi cho vào lõi lọc thì nó sẽ được nén chặt lại để tạo ra các khe lọc khác nhau. Khe lọc có kích cỡ là 5micron."
        + "<br>Chức năng: Lọc bỏ gỉ sét, bùn đất, các vật chất lơ lửng trong nước, đồng thời ngăn cản bớt các yếu tố vi sinh tràn vào bên trong hệ thống."
    document.getElementById("info-detail").style.fontSize = "1.7vh";
}

function btn_gac() {
    document.getElementById("info-detail").innerHTML = "Lõi lọc số 2 của máy lọc nước có cấu tạo bên ngoài là vỏ nhựa, bên trong có chứa than gáo dừa được hoạt hóa, than hoạt tính có cấu trúc xốp rỗng, có tính chất hấp thụ mạnh."
        + "<br>Chức năng: Than hoạt tính có khả năng hấp thụ mạnh các loại chất nhờn, mùi và hữu cơ hòa tan, kim loại nặng. Đặc biệt là than hoạt tính có khả năng xử lý asen và amoni."
    document.getElementById("info-detail").style.fontSize = "1.7vh";
}

function btn_cto() {
    document.getElementById("info-detail").innerHTML = "Lõi số 3 có cấu tạo bằng than hoạt tính được nghiền nhỏ ra dưới dạng bột, sau đó ép thành khối nhằm tăng diện tích bề mặt tiếp xúc với nước để làm tăng hiệu quả xử lý nước hơn."
        + "Than hoạt tính tính ép có khả năng lọc nước tốt hơn so với than hoạt tính dạng hạt."

        + "<br>Chức năng: Than hoạt tính có khả năng hấp thụ mạnh các loại chất nhờn, mùi và hữu cơ hòa tan, lọc cặn, bùn đất và rỉ sét có kích thước lớn hơn hoặc bằng 1 micromet."
    document.getElementById("info-detail").style.fontSize = "1.6vh";
}


function btn_tho() {
    document.getElementById("info-detail").innerHTML = "Lõi lọc thô được cấu tạo từ các sợi bông được nén ở công suất cao, tạo nên khe lọc có kích thước từ 0.5 đến 5 micromet."
        + "<br>Nguồn nước đầu vào sau khi lọc qua bộ lọc thô sẽ được loại bỏ tạp chất, cặn bẩn, sinh vật phù du, tảo có kích thước lớn trong nước máy hoặc nước giếng."
    document.getElementById("info-detail").style.fontSize = "1.6vh";
}
