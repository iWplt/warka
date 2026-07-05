export type OrderDetailStudent = {
  full_name: string;
  phone: string | null;
  college: string | null;
  department: string | null;
  stage: string | null;
  class_name: string | null;
  graduation_year: number | null;
};

export type ParsedDeliveryFromNotes = {
  governorate?: string;
  area?: string;
  address?: string;
  landmark?: string;
  phone?: string;
  preferredDate?: string;
  gpsUrl?: string;
  coordinates?: string;
  addressLabel?: string;
};

export type ParsedOrderNotes = {
  delivery: ParsedDeliveryFromNotes;
  /** Lines that are not structured delivery fields */
  extraLines: string[];
  referenceUrls: string[];
  groupOrderLine?: string;
};

const DELIVERY_PATTERNS: Array<{
  key: keyof ParsedDeliveryFromNotes;
  ar: RegExp;
  en: RegExp;
}> = [
  { key: "governorate", ar: /^المحافظة:\s*(.+)$/, en: /^Governorate:\s*(.+)$/i },
  { key: "area", ar: /^المنطقة:\s*(.+)$/, en: /^Area:\s*(.+)$/i },
  { key: "address", ar: /^العنوان:\s*(.+)$/, en: /^Address:\s*(.+)$/i },
  { key: "landmark", ar: /^علامة دالة:\s*(.+)$/, en: /^Landmark:\s*(.+)$/i },
  { key: "phone", ar: /^هاتف التوصيل:\s*(.+)$/, en: /^Delivery phone:\s*(.+)$/i },
  { key: "preferredDate", ar: /^تاريخ التسليم المطلوب:\s*(.+)$/, en: /^Preferred delivery date:\s*(.+)$/i },
  { key: "gpsUrl", ar: /^موقع GPS:\s*(.+)$/, en: /^GPS location:\s*(.+)$/i },
  { key: "coordinates", ar: /^إحداثيات:\s*(.+)$/, en: /^Coordinates:\s*(.+)$/i },
  { key: "addressLabel", ar: /^تسمية العنوان:\s*(.+)$/, en: /^Address label:\s*(.+)$/i },
];

export function parseOrderNotes(notes: string | null | undefined): ParsedOrderNotes {
  const result: ParsedOrderNotes = {
    delivery: {},
    extraLines: [],
    referenceUrls: [],
  };

  if (!notes?.trim()) return result;

  for (const rawLine of notes.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const refMatch = line.match(/(?:مرجع تصميم|Design reference):\s*(https?:\/\/\S+)/i);
    if (refMatch) {
      result.referenceUrls.push(refMatch[1]);
      continue;
    }

    if (line.startsWith("Group order for")) {
      result.groupOrderLine = line;
      continue;
    }

    let matched = false;
    for (const pattern of DELIVERY_PATTERNS) {
      const arMatch = line.match(pattern.ar);
      const enMatch = line.match(pattern.en);
      const value = (arMatch?.[1] ?? enMatch?.[1])?.trim();
      if (value) {
        result.delivery[pattern.key] = value;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.extraLines.push(line);
    }
  }

  return result;
}

/** @deprecated Use parseOrderNotes */
export function parseDeliveryFromNotes(notes: string | null): ParsedDeliveryFromNotes {
  return parseOrderNotes(notes).delivery;
}
