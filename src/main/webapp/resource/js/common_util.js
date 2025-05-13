let map;                    // 화면에 표시될 지도 정보를 담을 변수
let mapZoom = 11;   // zoom 레벨 기본값
let wms;                    // 이미지 기반의 wms 레이어 정보를 담을 변수
let vectorSource;           // 벡터
let coordinateSetBool = false;  // feature 좌표 셋팅 완료 여부
let customFeatureArr = [];     // 커스텀 feature을 그리기 위한 좌표를 담을 배열
let wmsArr = [  // 지오서버에 올라간 이미지 기반의 wms 레이어 목록 정보를 담은 배열
    {   // shp 파일로 올린 레이어 (광주 GIS)
        name : "shp_test1",     // 레이어 관리를 위한 레이어 명칭
        bbox : [168565.205, 272955.5300063771, 201286.76220000055, 295326.1299910848]   // 좌표
    },
    {   // postGIS로 올린 레이어 (광주 GIS)
        name : "wtl_meta_ps",   // 레이어 관리를 위한 레이어 명칭
        bbox : [168651.765625, 272956.15625, 201060.578125, 295331] // 좌표
    },
    {   // postGIS로 올린 레이어 (전국 GIS)
        name : "ctprvn",   // 레이어 관리를 위한 레이어 명칭
        bbox : [746110.25, 1458754.0, 1387949.625, 2068444.0] // 좌표
    }
];

/** 지도 셋팅 **/
function mapSettingFn(obj) {
    // 팝업에 필요한 요소를 활용해 지도에 표시할 팝업 overlay 요소 설정
    const overlay = new ol.Overlay({
        element: obj.container, // overlay 대상이 될 요소
        autoPan: {  // overlay 띄울 때 완전히 보이도록 지도 자동 이동 기능
            animation: {    // 지도 자동 이동 시 애니메이션 속도 지정
                duration: 250
            }
        }
    });

    // 팝업 닫기 버튼에 클릭 이벤트 설정
    obj.closer.onclick = function () {
        // overlay의 포지션을 null값으로 설정해서 overlay 숨김
        overlay.setPosition(null);
        // 해당 요소에서 blur 처리로 포커스 잃게 만들기
        obj.closer.blur();
    };

    // 지도 정보 셋팅
    map = new ol.Map({
        target: "map_div",  // 지도가 그려질 영역
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    // 브이월드 API로 설정시 기본 제공하는 지도보다 자세한 정보를 확인 가능
                    // 인증키 발급 (만료일 : 2025-11-07)
                    url : "https://api.vworld.kr/req/wmts/1.0.0/CDD5436C-0C9D-3858-BC9C-C1A60F4673F9/Base/{z}/{y}/{x}.png"
                })
            })
        ],
        overlays: [overlay],    // 설정한 맵에 표시할 overlay 요소 추가
        view: new ol.View({
            center: ol.proj.fromLonLat([126.835, 35.165]),  // 최초 표시될 지도의 중앙 좌표
            minZoom : 7,    // 최소 zoom 레벨
            maxZoom : 20,   // 최대 zoom 레벨
            zoom: mapZoom   // 기본 zoom 레벨
        })
    });

    // singleclick 시 팝업 띄우기 (더블클릭 할 경우에는 이벤트 생략)
    map.on("singleclick", function(e) {
        // 클릭 이벤트의 타입 확인
        const type = $("#clickEventSelect").val();
        // 클릭한 지점의 좌표 정보 조회
        const coordinate = e.coordinate;

        // 클릭 이벤트가 팝업 열기 일 경우
        if(type === "popupOption") {
            // 선택된 wms 레이어 조회
            let arr = selectWmsLayerObjFn(wmsArr, $("#layerSelect").val());
            // 해당 지점의 좌표or정보 표시 구분을 위한 변수
            let text;

            // 레이어 목록에서 특정 레이어가 선택 되어 있을 경우
            if(arr.length > 0) {
                let obj = arr[0];
                // 선택된 레이어가 지도에 표시 되어 있다면
                if(obj.wmsSource) {
                    // wms 레이어의 클릭한 feature 요소 정보를 url로 가져옴
                    let url = obj.wmsSource.getFeatureInfoUrl(e.coordinate, map.getView().getResolution(), map.getView().getProjection(), {
                        QUERY_LAYERS: obj.wmsSource.getParams().LAYERS, // 저장소:레이어명
                        INFO_FORMAT: 'application/json',   // 출력물 포맷 : json
                    });

                    if(url) {
                        $.ajax(url, {
                            type: "GET",
                            async: false,   // 해당 클릭 지점의 표시 정보를 분기처리 하기 위해 동기 방식으로 변경
                        }).done(function(data,status,response) {
                            // 클릭한 feature의 정보 조회
                            data = data.features;
                            // 클릭한 지점의 정보가 존재 할 경우
                            if(data.length > 0) {
                                let properties = data[0].properties;
                                // 클릭지점의 정확한 위치를 찾을 수 있다면 해당 정보 표시
                                if(properties != null) {
                                    // 연습한다고 다른 shp 파일도 추가했는데 각 레이어마다 컬럼명이 달라서..
                                    text = `<p>클릭위치</p><code></code>${properties.ctp_kor_nm ? properties.ctp_kor_nm : properties.blk_nam}`;
                                }
                            }

                        }).error(function(e) {
                            console.log(e);
                        });
                    }
                }
            }

            // 클릭한 지점의 정확한 정보를 찾을 수 업다면 해당 지점의 좌표 셋팅
            if(!text) {
                // 받아온 좌표의 좌표계를 변경후 셋팅
                const transCoordinate = ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326");
                text = `<p>클릭 위치</p><code>${transCoordinate[0]}, ${transCoordinate[1]}</code>`;
            }

            // 팝업 요소의 HTML을 클릭한 셋팅한 정보로 셋팅
            obj.content.innerHTML = text;
            // overlay 요소의 포지션을 해당 좌표로 설정
            overlay.setPosition(coordinate);

        } else {
            // 만약 클릭한 지점에 feature 요소가 있다면 제거
            let featureRemoveBool = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                layer.getSource().removeFeature(feature);
                return true;
            });
            // feature 요소를 지운게 있다면 새로운 feature 요소를 그리지 않고 종료
            if(featureRemoveBool) {
                return;
            }

            // 하나의 feature를 위한 벡터 셋팅
            if(vectorSource == null) {
                vectorSource = new ol.source.Vector();
            }
            // feature 스타일 정보를 담을 변수
            let featureStyle;
            // feature 정보를 담을 변수
            let feature;

            // 클릭 이벤트가 마커 일 경우
            if(type === "markerOption") {
                // 마커가 표시되기 위한 feature 정보 셋팅
                feature = new ol.Feature({
                    geometry: new ol.geom.Point([coordinate[0], coordinate[1]])
                });
                // feature 스타일 설정
                featureStyle = new ol.style.Style({
                    image: new ol.style.Icon({  // 마커 이미지 설정
                        opacity: 1,  // 투명도 1 = 100%
                        scale: 0.03, // 크기 1 = 100%
                        src: '/resource/img/marker.png' // 마커 이미지 경로
                    })
                });
                // 좌표 셋팅 완료
                coordinateSetBool = true;

                // 클릭 이벤트가 선 일 경우
            } else if(type === "lineOption") {
                // 배열에 feature을 그릴 좌표를 저장
                customFeatureArr.push([coordinate[0], coordinate[1]]);

                // 하나의 선을 만들기 위한 2점이 마련 되었을 경우 선 정보 셋팅
                if(customFeatureArr.length === 2) {
                    // 선이 그려지기 위한 feature 정보 셋팅
                    feature = new ol.Feature({
                        geometry: new ol.geom.LineString(customFeatureArr)
                    });
                    // 좌표 배열 초기화
                    customFeatureArr = [];
                    // 좌표 셋팅 완료
                    coordinateSetBool = true;
                }
            }

            // 클릭 이벤트가 원 일 경우
            else if(type === "circleOption") {
                // 원이 표시되기 위한 feature 정보 셋팅
                feature = new ol.Feature({
                    geometry: new ol.geom.Circle([coordinate[0], coordinate[1]], 600)
                });
                // feature 스타일 설정
                featureStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'red',
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(0, 0, 255, 0.1)'
                    })
                });
                // 좌표 셋팅 완료
                coordinateSetBool = true;

                // 클릭 이벤트가 폴리곤 일 경우
            } else if(type === "polygonOption") {
                // 배열에 feature을 그릴 좌표를 저장
                customFeatureArr.push([coordinate[0], coordinate[1]]);

                // 하나의 폴리곤을 만들기 위한 4점이 마련 되었을 경우 폴리곤 정보 셋팅
                if(customFeatureArr.length === 4) {
                    // 선이 그려지기 위한 feature 정보 셋팅
                    feature = new ol.Feature({
                        geometry: new ol.geom.Polygon([customFeatureArr])
                    });
                    // 좌표 배열 초기화
                    customFeatureArr = [];
                    // 좌표 셋팅 완료
                    coordinateSetBool = true;
                }
            }
            // feature 요소를 그리기위한 최종 좌표가 셋팅 완료 되었을 경우 레이어 추가
            if(coordinateSetBool) {
                // 벡터에 feature 정보 추가
                vectorSource.addFeature(feature);
                // 벡터 레이어 설정
                let vectorLayer = new ol.layer.Vector({
                    source: vectorSource,
                    // feature 스타일이 null 값이 아닐 경우 style 키값으로 featureStyle 추가
                    ...(featureStyle && {style : featureStyle})
                });
                // 다음 feature를 그릴 준비 하기 위해 벡터 초기화
                vectorSource = null;
                coordinateSetBool = false;
                // map에 벡터 레이어 추가
                map.addLayer(vectorLayer);
            }
        }
    });

    // 지도 움직임이 종료 될 경우
    map.on("moveend", function() {
        // 현재 줌 레벨 조회
        const newZoom = map.getView().getZoom();
        // 줌 레벨 변화가 생겼을 경우
        if(mapZoom !== newZoom) {
            // 줌 레벨을 새로운 줌 레벨로 설정
            mapZoom = newZoom;
            // 줌 레벨 표시값 변경
            $("#zoomLevel").val(mapZoom);
        }
    });

    // 포인터 위치가 이동 될 경우
    map.on("pointermove", function(e) {
        // 해당 지점의 좌표를 조회
        const coordinate = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
        // 경도/위도 표시값 변경
        $("#lon").val(coordinate[0]);
        $("#lat").val(coordinate[1]);
    });
}

/** 표시할 wms 레이어 목록 셋팅 **/
function wmsListSettingFn() {
    // wms 레이어 목록 비우기
    $("#layerSelect").empty();
    // 기본값이 될 option 추가
    $("#layerSelect").append("<option value=''>선택</option>");

    // wms 레이어 목록을 돌며 option 추가
    wmsArr.forEach(x => {
        $("#layerSelect").append(`<option value='${x.name}'>${x.name}</option>`);
    });
}

/** wms 레이어 표시 여부 설정 **/
function wmsDisplayFn(obj) {
    // 표시 여부 타입 조회
    let type = obj.dataset.type;
    // wms 레이어 이름 조회
    let name = $("#layerSelect").val();
    // 지도의 레이어 목록
    let layersArray = map.getLayers().getArray();
    // 레이어 목록 저장용 변수
    let arr;

    // 버튼 타입별 레이어 표시 여부 변경
    if(type === "show") {
        // 레이어 선택 여부 조회
        if(name === "") {
            // 선택된 레이어가 없을 경우 alert 창 띄우고 종료
            alert("표시할 레이어를 선택해주세요.");
            return;
        }
        arr = selectWmsLayerObjFn(layersArray, name);
        // 존재 하지 않을 경우에만
        if(arr.length === 0) {
            // wms 레이어 정보 셋팅
            layerSettingFn(name);
            // 셋팅된 wms 레이어 정보를 지도에 추가
            map.addLayer(wms);
            // wms 레이어 정보 null 값으로 초기화
            wms = null;
        }

    } else {
        // 특정 레이어 미표시
        if(type === "hide") {
            arr = selectWmsLayerObjFn(layersArray, name);
            // 모든 레이어 미표시
        } else {
            arr = selectWmsLayerObjFn(layersArray, null, false);
        }

        arr.forEach(x => {
            // 최종적으로 삭제 해야할 레이어 지도에서 제거
            map.removeLayer(x);
            wmsArr.forEach(y => {
                if(x.get("name") === y.name) {
                    // wms 레이어 목록에서 셋팅된 객체 내 wms 정보 제거
                    delete y.wmsSource;
                }
            });
        });
    }
}

/** 레이어 셋팅 **/
function layerSettingFn(name) {
    // wms 레이어 목록 중 name 값이 선택된 레이어와 동일한 객체를 조회
    let obj = selectWmsLayerObjFn(wmsArr, name)[0];
    // wms 레이어 정보 셋팅
    wms = new ol.layer.Tile({
        source : new ol.source.TileWMS({
            url : 'http://localhost:8090/geoserver/gis_test/wms?service=WMS', // 지오서버 내 레이어 URL
            params : {
                'VERSION' : '1.1.0',   // 버전
                'LAYERS' : 'gis_test:' + obj.name, // 작업공간:레이어 명
                'BBOX' : obj.bbox,     // 좌표
                'SRS' : 'EPSG:5186',   // 좌표계
                'FORMAT' : 'image/png' // 포맷
            },
            serverType : 'geoserver',  // 서버 타입
        }),
        name : name // 레이어 명칭
    });
    obj.wmsSource = wms.getSource();
}

/** 지도 클릭 이벤트 초기화 **/
function clickEventClearFn() {
    // 팝업 닫기 버튼 클릭 이벤트 실행
    $("#map_popup_closer").trigger("click");
    // 선 좌표 배열 초기화
    customFeatureArr = [];
}

/** wms 레이어 목록중 찾고자 하는 레이어 목록 조회 **/
function selectWmsLayerObjFn(arr, name, bool=true) {
    // 결과값을 담을 변수
    let result;

    // 동일한 명칭의 레이어를 찾고자 하는 경우
    if(bool) {
        result = arr.filter(x => x.name == null ? x.get("name") === name : x.name === name);
        // 일치하지 않는 레이어를 찾고자 하는 경우
    } else {
        result = arr.filter(x => x.name == null ? x.get("name") != name : x.name != name);
    }
    return result;
}