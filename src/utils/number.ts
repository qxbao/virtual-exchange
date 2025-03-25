export const bigNumberFormat = (num: number) => {
    if (num > 1_000_000_000) {
        return (num / 1_000_000_000).toLocaleString("en-us", {minimumFractionDigits: 2}) + "B";
    } else if (num > 1_000_000) {
        return (num / 1_000_000).toLocaleString("en-us", {minimumFractionDigits: 2}) + "M";
    } else if (num > 1_000) {
        return (num / 1_000).toLocaleString("en-us", {minimumFractionDigits: 2}) + "K";
    }
    return num;
}