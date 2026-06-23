import type { ATPOL } from "../../../main";

type LatLon = ATPOL.LatLon;
type Bounds_LatLon = ATPOL.Bounds_LatLon;

// ---- KML ----

export function generateKMLString(normalizedCode: string, bounds: Bounds_LatLon, sideLabel: string, inputPoint?: LatLon): string {
	const { center, nw, ne, se, sw } = bounds;
	const pointPlacemark = inputPoint
		? [
				`    <Placemark>`,
				`      <name>Wpisany punkt</name>`,
				`      <description>Współrzędne punktu:&#10;Lat (Szer): ${inputPoint.lat}&#10;Lon (Dł): ${inputPoint.lon}</description>`,
				`      <Point>`,
				`        <coordinates>${inputPoint.lon},${inputPoint.lat},0</coordinates>`,
				`      </Point>`,
				`    </Placemark>`,
			]
		: [
				`    <Placemark>`,
				`      <name>Środek kwadratu</name>`,
				`      <description>Środek dla: ${normalizedCode}</description>`,
				`      <Point>`,
				`        <coordinates>${center.lon},${center.lat},0</coordinates>`,
				`      </Point>`,
				`    </Placemark>`,
			];
	return [
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<kml xmlns="http://www.opengis.net/kml/2.2">`,
		`  <Document>`,
		...pointPlacemark,
		`    <Placemark>`,
		`      <name>${normalizedCode}</name>`,
		`      <description>Kwadrat ATPOL: ${normalizedCode}\nRozmiar: ${sideLabel}</description>`,
		`      <Style>`,
		`        <LineStyle><color>ff0000ff</color><width>1</width></LineStyle>`,
		`        <PolyStyle><fill>0</fill></PolyStyle>`,
		`      </Style>`,
		`      <Polygon>`,
		`        <tessellate>1</tessellate>`,
		`        <outerBoundaryIs>`,
		`          <LinearRing>`,
		`            <coordinates>`,
		`              ${nw.lon},${nw.lat},0`,
		`              ${ne.lon},${ne.lat},0`,
		`              ${se.lon},${se.lat},0`,
		`              ${sw.lon},${sw.lat},0`,
		`              ${nw.lon},${nw.lat},0`,
		`            </coordinates>`,
		`          </LinearRing>`,
		`        </outerBoundaryIs>`,
		`      </Polygon>`,
		`    </Placemark>`,
		`  </Document>`,
		`</kml>`,
	].join("\n");
}

export function downloadKML(normalizedCode: string, bounds: Bounds_LatLon, sideLabel: string, inputPoint?: LatLon): void {
	downloadBlob(
		generateKMLString(normalizedCode, bounds, sideLabel, inputPoint),
		`ATPOL_${normalizedCode}.kml`,
		"application/vnd.google-earth.kml+xml",
	);
}

// ---- GeoJSON ----

export function generateGeoJSONString(normalizedCode: string, bounds: Bounds_LatLon, sideLabel: string, inputPoint?: LatLon): string {
	const { center, nw, ne, se, sw } = bounds;
	const pointFeature = inputPoint
		? { type: "Feature", properties: { atpol: normalizedCode, name: "Wpisany punkt" }, geometry: { type: "Point", coordinates: [inputPoint.lon, inputPoint.lat] } }
		: { type: "Feature", properties: { atpol: normalizedCode, name: "Środek kwadratu" }, geometry: { type: "Point", coordinates: [center.lon, center.lat] } };
	const geojson = {
		type: "FeatureCollection",
		features: [
			pointFeature,
			{
				type: "Feature",
				properties: { atpol: normalizedCode, side: sideLabel },
				geometry: {
					type: "Polygon",
					// RFC 7946: exterior ring counter-clockwise
					coordinates: [[[sw.lon, sw.lat], [se.lon, se.lat], [ne.lon, ne.lat], [nw.lon, nw.lat], [sw.lon, sw.lat]]],
				},
			},
		],
	};
	return JSON.stringify(geojson, null, 2);
}

export function downloadGeoJSON(normalizedCode: string, bounds: Bounds_LatLon, sideLabel: string, inputPoint?: LatLon): void {
	downloadBlob(
		generateGeoJSONString(normalizedCode, bounds, sideLabel, inputPoint),
		`ATPOL_${normalizedCode}.geojson`,
		"application/geo+json",
	);
}

// ---- Shapefile (SHP + SHX + DBF + PRJ) in ZIP ----

const CRC32_TABLE: Uint32Array = (() => {
	const t = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
		t[i] = c;
	}
	return t;
})();

function crc32(data: Uint8Array): number {
	let c = 0xFFFFFFFF;
	for (const b of data) c = (CRC32_TABLE[(c ^ b) & 0xFF] as number) ^ (c >>> 8);
	return (c ^ 0xFFFFFFFF) >>> 0;
}

function bbox(bounds: Bounds_LatLon) {
	const { nw, ne, se, sw } = bounds;
	return {
		xmin: Math.min(nw.lon, ne.lon, se.lon, sw.lon),
		ymin: Math.min(nw.lat, ne.lat, se.lat, sw.lat),
		xmax: Math.max(nw.lon, ne.lon, se.lon, sw.lon),
		ymax: Math.max(nw.lat, ne.lat, se.lat, sw.lat),
	};
}

function writeShpFileHeader(v: DataView, fileLenWords: number, xmin: number, ymin: number, xmax: number, ymax: number): void {
	v.setInt32(0, 9994, false);
	v.setInt32(24, fileLenWords, false);
	v.setInt32(28, 1000, true);
	v.setInt32(32, 5, true); // Polygon
	v.setFloat64(36, xmin, true);
	v.setFloat64(44, ymin, true);
	v.setFloat64(52, xmax, true);
	v.setFloat64(60, ymax, true);
}

function generateSHP(bounds: Bounds_LatLon): Uint8Array {
	const { nw, ne, se, sw } = bounds;
	const pts = [nw, ne, se, sw, nw]; // CW as required by ESRI for exterior rings
	const { xmin, ymin, xmax, ymax } = bbox(bounds);
	// 100 file-hdr + 8 rec-hdr + 128 rec-content (4+32+4+4+4+5*16) = 236 bytes
	const buf = new Uint8Array(236);
	const v = new DataView(buf.buffer);
	writeShpFileHeader(v, 118, xmin, ymin, xmax, ymax); // 236/2=118 words
	v.setInt32(100, 1, false); // record number (1-based, big-endian)
	v.setInt32(104, 64, false); // content length in 16-bit words (128/2)
	let o = 108;
	v.setInt32(o, 5, true); o += 4;
	v.setFloat64(o, xmin, true); o += 8;
	v.setFloat64(o, ymin, true); o += 8;
	v.setFloat64(o, xmax, true); o += 8;
	v.setFloat64(o, ymax, true); o += 8;
	v.setInt32(o, 1, true); o += 4; // num parts
	v.setInt32(o, 5, true); o += 4; // num points
	v.setInt32(o, 0, true); o += 4; // parts[0]
	for (const pt of pts) {
		v.setFloat64(o, pt.lon, true); o += 8;
		v.setFloat64(o, pt.lat, true); o += 8;
	}
	return buf;
}

function generateSHX(bounds: Bounds_LatLon): Uint8Array {
	const { xmin, ymin, xmax, ymax } = bbox(bounds);
	const buf = new Uint8Array(108); // 100 hdr + 8 one index record
	const v = new DataView(buf.buffer);
	writeShpFileHeader(v, 54, xmin, ymin, xmax, ymax); // 108/2=54 words
	v.setInt32(100, 50, false); // SHP record offset in 16-bit words (100 bytes / 2)
	v.setInt32(104, 64, false); // record content length in 16-bit words
	return buf;
}

function generateDBF(normalizedCode: string): Uint8Array {
	const code = normalizedCode.slice(0, 10).padEnd(10, " ");
	const now = new Date();
	const headerSize = 65; // 32 file-hdr + 32 field-desc + 1 terminator
	const recordSize = 11; // 1 deletion-flag + 10 char
	const buf = new Uint8Array(headerSize + recordSize);
	const v = new DataView(buf.buffer);
	buf[0] = 3; // dBASE III
	buf[1] = now.getFullYear() - 1900;
	buf[2] = now.getMonth() + 1;
	buf[3] = now.getDate();
	v.setInt32(4, 1, true);
	v.setInt16(8, headerSize, true);
	v.setInt16(10, recordSize, true);
	"ATPOL".split("").forEach((c, i) => { buf[32 + i] = c.charCodeAt(0); });
	buf[42] = 0x43; // field type 'C'
	buf[47] = 10; // field length
	buf[64] = 0x0D; // header terminator
	buf[headerSize] = 0x20; // not-deleted flag
	for (let i = 0; i < 10; i++) buf[headerSize + 1 + i] = code.charCodeAt(i);
	return buf;
}

const PRJ_WGS84 = `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`;

function createZip(files: { name: string; data: Uint8Array | string }[]): Uint8Array {
	const enc = new TextEncoder();
	const entries = files.map(({ name, data }) => {
		const nameBytes = enc.encode(name);
		const dataBytes = data instanceof Uint8Array ? data : enc.encode(data as string);
		return { nameBytes, dataBytes, crc: crc32(dataBytes) };
	});

	const localParts: Uint8Array[] = [];
	const offsets: number[] = [];
	let pos = 0;

	for (const { nameBytes, dataBytes, crc } of entries) {
		offsets.push(pos);
		const lh = new Uint8Array(30 + nameBytes.length);
		const lv = new DataView(lh.buffer);
		lv.setUint32(0, 0x04034B50, true); // local file header signature
		lv.setUint16(4, 20, true);
		lv.setUint32(14, crc, true);
		lv.setUint32(18, dataBytes.length, true);
		lv.setUint32(22, dataBytes.length, true);
		lv.setUint16(26, nameBytes.length, true);
		lh.set(nameBytes, 30);
		localParts.push(lh, dataBytes);
		pos += lh.length + dataBytes.length;
	}

	const cdOffset = pos;
	const cdParts: Uint8Array[] = [];

	for (let i = 0; i < entries.length; i++) {
		const { nameBytes, dataBytes, crc } = entries[i]!;
		const cd = new Uint8Array(46 + nameBytes.length);
		const cv = new DataView(cd.buffer);
		cv.setUint32(0, 0x02014B50, true); // central directory signature
		cv.setUint16(4, 20, true);
		cv.setUint16(6, 20, true);
		cv.setUint32(16, crc, true);
		cv.setUint32(20, dataBytes.length, true);
		cv.setUint32(24, dataBytes.length, true);
		cv.setUint16(28, nameBytes.length, true);
		cv.setUint32(42, offsets[i]!, true);
		cd.set(nameBytes, 46);
		cdParts.push(cd);
		pos += cd.length;
	}

	const cdSize = pos - cdOffset;
	const eocd = new Uint8Array(22);
	const ev = new DataView(eocd.buffer);
	ev.setUint32(0, 0x06054B50, true); // end of central directory signature
	ev.setUint16(8, entries.length, true);
	ev.setUint16(10, entries.length, true);
	ev.setUint32(12, cdSize, true);
	ev.setUint32(16, cdOffset, true);

	const all = [...localParts, ...cdParts, eocd];
	const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
	let p = 0;
	for (const a of all) { out.set(a, p); p += a.length; }
	return out;
}

export function downloadSHPZip(normalizedCode: string, bounds: Bounds_LatLon): void {
	const prefix = `ATPOL_${normalizedCode}`;
	downloadBlob(
		createZip([
			{ name: `${prefix}.shp`, data: generateSHP(bounds) },
			{ name: `${prefix}.shx`, data: generateSHX(bounds) },
			{ name: `${prefix}.dbf`, data: generateDBF(normalizedCode) },
			{ name: `${prefix}.prj`, data: PRJ_WGS84 },
		]),
		`${prefix}.zip`,
		"application/zip",
	);
}

// ---- Shared download helper ----

export function downloadBlob(data: Uint8Array | string, filename: string, type: string): void {
	const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
