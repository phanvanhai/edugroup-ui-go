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

$(document).ready(function () {

	//global ajax setting to redirect to login when session timeout (but user stay in old page) or user logout
	//don't worry about user bypassing it,the back-end has set permission to pass if user logout or session timeout.
	//here just improve user experience.
	$.ajaxSetup({
		cache: false,//prevent browser cache result to redirect  failed.
		headers: { "X-Session-Token": window.sessionStorage.getItem("X_Session_Token") },
		statusCode: {
			302: function () {
				window.location.href = '/login.html?ran=' + Math.random(); //prevent browser cache result to redirect  failed.
			}
		}
	});

	//get menu data dynamically.
	var role = window.sessionStorage.getItem("role")
	var url_menu = "/data/menu_user.json"
	if (role == "admin")
	{
		url_menu = "/data/menu_admin.json"
	}
	$.ajax({		
		url: url_menu,
		type: "GET",
		success: function (data) {
			var menu = eval(data);
			menuRender(menu);
            $('.sidebar ul li:first').click()
		}
	});

	//globe shelter control
	$(".main_shelter").on("click", function () {
		$(".main_shelter").hide("fast");
		$(".main_msgbox").animate({ "right": "-400px" }, "fast");
	});

	//render side_bar menu dynamically when load index page.
	function menuRender(data) {
		for (var i = 0; i < data.length; i++) {
			var menu = data[i];
			var subMenu = menu.children;
			var str = '<li url="' + menu.url + '" tabindex=' + menu.title + ' ><i class="fa fa-caret-right" style="visibility:hidden"></i><i class="' + menu.icon + '"></i><span>' + menu.title + '</span></li>';
			if (subMenu != null && subMenu.length != 0) {
				var second_level_menu = "";
				for (var j = 0; j < subMenu.length; j++) {
					second_level_menu += '<li url="' + subMenu[j].url + '" tabindex=' + subMenu[j].title + '><span></span><i class="' + subMenu[j].icon + '"></i><span>' + subMenu[j].title + '<span></li>';
				}
				str = '<li children="true"><i class="fa fa-caret-right"></i><i class="' + menu.icon + '"></i><span>' + menu.title + '</span></li><div class="second_level" style="display:none"><ul>' + second_level_menu + '</ul></div>';
				$(".sidebar ul:first").append(str);
				continue;
			}
			$(".sidebar ul:first").append(str);
		}

		//bind menu event of click
		$(".sidebar li").on('click', function (event) {
			event.stopPropagation();//prevent event propagate to parent node when click on current node
			//if not leaf node,expand current node.
			if ($(this).attr("children") == "true") {
				//toggle menu icon when expand current node.
				$(this).find("i:first").toggleClass(function () {
					if ($(this).hasClass("fa fa-caret-right")) {
						$(this).removeClass();
						return 'fa fa-caret-down';
					} else {
						$(this).removeClass();
						return 'fa fa-caret-right';
					}
				});
				$(this).next("div.second_level").slideToggle("normal");
				return;
			}
			// $(".sidebar li").not($(this)).css({color:'',borderBottom: '',borderBottomColor:''});
			// $(this).css({color:'#339933',borderBottom: '2px solid',borderBottomColor:'#339933'});
			// $(".sidebar li").not($(this)).css({ color: '', borderBottom: '', borderBottomColor: '', backgroundColor: '' });
			// $(this).css({ color: '#339933', borderBottom: '', backgroundColor: 'rgba(51, 153, 51, 0.5)' });
			//if current node is leaf node，load html resource.
			var tabindex = $(this).attr("tabindex");
			var url = $(this).attr("url");
			createTabByTitle(tabindex, url);
		});
	}

	function createTabByTitle(title, url) {
		var tabTitle = '<a href="#edgex-foundry-tab-' + title + '" aria-controls="edgex-foundry-tab-' + title + '" role="tab" data-toggle="tab"></a>';
        $("#edgex-foundry-tabs-index-main").html(tabTitle);

        var tabContent = '<div role="tabpanel" class="tab-pane" id="edgex-foundry-tab-' + title + '">';
        tabContent += '</div>';        
        $("#edgex-foundry-tabs-content").html(tabContent);

        $("#edgex-foundry-tabs-content #edgex-foundry-tab-" + title).load(url);
        $("a[href='#edgex-foundry-tab-" + title + "']").tab('show');
	}

});
