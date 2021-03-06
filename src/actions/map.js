import { callApi } from "../utils/apiUtils";
import {userMapByPage} from "../reducers/map";

export const SELECT_MAP_PAGE = "SELECT_MAP_PAGE";
export const INVALIDATE_MAP_PAGE = "INVALIDATE_MAP_PAGE";

export const MAP_REQUEST = "MAP_REQUEST";
export const MAP_SUCCESS = "MAP_SUCCESS";
export const MAP_FAILURE = "MAP_FAILURE";
export const DRAW_ADD_MAP = "DRAW_ADD_MAP";

var taskclassid=null;
var mapbandsvalue=null;
export function selectMapsPage(page) {
  return {
    type: SELECT_MAP_PAGE,
    page
  };
}
//绘制完成返回信息
export function drawAddMap(payload) {
    return function(payload) {
        return {
            type: DRAW_ADD_MAP,
            drawdata: payload.data,

        };
    };
}
//刷新地图数据
export function refreshData(mapbands,taskid) {
    mapbandsvalue=mapbands;
    taskclassid=taskid;
}
export function invalidateMapsPage(page) {
  return {
    type: INVALIDATE_MAP_PAGE,
    page
  };
}
function mapRequest() {
    return {
        type: MAP_REQUEST,
    };
}

// This is a curried function that takes page as argument,
// and expects payload as argument to be passed upon API call success.
function mapSuccess() {
    return function(payload) {
        return {
            type: MAP_SUCCESS,
            geojson: payload.data
        };
    };
}

// This is a curried function that takes page as argument,
// and expects error as argument to be passed upon API call failure.
function mapFailure() {
    return function(error) {
        return {
            type: MAP_FAILURE,
            error
        };
    };
}
export function fetchTopmapgeojson(queryRange,classId) {
    const config ={
        method: 'POST',
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({"queryRange":queryRange,"classId":classId})

    }
    const url = "/service/busdata/userTaskData";

    return callApi(
        url,
        config,
        mapRequest(),
        mapSuccess(),
        mapFailure()
    );
}
//绘制图形调用后台接口
export function DrawAddMap(geoJson,featype,taskGuid,feaGuid) {
    // alert("尽量了");
    const config ={
        method: 'POST',
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({"geoJson":geoJson,"featype":featype,"taskGuid":taskGuid,"feaGuid":feaGuid})
    }
    const url = "/service/busdata/saveData";

    return callApi(
        url,
        config,
        mapRequest(),
        mapSuccess(),
        mapFailure()
    );
}
function shouldFetchMap(state, page) {
  // Check cache first
  const map = state.userMapByPage[page];
  if (!map) {
    // Not cached, should fetch
    return true;
  }

  if (map.isFetching) {
    // Shouldn't fetch since fetching is running
    return false;
  }

  // Should fetch if cache was invalidate
  return map.didInvalidate;
}
export function fetchTopmapgeojsonIfNeeded() {
    return (dispatch, getState) => {
        return dispatch(fetchTopmapgeojson());
    };
}
export function fetchTopmapDrawAddMap() {
    return (dispatch, getState) => {
        return dispatch(DrawAddMap());
    };
}
