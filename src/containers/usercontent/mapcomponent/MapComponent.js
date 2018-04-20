import React, {Component} from "react";

import './Map.css';
import L from 'leaflet';
// import antd from 'antd';
import { Button, Select, notification,Modal,Popover,Checkbox  } from 'antd';
import 'leaflet-draw';
import  'leaflet-fullscreen';
import  'leaflet-measure';
import  'leaflet-bookmarks';
import 'leaflet-tilelayer-geojson';
import 'leaflet-layerjson';
import "leaflet/dist/leaflet.css"
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
import layer from '../imgs/layers.png';
import Titlewindows from "./titlewindows/Titlewindows";
import {titleWindowClose} from "./titlewindows/Titlewindows";
import {fetchTopmapgeojson} from "../../../actions/map";
import { connect } from "react-redux";
const  editlayer=new L.FeatureGroup();
const  drawlayer=new L.FeatureGroup();
const content = (
    <div className="layerlist">
        <label>地图图层</label><br/>
        <Checkbox className="label" onChange={this.onlayercontrol}>影像地图</Checkbox>
        <Checkbox className="label">标注地图</Checkbox>
        <Checkbox className="label">平面地图</Checkbox>
        <br/>
        <label>Gamma图层</label>
        <br/>
        <Checkbox className="label">高铁图层</Checkbox>
        <Checkbox className="label">高校图层</Checkbox>
    </div>
);
//影像地图
const ImgLayers= L.tileLayer('http://www.google.cn/maps/vt/lyrs=s@160000000&hl=zh-CN&gl=CN&src=app&y={y}&x={x}&z={z}&s=Ga', {
    maxZoom: 21,
    minZoom: 1,
    attribution: '&copy; <a href="http://www.tulibj.com">Gamma</a> tuli'
})
//影像地图标注
const biaozhu=L.tileLayer('http://www.google.cn/maps/vt?lyrs=h@189&gl=cn&x={x}&y={y}&z={z}&s=Ga', {
    maxZoom: 21,
    minZoom: 1,
    attribution: '&copy; <a href="http://www.tulibj.com">Gamma</a> tuli'
});
var map = null;
var mapDiv = null;
class MapComponent extends Component {


    componentDidMount()
    {
            const {stateProxy} = this.props;
            this.stateProxy = stateProxy;
            this.map = L.map(this.mapDiv, {
                doubleClickZoom: false,//不可以通过双击放大，因为双击的作用是添加矩形
                contextmenu: true,
                zoomControl:false,
                zoom:12,
                contextmenuItems: [{
                    text: 'Bookmark this position',
                    callback: function (evt) {
                        this.fire('bookmark:new', {
                            latlng: evt.latlng
                        });
                    }
                }]
            }).setView(new L.LatLng(24.291, 166.636), 3);
            L.control.zoom({ zoomInTitle: '放大', zoomOutTitle: '缩小', position: 'topright' }).addTo(this.map);
            // 全屏
            var fsControl = new L.control.fullscreen({ position: 'topright',title:'全屏'}).addTo(this.map);
            this.map.addLayer(editlayer);
            this._setBaseMap();
            // this.map._onResize();
            this.map.on('moveend', function (ev) {
                console.log(ev.target.getBounds());
            });
        }

        _setBaseMap()
        {

            this.map.addLayer(ImgLayers);
            this.map.addLayer(biaozhu);
            //增加绘制图层
            const drawnItems = new L.FeatureGroup();
            this.map.addLayer(drawnItems);

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

            this.map.on(L.Draw.Event.CREATED, function (e) {

                var polygon = L.polygon(e.layer._latlngs);
                var geojson= polygon.toGeoJSON();
                var type = e.layerType,
                    layer = e.layer;

                if (type === 'marker') {
                    layer.bindPopup('A popup!');
                }

                drawlayer.addLayer(layer);
                titleWindowClose("true");
                {/*<Titlewindows getBStyle={'display:""'}/>*/}
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

        onlayercontrol(e) {
            var value=e.target.value;
            var checked=e.target.checked;
            //平面坐标
            const pingmianMap=L.tileLayer('http://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}', {
                maxZoom: 21,
                minZoom: 1,
                attribution: '&copy; <a href="http://www.tulibj.com">Gamma</a> tuli'
            });
            switch(value)
            {
                case '影像':
                    if(checked){
                        this.map.addLayer(ImgLayers);
                    }else{
                        this.map.removeLayer(ImgLayers);
                    }
                    break;
                case '标注':
                    if(checked){
                        this.map.addLayer(biaozhu);
                    }else{
                        this.map.removeLayer(biaozhu);
                    }
                    break;
                case '高铁':
                    break;
                default:

            }
        }
        geojsonmap(geojson) {
            const { dispatch } = this.props;
            if (geojson != null && geojson != "") {
                // var editlayer=new L.FeatureGroup();
                // this.map.addLayer(editlayer);
                this.jsonlayer= L.geoJSON(geojson, {
                    style: {
                        stroke:true,
                         color:'#59edca',
                         opacity: 1,
                         fillOpacity: 0.8,
                         fillColor: '#59edca',
                         weight:5
                    }
                }).bindPopup(function (layer) {

                    // var layeredit=new layer();
                    // return layer.feature.properties.description;
                    var latlngs=layer.feature.geometry.coordinates[0];
                    //L.marker([39.61, -105.02]).bindPopup('This is Littleton, CO.').addTo(this.map);

                    if(layer.feature.geometry.type=="Polygon"){

                        editlayer.clearLayers();
                        editlayer.addLayer( L.polygon(layer._latlngs, {color: 'red'}));
                        titleWindowClose("true");
                    }else{
                        var polyline = L.polyline(latlngs, {color: 'black'})
                    }


                }).addTo(this.map);
            }
        }

        render()
        {

            const geojsonarr=this.props.geojsonarr;
            this.geojsonmap(geojsonarr);

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
                <div className="map" ref={ref => this.mapDiv = ref} />
                <Titlewindows/>
                <Popover placement="left" title="图层控制" className="" content={content}>
                    <img src={layer} title="图层控制" className="layercontrol"></img>
                </Popover>
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
Map.defaultProps = {};
