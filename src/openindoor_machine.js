import osmtogeojson from 'osmtogeojson/osmtogeojson.js';
import indoor_layers from './layers/indoor.json';
import footprint_layers from './layers/footprint.json';
import toolbox from './toolbox.js';
import centroid from '@turf/centroid';
import convex from '@turf/convex';
import polygonize from '@turf/polygonize';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';
import Controls from "./controls"
import { DOMParser } from '@xmldom/xmldom'


//                     let indoor_geojson = undefined;

//
//                                     -----------
//                                    |   Init    |
//                                     -----------
//                                               |
//                                               |- on_map_loaded()
//                                               |  -> data load: footprint data
//                                               |  -> data unload: overpass data
//                                               |  -> layout display: buildings / colored buildings
//                                               |  -> interaction: building selection
//                                               |  -> events:
//                                               |    -> register "mousemove" on building: building preselection
//                                               |    -> register "click" on building: trigger on_building_selected()
//                                               |
//                                              \|/
//                                     -----------
//                                    | Building  | Buildings shown
//                                     -----------
//                                               |
//       --------------->--------------          |
//      |                              |         |
//      |                              |         |
//      |                             \|/       \|/ 
//      |                              |         |
//      |                               ---------
//      |                                   |
//      |                                   |- on_building_selected()
//      |                                   |  -> data load: overpass data inside footprint
//      |                                   |  -> data unload: current footprint (layout)
//      |                                   |  -> layout display: shape / colored floors
//      |                                   |  -> interaction: level selection
//      |                                   |  -> events:
//      |                                   |    -> register "mousemove" on floors/shape
//      |                                   |    -> register "click" on floors/shape: trigger on_floor_selected()
//      |                                   |    -> unregister events on on PoIs
//      |                                   |
//      |                                  \|/
//      |                              -----------
//      |                             |   Floor   | Floors shown (buildings and raster ground also)
//      |                              -----------
//      |                                        |
//      |                                        |
//      |                                        |
//      |                                        |
//      |                          -------       |
//      |                         |     \|/     \|/
//      |                         |       -------
//      |                         |         |- on_floor_selected()
//      |                         |         |  -> filter on specific level data, display indoor map
//      |                         |         |  -> data load (if not yet loaded): overpass data inside footprint
//      |                         |         |  -> data unload (if not yet loaded): footprints
//      |                         |         |  -> layout display: indoor / all indoor data
//     /|\                        |         |  -> interaction: indoor POI selection
//      |                         |         |  -> events:
//      |                         |         |    -> register "mousemove" on PoIs
//      |                         |         |    -> register "click" on PoIs: trigger on_indoor_POI_selected()
//      |                         |         |    -> unregister PoI immersion (360, control...):
//      |                         |         |  -> other:
//      |                         |         |    -> unload POI data
//      |                         |         |
//      |                         |        \|/
//      |                         |    -----------
//      |                         |   |  Indoor   | Indoor shown (remove raster ground)
//      |                         |    -----------
//      |                         |    |   |    |
//      |    on_floor_selected() -|    |   |    |- on_indoor_POI_selected()
//      |                         |    |   |    |  -> interact with indoor POI
//      |                        /|\   |   |    |    -> 360 visit
//      |                         |    |   |    |    -> IoT control & monitoring
//      |                         |   \|/  |   \|/
//      |                          -----   |    |
//      |                                  |    |
//       ----------------------------------     |
//                                              |
//                                     -----------
//                                    |    PoI    |
//                                     -----------

class Abstractmachine {

    constructor(map) {
        if (this.constructor === Abstractmachine) {
            throw new TypeError('Abstract class "AbstractConfig" cannot be instantiated directly');
        }

    }

    do() {
        throw new Error('You must implement this function');
    }

    on_building_selected({ feature: {} }) {
        throw new Error('You must implement to_building function');
    }
    on_floor_selected({ feature: {} }) {
        throw new Error('You must implement to_floor function');
    }
    on_indoor_POI_selected({ feature: {} }) {
        throw new Error('You must implement to_indoor function');
    }
}

class machine extends Abstractmachine {

    constructor(map) {
        super(map);
        this.state = building_state;
        this.data_mode = "online"
        machine.controls = new Controls(map);
        let self = this;
        machine.controls.set_on_indoor_button_pushed(() => {
            self.setState(indoor_state)
        });
        machine.controls.set_on_floor_button_pushed(() => {
            self.setState(floor_state)
        });
        machine.controls.set_on_building_button_pushed(() => {
                self.setState(building_state)

                // unzoom
                // machine.map.flyTo({
                //     center: machine.map.getCenter(),
                //     zoom: 16
                // })

                // if (openIndoorMachine.getState().constructor.name !== building_state.constructor.name) {
                //     openIndoorMachine.setState(building_state)

                //     // show buildings
                //     map.setLayoutProperty("building-footprint", 'visibility', 'visible')

                //     map.setPaintProperty("indoor-tag", "line-opacity", 0)
                //     map.setPaintProperty("simple-tiles", "raster-opacity", 1)

                //     // Disable floors
                //     machine.map.setLayoutProperty("shape-area-extrusion-indoor-00", 'visibility', 'none')
                //     machine.map.off(
                //         'mousemove',
                //         'shape-area-extrusion-indoor-00',
                //         floor_state.on_floor_hover
                //     );
                //     machine.map.off(
                //         'click',
                //         'shape-area-extrusion-indoor-00',
                //         floor_state.on_floor_selected
                //     );

                //     // Disable clicked building
                //     machine.map.setFeatureState({
                //         source: 'footprint',
                //         sourceLayer: 'footprint',
                //         id: building_state.clickedBuildingId
                //     }, {
                //         click: false
                //     });
                // }
            })
            // machine.controls.set_change_level_action(({ level }) => {
            //     machine.getState().on_change_level_action({ level });
            // })
        machine.controls.set_change_level_action(({ level }) => {
            if (openIndoorMachine.getState().constructor.name === floor_state.constructor.name) {
                return floor_state.on_change_level_action({ level });
            } else if (openIndoorMachine.getState().constructor.name === indoor_state.constructor.name) {
                return indoor_state.on_change_level_action({ level });
            }
            // openIndoorMachine.getState().on_change_level_action({ level })
        });


        let dropZone = document.getElementById('map');
        dropZone.addEventListener('drop', this.handleGeojsonDropped, false);
        dropZone.addEventListener('dragover', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('dragover !')
            e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        }, false);

        // this.indoor_geojson = undefined;
        // machine.INDOOR_LAYER = JSON.parse(JSON.stringify(indoor_layers));
    }

    static setLevel(level) {
        machine.controls.setLevel(level)
    }
    static getLevel(level) {
        return machine.controls.getLevel()
    }
    static controls = undefined;
    static floors_data = undefined;
    static indoor_data = undefined;
    // static indoor_flat_data = undefined;
    static map = undefined;
    // static indoor_geojson = undefined;
    static INDOOR_LAYER = undefined;
    // static getSource(type) {
    //     switch (type) {
    //         case "building":
    //             return "footprint";
    //         case "floor":
    //             return "shape_source";
    //         case "indoor":
    //             return "indoor_source";


    //     }
    // }

    // unselect({ next_feature }) {
    //     this.state.unselect({ next_feature: next_feature });
    // }

    // static unselect({ selectedFeature }) {
    //     if (hovered.type === 'floor') {
    //         let oldLevel_features = machine.indoor_data.features.filter(
    //             function(feature) {
    //                 return (feature.properties.min_level >= parseInt(hovered.feature.properties.min_level)) &&
    //                     (feature.properties.min_level < parseInt(hovered.feature.properties.min_level) + 1)
    //             }
    //         )
    //         for (let feature of oldLevel_features) {
    //             machine.map.setFeatureState({
    //                 source: 'shape_source',
    //                 id: feature.id
    //             }, {
    //                 hover: false
    //             });
    //         }
    //         return;
    //     }
    //     if (hovered.type === 'indoor') {
    //         // Invalidate other hovered
    //         if (hovered.feature !== undefined && hovered.feature.id !== undefined && hovered.feature.id !== selectedFeature.id) {
    //             machine.map.setFeatureState({
    //                 source: machine.getSource(hovered.type),
    //                 id: hovered.feature.id
    //             }, {
    //                 hover: false
    //             });
    //         }
    //         return;
    //     }
    // }
    do() {
        this.state.do()
    }

    // getIndoorGeojson() {
    //     return this.indoor_geojson;
    // }
    // setIndoorGeojson(indoor) {
    //     this.indoor_geojson = indoor;
    // }


    setState(state) {
        this.state = state
        this.state.do()
    }
    getState() {
        return this.state;
    }
    on_building_selected({ feature: {} }) {
        this.state.on_building_selected({ feature })
    }
    on_floor_selected() {}
    on_indoor_POI_selected() {}


    setFeatureState({ source, id, property } = {}) {
        let feature_ref = {
            source: source,
            id: id
        }

        // if (openIndoorMachine.getState().constructor.name === floor_state.constructor.name) {
        //     return floor_state.on_change_level_action({ level });

        if (openIndoorMachine.data_mode === "online" &&
            openIndoorMachine.getState().constructor.name === building_state.constructor.name) {
            feature_ref.sourceLayer = source;
        }
        // console.log('feature_ref:', feature_ref)
        // console.log('property:', property)
        machine.map.setFeatureState(feature_ref, property);

    }
    handleGeojsonDropped(e) {
        e.stopPropagation();
        e.preventDefault();
        console.log('handleGeojsonDropped !');
        let files = e.dataTransfer.files;
        let reader = new FileReader();
        reader.onerror = function(e) {};
        reader.onprogress = function(e) {}
        reader.onabort = function(e) {};
        reader.onloadstart = function(e) {};
        let self = this;
        reader.onload = function(e) {
            let text = e.target.result; // INPUT IS TEXT FILE
            let re = /(?:\.([^.]+))?$/;
            let ext = re.exec(files[0].name)[1];
            let geojson;
            if (ext === "geojson") {
                geojson = JSON.parse(text);
                console.log('-geojson:', geojson)
            } else if (ext === "osm") {
                console.log('text:', text);
                let data = (new DOMParser()).parseFromString(
                    text,
                    'text/xml'
                );
                geojson = osmtogeojson(
                    data, {
                        flatProperties: true,
                        polygonFeatures: function() { return true }
                    }
                )
            }
            // console.log('name:', files[0].name)
            // if ()
            // let geojson = JSON.parse(text);



            openIndoorMachine.data_mode = "drag_n_drop"


            geojson.features = geojson.features.filter(feat_ => (feat_.properties !== null))
                // Set ids and fix properties
            if (geojson.features.filter(feat_ => isNaN(feat_.id)).length > 0) {
                let i = 0;
                for (let feat_ of geojson.features) {
                    // let polygons = polygonize(feat_)
                    i++;
                    feat_.id = i;
                    feat_.properties.osm_id = "x" + i;
                    // feat_.geometry = polygons[0].geometry;
                }
            }
            console.log('geojson:', geojson)
            toolbox.fix_indoor(geojson)

            machine.floors_data = geojson;

            machine.indoor_data = geojson;
            for (let layer of footprint_layers) {
                if (machine.map.getLayer(layer.id) === undefined)
                    continue;
                machine.map.removeLayer(layer.id);
            }
            machine.map.removeSource('footprint');
            // let my_convex = convex(geojson);
            // console.log('my_convex:', my_convex)
            // let building_data = convex(geojson);



            let building_data = {
                type: "FeatureCollection",
                features: geojson.features.filter(feat_ => ('building' in feat_.properties))
            }

            for (let feat_ of building_data.features.filter(feat__ => feat__.geometry.type !== "Point")) {
                let polygons = polygonize(feat_)
                    // console.log('feat_:', feat_)
                    // console.log('polygons:', polygons)
                feat_.geometry = polygons.features[0].geometry;
            }

            console.log('building_data:', building_data)
                // building_data.id = 1;
                // console.log('building_data:', building_data)

            // building_data.features[0].id = 1;
            machine.map.addSource('footprint', {
                "type": "geojson",
                "data": building_data
            });
            for (let layer of footprint_layers) {
                if (machine.map.getLayer(layer.id) !== undefined)
                    continue;
                delete layer["source-layer"];
                machine.map.addLayer(layer);
            }

            machine.map.getSource("shape_source").setData(machine.floors_data);
            machine.map.getSource("indoor_source").setData(machine.indoor_data);

            let center = centroid(machine.floors_data).geometry.coordinates;
            console.log('center:', center);
            machine.map.flyTo({
                center: center,
                zoom: 16
            });
            openIndoorMachine.setState(building_state);

            // console.log()
        }
        reader.readAsText(files[0]);
        // console.log('files[0]:', files[0]);
    }
}

class Init extends Abstractmachine {

    constructor(map) {
        super(map);
    }

    on_building_selected({ feature: {} }) {}
    on_floor_selected({ feature: {} }) {}
    on_indoor_POI_selected({ feature: {} }) {}
}

class Building extends Abstractmachine {

    constructor(map) {
        super(map);
        this.hovered = {
            feature: undefined
        }
        this.selected = {
            feature: undefined
        }
        this.hoveredBuildingId = undefined;
        this.oldBuildingId = undefined;
        // this.map = map;
        // console.log("map-:", this.map)

        this.clickedBuildingId = undefined;
        this.oldClickedBuildingId = undefined;
        this.loadingId = undefined

        this.hoveredPinsId = undefined;
        this.oldTextId = undefined;
    }

    do() {
        let self = this

        // this.hovered = {
        //     type: undefined, // "footprint", "floor", "indoor", "poi"
        //     feature: undefined
        // }

        machine.controls.disable_building_button();
        machine.controls.disable_floor_button();
        machine.controls.disable_indoor_button();


        // unzoom
        // machine.map.flyTo({
        //     center: machine.map.getCenter(),
        //     zoom: 16
        // })

        machine.controls.deactivateLevelControl();

        machine.map.setMaxZoom(24);
        machine.map.setMinZoom(0);

        // Enable raster tiles
        if (machine.map.getLayer("simple-tiles") !== undefined)
            machine.map.setPaintProperty("simple-tiles", "raster-opacity", 1)


        // Enable buildings
        if (machine.map.getLayer("building-footprint") !== undefined)
            machine.map.setLayoutProperty("building-footprint", 'visibility', 'visible')

        // Disable floors
        if (machine.map.getLayer("shape-area-extrusion-indoor-00") !== undefined)
            machine.map.setLayoutProperty("shape-area-extrusion-indoor-00", 'visibility', 'none')

        // Disable indoor
        for (let layer_ of indoor_layers) {
            if (machine.map.getLayer(layer_.id) !== undefined)
                machine.map.setLayoutProperty(layer_.id, 'visibility', 'none')
        }

        machine.map.on(
            'mousemove',
            'building-footprint',
            (e) => {
                if (!('features' in e && e.features.length > 0))
                    return
                let feature = e.features[0]
                self.on_building_hover({
                    feature: feature
                })
            }
        );

        let on_building_click_e = (e) => {
            if (!('features' in e && e.features.length > 0))
                return
                // let buildings = e.features.filter((feature) => feature.geometry.type === "Polygon")
                // if (buildings.length === 0)
                //     return;
                // let feature = buildings[0]

            let feature = e.features[0]
            console.log('feature:', feature)
            self.on_building_selected({
                feature: feature,
                disable: () => {
                    machine.map.off(
                        'click',
                        'building-footprint',
                        on_building_click_e
                    )
                }
            })
        }
        machine.map.on('click', 'building-footprint', on_building_click_e);

        let on_pins_over_e = (e) => {
            if (!('features' in e && e.features.length > 0))
                return
            let feature = e.features[0]
                // console.log('feature:', feature)
            self.on_pins_over({
                feature: feature,
                disable: () => {
                    machine.map.off(
                        'click',
                        'pins-layer',
                        on_pins_over_e
                    )
                }
            })
        }
        machine.map.on('click', 'pins-layer', on_pins_over_e)
    }

    on_pins_hover({ pins_feature }) {
        if ('id' in pins_feature && pins_feature.id !== building_state.oldTextId) {
            if (building_state.oldTextId !== undefined) {
                openIndoorMachine.setFeatureState({
                    source: 'pins',
                    id: building_state.oldTextId,
                    property: {
                        hover: false
                    }
                })
            }
            building_state.hoveredPinsId = pins_feature.id;
            // console.log('active:', hoveredPinsId)
            openIndoorMachine.setFeatureState({
                source: 'pins',
                id: building_state.hoveredPinsId,
                property: {
                    hover: true
                }
            })
            building_state.oldTextId = building_state.hoveredPinsId;
        }
    }

    unselect({ next_feature }) {
        // Invalidate other hovered
        if (this.hovered.feature !== undefined &&
            this.hovered.feature.id !== undefined &&
            next_feature.id !== undefined &&
            this.hovered.feature.id !== next_feature.id) {
            openIndoorMachine.setFeatureState({
                source: 'footprint',
                id: this.hovered.feature.id,
                property: {
                    hover: false
                }
            })

            // machine.map.setFeatureState({
            //     source: "footprint",
            //     sourceLayer: "footprint",
            //     id: this.hovered.feature.id
            // }, {
            //     hover: false
            // });
        }
    }

    on_building_hover({ feature: feature }) {
        building_state.unselect({ next_feature: feature })

        this.hovered.feature = feature
            // console.log('this.hovered.feature:', this.hovered.feature);
        openIndoorMachine.setFeatureState({
            source: 'footprint',
            id: this.hovered.feature.id,
            property: {
                hover: true
            }
        })
    }

    on_building_selected({ feature, disable }) {
        if (building_state.loadingId != undefined) {
            return
        }
        // if (!('id' in feature &&
        //         feature.id !== building_state.oldClickedBuildingId
        //     ))
        //     return

        //                     console.log("selectedBuilding:", e.features[0])
        this.selected = feature
        let selectedBuilding = feature

        // openIndoorMachine.on_building_selected(e.features[0])

        console.log("selectedBuilding:", selectedBuilding)
        if (building_state.oldClickedBuildingId !== undefined) {
            openIndoorMachine.setFeatureState({
                source: 'footprint',
                id: building_state.oldClickedBuildingId,
                property: {
                    click: false
                }
            })
        }

        // building_state.clickedBuildingId = selectedBuilding.properties.osm_id;
        building_state.clickedBuildingId = selectedBuilding.id;
        //                     console.log('active:', hoveredBuildingId)
        // console.log('building_state.clickedBuildingId:', building_state.clickedBuildingId)
        openIndoorMachine.setFeatureState({
            source: 'footprint',
            id: building_state.clickedBuildingId
        }, {
            click: true
        })

        // machine.map.setFeatureState({
        //     source: 'footprint',
        //     sourceLayer: 'footprint',
        //     id: building_state.clickedBuildingId
        // }, {
        //     click: true
        // });
        building_state.oldClickedBuildingId = building_state.clickedBuildingId;



        if (openIndoorMachine.data_mode === "drag_n_drop") {

            let levels = [...new Set(machine.floors_data.features.map(
                feature => {
                    return parseInt(feature.properties.min_level) || 0;
                }
            ))].sort(function(a, b) {
                return a - b;
            })
            machine.controls.setLevels(levels)

            machine.setLevel(levels[levels.length - 1])
            if (levels.length === 1) {
                openIndoorMachine.setState(indoor_state)
            } else {
                openIndoorMachine.setState(floor_state)
            }

        } else {
            building_state.loadingId = building_state.clickedBuildingId

            // console.log("hover feature:", selectedBuilding)
            let my_building = convex(selectedBuilding);

            console.log('convex:', my_building)

            // if (my_building.geometry.type)
            // let last_choice = my_building
            // console.log("my_building:", last_choice)
            let polygon = JSON.parse(JSON.stringify(my_building.geometry.coordinates[0]))

            // if (my_building.geometry.type === "MultiPolygon") {
            //     const lengths = my_building.geometry.coordinates[0].map(a => a.length);
            //     let index = lengths.indexOf(Math.max(...lengths));

            //     polygon = JSON.parse(JSON.stringify(my_building.geometry.coordinates[0][index]))

            //     // last_choice = {
            //     //     "type": "FeatureCollection",
            //     //     "features": [my_building]
            //     // }
            //     // console.log("my_building-:", last_choice)

            //     // last_choice = convex({
            //     //     "type": "FeatureCollection",
            //     //     "features": [my_building]
            //     // })
            //     // console.log("my_building--:", last_choice)


            // }
            // console.log("my_building-:", last_choice)

            // console.log("type:", last_choice.geometry.type)

            // my_building = turf.polygonSmooth(my_building, { iterations: 3 });

            // console.log("polygon:", polygon)


            let reverse = polygon.map(
                gps_a => {
                    return gps_a.reverse()
                }
            )
            let poly_ovp = reverse.flat().join(" ")
                // let request = '[out:json];nwr["indoor"]["level"](poly:"' + poly_ovp + '");out geom;'
            let request = '[out:json];nwr(poly:"' + poly_ovp + '");out geom;';
            // let request = '[out:json];nwr(poly:"' + poly_ovp + '");(._;>;);out geom;';
            console.log('request:', request.substring(0, 20) + "...")

            console.log("Going to fetch from overpass !!!")
            let self = building_state;



            let center = centroid(my_building).geometry.coordinates
            console.log('center:', center)


            wait_marker.setLngLat(center)
            el.style.display = "block";


            let my_geojson = fetch("https://overpass-api.openindoor.io/api/interpreter", {
                    method: 'POST',
                    body: request
                }).then(function(response) {
                    el.style.display = "none";

                    if (response.ok) {
                        return response.json();
                    } else {
                        console.log('Status:', response.status);
                    }
                }).then(function(json) {
                    //                     traitement du JSON
                    // console.log('json reply:', json)
                    console.log("Reply received !")

                    // floors data
                    machine.floors_data = osmtogeojson(
                        json, {
                            flatProperties: true,
                            polygonFeatures: function() { return true }
                        }
                    )
                    toolbox.fix_indoor(machine.floors_data)
                        // for (let feature of machine.floors_data.features) {
                        //     feature.id = parseInt(feature.properties.id.replace(/relation\/|way\/|node\//gi, ""))
                        // }

                    // indoor data
                    machine.indoor_data = osmtogeojson(
                        json, {
                            flatProperties: true,
                            polygonFeatures: function() { return false }
                        }
                    )
                    for (let feature of machine.indoor_data.features) {
                        feature.geometry = buffer(feature, 0.1, { units: 'meters' }).geometry
                    }
                    toolbox.fix_indoor(machine.indoor_data)
                        // for (let feature of machine.indoor_data.features) {
                        //     feature.id = parseInt(feature.properties.id.replace(/relation\/|way\/|node\//gi, ""))
                        // }

                    // Manage available levels
                    let levels = [...new Set(machine.floors_data.features.map(
                        feature => {
                            return parseInt(feature.properties.min_level) || 0;
                        }
                    ))].sort(function(a, b) {
                        return a - b;
                    })
                    machine.controls.setLevels(levels)

                    // console.log('machine.indoor_data', machine.indoor_data)

                    // if (machine.map.getLayer("simple-tiles") != undefined) {
                    //     machine.map.removeLayer("simple-tiles");
                    // }
                    //                     console.log("simple_tiles_layer:", simple_tiles_layer)
                    // if (machine.map.getSource("raster-tiles") != undefined) {
                    //     machine.map.removeSource("raster-tiles");
                    // }
                    console.log('indoor_geojson:', machine.indoor_data)
                    machine.map.getSource("shape_source").setData(machine.floors_data);
                    machine.map.getSource("indoor_source").setData(machine.indoor_data);
                    // machine.map.getSource("indoor_flat_source").setData(machine.indoor_data);

                    self.loadingId = undefined
                        //                     map.setLayoutProperty("building-footprint", 'visibility', 'none')
                        // machine.map.removeLayer("pins-layer")
                        // machine.map.removeSource("pins")

                    // machine.map.removeLayer("building-footprint")
                    // machine.map.removeSource("footprint")
                    // let hiddenFeatureId = selectedBuilding.properties.osm_id
                    // let buildingFilter = [
                    //         "all", ["!=", ["get", "geometry_type"], "ST_MultiPolygon"],
                    //         ["!=", ["get", "osm_id"], hiddenFeatureId]
                    //     ]
                    //     // console.log('buildingFilter:', buildingFilter)
                    // machine.map.setFilter(
                    //     "building-footprint", buildingFilter
                    // )

                    // Disable other buildings
                    machine.map.setLayoutProperty("building-footprint", 'visibility', 'none')

                    openIndoorMachine.setFeatureState({
                        source: 'footprint',
                        id: building_state.clickedBuildingId
                    }, {
                        click: false
                    })

                    // machine.map.setFeatureState({
                    //     source: 'footprint',
                    //     sourceLayer: 'footprint',
                    //     id: building_state.clickedBuildingId
                    // }, {
                    //     click: false
                    // });

                    machine.setLevel(levels[levels.length - 1])
                    if (levels.length === 1) {
                        openIndoorMachine.setState(indoor_state)
                    } else {
                        openIndoorMachine.setState(floor_state)
                    }

                    // selectedBuilding
                })
                // .catch(function(error) {
                //     console.trace();
                //     console.log('fetch() failure: ' + error.message);
                // });
        }

        // Deactivate building selection
        disable()


    }
    on_floor_selected() {}
    on_indoor_POI_selected() {}
}

class Floor extends Abstractmachine {

    constructor(map) {
        super(map);
        this.hovered = {
            feature: undefined
        }
        this.oldFloorId = undefined;
        this.oldLevel = undefined
        this.hoveredLevel = undefined
    }


    on_change_level_action({ level }) {
        let self = this;
        let feature = {
            type: "Feature",
            properties: {
                min_level: level
            }
        }
        return {
            before: () => {
                // Unselect previous level
                console.log('unselect previous level')
                floor_state.unselect({ next_feature: feature })
            },
            after: () => {
                console.log('select level:', feature.properties.min_level)
                floor_state.set_hover(feature)
            }
        }

    }
    set_hover(hover_feature) {
        this.hovered.type = 'floor'
        this.hovered.feature = hover_feature
        let level = machine.getLevel();
        let level_features = machine.indoor_data.features.filter(function(feature) {
            return (
                feature.properties.min_level >= level &&
                feature.properties.min_level < (level + 1)
            )
        })
        for (let feature of level_features) {
            openIndoorMachine.setFeatureState({
                source: 'shape_source',
                id: feature.id
            }, {
                hover: true
            })

            // machine.map.setFeatureState({
            //     source: 'shape_source',
            //     id: feature.id
            // }, {
            //     hover: true
            // });
        }
    }

    do() {
        let self = this;
        console.log('Switch to Floor State !')
        machine.controls.activateLevelControl();

        machine.controls.enable_building_button();
        machine.controls.disable_floor_button();
        machine.controls.disable_indoor_button();

        machine.map.setMaxZoom(24);


        // let center = centroid(building_state.selected).geometry.coordinates;
        // console.log('center:', center)

        let bb = bbox(machine.floors_data)
        console.log('bbox:', bb)
        machine.map.fitBounds([
            [bb[0], bb[1]],
            [bb[2], bb[3]],
        ], {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            mazZoom: 18
        })


        // machine.map.flyTo({
        //     center: center,
        //     zoom: 19
        // })


        // Enable raster tiles
        machine.map.setPaintProperty("simple-tiles", "raster-opacity", 0)

        // Enable floors
        machine.map.setLayoutProperty("shape-area-extrusion-indoor-00", 'visibility', 'visible')

        // Disable building
        // if (machine.map.getLayer('building-footprint') !== undefined)
        machine.map.setLayoutProperty("building-footprint", 'visibility', 'none')

        // Enable indoor
        // for (let layer of indoor_layers.filter(layer => layer.type === "line")) {
        for (let layer of indoor_layers) {
            // console.log("layer:", layer)
            machine.map.setLayoutProperty(layer.id, "visibility", "none")
        }

        machine.map.setMaxZoom(24);
        // machine.map.setMinZoom(17);

        let on_floor_hover_e = (e) => {
            if (!('features' in e && e.features.length > 0))
                return;

            let feature = e.features[0];
            self.on_floor_hover({
                feature: feature
            })
        }
        machine.map.on(
            'mousemove',
            'shape-area-extrusion-indoor-00',
            on_floor_hover_e
        );

        let on_floor_click_e = (e) => {
            if (!('features' in e && e.features.length > 0))
                return;

            let feature = e.features[0];
            self.on_floor_selected({
                feature: feature,
                disable: () => machine.map.off(
                    'mousemove',
                    'shape-area-extrusion-indoor-00',
                    on_floor_click_e
                )
            })
        }
        machine.map.on(
            'click',
            'shape-area-extrusion-indoor-00',
            on_floor_click_e
        );
    }

    unselect({ next_feature }) {
        console.log('unselect !!!')

        let level = machine.getLevel();
        // console.log('level:', level)
        let oldLevel_features = machine.indoor_data.features.filter(
            function(feature) {
                return (feature.properties.min_level >= level) &&
                    (feature.properties.min_level < level + 1)
            }
        )

        // console.log('oldLevel_features:', oldLevel_features)
        console.log('unselecting level:', level)

        for (let feature of oldLevel_features) {


            openIndoorMachine.setFeatureState({
                source: 'shape_source',
                id: feature.id
            }, {
                hover: false
            })

            // machine.map.setFeatureState({
            //     source: 'shape_source',
            //     id: feature.id
            // }, {
            //     hover: false
            // });
        }
    }

    on_floor_hover({ feature }) {
        self = this;
        // console.log("feature:", feature)
        // Remove all hovereds for the last hovered level
        if (!(
                ('properties' in feature) &&
                'id' in feature &&
                'min_level' in feature.properties
            ))
            return

        // console.log('feature:', feature)
        if (
            this.hovered.feature !== undefined &&
            parseInt(feature.properties.min_level) !== parseInt(this.hovered.feature.properties.min_level)
        ) {
            this.unselect({ next_feature: feature })
        }
        // console.log('hover for min_level:', feature.properties.min_level)

        machine.setLevel(parseInt(feature.properties.min_level))
            // if (feature.properties.min_level != machine.getLevel())
        this.set_hover(feature)

    }
    on_building_selected({ feature }) {
        console.log("feature:", feature)
    }

    on_floor_selected({ feature }) {
        let center = centroid(feature).geometry.coordinates
            // console.log("centroid:", centroid_)
            // machine.map.removeLayer('shape-area-extrusion-indoor-00')
            // machine.controls.deactivateLevelControl();
            // console.log('this.hovered.feature:', this.hovered.feature)
        console.log('click on level:', parseInt(this.hovered.feature.properties.min_level))
        machine.map.setMaxZoom(24);

        machine.map.flyTo({
            // center: machine.map.getCenter(),
            center: center,
            zoom: 20
        })
        Indoor.flying = true;

        openIndoorMachine.setState(indoor_state)


    }
    on_indoor_POI_selected() {}
}

class Indoor extends Abstractmachine {

    constructor(map) {
        super(map);
        this.hovered = {
            feature: undefined
        }
        this.popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false
        });
    }
    static flying = false;
    static zoom = 20




    on_change_level_action({ level }) {
        let self = this;
        let feature = {
            type: "Feature",
            properties: {
                min_level: level
            }
        }
        return {
            before: () => {},
            after: () => {
                indoor_state.filter_on_level({
                    level_min: level,
                    level_max: level + 1
                })
            }
        }
    }


    filter_on_level({ level_min, level_max }) {
        for (let layer of JSON.parse(JSON.stringify(indoor_layers))) {
            layer.filter = [
                    "all",
                    layer.filter, [
                        ">=", [
                            "to-number", [
                                "get",
                                "min_level"
                            ]
                        ],
                        level_min
                    ],
                    [
                        "<", [
                            "to-number", [
                                "get",
                                "min_level"
                            ]
                        ],
                        level_max
                    ]
                ].filter(filter => filter !== undefined)
                // console.log('layer.filter:', layer.filter)
            machine.map.setFilter(layer.id, layer.filter)

            // activate indoor layout

            // for (layer of indoor_layers.filter(layer => layer.)) {
            machine.map.setLayoutProperty("indoor-tag", "visibility", "visible")
                // }
                // console.log("filter:", machine.map.getFilter(layer.id))
        }

    }
    do() {
        let self = this;

        machine.controls.enable_building_button();
        machine.controls.enable_floor_button();
        machine.controls.disable_indoor_button();

        // Enable indoor layout
        // for (let layer of indoor_layers.filter(layer => layer.type === "line")) {
        for (let layer of indoor_layers) {
            // console.log("layer:", layer)
            machine.map.setLayoutProperty(layer.id, "visibility", "visible")
        }

        let level = machine.getLevel()
        self.filter_on_level({
            level_min: level,
            level_max: level + 1
        })

        // deactivate shape layout
        machine.map.setLayoutProperty("shape-area-extrusion-indoor-00", 'visibility', 'none')

        // deactivate raster layout
        machine.map.setPaintProperty("simple-tiles", "raster-opacity", 0)

        // deactivate building footprint layout
        machine.map.setLayoutProperty("building-footprint", 'visibility', 'none')



        // let centroid_ = centroid({
        //     "type": "FeatureCollection",
        //     "features": machine.indoor_data.features.filter(
        //         function(feature) {
        //             return feature.properties.level === hovered.feature.properties.level
        //         }
        //     )
        // })
        // console.log('centroid:', centroid_)

        // machine.map.on('sourcedata', function() {
        //     let sourceId = "indoor_source"
        //     if (machine.map.getSource(sourceId) && machine.map.isSourceLoaded(sourceId)) {
        //         // console.log('sourceId:', sourceId);
        //         const features = machine.map.querySourceFeatures(sourceId);

        //         console.log('indoor_source features loaded:', features);
        //     }
        // });
        let flyend = function(e) {
            if (!Indoor.flying)
                return

            machine.map.off('moveend', flyend);
            Indoor.flying = false;
            // machine.map.setMinZoom(18);




        }



        // machine.map.on('mouseover', 'indoor-tag', function(e) {
        //     // Change the cursor style as a UI indicator.
        //     machine.map.getCanvas().style.cursor = 'pointer';

        //     var coordinates = centroid(e.features[0]).geometry.coordinates.slice();
        //     console.log('coordinates:', coordinates)
        //     var description = e.features[0].properties.description;

        //     // Ensure that if the map is zoomed out such that multiple
        //     // copies of the feature are visible, the popup appears
        //     // over the copy being pointed to.
        //     while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        //         coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        //     }


        //     // Populate the popup and set its coordinates
        //     // based on the feature found.
        //     self.popup.setLngLat(coordinates).setHTML(description).addTo(map);
        // });

        // machine.map.on('mouseout', 'indoor-tag', function() {
        //     machine.map.getCanvas().style.cursor = '';
        //     self.popup.remove();
        // });



        machine.map.on('moveend', flyend);
        for (let layer of indoor_layers.filter(
                layer_ => (
                    layer_.type === "line" ||
                    layer_.type === "fill-extrusion"
                )
            )) {
            machine.map.on(
                'mousemove',
                layer.id,
                (e) => {
                    if ('features' in e && e.features.length > 0) {
                        let feature = e.features[0]
                            // console.log('feature:', feature)
                        self.on_indoor_hover({ feature: feature })
                    }
                }
            );
            machine.map.on('mouseenter', layer.id, function(e) {
                // Change the cursor style as a UI indicator.
                machine.map.getCanvas().style.cursor = 'pointer';

                // let coordinates = centroid(e.features[0]).geometry.coordinates;
                let coordinates = [e.lngLat.lng, e.lngLat.lat];
                // console.log('e:', e)
                // var coordinates = centroid(e.features[0]).geometry.coordinates.slice();
                // console.log('coordinates:', coordinates)
                var description = JSON.stringify(e.features[0].properties, null, 4).replace(/\n\r?/g, '<br />');

                // // Ensure that if the map is zoomed out such that multiple
                // // copies of the feature are visible, the popup appears
                // // over the copy being pointed to.
                // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                //     coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                // }


                // Populate the popup and set its coordinates
                // based on the feature found.
                self.popup.setLngLat(coordinates).setHTML(description).addTo(machine.map);
            });
            machine.map.on('mouseleave', layer.id, function() {
                machine.map.getCanvas().style.cursor = '';
                self.popup.remove();
            });
        }

        // let zoom_out = function(e) {
        //     // console.log('zoom:', machine.map.getZoom())
        //     if (this.zoom > machine.map.getZoom() && machine.map.getZoom() <= 15) {
        //         console.log('Time to zoom out !')
        //         machine.map.off(zoom_out)
        //         openIndoorMachine.setState(floor_state)
        //     }
        //     indoor_state.zoom = machine.map.getZoom()
        // }
        // machine.map.on(
        //     'zoom', zoom_out
        // )
    }

    unselect({ next_feature }) {
        // Invalidate other hovered
        if (indoor_state.hovered.feature !== undefined &&
            indoor_state.hovered.feature.id !== undefined &&
            indoor_state.hovered.feature.id !== next_feature.id) {

            openIndoorMachine.setFeatureState({
                source: "indoor_source",
                id: indoor_state.hovered.feature.id
            }, {
                hover: false
            })

            // machine.map.setFeatureState({
            //     source: "indoor_source",
            //     id: indoor_state.hovered.feature.id
            // }, {
            //     hover: false
            // });
        }
    }
    on_indoor_hover({ feature }) {
        // console.log('indoor feature hover:', feature);

        // if (feature.id === undefined)
        //     return;
        if (!('properties' in feature))
            return;

        indoor_state.unselect({ next_feature: feature })

        indoor_state.hovered.feature = feature
            // console.log('indoor_state.hovered:', indoor_state.hovered)


        openIndoorMachine.setFeatureState({
            source: "indoor_source",
            id: indoor_state.hovered.feature.id
        }, {
            hover: true
        })

        // machine.map.setFeatureState({
        //     source: "indoor_source",
        //     id: indoor_state.hovered.feature.id
        // }, {
        //     hover: true
        // });
        // change color
    }
    on_building_selected({ feature: {} }) {}
    on_floor_selected() {}
    on_indoor_POI_selected() {}
}

let openIndoorMachine = undefined;
let building_state = undefined;
let floor_state = undefined;
let indoor_state = undefined;


let el = document.createElement('div');
el.className = 'marker';
// el.classList.add('loader', 'recursive-circle');

// el.style.backgroundImage =
//     'url(https://placekitten.com/g/40/40/)';
// el.style.width = '40px';
// el.style.height = '40px';

el.addEventListener('click', function() {
    window.alert(marker.properties.message);
});

let wait_marker = new maplibregl.Marker(el)

function openindoor_machine(map) {
    console.log('indoor_layers:', indoor_layers)
    machine.map = map
    wait_marker
        .setLngLat([0, 0])
        .addTo(machine.map);

    building_state = new Building(map)
    floor_state = new Floor(map);
    indoor_state = new Indoor(map);
    openIndoorMachine = new machine(map);

    openIndoorMachine.do();
    return openIndoorMachine;
}

export default openindoor_machine;
//                     export indoor_geojson;