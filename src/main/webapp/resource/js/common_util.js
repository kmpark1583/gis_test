/**
 * 공통 모듈
 */
let map;
let mapZoom = 11;
let wms;
let markerSource = new ol.source.Vector();
let markerLayer;
let polyArr = [];
let layersInfoArr = [
    {
        name : "shp_test1", // shp 파일로 올린 레이어
        bbox : [168565.205, 272955.5300063771, 201286.76220000055, 295326.1299910848]
    },
    {
        name : "wtl_meta_ps", // postGIS로 올린 레이어
        bbox : [168651.765625, 272956.15625, 201060.578125, 295331]
    }
];

/** 지도 셋팅 **/
function mapSettingFn(obj) {
    // 팝업 설정
    const overlay = new ol.Overlay({
        element: obj.container,
        autoPan: {
            animation: {
                duration: 250
            }
        }
    });

    // 팝업 닫기 버튼 클릭 이벤트
    obj.closer.onclick = function () {
        overlay.setPosition(null);
        obj.closer.blur();
    };

    map = new ol.Map({
        target: 'map_div',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM({
                    // 브이월드 API 인증키 발급 (만료일 : 2025-11-07)
                    url : "https://api.vworld.kr/req/wmts/1.0.0/CDD5436C-0C9D-3858-BC9C-C1A60F4673F9/Base/{z}/{y}/{x}.png"
                })
            })
        ],
        overlays: [overlay],
        view: new ol.View({
            center: ol.proj.fromLonLat([126.835, 35.165]),
            minZoom : 7,
            maxZoom : 20,
            zoom: mapZoom
        })
    });

    // singleclick 시 팝업 띄우기 (더블클릭 할 경우에는 이벤트 생략)
    map.on('singleclick', function(e) {
        const type = $("#clickEventSelect").val();
        const coordinate = e.coordinate;

        if(type === "popupOption") {
            // 팝업창 열기
            const transCoordinate = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

            obj.content.innerHTML = `<p>클릭 위치</p><code>${transCoordinate[0]}, ${transCoordinate[1]}</code>`
            overlay.setPosition(coordinate);

        } else {
            let markerStyle;
            let feature;

            if(type === "markerOption") {
                // 마커 그리기
                feature = new ol.Feature({
                    geometry: new ol.geom.Point([coordinate[0], coordinate[1]])
                });

                // 마커 스타일 변경
                markerStyle = new ol.style.Style({
                    image: new ol.style.Icon({ // 마커 이미지
                        opacity: 1,  // 투명도 1=100%
                        scale: 0.01, // 크기 1=100%
                        src: '/resource/img/marker.png'
                    })
                });

            } else {
                // 폴리선 그리기
                polyArr.push([coordinate[0], coordinate[1]]);

                feature = new ol.Feature({
                    geometry: new ol.geom.LineString(polyArr)
                });
            }

            markerSource.addFeature(feature);

            markerLayer = new ol.layer.Vector({
                source: markerSource,
                ...(markerStyle && {style : markerStyle})
            });

            map.addLayer(markerLayer);
        }
    });

    map.on("moveend", function() {
        // 줌의 변화가 생겼을 경우
        const newZoom = map.getView().getZoom();
        if(mapZoom !== newZoom) {
            mapZoom = newZoom;
            $("#zoomLevel").val(mapZoom);
        }
    });

    // 마우스가 위치한 좌표 표시
    map.on("pointermove", function(e) {
        const coordinate = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
        $("#lon").val(coordinate[0]);
        $("#lat").val(coordinate[1]);
    });
}

/** 표시할 레이어 목록 셋팅 **/
function layerListSettingFn() {
    $("#layerSelect").empty();
    $("#layerSelect").append("<option value=''>선택</option>");

    layersInfoArr.forEach(x => {
        $("#layerSelect").append(`<option value='${x.name}'>${x.name}</option>`);
    });
}

/** 레이어 표시 여부 설정 **/
function layerDisplayFn(obj) {
    let type = obj.dataset.type;
    let name = $("#layerSelect").val();

    let layersArray = map.getLayers().getArray();

    // 버튼 타입별 레이어 표시 여부 변경
    switch(type) {
        case 'show':
            // 레이어 선택 여부 조회
            if(name === "") {
                alert("표시할 레이어를 선택해주세요.");
                return;
            }

            let length = layersArray.filter(x => x.get("name") == name).length;

            if(length === 0) {
                // 최초 레이어를 그리는 경우 레이어 정보 셋팅
                layerSettingFn(name);
                map.addLayer(wms);
                wms = null;
            }
            break;
        case 'hide':
            layersArray
                .filter(x => x.get("name") == name)
                .forEach(x => map.removeLayer(x));
            break;
        case 'allHide' :
            layersArray
                .filter(x => x.get("name") != null)
                .forEach(x => map.removeLayer(x));
    }
}

/** 레이어 셋팅 **/
function layerSettingFn(name) {

    let obj = layersInfoArr.filter(x => x.name == name)[0];

    wms = new ol.layer.Tile({
        source : new ol.source.TileWMS({
            url : 'http://localhost:8090/geoserver/gis_test/wms?service=WMS', // 1. 레이어 URL
            params : {
                'VERSION' : '1.1.0', // 2. 버전
                'LAYERS' : 'gis_test:' + obj.name, // 3. 작업공간:레이어 명
                'BBOX' : obj.bbox, // 좌표
                'SRS' : 'EPSG:5186', // SRID
                'FORMAT' : 'image/png' // 포맷
            },
            serverType : 'geoserver',
        }),
        name : name
    });
}

/** 지도 클릭 이벤트 초기화 **/
function clickEventClearFn() {
    $("#map_popup_closer").trigger("click");
    if(markerLayer != null) {
        markerLayer.getSource().clear();
    }
    polyArr = [];
}