/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-assignment */

/**
*  A general purpose metric grid overlay for Leaflet.
*  Designed to show grids such as the British, Irish and UTM.
*  Such grids are composed of fixed size squares and were
*  traditionally used for estimating grid references on printed maps.
*  The grid is restricted to 100m, 1km, 10km or 100km intervals (more intervals would be possible but unusual).
*  Most grids repeat their numbering every 100km.
*  Grid lines will tend to straight as a Web Mercator map is zoomed in.
*  At low zooms, the minimum number of straight line segments are used to
*  draw grid lines that project as curves on Web Mercator.
*  Depends on proj4.js 2.5.0 or later
*  Author: bill.chadwick2@gmail.com
*  Inspired by lanwei@cloudybay.com.tw and Open Layers 3
*/

import L from "leaflet";
import proj4 from "proj4";

import { ATPOL } from "../../../main";

L.MetricGrid = L.Layer.extend({

	options: {

		proj4ProjDef: "must be provided", // must be provided
		bounds: [[0, 0], [0, 0]], // must be provided. First coord is bottom left, second is top right in [x,y] format
		clip: null, // optional, clip polygon in grid coordinates
		latLonClipBounds: null, // optional, Leaflet.LatLngBounds or equivalent array
		drawClip: false, // optional, when true, the clip bounds are drawn with the same pen as the grid
		hundredKmSquareFunc: function (e, n) { return ""; }, // optional, params are eastings and northings in metres

		showAxisLabels: [100, 1000, 10000], // show axis for listed grid spacings - omit 100000
		showAxis100km: false,
		showSquareLabels: [], // show square labels for listed grid spacings
		opacity: 0.7,
		weight: 2, // use 2 for best results, else label rub-out is less good (antialiased pixels)
		color: "#00f",
		fontSize: 16, // px, and the line height used to place and rub out labels
		fontFamily: "Verdana",
		fontWeight: "bold",
		density: 1,
		minInterval: 100, // minimum grid interval in metres
		maxInterval: 100000, // maximum grid interval in metres, the bounds values should be multiples of this
		minZoom: 4, // minimum zoom at which grid is drawn
	},

	// Pseudo class constructor
	initialize: function (options) {
		L.setOptions(this, options); // merge with default options above

		if (!this.options.fontColor) {
			this.options.fontColor = this.options.color;
		}
	},

	// Base class override
	onAdd: function (map) {
		this._map = map;

		if (!this._container) {
			this._initCanvas();
		}

		map._panes.overlayPane.appendChild(this._container);
		map.on("viewreset", this._reset, this);
		map.on("move", this._reset, this);
		map.on("moveend", this._reset, this);

		this._reset();
	},

	// Base class override
	onRemove: function (map) {
		map.getPanes().overlayPane.removeChild(this._container);
		map.off("viewreset", this._reset, this);
		map.off("move", this._reset, this);
		map.off("moveend", this._reset, this);
	},

	// Base class override
	addTo: function (map) {
		map.addLayer(this);
		return this;
	},

	// Base class override, unlikely to be needed
	getAttribution: function () {
		return this.options.attribution;
	},

	// MetricGrid method
	setOpacity: function (opacity) {
		this.options.opacity = opacity;
		this._updateOpacity();
		return this;
	},

	// MetricGrid method
	bringToFront: function () {
		if (this._canvas) {
			this._map._panes.overlayPane.appendChild(this._canvas);
		}
		return this;
	},

	// MetricGrid method
	bringToBack: function () {
		let pane = this._map._panes.overlayPane;
		if (this._canvas) {
			pane.insertBefore(this._canvas, pane.firstChild);
		}
		return this;
	},

	// Resolves options.proj4ProjDef to an object with forward([lng,lat])->[x,y]
	// and inverse([x,y])->[lng,lat]) methods.
	// proj4ProjDef is normally a proj4 definition string, but grids using a
	// projection proj4 doesn't implement (e.g. ATPOL's "ccon", see L.AtpolGrid)
	// can instead supply such an object directly.
	_getConverter: function () {
		let proj = this.options.proj4ProjDef;
		return (typeof proj === "string") ? proj4(proj) : proj;
	},

	// Private method to initialize a drawing canvas for the grid.
	// No animation support (yet).
	_initCanvas: function () {
		this._container = L.DomUtil.create("div", "leaflet-image-layer");
		this._canvas = L.DomUtil.create("canvas", "");
		this._updateOpacity();
		this._container.appendChild(this._canvas);

		// No canvas interactions, but bind canvas onload to our _onCanvasLoad
		L.extend(this._canvas, {
			onselectstart: L.Util.falseFn,
			onmousemove: L.Util.falseFn,
			onload: L.bind(this._onCanvasLoad, this),
		});
	},

	// Sets the clip region for a grid.
	// Useful at low zooms to prevent multiple grids drawing on top of each other.
	// See the demo for clipping of the British and Irish grids.
	// The clip path is specified in the options as an array of grid coordinates.
	// These should represent a simple closed polygon and start and end with the same point.
	// Individual points are an array of two coordinates - east/x then north/y.
	// The clip outline is drawn using the same pen (color and width) as the grid lines
	// Clipping is only used if one or more of the corners of the grid covering the visible map
	// lie outside of the clipping path.
	_setClip: function (ctx) {
		let map = this._map;
		let conv = this._getConverter();
		let i;

		if (this.options.clip) {
			// iterate the segments of the clip path
			let x2;
			let y2;
			let x1;
			let y1;
			let dX;
			let dY;
			let pts;
			let j;

			for (i = 0; i < (this.options.clip.length - 1); i += 1) {
				x2 = this.options.clip[i + 1][0];
				x1 = this.options.clip[i][0];
				y2 = this.options.clip[i + 1][1];
				y1 = this.options.clip[i][1];
				dX = x2 - x1;
				dY = y2 - y1;

				// interpolate a point along the line segment
				function _interpolate(frac) {
					return conv.inverse([x1 + (frac * dX), y1 + (frac * dY)]);
				}

				// get set of Web Mercator line segments fitted to this segment with a maximum error of 1 pixel
				pts = this._getPoints(_interpolate, 1.0, map);

				// draw the clip path segment
				j = 0;
				if (i == 0) {
					ctx.beginPath();
					ctx.moveTo(pts[0].x, pts[0].y);
					j = 1;
				}
				for (; j < pts.length; j += 1) {
					ctx.lineTo(pts[j].x, pts[j].y);
				}
			}

			// finish the path and set the clip region
			if (this.options.drawClip) {
				ctx.stroke();
			}
			ctx.clip();
		}
	},

	// sets a rectangular lat/lon clip
	// the latLonClipBounds should be [[bottom lat, left lon],[top lat, right lon]]
	// return is clip bounds in canvas coords
	_setLLClipBounds: function (ctx, map) {
		let b = L.latLngBounds(this.options.latLonClipBounds);
		let bl = map.latLngToContainerPoint(b.getSouthWest());
		let tr = map.latLngToContainerPoint(b.getNorthEast());

		ctx.beginPath();
		ctx.moveTo(bl.x, bl.y);
		ctx.lineTo(tr.x, bl.y);
		ctx.lineTo(tr.x, tr.y);
		ctx.lineTo(bl.x, tr.y);
		ctx.lineTo(bl.x, bl.y);

		// finish the path and set the clip region
		if (this.options.drawClip) {
			ctx.stroke();
		}
		ctx.clip();

		// LL bounds in canvas coords, for use when labelling
		return L.bounds(bl, tr);
	},

	// redraw the overlay after a map pan or zoom etc
	_reset: function () {
		let container = this._container;
		let canvas = this._canvas;
		let size = this._map.getSize();
		let lt = this._map.containerPointToLayerPoint([0, 0]);

		// position the canvas ontop of the map
		L.DomUtil.setPosition(container, lt);

		container.style.width = size.x + "px";
		container.style.height = size.y + "px";

		canvas.width = size.x;
		canvas.height = size.y;
		canvas.style.width = size.x + "px";
		canvas.style.height = size.y + "px";

		this._draw();
	},

	// fire a Layer loaded event
	_onCanvasLoad: function () {
		this.fire("load");
	},

	// internal opacity control
	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._canvas, this.options.opacity);
	},

	// Formats eastings or northings within a 100km square for axis / square labelling
	// Most grids repeat their numbering every 100km
	// If grid spacing < 1km, uses 3 digits,
	// else if grid spacing < 10km uses 2 digits,
	// else one digit
	_formatEastOrNorth(n, spacing) {
		let r;
		let h = Math.floor(n / 100000);
		n = n % 100000; // metres within 100km square

		if (spacing < 1000) {
			r = Math.floor(n / 100).toString();
			r = (r.length == 1) ? "0" + r : r;
			r = (r.length == 2) ? "0" + r : r;
		} else if (spacing < 10000) {
			r = Math.floor(n / 1000).toString();
			r = (r.length == 1) ? "0" + r : r;
		} else {
			r = Math.floor(n / 10000).toString();
		}

		// prepend hundreds of km in subscript
		if (this.options.showAxis100km) {
			let hs = h.toString();
			let i;
			for (i = (hs.length - 1); i >= 0; i--) {
				r = String.fromCharCode(hs.charCodeAt(i) + 8272) + r;
			}
		}

		return r;
	},

	// Formats eastings value for grid line labels
	// This shows distance within each 100 km grid square - most grid stytems work like this
	_format_eastings: function (eastings, spacing) {
		return this._formatEastOrNorth(eastings, spacing);
	},

	// Formats northings value for grid line labels
	// This shows distance within each 100 km grid square - most grid stytems work like this
	_format_northings: function (northings, spacing) {
		return this._formatEastOrNorth(northings, spacing);
	},

	// Calculates map scale at the center of map in metres per pixel
	// On a Web Mercator map, scale changes with latitude (y axis)
	_mPerPx: function () {
		// get map resolution by moving 1 pixel at the center
		let ll1 = this._map.getCenter();
		let p1 = this._map.project(ll1);
		let p2 = p1.add(new L.Point(1, 0));
		let ll2 = this._map.unproject(p2);
		return ll1.distanceTo(ll2);
	},

	// Determines graticule interval according to map scale
	// Because the grid can only be a power of 10 and map zooms are powers of two
	// some zooms will have small grid squares and some large.
	// The only way around this would be to introduce grids at decimal multiples of say 2 and 5 meters.
	// We don't do that as such a grid square can not be properly labeled.
	_calcInterval: function () {
		let mPerPx = this._mPerPx();

		// select the grid interval according to the map resolution
		// TODO make these limits into an option perhaps setting spacing by zoom
		let spacing;
		if (mPerPx <= 1) {
			spacing = 100;
		} else if (mPerPx <= 20) {
			spacing = 1000;
		} else if (mPerPx <= 175) {
			spacing = 10000;
		} else {
			spacing = 100000;
		}

		if (this.options.density)
			spacing = spacing / this.options.density;

		// limit to min/max interval
		if (spacing < this.options.minInterval) {
			spacing = this.options.minInterval;
		}
		if (spacing > this.options.maxInterval) {
			spacing = this.options.maxInterval;
		}

		return spacing;
	},

	// Finds the set of screen points corresponding to a grid line.
	// Most metric grid lines are nearly straight on a Web Mercator map, especially when zoomed in.
	// We use the minimum number of line segments that represent the actual grid line,
	// by chopping the grid line into a set of straight line segments that fit the grid line curve with less
	// than 1 screen pixel of error.
	// This approach can be used to draw e.g. a great circle on a Web Mercator map.
	// However if the WM curve of your line has a point of inflexion then you will need to
	// proceed in two parts about the inflexion.
	// There is an inflexion when a Great Circle crosses the equator on a WM map.
	//
	// The interpolate function should return the Lat/Lon of point a for a fraction of 0.0
	// and the Lat/Lon of point b for a fraction of 1.0.
	//
	// This code is adapted from OpenLayers 3
	//
	_getPoints: function (interpolate, tolerance, map) {
		let geoA = interpolate(0);
		let geoB = interpolate(1);

		let a = map.latLngToContainerPoint(L.latLng(geoA[1], geoA[0]));
		let b = map.latLngToContainerPoint(L.latLng(geoB[1], geoB[0]));
		let endPoint = b;

		let coords = [];
		let geoStack = [geoB, geoA];
		let stack = [b, a];
		let fractionStack = [1, 0];
		let fractions = {};
		let maxIterations = 1000;
		let geoM;
		let m;
		let fracA;
		let fracB;
		let fracM;
		let key;

		while (--maxIterations > 0 && fractionStack.length > 0) {
			// Pop the a coordinate off the stack
			fracA = fractionStack.pop();
			geoA = geoStack.pop();
			a = stack.pop();

			// Add the a coordinate if it has not been added yet
			key = fracA.toString();
			if (!fractions[key]) {
				coords.push(a);
				fractions[key] = true;
			}

			// Pop the b coordinate off the stack
			fracB = fractionStack.pop();
			geoB = geoStack.pop();
			b = stack.pop();

			// Find the m point between the a and b coordinates
			fracM = (fracA + fracB) / 2;
			geoM = interpolate(fracM);
			m = map.latLngToContainerPoint(L.latLng(geoM[1], geoM[0]));

			if (L.LineUtil.pointToSegmentDistance(m, a, b) < tolerance) {
				// If the m point is sufficiently close to the straight line, then we
				// discard it.  Just use the b coordinate and move on to the next line
				// segment.
				coords.push(b);
				key = fracB.toString();
				fractions[key] = true;
			} else {
				// Otherwise, we need to subdivide the current line segment.  Split it
				// into two and push the two line segments onto the stack.
				fractionStack.push(fracB, fracM, fracM, fracA);
				stack.push(b, m, m, a);
				geoStack.push(geoB, geoM, geoM, geoA);
			}
		}

		// If the iteration budget ran out mid-fit the tail of the line would be
		// missing, leaving a polyline that stops short of where it should end.
		// Close it off rather than drawing a truncated line.
		if (!fractions["1"]) {
			coords.push(endPoint);
		}

		return coords;
	},

	// Determine if a point lies inside a polygon
	// This is used to check if a point lies outside the clipping region.
	// vs is an array of 2d points [[x,y],,,]
	_inside: function (point, vs) {
	// ray-casting algorithm based on
	// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

		let x = point[0];
		let y = point[1];
		let i, j;

		let inside = false;
		for (i = 0, j = vs.length - 1; i < vs.length; j = i++) {
			let xi = vs[i][0], yi = vs[i][1];
			let xj = vs[j][0], yj = vs[j][1];

			let intersect = ((yi > y) != (yj > y))
				&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}

		return inside;
	},

	// Draw the grid.
	// We compute, in the current grid interval, a bounding box that contains the map view.
	// Then we draw vertical and horizontal grid lines for that box.
	// Then we optionally label the left and right axis, taking care to avoid colliding labels.
	// Then we optionally label each grid square in its bottom left corner.
	_draw: function () {
		let canvas = this._canvas;
		let map = this._map;

		if (L.Browser.canvas && map) {
			let zoom = map.getZoom();
			if (this.options.minZoom && zoom < this.options.minZoom)
				return;
			if (this.options.maxZoom && zoom > this.options.maxZoom)
				return;
			if (this.options.skipZoom && this.options.skipZoom.indexOf(zoom) > -1)
				return;

			let spacing = this._calcInterval();
			let conv = this._getConverter();
			let ctx = canvas.getContext("2d");

			// set up canvas for drawing and writing
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.lineWidth = this.options.weight;
			ctx.strokeStyle = this.options.color;
			ctx.fillStyle = this.options.fontColor;

			ctx.font = this.options.fontWeight + " " + this.options.fontSize + "px " + this.options.fontFamily;

			// the text height is simply the configured size - no need to dig it
			// back out of a font shorthand, which is ambiguous anyway since a
			// shorthand can lead with a numeric weight ("600 11px ...")
			let txtHeight = this.options.fontSize;
			let txtWidth = ctx.measureText("0").width;
			let i;

			// get bounds of map corners in grid projection
			let mapB = map.getBounds();
			let mapSW = mapB.getSouthWest();
			let mapNE = mapB.getNorthEast();
			let mapNW = mapB.getNorthWest();
			let mapSE = mapB.getSouthEast();
			let mapSWg = conv.forward([mapSW.lng, mapSW.lat]);
			let mapNEg = conv.forward([mapNE.lng, mapNE.lat]);
			let mapNWg = conv.forward([mapNW.lng, mapNW.lat]);
			let mapSEg = conv.forward([mapSE.lng, mapSE.lat]);

			// also the middles of the sides of the map
			let mapSMg = conv.forward([mapB.getCenter().lng, mapB.getSouth()]);
			let mapNMg = conv.forward([mapB.getCenter().lng, mapB.getNorth()]);
			let mapWMg = conv.forward([mapB.getWest(), mapB.getCenter().lat]);
			let mapEMg = conv.forward([mapB.getEast(), mapB.getCenter().lat]);

			// extend grid bounds to enclose the map corners
			let grdWx = Math.min(mapSWg[0], mapNWg[0]);
			let grdEx = Math.max(mapSEg[0], mapNEg[0]);
			let grdSy = Math.min(mapSWg[1], mapSEg[1]);
			let grdNy = Math.max(mapNWg[1], mapNEg[1]);

			// extend grid bounds to enclose the middles of the sides
			grdWx = Math.min(mapWMg[0], grdWx);
			grdEx = Math.max(mapEMg[0], grdEx);
			grdSy = Math.min(mapSMg[1], grdSy);
			grdNy = Math.max(mapNMg[1], grdNy);

			// round up/down based on the spacing
			grdWx = Math.floor(grdWx / spacing) * spacing;
			grdSy = Math.floor(grdSy / spacing) * spacing;
			grdEx = Math.ceil(grdEx / spacing) * spacing;
			grdNy = Math.ceil(grdNy / spacing) * spacing;

			let canvasClipBounds = null;
			if (this.options.clip) {
				// if any of the corners of our grid are outside the clip path then we need to clip
				// must do this before restricting to grid bounds

				let swInClip = this._inside([grdWx, grdSy], this.options.clip);
				let seInClip = this._inside([grdEx, grdSy], this.options.clip);
				let neInClip = this._inside([grdEx, grdNy], this.options.clip);
				let nwInClip = this._inside([grdWx, grdNy], this.options.clip);

				if ((!swInClip) || (!seInClip) || (!neInClip) || (!nwInClip)) {
					this._setClip(ctx);
				}
			} else if (this.options.latLonClipBounds) {
				canvasClipBounds = this._setLLClipBounds(ctx, map);
			}

			// Limit to grid bounds. We don't need to draw anything
			// if the map is way outside the area of the grid.
			if (grdWx < this.options.bounds[0][0]) {
				grdWx = Math.floor(this.options.bounds[0][0] / spacing) * spacing;
			}
			if (grdWx > this.options.bounds[1][0]) {
				return; // left of grid > east limit
			}
			if (grdEx > this.options.bounds[1][0]) {
				grdEx = Math.ceil(this.options.bounds[1][0] / spacing) * spacing;
			}
			if (grdEx < this.options.bounds[0][0]) {
				return; // right of grid < west limit
			}
			if (grdSy < this.options.bounds[0][1]) {
				grdSy = Math.floor(this.options.bounds[0][1] / spacing) * spacing;
			}
			if (grdSy > this.options.bounds[1][1]) {
				return; // south of grid > north limit
			}
			if (grdNy > this.options.bounds[1][1]) {
				grdNy = Math.ceil(this.options.bounds[1][1] / spacing) * spacing;
			}
			if (grdNy < this.options.bounds[0][1]) {
				return; // north of grid < south limit
			}

			let ww = canvas.width;
			let hh = canvas.height;

			// now draw lines
			let d = spacing;
			let d2 = d / 2;

			// Verticals of constant Eastings
			let h = grdNy - grdSy;
			for (let x = grdWx; x <= grdEx; x += d) {
				// interpolate northings from top to bottom
				function _interpolateY(frac) {
					return conv.inverse([x, grdNy - (frac * h)]);
				}

				let pts = this._getPoints(_interpolateY, 1.0, map);

				ctx.beginPath();
				ctx.moveTo(pts[0].x, pts[0].y);
				for (i = 1; i < pts.length; i++) {
					ctx.lineTo(pts[i].x, pts[i].y);
				}
				ctx.stroke();
			}

			// Horizontals of constant Northings
			let w = grdEx - grdWx;
			for (let y = grdSy; y <= grdNy; y += d) {
				// interpolate eastings from right to left
				function _interpolateX(frac) {
					return conv.inverse([grdEx - (frac * w), y]);
				}

				let pts = this._getPoints(_interpolateX, 1.0, map);

				ctx.beginPath();
				ctx.moveTo(pts[0].x, pts[0].y);
				for (i = 1; i < pts.length; i++) {
					ctx.lineTo(pts[i].x, pts[i].y);
				}
				ctx.stroke();
			}

			// Now the axis labels
			// We label the West and South axis at grid croosings that are on screen.
			// We label in the middle of the vertical or horizontal edge of a grid square,
			// like the OS do on their printed maps. This means the labels never collide.

			ctx.fillStyle = this.options.color; // for rub out
			let rubWidth = this.options.weight * 3;

			// Eastings axis labels
			if (this.options.showAxisLabels.indexOf(d) >= 0) {
				for (let x = grdWx; x <= grdEx; x += d) {
					for (let y = grdSy; y <= grdNy; y += d) {
						let ll = conv.inverse([x, y + d2]); // middle of vertical square edge
						let s = map.latLngToContainerPoint(L.latLng(ll[1], ll[0])); // screen point

						// check on screen and within grid bounds
						if ((s.x > 0) && (s.y < hh) && (x < this.options.bounds[1][0])) {
							if (this.options.clip) {
								if (!this._inside([x, y + d2], this.options.clip)) {
									continue;
								}
							} else if (this.options.latLonClipBounds) {
								if (!canvasClipBounds.contains([s.x, s.y])) {
									continue;
								}
							}

							let eStr = this._format_eastings(x, d);
							txtWidth = ctx.measureText(eStr).width;

							// rub out the bit of the grid line the text will be over
							ctx.globalCompositeOperation = "destination-out";
							ctx.fillRect(s.x - (rubWidth / 2), s.y - txtHeight, rubWidth, txtHeight * 1.2);
							ctx.globalCompositeOperation = "source-over";

							ctx.fillText(eStr, s.x - (txtWidth / 2), s.y);
							break;
						}
					}
				}
			}

			// Northings axis labels
			if (this.options.showAxisLabels.indexOf(d) >= 0) {
				for (let y = grdSy; y <= grdNy; y += d) {
					for (let x = grdWx; x <= grdEx; x += d) {
						let ll = conv.inverse([x + d2, y]); // middle of horizontal square edge
						let s = map.latLngToContainerPoint(L.latLng(ll[1], ll[0])); // screen point

						// check on screen and within grid bounds
						if ((s.x > 0) && (s.y < hh) && (y < this.options.bounds[1][1])) {
							if (this.options.clip) {
								if (!this._inside([x + d2, y], this.options.clip)) {
									continue;
								}
							} else if (this.options.latLonClipBounds) {
								if (!canvasClipBounds.contains([s.x, s.y])) {
									continue;
								}
							}

							let nStr = this._format_northings(y, d);
							txtWidth = ctx.measureText(nStr).width;

							// rub out the bit of the grid line the text will be over
							ctx.globalCompositeOperation = "destination-out";
							ctx.fillRect(s.x - txtWidth * 0.1, s.y - (rubWidth / 2), txtWidth * 1.2, rubWidth);
							ctx.globalCompositeOperation = "source-over";

							ctx.fillText(nStr, s.x, s.y + (txtHeight / 2));
							break;
						}
					}
				}
			}

			// Grid Square labels in bottom left of each square, with a 2px padding
			let str;
			if (this.options.showSquareLabels.indexOf(d) >= 0) {
				for (let y = grdSy; y <= grdNy; y += d) {
					for (let x = grdWx; x <= grdEx; x += d) {
						let ll = conv.inverse([x, y]); // bottom left corner of grid square
						let s = map.latLngToContainerPoint(L.latLng(ll[1], ll[0]));

						// check on screen and within grid bounds
						if ((s.x > 0) && (s.y < hh) && (x < this.options.bounds[1][0]) && (y < this.options.bounds[1][1])) {
							let nStr = this._format_northings(y, d);
							let eStr = this._format_eastings(x, d);
							let sq = this.options.hundredKmSquareFunc(x, y);
							str = sq;
							if (d < 100000) {
								str += eStr + nStr;
							}
							ctx.fillText(str, s.x + 2, s.y - 2);
						}
					}
				}
			}
		}
	},

});

// instance factory
L.metricGrid = function (options) {
	return new L.MetricGrid(options);
};

/** Definitions for a British Grid - EPSG code 27700
* Clip path avoids overlaying L.IrishGrid.
*/
L.BritishGrid = L.MetricGrid.extend({

	options: {
		proj4ProjDef: "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs",
		bounds: [[0, 0], [700000, 1300000]],
		clip: [[0, 0], [700000, 0], [700000, 1300000], [0, 1300000], [0, 700000],
			[100000, 650000], [150000, 600000], [190000, 550000], [200000, 500000], [200000, 400000], [0, 0]],
		hundredKmSquareFunc: function (e, n) {
			let osgbGridSquares // index by  Northing kM / 100, Easting kM / 100
				= [
					["SV", "SW", "SX", "SY", "SZ", "TV", "TW"],
					["SQ", "SR", "SS", "ST", "SU", "TQ", "TR"],
					["SL", "SM", "SN", "SO", "SP", "TL", "TM"],
					["SF", "SG", "SH", "SJ", "SK", "TF", "TG"],
					["SA", "SB", "SC", "SD", "SE", "TA", "TB"],
					["SV", "NW", "NX", "NY", "NZ", "OV", "OW"],
					["NQ", "NR", "NS", "NT", "NU", "OQ", "OR"],
					["NL", "NM", "NN", "NO", "NP", "OL", "OM"],
					["NF", "NG", "NH", "NJ", "NK", "OF", "OG"],
					["NA", "NB", "NC", "ND", "NE", "OA", "OB"],
					["HV", "HW", "HX", "HY", "HZ", "JV", "JW"],
					["HQ", "HR", "HS", "HT", "HU", "JQ", "JR"],
					["HL", "HM", "HN", "HO", "HP", "JL", "JM"],
				];
			let eSq = Math.floor(e / 100000);
			let nSq = Math.floor(n / 100000);
			return ((eSq < 7) && (nSq < 13) && (eSq >= 0) && (nSq >= 0)) ? osgbGridSquares[nSq][eSq] : "--";
		},
	},
});

// instance factory
L.britishGrid = function (options) {
	return new L.BritishGrid(options);
};

/** Definitions for a Irish Grid - EPSG code 29903 (TM75)
* Clip path avoids overlaying L.BritishGrid
*/
L.IrishGrid = L.MetricGrid.extend({

	options: {
		proj4ProjDef: "+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1.000035 +x_0=200000 +y_0=250000 +ellps=mod_airy +towgs84=482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15 +uni+units=m +no_defs",
		bounds: [[0, 0], [500000, 500000]],
		clip: [
			[0, 0],
			[290000, 0],
			[370000, 300000],
			[370000, 400000],
			[310000, 460000],
			[200000, 500000],
			[0, 500000],
			[0, 0]],
		hundredKmSquareFunc: function (e, n) {
			let irishGridSquares // index by Easting kM / 100, Northing kM / 100
				= [
					["V", "Q", "L", "F", "A"],
					["W", "R", "M", "G", "B"],
					["X", "S", "N", "H", "C"],
					["Y", "T", "O", "J", "D"],
					["Z", "U", "P", "K", "E"],
				];
			let eSq = Math.floor(e / 100000);
			let nSq = Math.floor(n / 100000);
			return ((eSq < 5) && (nSq < 5) && (eSq >= 0) && (nSq >= 0)) ? irishGridSquares[eSq][nSq] : "--";
		},
	},
});

// instance factory
L.irishGrid = function (options) {
	return new L.IrishGrid(options);
};

/** Definitions for UTM grid
*/

L.UtmGrid = L.MetricGrid.extend({

	options: {
		bounds: [[100000, 0], [900000, 9400000]],
	},

	initialize: function (zone, bSouth, options) {
		options.proj4ProjDef = "+proj=utm +zone=" + zone + " +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
		if (bSouth) {
			options.proj4ProjDef += " +south";
			options.bounds = [[100000, 600000], [900000, 10000000]];
		}

		options.hundredKmSquareFunc = function (e, n) {
			let r = "";

			// 100kM square UTM Easting letters, standard treatment (NIMA 8358.1 Appx B3)

			let UTMEast = [
				"ABCDEFGH", // zones 1,4, ...,   -400, -300, -200, -100, 0, 100, 200, 300 kM
				"JKLMNPQR", // zones 2,5, ...,
				"STUVWXYZ", // zones 3,6, ...,
			];

			// 100kM square UTM Northing letters, standard treatment (NIMA 8358.1 Appx B3)
			// repeat every 2000 kM
			// start at A at 0 Lat and go forwards for northern hemisphere
			// start at V at 0 Lat and go backwards for southern hemisphere

			let UTMNorthGroup1
				= [
					"ABCDEFGHJKLMNPQRSTUV", // odd numbered zones
					"FGHJKLMNPQRSTUVABCDE", // even numbered zones
				];

			let x = Math.floor(e / 100000);
			let y = Math.floor(n / 100000);
			let z = zone - 1;

			if (bSouth) {
				y -= 100;
			}

			if ((x >= 1) && (x <= 8)) {
				r = UTMEast[z % 3].charAt(x - 1);
			} else {
				r = "-";
			}

			if (y >= 0) {
				r += UTMNorthGroup1[z % 2].charAt(y % 20);// Northern Hemisphere
			} else {
				r += UTMNorthGroup1[z % 2].charAt(19 + ((y + 1) % 20));// Southern Hemisphere
			}
			return r;
		};

		L.setOptions(this, options);
	},

});

// instance factory
// constructor params are UTM zone 1..60 and boolean true for southern hemisphere
L.utmGrid = function (zone, bSouth, options) {
	return new L.UtmGrid(zone, bSouth, options);
};

/** The 100 km rows of the ATPOL grid that Poland actually reaches into.
*
* Indexed by row = y / 100 km (the code's *second* letter, A-G = 0-6); each
* entry is the [first, last+1] column index (the code's *first* letter, A-G
* = 0-6) covered by that row. So the covered squares are BA-GA, AB-GB, AC-GC,
* AD-GD, AE-GE, BF-GF and DG-GG - the rest of the 700x700 km ATPOL square
* falls outside Poland and is not drawn.
*/
const ATPOL_ROWS = [
	[1, 7], // row A - y   0-100 km
	[0, 7], // row B - y 100-200 km
	[0, 7], // row C - y 200-300 km
	[0, 7], // row D - y 300-400 km
	[0, 7], // row E - y 400-500 km
	[1, 7], // row F - y 500-600 km
	[3, 7], // row G - y 600-700 km
];

/** Definitions for the ATPOL botanical grid used across Poland.
*
* ATPOL's projection (PROJ calls it "ccon", a central conic projection - see
* https://proj.org/en/stable/operations/projections/ccon.html, whose own
* example is this exact grid) isn't implemented by proj4js, so rather than
* reimplementing its maths a second time, proj4ProjDef is a converter object
* built directly from the library's own (already exact, tested)
* ATPOL.latlon_to_xy / ATPOL.xy_to_latlon.
*
* Unlike the metric grids above, this class draws itself (_draw below) rather
* than reusing L.MetricGrid's drawing, because ATPOL differs from them in
* three ways that the base class has no room for:
*
*  - its y axis grows SOUTH from a NW origin, where the base class assumes
*    projected y grows north when working out which viewport edge is "south";
*  - its squares are named from their NW corner, not their SW one;
*  - its code is not "letters + eastings + northings" but letters followed by
*    digit *pairs* that interleave one northing and one easting digit each
*    (Warsaw is ED 26 27 42, not ED + "22" + "67"), so the base class's
*    separate easting/northing axis labels cannot spell an ATPOL code at all.
*
* The base class's axis labelling also placed each label at the first grid
* crossing it found on screen, which for tilted ATPOL lines jumps a whole
* square between neighbouring columns, and punched a destination-out "rub out"
* rectangle at every such spot - tearing gaps into the lines. This class
* labels whole squares with their real code instead, so neither applies.
*
* Only the grid's standard (non-subdivided) square sizes are drawn: 100 km,
* 10 km, 1 km and 100 m. The D/C/P subdivisions (halves/quarters/fifths of a
* square) aren't independent zoom levels of the grid, so they don't apply here.
*/
L.AtpolGrid = L.MetricGrid.extend({

	options: {
		// Kept in ATPOL's own units - km, x eastward, y southward from a NW
		// origin - since _draw below is ATPOL-specific and works in them
		// directly. No flipping to a north-positive system, no metres.
		proj4ProjDef: {
			forward: function (lonlat) {
				const xy = ATPOL.latlon_to_xy({ lon: lonlat[0], lat: lonlat[1] });
				return [xy.x, xy.y];
			},
			inverse: function (xy) {
				const ll = ATPOL.xy_to_latlon({ x: xy[0], y: xy[1] });
				return [ll.lon, ll.lat];
			},
		},

		bounds: [[0, 0], [700, 700]], // km
		region: ATPOL_ROWS,

		// Standard ATPOL square sizes in km, coarsest first. Each step of 10
		// adds one digit pair to the code (100 km = "ED", 10 km = "ED26", ...).
		levels: [100, 10, 1, 0.1],

		minCellPx: 40, // switch to a finer level once its squares are this big
		minLabelCellPx: 30, // don't label squares smaller than this
		labelPadding: 3,

		color: "#080",
		weight: 1, // squares of the current level
		majorWeight: 2, // squares of the enclosing 10x coarser level
		opacity: 0.7,
		fontSize: 12,
		fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
		fontWeight: "bold",
		labelHalo: "rgba(255, 255, 255, 0.85)",
		showLabels: true,
		minZoom: 5,
	},

	// Kills float noise from accumulating multiples of e.g. 0.1 km
	_atpolRound: function (v) {
		return Math.round(v * 1e6) / 1e6;
	},

	// Screen position of an ATPOL (x, y) in km
	_atpolPoint: function (x, y) {
		const ll = this._getConverter().inverse([x, y]);
		return this._map.latLngToContainerPoint(L.latLng(ll[1], ll[0]));
	},

	// The ATPOL km bounding box of the current viewport.
	// The grid's meridians converge, so the box is found by sampling right
	// round the viewport border rather than from its corners alone.
	// Returns null when nothing of the grid is in view.
	_atpolViewBox: function () {
		const conv = this._getConverter();
		const b = this._map.getBounds();

		// Keep the sampled window inside the latitudes/longitudes where the
		// conic projection still means something - far outside Poland its
		// formulas keep returning numbers, just not useful ones.
		const south = Math.max(b.getSouth(), 30);
		const north = Math.min(b.getNorth(), 70);
		const west = Math.max(b.getWest(), -10);
		const east = Math.min(b.getEast(), 50);
		if (north <= south || east <= west) return null;

		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		const add = function (lon, lat) {
			const p = conv.forward([lon, lat]);
			if (p[0] < minX) minX = p[0];
			if (p[0] > maxX) maxX = p[0];
			if (p[1] < minY) minY = p[1];
			if (p[1] > maxY) maxY = p[1];
		};

		const steps = 16;
		for (let i = 0; i <= steps; i += 1) {
			const f = i / steps;
			add(west + ((east - west) * f), south);
			add(west + ((east - west) * f), north);
			add(west, south + ((north - south) * f));
			add(east, south + ((north - south) * f));
		}

		const bounds = this.options.bounds;
		minX = Math.max(minX, bounds[0][0]);
		minY = Math.max(minY, bounds[0][1]);
		maxX = Math.min(maxX, bounds[1][0]);
		maxY = Math.min(maxY, bounds[1][1]);
		if (maxX <= minX || maxY <= minY) return null;

		return { minX, minY, maxX, maxY };
	},

	// Finest standard square size (km) whose squares are still big enough
	// on screen to be worth drawing
	_atpolCellKm: function () {
		const mPerPx = this._mPerPx();
		const levels = this.options.levels;
		let chosen = levels[0];
		for (let i = 0; i < levels.length; i += 1) {
			if ((levels[i] * 1000 / mPerPx) < this.options.minCellPx) break;
			chosen = levels[i];
		}
		return chosen;
	},

	// The y ranges (km) over which the vertical line at x km borders a square
	// that is inside the grid's region, as a list of [y0, y1] spans
	_atpolVerticalSpans: function (x) {
		const rows = this.options.region;
		const spans = [];
		let start = null;

		for (let r = 0; r < rows.length; r += 1) {
			const on = (x >= rows[r][0] * 100) && (x <= rows[r][1] * 100);
			if (on && start === null) {
				start = r;
			} else if (!on && start !== null) {
				spans.push([start * 100, r * 100]);
				start = null;
			}
		}
		if (start !== null) spans.push([start * 100, rows.length * 100]);

		return spans;
	},

	// Same for the horizontal line at y km. A line sitting exactly on a 100 km
	// row boundary borders the rows on both sides of it, so it runs as far as
	// the wider of the two.
	_atpolHorizontalSpans: function (y) {
		const rows = this.options.region;
		const r = Math.floor(y / 100);
		const onBoundary = Math.abs(y - (r * 100)) < 1e-9;

		let lo = Infinity;
		let hi = -Infinity;
		for (const i of onBoundary ? [r - 1, r] : [r]) {
			if (i < 0 || i >= rows.length) continue;
			lo = Math.min(lo, rows[i][0]);
			hi = Math.max(hi, rows[i][1]);
		}

		return (lo > hi) ? [] : [[lo * 100, hi * 100]];
	},

	// Is the square whose NW corner is (x, y) km inside the grid's region?
	_atpolCellInRegion: function (x, y) {
		const rows = this.options.region;
		const r = Math.floor(y / 100);
		if (r < 0 || r >= rows.length) return false;
		return (x >= rows[r][0] * 100) && (x < rows[r][1] * 100);
	},

	// The full ATPOL code of the square whose NW corner is (x, y) km.
	// Sampled at the square's centre so corner rounding can't tip it into a
	// neighbour, and asked for exactly the digit pairs this level implies.
	_atpolCellCode: function (x, y, cellKm) {
		const length = 2 + (2 * Math.round(Math.log10(100 / cellKm)));
		try {
			return ATPOL.xy_to_grid({ x: x + (cellKm / 2), y: y + (cellKm / 2) }, length).grid;
		} catch {
			return "";
		}
	},

	// Draws one grid line as a polyline fitted to its projected curve
	_atpolStroke: function (ctx, ax, ay, bx, by) {
		const conv = this._getConverter();
		const pts = this._getPoints(function (frac) {
			return conv.inverse([ax + ((bx - ax) * frac), ay + ((by - ay) * frac)]);
		}, 0.5, this._map);

		if (pts.length < 2) return;

		ctx.beginPath();
		ctx.moveTo(pts[0].x, pts[0].y);
		for (let i = 1; i < pts.length; i += 1) {
			ctx.lineTo(pts[i].x, pts[i].y);
		}
		ctx.stroke();
	},

	// Draws every grid line at multiples of step km that is in view, skipping
	// those that are also multiples of 10 * step when skipMajor is set (those
	// belong to the enclosing level and get drawn separately, thicker).
	// Lines are cut to the region here rather than with a canvas clip path:
	// clipping to a path made of the grid's own outer lines shaves half the
	// pen width off them, and does it unevenly along their length.
	_atpolDrawLines: function (ctx, step, view, skipMajor) {
		const bounds = this.options.bounds;
		const eps = 1e-9;

		const i0 = Math.max(Math.ceil((view.minX / step) - eps) - 1, Math.round(bounds[0][0] / step));
		const i1 = Math.min(Math.floor((view.maxX / step) + eps) + 1, Math.round(bounds[1][0] / step));
		for (let i = i0; i <= i1; i += 1) {
			if (skipMajor && (i % 10 === 0)) continue;
			const x = this._atpolRound(i * step);
			for (const span of this._atpolVerticalSpans(x)) {
				const y0 = Math.max(span[0], view.minY - step);
				const y1 = Math.min(span[1], view.maxY + step);
				if (y1 > y0) this._atpolStroke(ctx, x, y0, x, y1);
			}
		}

		const j0 = Math.max(Math.ceil((view.minY / step) - eps) - 1, Math.round(bounds[0][1] / step));
		const j1 = Math.min(Math.floor((view.maxY / step) + eps) + 1, Math.round(bounds[1][1] / step));
		for (let j = j0; j <= j1; j += 1) {
			if (skipMajor && (j % 10 === 0)) continue;
			const y = this._atpolRound(j * step);
			for (const span of this._atpolHorizontalSpans(y)) {
				const x0 = Math.max(span[0], view.minX - step);
				const x1 = Math.min(span[1], view.maxX + step);
				if (x1 > x0) this._atpolStroke(ctx, x0, y, x1, y);
			}
		}
	},

	// Labels each visible square with its own ATPOL code, anchored to the
	// square's NW corner - the corner ATPOL names its squares from - and
	// nudged onto screen so a square running off the edge stays labelled.
	_atpolDrawLabels: function (ctx, cellKm, view) {
		const o = this.options;
		const canvas = this._canvas;
		const pad = o.labelPadding;

		ctx.fillStyle = o.fontColor || o.color;
		ctx.font = o.fontWeight + " " + o.fontSize + "px " + o.fontFamily;
		ctx.textAlign = "left";
		ctx.textBaseline = "top";

		const textHeight = o.fontSize;

		const i0 = Math.max(Math.floor(view.minX / cellKm), 0);
		const i1 = Math.min(Math.floor(view.maxX / cellKm), Math.round(700 / cellKm) - 1);
		const j0 = Math.max(Math.floor(view.minY / cellKm), 0);
		const j1 = Math.min(Math.floor(view.maxY / cellKm), Math.round(700 / cellKm) - 1);

		for (let j = j0; j <= j1; j += 1) {
			for (let i = i0; i <= i1; i += 1) {
				const x = this._atpolRound(i * cellKm);
				const y = this._atpolRound(j * cellKm);
				if (!this._atpolCellInRegion(x, y)) continue;

				const nw = this._atpolPoint(x, y);
				const ne = this._atpolPoint(x + cellKm, y);
				const sw = this._atpolPoint(x, y + cellKm);
				const se = this._atpolPoint(x + cellKm, y + cellKm);

				// The grid is conic, so its meridians converge and a square
				// lands on screen as a quadrilateral rotated by up to about
				// four degrees (most in the west, furthest from the 19E central
				// meridian), not as a screen-aligned box. The label is
				// therefore placed along the square's *own* edges: measuring
				// off a bounding box instead puts its top several pixels above
				// the square's NW corner, which at 100 km is enough to leave
				// the label sitting on, or clean above, the top grid line.
				const ux = ne.x - nw.x; // along the top edge, eastward
				const uy = ne.y - nw.y;
				const vx = sw.x - nw.x; // along the left edge, southward
				const vy = sw.y - nw.y;
				const uLen = Math.hypot(ux, uy);
				const vLen = Math.hypot(vx, vy);
				if (uLen < o.minLabelCellPx || vLen < o.minLabelCellPx) continue;

				// cheap reject of squares that are wholly off canvas
				if (Math.max(ne.x, se.x) < 0 || Math.max(sw.y, se.y) < 0) continue;
				if (Math.min(nw.x, sw.x) > canvas.width || Math.min(nw.y, ne.y) > canvas.height) continue;

				let text = this._atpolCellCode(x, y, cellKm);
				if (!text) continue;

				// fall back to just this level's own digit pair when the full
				// code is wider than the square it has to sit in
				if ((ctx.measureText(text).width + (2 * pad)) > uLen && text.length > 2) {
					text = text.slice(-2);
				}
				const width = ctx.measureText(text).width;

				const unx = ux / uLen, uny = uy / uLen;
				const vnx = vx / vLen, vny = vy / vLen;

				// start one padding in from the NW corner along both edges
				let lx = nw.x + (unx * pad) + (vnx * pad);
				let ly = nw.y + (uny * pad) + (vny * pad);

				// Slide along the edges to bring the label on canvas, so a
				// square running off the edge still gets labelled. Done before
				// the clearance below, which only ever moves down and right.
				if (lx < 0 && unx > 0) {
					const t = -lx / unx;
					lx = 0;
					ly += uny * t;
				}
				if (ly < 0 && vny > 0) {
					const t = -ly / vny;
					lx += vnx * t;
					ly = 0;
				}

				// The text box is screen-aligned but the square is not, so the
				// two are squared up by measuring perpendicular to the square's
				// own top and left edges and pushing the box in until the worst
				// of its corners clears both by a padding. Nudging each axis
				// slightly disturbs the other, so two passes settle it.
				for (let pass = 0; pass < 2; pass += 1) {
					let dTop = Infinity;
					let dLeft = Infinity;
					for (const cx of [lx, lx + width]) {
						for (const cy of [ly, ly + textHeight]) {
							// signed distances, positive towards the interior
							dTop = Math.min(dTop, (unx * (cy - nw.y)) - (uny * (cx - nw.x)));
							dLeft = Math.min(dLeft, (vny * (cx - nw.x)) - (vnx * (cy - nw.y)));
						}
					}
					if (dLeft < pad && vny > 0) lx += (pad - dLeft) / vny;
					if (dTop < pad && unx > 0) ly += (pad - dTop) / unx;
				}

				// ...and having moved, it must still not reach the square's
				// far edges
				const alongU = ((lx - nw.x) * unx) + ((ly - nw.y) * uny);
				const alongV = ((lx - nw.x) * vnx) + ((ly - nw.y) * vny);
				if ((alongU + width + pad) > uLen) continue;
				if ((alongV + textHeight + pad) > vLen) continue;
				if (lx > canvas.width || ly > canvas.height) continue;

				if (o.labelHalo) {
					ctx.strokeStyle = o.labelHalo;
					ctx.lineWidth = 3;
					ctx.lineJoin = "round";
					ctx.strokeText(text, lx, ly);
				}
				ctx.fillText(text, lx, ly);
			}
		}
	},

	// Base class override - see the class comment for why ATPOL draws itself
	_draw: function () {
		const canvas = this._canvas;
		const map = this._map;
		if (!L.Browser.canvas || !map) return;

		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const zoom = map.getZoom();
		if (this.options.minZoom && zoom < this.options.minZoom) return;
		if (this.options.maxZoom && zoom > this.options.maxZoom) return;
		if (this.options.skipZoom && this.options.skipZoom.indexOf(zoom) > -1) return;

		const view = this._atpolViewBox();
		if (!view) return;

		const cellKm = this._atpolCellKm();
		const majorKm = (cellKm < this.options.levels[0]) ? cellKm * 10 : null;

		ctx.strokeStyle = this.options.color;
		ctx.lineCap = "butt";
		ctx.lineJoin = "round";

		// Finer lines first, then the enclosing coarser ones over the top, so
		// a square's own boundary always reads as the strongest line near it.
		if (majorKm !== null) {
			ctx.lineWidth = this.options.weight;
			this._atpolDrawLines(ctx, cellKm, view, true);
		}
		ctx.lineWidth = this.options.majorWeight;
		this._atpolDrawLines(ctx, majorKm === null ? cellKm : majorKm, view, false);

		if (this.options.showLabels) {
			this._atpolDrawLabels(ctx, cellKm, view);
		}
	},
});

// instance factory
L.atpolGrid = function (options) {
	return new L.AtpolGrid(options);
};
