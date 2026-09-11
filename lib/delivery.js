import wilayasData from "@/public/data/wilayas.json";

export function getWilayas() {
  return wilayasData.wilayas || [];
}

export function getWilayaByName(name) {
  if (!name) return null;
  const needle = String(name).trim().toLowerCase();
  return getWilayas().find(
    (w) => w.name.toLowerCase() === needle || w.nameAr === name || w.code === name
  ) || null;
}

export function getDeliveryFee(wilayaName, deliveryType) {
  const wilaya = getWilayaByName(wilayaName);
  if (!wilaya) return 0;
  return deliveryType === "agency" ? wilaya.officeFee : wilaya.homeFee;
}
