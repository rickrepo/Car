/**
 * Reddit Scraper
 *
 * Uses Reddit's public .json endpoints (no API key needed).
 * Appending .json to any Reddit URL returns JSON data.
 *
 * Endpoints:
 *   - /r/{subreddit}/search.json?q={query}&restrict_sr=1&sort=new
 *   - /r/{subreddit}/new.json
 *
 * Rate limits: ~10 req/min unauthenticated, ~100 req/min with OAuth.
 * We use unauthenticated for simplicity.
 */

import { parseRedditPost, isDealViable, enrichParsedDeal } from "./parse-deal-text";

const USER_AGENT = "DealCheck-Canada-Scraper/1.0 (community project)";

interface RedditPost {
  kind: string;
  data: {
    id: string;
    title: string;
    selftext: string;
    created_utc: number;
    permalink: string;
    subreddit: string;
    score: number;
    num_comments: number;
    url: string;
  };
}

interface RedditListing {
  kind: string;
  data: {
    children: RedditPost[];
    after: string | null;
  };
}

async function fetchRedditJSON(url: string): Promise<RedditListing> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (response.status === 429) {
    console.warn("[Reddit] Rate limited. Waiting 60s...");
    await sleep(60000);
    return fetchRedditJSON(url);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Subreddits and search queries to scrape
const SEARCHES = [
  {
    subreddit: "PersonalFinanceCanada",
    queries: [
      "lease deal",
      "lease quote",
      "car lease signed",
      "lease payment monthly",
      "lease MSRP",
    ],
  },
  {
    subreddit: "askcarsales",
    queries: [
      "lease deal canada",
      "lease signed canada",
      "lease quote canada ontario",
    ],
  },
  {
    subreddit: "CarLeasing",
    queries: [
      "canada",
      "ontario lease",
      "signed lease",
    ],
  },
];

/**
 * Search a subreddit for lease deal posts.
 */
async function searchSubreddit(
  subreddit: string,
  query: string,
  limit: number = 25
) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=${limit}&t=year`;

  try {
    const data = await fetchRedditJSON(url);
    return data.data.children.map((child) => child.data);
  } catch (err) {
    console.error(`[Reddit] Error searching r/${subreddit} for "${query}":`, err);
    return [];
  }
}

/**
 * Scrape Reddit for Canadian lease deals.
 */
export async function scrapeRedditDeals() {
  const deals: ReturnType<typeof parseRedditPost>[] = [];
  const seenIds = new Set<string>();

  console.log("[Reddit] Starting scrape...");

  for (const { subreddit, queries } of SEARCHES) {
    for (const query of queries) {
      console.log(`[Reddit] Searching r/${subreddit}: "${query}"`);

      const posts = await searchSubreddit(subreddit, query);

      for (const post of posts) {
        // Skip duplicates
        if (seenIds.has(post.id)) continue;
        seenIds.add(post.id);

        // Skip very short posts (probably not deal details)
        if ((post.selftext?.length || 0) < 30 && post.title.length < 40) continue;

        // Parse the post
        const parsed = parseRedditPost(post.title, post.selftext || "");
        parsed.source_url = `https://www.reddit.com${post.permalink}`;
        parsed.source_platform = "reddit";
        parsed.raw_title = post.title;
        parsed.raw_body = (post.selftext || "").slice(0, 2000);
        parsed.posted_at = new Date(post.created_utc * 1000).toISOString();

        if (isDealViable(parsed)) {
          deals.push(enrichParsedDeal(parsed));
        }
      }

      // Be nice — wait between requests (10 req/min unauthenticated)
      await sleep(7000);
    }
  }

  console.log(`[Reddit] Done. ${deals.length} viable deals from ${seenIds.size} posts scanned.`);
  return deals;
}
