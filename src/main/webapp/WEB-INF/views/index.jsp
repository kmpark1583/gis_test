<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <script src="https://code.jquery.com/jquery-latest.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/ol@v10.5.0/dist/ol.js"></script>
    <script src="/resource/js/common_util.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v10.5.0/ol.css">
    <link rel="stylesheet" href="/resource/css/style.css">
    <title>Title</title>

    <script>

        $(function() {
            // 지도 내 팝업 설정용
            const container = document.getElementById('map_popup');
            const content = document.getElementById('map_popup_content');
            const closer = document.getElementById('map_popup_closer');
            const popupObj = {
                container,
                content,
                closer
            };

            // 초기 ZOOM LEVEL 셋팅
            $("#zoomLevel").val("ZOOM : " + mapZoom);

            // 지도 셋팅
            mapSettingFn(popupObj);

            // 표시할 wms 레이어 목록 셋팅
            wmsListSettingFn();
        });

    </script>
</head>

<body>
    <div>
        <div id="map_div"><!-- 지도가 그려지는 영역 --></div>
    </div>
    <div id="map_popup" class="ol-popup">
        <a href="javascript:void(0)" id="map_popup_closer" class="ol-popup-closer"></a>
        <div id="map_popup_content"></div>
    </div>
    <div>
        Zoom Level <input type="text" id="zoomLevel" readonly>
        경도 <input type="text" id="lon" readonly>
        위도 <input type="text" id="lat" readonly>
    </div>
    <div>
        레이어 목록
        <select id="layerSelect"></select>
    </div>
    <div>
        <button onclick="wmsDisplayFn(this);" data-type="show">레이어 표시</button>
        <button onclick="wmsDisplayFn(this);" data-type="hide">레이어 미표시</button>
        <button onclick="wmsDisplayFn(this);" data-type="allHide">레이어 모두 미표시</button>
    </div>
    <div>
        클릭 이벤트
        <select id="clickEventSelect" onchange="clickEventClearFn();">
            <option value="popupOption" selected>팝업</option>
            <option value="markerOption">마커</option>
            <option value="lineOption">선</option>
            <option value="circleOption">원</option>
            <option value="polygonOption">폴리곤</option>
        </select>
    </div>
</body>
</html>