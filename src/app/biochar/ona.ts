import { parseBiocharCsv, type Batch } from "./data";

const ONA_API_BASE = process.env.ONA_API_BASE ?? "https://api.ona.io/api/v1";

export interface BiocharDataSource {
  batches: Batch[];
  source: "ona";
  formId?: string;
  error?: string;
  loadedAt: string;
}

function loadEmptyData(error: string, formId?: string): BiocharDataSource {
  return {
    batches: [],
    source: "ona",
    formId,
    error,
    loadedAt: new Date().toISOString(),
  };
}

export async function loadBiocharData(): Promise<BiocharDataSource> {
  const formId = process.env.ONA_FORM_ID;
  const apiToken = process.env.ONA_API_TOKEN;

  if (!formId || !apiToken) {
    return loadEmptyData("ONA_FORM_ID or ONA_API_TOKEN is not configured.");
  }

  try {
    const response = await fetch(`${ONA_API_BASE}/data/${formId}.csv`, {
      headers: { Authorization: `Token ${apiToken}` },
      cache: "no-store",
    });

    if (response.status === 401) {
      return loadEmptyData("ONA rejected the configured API token.", formId);
    }

    if (response.status === 403) {
      return loadEmptyData(`The configured token cannot access ONA form ${formId}.`, formId);
    }

    if (response.status === 404) {
      return loadEmptyData(`ONA form ${formId} was not found.`, formId);
    }

    if (!response.ok) {
      return loadEmptyData(`ONA returned ${response.status} ${response.statusText}.`, formId);
    }

    const csv = await response.text();
    return {
      batches: parseBiocharCsv(csv),
      source: "ona",
      formId,
      loadedAt: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ONA fetch error.";
    return loadEmptyData(`Failed to fetch ONA data: ${message}`, formId);
  }
}
