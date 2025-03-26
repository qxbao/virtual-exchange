export function bigNumberFormat(num: number) {
    if (num > 1_000_000_000) {
        return (num / 1_000_000_000).toLocaleString("en-us", {minimumFractionDigits: 2}) + "B";
    } else if (num > 1_000_000) {
        return (num / 1_000_000).toLocaleString("en-us", {minimumFractionDigits: 2}) + "M";
    } else if (num > 1_000) {
        return (num / 1_000).toLocaleString("en-us", {minimumFractionDigits: 2}) + "K";
    }
    return num.toLocaleString("en-us", {
        maximumFractionDigits: 2
    });
}

export function roundToDecimals(n: number, decimals: number) {
    const log10 = n ? Math.floor(Math.log10(n)) : 0;
    const div = log10 < 0 ? Math.pow(10, decimals - log10 - 1) : Math.pow(10, decimals);
  
    return (Math.round(n * div) / div).toLocaleString("en-us", {
        maximumFractionDigits: 10
    });
}

export function numberFormatRouter(n: number ) {
    if (n < 1) return roundToDecimals(n, 1);
    else return bigNumberFormat(n);
}