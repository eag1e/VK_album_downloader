//Copyright (c) 2016 e@g1e https://github.com/eag1e
// 2016/08/01 e@g1e modified for the new VK album design.
// 2016/08/02 e@g1e modified for the Chrome + Tampermonkey.
//
//Released under the MIT license
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

//The major design pattern of this plugin was abstracted from Radu Oancea's vuplea, which is subject to the same license.
//Here is the original copyright notice for vuplea:

// Copyright (C) 2013 https://github.com/vuplea
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// USES https://raw.github.com/vuplea/tiny_zip_js
// ==UserScript==
// @name          VK album downloader
// @author         eag1e
// @description   This script introduces in VK.com album pages the ability to automatically create a .zip of the photos for quick download.
// @include       http://*vk.com/*
// @include       https://*vk.com/*
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_xmlhttpRequest
// @version       0.4 RC
// @require       http://raw.github.com/vuplea/tiny_zip_js/master/tiny_zip.js
// @downloadURL   http://raw.github.com/eag1e/VK_album_downloader/master/vkalbumdownloader.user.js
// ==/UserScript==



//if (GM_getValue("switch") === undefined) GM_setValue("switch", "on");
//
var nPhotos, album_box, cur_done = Infinity;
var anchors = document.getElementsByClassName("photos_row ");
//

//起動ループ
var loop = setInterval(launcher, 500);

//アルバム判定
function is_album()
{
// alert(document.getElementsByClassName("photos_album_page")[0]);
// alert(anchors.length);
// alert(anchors[0].getElementsByTagName('a')[0].href);
	return document.getElementsByClassName("photos_album_page")[0] !== undefined && anchors.length > 0 && anchors[0].getElementsByTagName('a')[0].href !== undefined;
}

var reverse;
function launcher()
{//alert(is_album());
	if (is_album()) {
		if (document.getElementById("vuplea_vk_album") === null) {
			if (anchors[0].getElementsByTagName('a')[0].href.indexOf("?rev=1") != -1)
				reverse = true;
			else
				reverse = false;
			setTimeout(main, 100);
		}
		setTimeout(update_links, 200);
	}
}

function update_links() {
	if (!is_album()) return;
	for (var i = cur_done; i < anchors.length; i += splits.length) {
		var splits = get_splits(createUrl(i));
		for (var j = 0; j < splits.length && i+j < anchors.length; ++j)
			anchors[i+j].getElementsByTagName('a')[0].href = findLink(splits[j]);
	}
	cur_done = anchors.length;
}

function createUrl(i) {
	return "al_photos.php?act=show&al=1&list="
	+ document.URL.split("/")[3].match(/[a-z\-0-9_]+/)[0]
	+ (reverse ? "%2Frev" : "") //reverse
	+ "&offset="
	+ i;
}

function main() {
	if (!is_album()) return;
	anchors = document.getElementsByClassName("photos_row ");
	nPhotos = document.getElementsByClassName("ui_crumb_count")[0].textContent.match(/[0-9]+/)[0];
	album_box = document.getElementsByClassName("photos_album_page")[0];
	if (album_box === undefined) album_box = document.getElementsByClassName("photos_tag_page")[0];
	cur_done = 0;
	//
	var text = document.createElement("TD");
	text.innerHTML = "VK album +  ";
	//
//	relinkB = document.createElement("INPUT");
//	relinkB.type = "button";
//	set_switch(relinkB, GM_getValue("switch"));
	//
//	scrollB = document.createElement("INPUT");
//	scrollB.type = "button";
//	scrollB.value = "Scroll";
//	var scroll_launcher = function()
//	{
//		scrollB.disabled = "disabled";
//		clearInterval(loop);
//		scroll();
//	};
//	scrollB.addEventListener("click", scroll_launcher);
	//
	zipB = document.createElement("INPUT");
	zipB.type = "button";
	zipB.value = "Create .zip";
	zipB.addEventListener("click", function()
	{
		zipB.disabled = "disabled";
//		set_switch(relinkB, "on");
//		scroll_launcher();
        clearInterval(loop);
		setTimeout(zipper, 300 + nPhotos*4);
	});
	//
	var script_row = document.createElement("TR");
	script_row.appendChild(text);
//	script_row.appendChild(document.createElement("TD").appendChild(relinkB));
//	script_row.appendChild(document.createElement("TD").appendChild(scrollB));
	script_row.appendChild(document.createElement("TD").appendChild(zipB));
	var script_table = document.createElement("TABLE");
	script_table.id = "vuplea_vk_album";
	script_table.style.cssText = "margin-left:22px; margin-top:10px; margin-bottom:-15px";
	script_table.appendChild(script_row);
	album_box.insertBefore(script_table, album_box.firstChild);
	if (document.getElementById("photos_upload_area_wrap") !== undefined)
		document.getElementById("photos_upload_area_wrap").style.marginTop = "25px";
}

function get_splits(theUrl)
{
	var request = new XMLHttpRequest();
    request.open("GET", theUrl, false);
    request.send();
	var all_splits = request.responseText.split(',"hash":');
	var splits = [];
	for (var i = 0; i < all_splits.length; ++i)
		if (all_splits[i].indexOf("_src") != -1)
			splits.push(all_splits[i]);
	return splits;
}

function findLink (mess)
{
	//最大解像度のサイズが取得できてないので修正
	var mess2 = mess.substring(0, mess.indexOf("}"));
	var sources_string = mess2.split(/"._src":"/);
	sources_string.splice(0,1);
	var sources = [];
	var imax = 0, max_size = 0;
	for (var i = 0; i < sources_string.length; i++)
	{
		var src_str = sources_string[i];
		//alert(src_str);
		sources[i] = src_str.split('"')[0];
		var size = src_str.substring(src_str.lastIndexOf('"')+2, src_str.indexOf("]")).split(",");
		if (size[0]*size[1] > max_size)
		{
			imax = i;
			max_size = size[0]*size[1];
		}
	}
	//alert(sources[imax].replace(/\\\//g, "/"));
	return sources[imax].replace(/\\\//g, "/");
}

/*
function set_switch(button, state)
{
	if (state == "on")
	{
		GM_setValue("switch", "on");
		button.value = "Disable";
		button.addEventListener("click", function()
		{
			set_switch(button, "off");
			location.reload();
		});
	}
	else
	{
		GM_setValue("switch", "off");
		button.value = "Enable";
		button.addEventListener("click",
			function(){set_switch(button, "on");});
	}
}
*/
/*
function scroll() {
	if (!is_album()) return;
	if (anchors.length == nPhotos)
	{
		loop = setInterval(launcher, 200);
		return;
	}
	unsafeWindow.photos.load();
	setTimeout(scroll, 100);
}
*/

var album_title, prog_text, prog_bar, download_row, i, zip,album_url;
function zipper(photo_resp)
{
	if (!is_album()) return;
	if (photo_resp === undefined)
	{
		album_title = document.title.split("|")[0].trim();
		var href = window.location.href;
		album_url = href.slice(href.lastIndexOf("_")+1);
		//alert(album_url);
		//
		prog_text = document.createElement("TD");
		prog_text.style.cssText = "margin-left:20px; margin-right:20px";
		//
		var canvas = document.createElement("CANVAS");
		canvas.style.cssText = "height:20px; width:450px; padding-top:20px; padding-left:10px";
		prog_bar = canvas.getContext("2d");
		//
		download_row = document.createElement("TR");
		download_row.appendChild(prog_text);
		download_row.appendChild(document.createElement("TD").appendChild(canvas));
		var zip_table = document.createElement("TABLE");
		zip_table.appendChild(download_row);
		zip_table.style.cssText = "margin-left:22px; margin-bottom:-20px; margin-top:8px; width:570px";
		album_box.insertBefore(zip_table, album_box.childNodes[1]);
		//
		i = 0;
		zip = new tiny_zip();
	}
	else
	{
		zip.add(album_url + "_" + i + ".jpg", uint8array_from_binstr(photo_resp.responseText));
		if (i == nPhotos)
		{
			var downLink = document.createElement("A");
			downLink.innerHTML = "File ready!";
			downLink.download = album_title + ".zip";
			downLink.href = window.URL.createObjectURL(zip.generate("blob"));
			//
			var newtd = document.createElement("TD");
			newtd.style.cssText = "vertical-align:middle";
			newtd.appendChild(downLink);
			download_row.appendChild(newtd);
			return;
		}
	}
	//
	GM_xmlhttpRequest
	({
		method: "GET",
		url: anchors[i].getElementsByTagName('a')[0].href,
		overrideMimeType: "text/plain; charset=x-user-defined",
		onload: zipper
	});
	i++;
	prog_text.innerHTML = i + "/" + nPhotos;
	prog_bar.fillRect(0,0,300 * i/nPhotos, 25);
}
