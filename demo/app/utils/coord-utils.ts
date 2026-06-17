export function dmsToDd(deg: number, min: number, sec: number): number {
	const sign = deg < 0 ? -1 : 1;
	return sign * (Math.abs(deg) + min / 60 + sec / 3600);
}

export function ddToDmsString(decimalStr: string): string | null {
	const trimmed = decimalStr.trim();
	if (!/^([0-9]+([.,][0-9]+)?)?$/.test(trimmed)) return null;
	const num = parseFloat(trimmed.replace(/,/g, "."));
	if (isNaN(num)) return null;
	const abs = Math.abs(num);
	const sign = num < 0 ? "-" : "";
	const deg = Math.floor(abs);
	const minFull = (abs - deg) * 60;
	const min = Math.floor(minFull);
	const sec = ((minFull - min) * 60).toFixed(4);
	return `${sign}${deg}° ${min}' ${sec}"`;
}

export function parseDmsString(str: string): number | null {
	const cleaned = str
		.replace(/(?:["""″²]|''|′′)/g, " ")
		.replace(/['′¢]/g, " ")
		.replace(/[°º˚*]/g, " ")
		.replace(/\s+/g, " ")
		.replace(/,/g, ".")
		.trim();
	const parts = cleaned.split(" ").filter(p => p !== "");
	if (parts.length < 1) return null;
	const deg = parseFloat(parts[0]!);
	const min = parseFloat(parts[1]!) || 0;
	const sec = parseFloat(parts[2]!) || 0;
	if (isNaN(deg)) return null;
	const sign = deg < 0 ? -1 : 1;
	return sign * (Math.abs(deg) + min / 60 + sec / 3600);
}
