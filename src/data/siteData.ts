import defaultData from "./siteData.json";

let data: typeof defaultData;

try {
  const stored = localStorage.getItem("siteData_override");
  if (stored) {
    data = JSON.parse(stored);
  } else {
    data = defaultData;
  }
} catch {
  data = defaultData;
}

export default data;
