const helper = {
  shortName: (val: any) => {
    if (!val || val.length == 0) return "";

    const splt = val.split(" ");
    return `${splt[0][0]}${splt.length > 1 ? splt[1][0] || "" : ""}`;
  },
  isEmptyObj: (obj: any) => {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
    }

    return JSON.stringify(obj) === JSON.stringify({});
  },
  uuidv4: () => {
    return crypto.randomUUID();
  },
  toReadableNumber(val: number): string {
    return helper.toCurrency(val, { currency: "" }).replace(".00", "");
  },
  debounce: <T extends (...args: any[]) => void>(func: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    }) as T;
  },
  abbreviateNumber: (num: number, decimals: number = 1): string => {
    if (num === 0) return "0";

    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";

    const abbreviations = [
      { value: 1e12, suffix: "T" },
      { value: 1e9, suffix: "B" },
      { value: 1e6, suffix: "M" },
      { value: 1e3, suffix: "K" },
    ];

    for (const { value, suffix } of abbreviations) {
      if (absNum >= value) {
        return (
          sign +
          (absNum / value)
            .toFixed(decimals)
            .replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") +
          suffix
        );
      }
    }

    return sign + absNum.toString();
  },
  toCurrency: (
    val: number | string,
    format?: { currency?: string; precision?: number; abbreviate?: boolean }
  ) => {
    const { currency = "₦ ", precision = 2, abbreviate = false } = format || {};

    if (abbreviate && typeof val === "number" && Math.abs(val) >= 1000) {
      return currency + helper.abbreviateNumber(val, precision);
    }

    val = precision ? helper.formatAmt(val, precision) : val;

    if (!val) return `${currency} 0.0`;
    return (
      `${currency} ` +
      (val as number).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,")
    );
  },
  formatAmt: (amt: number | string, precision = 2) => {
    if (typeof amt !== "number" && typeof amt !== "string") {
      return parseFloat("0.00");
    }

    let amtFloat = parseFloat(amt as any);
    if (isNaN(amtFloat)) {
      return parseFloat("0.00");
    }

    // Format the amount to the specified precision
    let formattedAmt = amtFloat.toFixed(precision);

    return parseFloat(formattedAmt);
  },
};

export default helper;
