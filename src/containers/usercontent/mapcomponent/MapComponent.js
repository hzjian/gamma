import React, {Component} from "react";

import './Map.css';
import L from 'leaflet';
// import antd from 'antd';
import { Button, Select, notification,Modal,Popover,Checkbox  } from 'antd';
import '../../../base/draw/leaflet.draw-src';
import '../../../base/draw/zh_cn';
import  'leaflet-fullscreen';
import  '../../../base/layercontrol/leaflet.groupedlayercontrol';
// import {layerconfig} from '../../../base/layercontrol/layerconfig';
import  'leaflet-measure';
import  'leaflet-bookmarks';
import 'leaflet-tilelayer-geojson';
import 'leaflet-layerjson';
import "leaflet/dist/leaflet.css"
import "../../../base/layercontrol/leaflet.groupedlayercontrol.css"
import "leaflet-toolbar/dist/leaflet.toolbar.css"
import "leaflet-draw/dist/leaflet.draw.css"
import "leaflet-bookmarks/dist/leaflet.bookmarks.css"
import "leaflet-measure/dist/leaflet-measure.css"
import "leaflet-fullscreen/dist/leaflet.fullscreen.css"
import "leaflet.measurecontrol/docs/leaflet.measurecontrol.css"
import "bootstrap/dist/css/bootstrap.min.css"
import "antd/dist/antd.css"
import {Icon } from 'antd';
import img from '../imgs/marker-icon.png';
import layerpng from '../imgs/layers.png';
import Titlewindows from "./titlewindows/Titlewindows";
import {titleWindowClose} from "./titlewindows/Titlewindows";
import {mapbands} from "../taskcomponent/task";
import {fetchTopmapgeojson,DrawAddMap,refreshData} from "../../../actions/map";
import {openLayer,openeditlayerEdit} from '../mapcomponent/MapComponent'
import { connect } from "react-redux";
const  editlayer=new L.FeatureGroup();
const  drawlayer=new L.FeatureGroup();

var jsonlayer;
var editObject;
var editResult;
var editlatlngs;
var map = null;
var mapDiv = null;
var taskclassid;
var mapbandsvalue;


var groups = {
    ImgLayers: L.tileLayer('http://www.google.cn/maps/vt/lyrs=s@160000000&hl=zh-CN&gl=CN&src=app&y={y}&x={x}&z={z}&s=Ga', {
        maxZoom: 21,
        minZoom: 1,
        attribution: '&copy; <a href="http://www.tulibj.com">Gamma</a> tuli'
    }),
    //影像地图标注
    biaozhu:L.tileLayer('http://www.google.cn/maps/vt?lyrs=h@189&gl=cn&x={x}&y={y}&z={z}&s=Ga', {
        maxZoom: 21,
        minZoom: 1,
        attribution: '&copy; <a href="http://www.tulibj.com">Gamma</a> tuli'
    })
};
var basemaps = {
    //影像地图
    // ImgLayers: L.tileLayer()
};
var layerconfig = {
    LayerGroups: groups,
    Basemaps:basemaps
};
class MapComponent extends Component {

    componentDidMount()
    {
            const {stateProxy} = this.props;
            this.stateProxy = stateProxy;
            this.map = L.map(this.mapDiv, {
                layers: [groups.ImgLayers,groups.biaozhu],
                doubleClickZoom: false,//不可以通过双击放大，因为双击的作用是添加矩形
                contextmenu: true,
                zoomControl:false,
                zoom:12,
                minZoom: 3,
                contextmenuItems: [{
                    text: 'Bookmark this position',
                    callback: function (evt) {
                        this.fire('bookmark:new', {
                            latlng: evt.latlng
                        });
                        alert("123");
                    }
                }]
            }).setView(new L.LatLng(24.291, 166.636), 3);
        var groupedOverlays = {
            "地图图层": {
                "影像地图": layerconfig.LayerGroups.ImgLayers,
                "标注图层": layerconfig.LayerGroups.biaozhu
            },
            "Gamma图层":{
                // "高铁数据": ""
            }

        };
        L.control.groupedLayers(layerconfig.Basemaps,groupedOverlays).addTo(this.map);
        this.map.on('layeradd', function (ev) {
            console.log(ev.layer._map.getBounds());
            var x0=ev.target.getBounds()._northEast.lat;
            var y0=ev.target.getBounds()._northEast.lng;
            var x1=ev.target.getBounds()._southWest.lat;
            var y1=ev.target.getBounds()._southWest.lng;
            var latlngs = [[x0, y0],[x1,y0],[x1,y1],[x0,y1]];
            var polygon = L.polygon(latlngs, {color: 'red'});
            mapbandsvalue=polygon.toGeoJSON().geometry;
            mapbands(mapbandsvalue);

        });
            L.control.zoom({ zoomInTitle: '放大', zoomOutTitle: '缩小', position: 'topright' }).addTo(this.map);
            // 全屏
            var fsControl = new L.control.fullscreen({ position: 'topright',title:'全屏'}).addTo(this.map);
            this.map.addLayer(editlayer);
            this._setBaseMap();
            // this.map._onResize();
        const {dispatch} = this.props;
            this.map.on('moveend', function (ev) {

                console.log(ev.target.getBounds());
                var x0=ev.target.getBounds()._northEast.lat;
                var y0=ev.target.getBounds()._northEast.lng;
                var x1=ev.target.getBounds()._southWest.lat;
                var y1=ev.target.getBounds()._southWest.lng;
                var latlngs = [[x0, y0],[x1,y0],[x1,y1],[x0,y1]];
                var polygon = L.polygon(latlngs, {color: 'red'});
                mapbandsvalue=polygon.toGeoJSON().geometry;
                mapbands(mapbandsvalue);
                if(taskclassid!=null){
                    dispatch(fetchTopmapgeojson(mapbandsvalue,taskclassid));
                }
            });

        }

        _setBaseMap()
        {

                // this.map.addLayer(ImgLayers);
                // this.map.addLayer(biaozhu);
            //增加绘制图层
            const drawnItems = new L.FeatureGroup();
            this.map.addLayer(drawnItems);
            this.map.addLayer(drawlayer);
            this.map.addLayer(editlayer);
            //标记图片
            var MyCustomMarker = L.Icon.extend({
                options: {
                    shadowUrl: null,
                    // iconAnchor: new L.Point(12, 12),
                    // iconSize: new L.Point(24, 24),
                    iconUrl: img
                }
            });

            var options = {
                position: 'topright',
                draw: {
                    circle: false, // Turns off this drawing tool
                    rectangle: false,
                    circlemarker: false,
                    marker: {
                        icon: new MyCustomMarker()
                    },
                    polyline: {
                        shapeOptions: {
                            color: '#f357a1',
                            weight: 5
                        }
                    },
                    polygon: {
                        // allowIntersection: false, // Restricts shapes to simple polygons
                        shapeOptions: {
                            color: '#bada55'
                        }
                    }

                },
                edit: {
                    featureGroup: editlayer, //REQUIRED!!
                    remove: false
                }
            };

            var drawControl = new L.Control.Draw(options);
            this.map.addControl(drawControl);
            const {dispatch} = this.props;
            this.map.on("draw:created", function (e) {
                var object;
                if(e.layerType=="marker"){
                    object= L.marker(e.layer._latlng);
                }
                if(e.layerType=="polyline"){
                    object= L.polyline(e.layer._latlngs);
                }
                if(e.layerType=="polygon"){
                    object= L.polygon(e.layer._latlngs);
                }
                //var polygon = L.polygon(e.layer._latlngs);
                var geojson= object.toGeoJSON();
                var type = e.layerType,
                    layer = e.layer;

                if (type === 'marker') {
                    layer.bindPopup('A popup!');
                }
                var geoJson=geojson;
                var featype=e.layerType;
                const geoJsonvalue=geoJson.geometry;
                var guid=0;
                dispatch(DrawAddMap(geoJsonvalue,featype,taskclassid,guid));
                drawlayer.addLayer(layer);
                titleWindowClose("true");

                {/*<Titlewindows getBStyle={'display:""'}/>*/}
            });
            // this.map.on(L.Draw.Event.EDITSTOP, function (e) {
            //
            //     var polygon=L.polygon(editObject._latlngs, {color: 'red'});
            //     var geojson=editObject.toGeoJSON().geometry;
            //     var featype=e.layerType;
            //     var guid=editObject.feature.properties.guid;
            //     dispatch(DrawAddMap(geojson,geojson.type,taskclassid,guid));
            //     titleWindowClose("true");
            //     editlayer.addLayer(polygon);
            //     // editlayer.clearLayers();
            //     drawlayer.clearLayers();
            //  });
            this.map.on('draw:edited', function (e) {
                var layers = e.layers;
                layers.eachLayer(function (layer) {
                    editResult=layer;
                    var polygon=L.polygon(editResult._latlngs, {color: 'red'});
                    var geojson=editResult.toGeoJSON().geometry;
                    var featype=e.layerType;
                    var guid=editObject.feature.properties.guid;
                    dispatch(DrawAddMap(geojson,geojson.type,taskclassid,guid));
                    titleWindowClose("true");
                    // editlayer.addLayer(polygon);
                    editlayer.clearLayers();
                    drawlayer.clearLayers();
                    editlatlngs=null;

                });
            });
            var measureControl = new L.Control.Measure({
                localization: 'cn',
                position: 'topright',
                primaryLengthUnit: 'meters',
                secondaryLengthUnit: 'kilometers',
                primaryAreaUnit: 'sqmeters',
                secondaryAreaUnit: 'hectares',
                activeColor: '#ABE67E',
                completedColor: '#C8F2BE',
                className: 'leaflet-measure-resultpopup',
                autoPanPadding: [10, 10],
                captureZIndex: 10000
            });
            this.map.addControl(measureControl);
            this.map.on('click', function (e) {
                // alert("尽量了");
                // L.DomEvent.stopPropagation(e);
            });
            drawlayer.on('click', function (e) {
                // var latlngs=e.layer.feature.geometry.coordinates[0];
                    editlayer.clearLayers();
                    editlayer.addLayer( L.polygon(e.layer._latlngs, {color: 'red'}));
            });
            //书签
            var bookmarksControl = global.bookmarksControlLeft = new L.Control.Bookmarks({
                position: 'topright',
                onRemove: function (bookmark, callback) {
                    callback(true);  // will be removed
                },
            });
            this.map.addControl(bookmarksControl);
        }
        //图层控制

        geojsonmap() {
            const { dispatch } = this.props;
            if(jsonlayer!=null){
                jsonlayer.clearLayers();
            }
           var geojson=this.props.geojsonarr;
            if (geojson != null && geojson != "") {
                // var editlayer=new L.FeatureGroup();
                // this.map.addLayer(editlayer);
                jsonlayer= L.geoJSON(geojson, {
                    style: {
                        stroke:true,
                         color:'#59edca',
                         opacity: 1,
                         fillOpacity: 0.8,
                         fillColor: '#59edca',
                         weight:5
                    }
                }).bindPopup(function (layer) {

                    editObject=layer;
                    // var layeredit=new layer();
                    // return layer.feature.properties.description;
                    editlatlngs=layer._latlngs;
                    //L.marker([39.61, -105.02]).bindPopup('This is Littleton, CO.').addTo(this.map);
                    this._map.setView(layer.getCenter(),14);
                    // this._map.setZoomAround(layer.getCenter(),14);
                    if(layer.feature.geometry.type=="Polygon"){
                        // editlayer.clearLayers();
                        editlayer.addLayer( L.polygon(layer._latlngs, {color: 'red'}));
                        titleWindowClose("true");
                    }else{
                        var polyline = L.polyline(editlatlngs, {color: 'black'})
                    }


                }).addTo(this.map);
            }
        }

        render()
        {
            const geojsonarr=this.props.geojsonarr;
            if(geojsonarr=="SUCCESS"){
                const {dispatch} = this.props;
                dispatch(fetchTopmapgeojson(mapbandsvalue,taskclassid));
            }
            if(geojsonarr!=null && geojsonarr!="SUCCESS"){
                this.geojsonmap(geojsonarr);
            }
            if(editlatlngs!=null){
                editlayer.addLayer( L.polygon(editlatlngs, {color: 'red'}));
            }
            const content = (
                <div className="layerlist">
                    <label>地图图层</label><br/>
                    <Checkbox className="label" defaultChecked="true" value="影像" onChange={(e) => this.onlayercontrol(e) }>影像地图</Checkbox>
                    <Checkbox className="label" defaultChecked="true" value="标注" onChange={(e) => this.onlayercontrol(e) }>标注地图</Checkbox>
                    <br/>
                    <label>Gamma图层</label>
                    <br/>
                    <Checkbox className="label" value="高铁" onChange={(e) => this.onlayercontrol(e) }>高铁图层</Checkbox>
                    <Checkbox className="label">高校图层</Checkbox>
                </div>
            );



            return <div className="mapinfo">
                <div className="map" ref={ref => this.mapDiv = ref} >
                <Titlewindows/>
                {/*<Popover placement="left" title="图层控制" className="" content={content}>*/}
                    {/*<img src={layerpng} title="图层控制" className="layercontrol"></img>*/}
                {/*</Popover>*/}
                </div>
            </div>

    }
}

// Map.propTypes = {
//     geojson: PropTypes.shape({
//         // login: PropTypes.string.isRequired,
//         // avatar_url: PropTypes.string.isRequired,
//         // url: PropTypes.string.isRequired,
//         // html_url: PropTypes.string.isRequired
//     }).isRequired
// };
export default connect()(MapComponent);

// export function openLayer() {
//     // const geojsonarr=this.props.geojsonarr;
//     this.geojsonmap();
// }
export function taskMaptoLayer(classid) {
    taskclassid=classid;
    refreshData(mapbandsvalue,taskclassid)
    // document.getElementById("leaflet-right").style.display="none";
}

Map.defaultProps = {
    geojsonarr:null,
    drawdata:null
};
