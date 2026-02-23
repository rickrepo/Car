/**
 * Leasehackr Forum Scraper
 *
 * Leasehackr runs on Discourse, which has a public JSON API.
 * The "Signed Deals & Tips" category has structured deal titles like:
 *   "SIGNED! 2026 Rubicon X - $72k MSRP, $314/mo, $340 DAS 24/10k"
 *
 * Endpoints:
 *   - /c/deals-and-tips/6.json — category listing
 *   - /tag/canada.json — Canada-tagged posts
 *   - /t/{slug}/{id}.json — individual topic
 */

import { parseLeasehackrTitle, isDealViable, enrichParsedDeal } from "./parse-deal-text";

const BASE_URL = "https://forum.leasehackr.com";
const USER_AGENT = "DealCheck-Canada-Scraper/1.0 (community project)";

interface DiscourseTopic {
  id: number;
  title: string;
  slug: string;
  created_at: string;
  views: number;
  reply_count: number;
  tags: string[];
}

interface DiscourseResponse {
  topic_list: {
    topics: DiscourseTopic[];
    more_topics_url?: string;
  };
}

async function fetchJSON(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch signed deals from the "Signed Deals & Tips" category.
 * Filters for Canada-related posts.
 */
export async function scrapeLeasehackrDeals(maxPages: number = 3) {
  const deals: ReturnType<typeof parseLeasehackrTitle>[] = [];
  let page = 0;

  console.log("[Leasehackr] Fetching signed deals...");

  while (page < maxPages) {
    try {
      const url =
        page === 0
          ? `${BASE_URL}/c/deals-and-tips/6.json`
          : `${BASE_URL}/c/deals-and-tips/6.json?page=${page}`;

      const data = (await fetchJSON(url)) as DiscourseResponse;
      const topics = data.topic_list?.topics || [];

      if (topics.length === 0) break;

      for (const topic of topics) {
        // Check if Canada-related
        const isCanada =
          topic.tags?.some((t) =>
            /canada|canadian|ontario|toronto|vancouver|bc|alberta|quebec/i.test(t)
          ) || /canada|ontario|toronto|vancouver|calgary|montreal/i.test(topic.title);

        // Parse the title
        const parsed = parseLeasehackrTitle(topic.title);
        parsed.source_url = `${BASE_URL}/t/${topic.slug}/${topic.id}`;
        parsed.source_platform = "leasehackr";
        parsed.raw_title = topic.title;
        parsed.raw_body = "";
        parsed.posted_at = topic.created_at;

        // Tag as Canada if detected
        if (isCanada && !parsed.province) {
          parsed.province = "ON"; // Default to Ontario for tagged Canada posts
        }

        // Only include if we got enough data
        if (isDealViable(parsed)) {
          deals.push(enrichParsedDeal(parsed));
        }
      }

      console.log(
        `[Leasehackr] Page ${page + 1}: ${topics.length} topics, ${deals.length} viable deals so far`
      );

      page++;
      await sleep(1500); // Be nice to the server
    } catch (err) {
      console.error(`[Leasehackr] Error on page ${page}:`, err);
      break;
    }
  }

  // Also fetch Canada-tagged posts specifically
  try {
    console.log("[Leasehackr] Fetching Canada-tagged posts...");
    const canadaData = (await fetchJSON(
      `${BASE_URL}/tag/canada.json`
    )) as DiscourseResponse;

    for (const topic of canadaData.topic_list?.topics || []) {
      const parsed = parseLeasehackrTitle(topic.title);
      parsed.source_url = `${BASE_URL}/t/${topic.slug}/${topic.id}`;
      parsed.source_platform = "leasehackr";
      parsed.raw_title = topic.title;
      parsed.raw_body = "";
      parsed.posted_at = topic.created_at;
      if (!parsed.province) parsed.province = "ON";

      if (isDealViable(parsed)) {
        // Avoid duplicates by URL
        if (!deals.some((d) => d.source_url === parsed.source_url)) {
          deals.push(enrichParsedDeal(parsed));
        }
      }
    }
  } catch (err) {
    console.error("[Leasehackr] Error fetching Canada tags:", err);
  }

  console.log(`[Leasehackr] Done. ${deals.length} total viable deals.`);
  return deals;
}
