// scripts/scrape-teamrankings.ts
import * as fs from "fs/promises";
import * as path from "path";
import * as cheerio from "cheerio";
const TARGETS = [
    {
        id: "opponent-rushing-tds",
        url: "https://www.teamrankings.com/nfl/stat/opponent-rushing-touchdowns-per-game"
    },
    {
        id: "opponent-passing-tds",
        url: "https://www.teamrankings.com/nfl/stat/opponent-passing-touchdowns-per-game"
    }
];
// Heuristic: parse the largest table (by row count) that looks like a team table.
function findMainTable($) {
    const tables = $("table").toArray();
    let best = null;
    let bestRows = 0;
    for (const t of tables) {
        const rows = $(t).find("tr").length;
        const headers = $(t).find("th").map((_, el) => $(el).text().trim()).get();
        const hasTeamHeader = headers.some(h => /team/i.test(h));
        if (hasTeamHeader && rows > bestRows) {
            best = t;
            bestRows = rows;
        }
    }
    return best;
}
function toNumber(s) {
    const cleaned = s.replace(/[^0-9.\-]/g, "");
    if (!cleaned)
        return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}
// Choose the main numeric column to sort by (prefer header with TD in the name,
// else first numeric column after "Team").
function chooseSortColumn(headers, rowCells) {
    // Try headers with "TD" or "touchdown"
    const tdHeaderIdx = headers.findIndex(h => /td|touchdown/i.test(h));
    if (tdHeaderIdx >= 0)
        return tdHeaderIdx;
    // Otherwise, find the first column after the "Team" header that is mostly numeric
    const teamIdx = headers.findIndex(h => /team/i.test(h));
    for (let c = 0; c < headers.length; c++) {
        if (c === teamIdx)
            continue;
        // If > 80% of rows parse as numbers, pick it
        const values = rowCells.map(r => r[c] ?? "");
        const numericCount = values.reduce((acc, v) => acc + (toNumber(v) !== null ? 1 : 0), 0);
        if (numericCount / Math.max(1, values.length) >= 0.8) {
            return c;
        }
    }
    // Fallback to second column if exists
    return Math.min(headers.length - 1, Math.max(0, teamIdx + 1));
}
async function scrapeOne(target) {
    const res = await fetch(target.url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari"
        }
    });
    if (!res.ok)
        throw new Error(`Fetch failed ${res.status} for ${target.url}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const table = findMainTable($);
    if (!table) {
        return {
            url: target.url,
            scrapedAt: new Date().toISOString(),
            note: "No suitable table found",
            columns: [],
            rows: []
        };
    }
    const headers = $(table)
        .find("thead th")
        .map((_, el) => $(el).text().trim())
        .get();
    // If no thead, infer headers from first row
    let effectiveHeaders = headers;
    const bodyRows = $(table).find("tbody tr").toArray();
    let rowCells = bodyRows.map(tr => $(tr)
        .find("th,td")
        .map((_, td) => $(td).text().replace(/\s+/g, " ").trim())
        .get());
    if (effectiveHeaders.length === 0 && rowCells.length > 0) {
        effectiveHeaders = rowCells[0];
        rowCells = rowCells.slice(1);
    }
    // Normalize header names
    effectiveHeaders = effectiveHeaders.map(h => h || "col");
    // Determine sort column
    const sortCol = chooseSortColumn(effectiveHeaders, rowCells);
    // Build rows, parsing numbers where possible
    const rows = rowCells.map(cells => {
        const obj = {};
        effectiveHeaders.forEach((h, i) => {
            const raw = cells[i] ?? "";
            const n = toNumber(raw);
            obj[h] = n !== null ? n : raw;
        });
        return obj;
    });
    // Sort DESC (most allowed -> least) by sortCol
    const sortHeader = effectiveHeaders[sortCol];
    rows.sort((a, b) => {
        const av = typeof a[sortHeader] === "number" ? a[sortHeader] : -Infinity;
        const bv = typeof b[sortHeader] === "number" ? b[sortHeader] : -Infinity;
        return bv - av;
    });
    return {
        url: target.url,
        scrapedAt: new Date().toISOString(),
        note: `Sorted by ${sortHeader} (desc)`,
        columns: effectiveHeaders,
        rows
    };
}
async function main() {
    await fs.mkdir("data", { recursive: true });
    for (const t of TARGETS) {
        const out = await scrapeOne(t);
        const outPath = path.join("data", `${t.id}.json`);
        await fs.writeFile(outPath, JSON.stringify(out, null, 2));
        console.log(`Wrote ${outPath} (${out.rows.length} rows)`);
    }
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
