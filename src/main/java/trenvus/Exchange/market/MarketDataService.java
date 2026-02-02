package trenvus.Exchange.market;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class MarketDataService {
	private final RestClient restClient;
	private final List<String> instIds;
	private final Duration cacheTtl;

	private volatile CacheEntry cache = null;
	private final Map<String, CandleCacheEntry> candlesCache = new HashMap<>();

	public MarketDataService(
			@Value("${MARKET_OKX_INST_IDS:BTC-USDT,ETH-USDT,USDT-USDC}") String okxInstIdsRaw,
			@Value("${MARKET_ASSETS:}") String legacyAssetsRaw,
			@Value("${MARKET_CACHE_TTL_SECONDS:10}") long ttlSeconds
	) {
		this.restClient = RestClient.builder().baseUrl("https://www.okx.com").build();
		this.instIds = parseInstIds(okxInstIdsRaw, legacyAssetsRaw);
		this.cacheTtl = Duration.ofSeconds(Math.max(5, ttlSeconds));
	}

	public List<MarketTicker> getTickers() {
		var cached = cache;
		var now = Instant.now();
		if (cached != null && cached.expiresAt.isAfter(now)) {
			return cached.value;
		}

		synchronized (this) {
			cached = cache;
			now = Instant.now();
			if (cached != null && cached.expiresAt.isAfter(now)) {
				return cached.value;
			}

			var tickers = fetchTickers();
			cache = new CacheEntry(tickers, now.plus(cacheTtl));
			return tickers;
		}
	}

	private List<MarketTicker> fetchTickers() {
		var result = new ArrayList<MarketTicker>();
		for (var instId : instIds) {
			var t = fetchTicker(instId);
			if (t != null) {
				result.add(t);
			}
		}
		return result;
	}

	public OrderBook getOrderBook(String instId, int size) {
		int sz = Math.max(1, Math.min(50, size));

		@SuppressWarnings("unchecked")
		Map<String, Object> body = restClient.get()
				.uri(uriBuilder -> uriBuilder
						.path("/api/v5/market/books")
						.queryParam("instId", instId)
						.queryParam("sz", String.valueOf(sz))
						.build())
				.accept(MediaType.APPLICATION_JSON)
				.retrieve()
				.body(Map.class);

		if (body == null) {
			return new OrderBook(instId, List.of(), List.of(), null);
		}

		var data = asList(body.get("data"));
		if (data.isEmpty()) {
			return new OrderBook(instId, List.of(), List.of(), null);
		}

		var first = asMap(data.get(0));
		var asks = parseLevels(first.get("asks"));
		var bids = parseLevels(first.get("bids"));
		String ts = asString(first.get("ts"));
		return new OrderBook(instId, asks, bids, ts);
	}

	public List<CandlePoint> getCandles(String instId, String bar, int limit) {
		String barValue = (bar == null || bar.isBlank()) ? "1H" : bar.trim();
		int clampedLimit = Math.max(5, Math.min(100, limit));

		String key = instId + "|" + barValue + "|" + clampedLimit;
		var now = Instant.now();
		synchronized (candlesCache) {
			var cached = candlesCache.get(key);
			if (cached != null && cached.expiresAt.isAfter(now)) {
				return cached.value;
			}
		}

		var value = fetchCandles(instId, barValue, clampedLimit);
		synchronized (candlesCache) {
			candlesCache.put(key, new CandleCacheEntry(value, now.plus(cacheTtl)));
		}
		return value;
	}

	private List<CandlePoint> fetchCandles(String instId, String bar, int limit) {
		@SuppressWarnings("unchecked")
		Map<String, Object> body = restClient.get()
				.uri(uriBuilder -> uriBuilder
						.path("/api/v5/market/candles")
						.queryParam("instId", instId)
						.queryParam("bar", bar)
						.queryParam("limit", String.valueOf(limit))
						.build())
				.accept(MediaType.APPLICATION_JSON)
				.retrieve()
				.body(Map.class);

		if (body == null) {
			return List.of();
		}

		var data = asList(body.get("data"));
		if (data.isEmpty()) {
			return List.of();
		}

		var points = new ArrayList<CandlePoint>();
		for (var row : data) {
			var cols = asList(row);
			if (cols.size() < 5) continue;
			String ts = asString(cols.get(0));
			Double close = asDouble(cols.get(4));
			if (ts == null || close == null) continue;
			points.add(new CandlePoint(ts, close));
		}
		java.util.Collections.reverse(points);
		return points;
	}

	private MarketTicker fetchTicker(String instId) {
		@SuppressWarnings("unchecked")
		Map<String, Object> body = restClient.get()
				.uri(uriBuilder -> uriBuilder
						.path("/api/v5/market/ticker")
						.queryParam("instId", instId)
						.build())
				.accept(MediaType.APPLICATION_JSON)
				.retrieve()
				.body(Map.class);

		if (body == null) {
			return null;
		}

		var data = asList(body.get("data"));
		if (data.isEmpty()) {
			return null;
		}

		var first = asMap(data.get(0));
		Double last = asDouble(first.get("last"));
		if (last == null) {
			return null;
		}

		Double open24h = asDouble(first.get("open24h"));
		Double change24h = null;
		if (open24h != null && open24h > 0) {
			change24h = ((last - open24h) / open24h) * 100.0;
		}

		Double bid = asDouble(first.get("bidPx"));
		Double ask = asDouble(first.get("askPx"));
		Double high24h = asDouble(first.get("high24h"));
		Double low24h = asDouble(first.get("low24h"));
		Double vol24h = asDouble(first.get("vol24h"));
		Double volCcy24h = asDouble(first.get("volCcy24h"));
		String ts = asString(first.get("ts"));
		return new MarketTicker(instId, last, bid, ask, change24h, high24h, low24h, vol24h, volCcy24h, ts);
	}

	private static Double asDouble(Object value) {
		if (value == null) return null;
		if (value instanceof Number n) return n.doubleValue();
		try {
			return Double.parseDouble(String.valueOf(value));
		} catch (Exception e) {
			return null;
		}
	}

	private static String asString(Object value) {
		if (value == null) return null;
		String s = String.valueOf(value);
		return s.isBlank() ? null : s;
	}

	private static List<Object> asList(Object value) {
		if (value instanceof List<?> l) {
			@SuppressWarnings("unchecked")
			List<Object> out = (List<Object>) l;
			return out;
		}
		return List.of();
	}

	private static Map<String, Object> asMap(Object value) {
		if (!(value instanceof Map<?, ?> m)) {
			return Map.of();
		}
		var out = new LinkedHashMap<String, Object>();
		for (var e : m.entrySet()) {
			out.put(String.valueOf(e.getKey()), e.getValue());
		}
		return out;
	}

	private static List<Level> parseLevels(Object raw) {
		var rows = asList(raw);
		var levels = new ArrayList<Level>();
		for (var r : rows) {
			var cols = asList(r);
			if (cols.size() < 2) continue;
			Double price = asDouble(cols.get(0));
			Double size = asDouble(cols.get(1));
			if (price == null || size == null) continue;
			levels.add(new Level(price, size));
		}
		return levels;
	}

	private static List<String> parseInstIds(String okxInstIdsRaw, String legacyAssetsRaw) {
		String raw = (okxInstIdsRaw == null ? "" : okxInstIdsRaw).trim();
		if (!raw.isBlank()) {
			return java.util.Arrays.stream(raw.split(","))
					.map(String::trim)
					.filter(s -> !s.isBlank())
					.distinct()
					.toList();
		}

		String legacy = (legacyAssetsRaw == null ? "" : legacyAssetsRaw).trim();
		if (legacy.isBlank()) {
			return List.of("BTC-USDT", "ETH-USDT", "USDT-USDC");
		}

		return java.util.Arrays.stream(legacy.split(","))
				.map(String::trim)
				.filter(s -> !s.isBlank())
				.map(MarketDataService::mapLegacyAssetToInstId)
				.distinct()
				.toList();
	}

	private static String mapLegacyAssetToInstId(String asset) {
		return switch (asset.toLowerCase()) {
			case "bitcoin" -> "BTC-USDT";
			case "ethereum" -> "ETH-USDT";
			case "tether" -> "USDT-USDC";
			default -> asset.toUpperCase().contains("-") ? asset.toUpperCase() : (asset.toUpperCase() + "-USDT");
		};
	}

	private record CacheEntry(List<MarketTicker> value, Instant expiresAt) {}
	private record CandleCacheEntry(List<CandlePoint> value, Instant expiresAt) {}

	public record MarketTicker(
			String instId,
			double lastUsd,
			Double bidUsd,
			Double askUsd,
			Double change24hPercent,
			Double high24hUsd,
			Double low24hUsd,
			Double vol24hBase,
			Double vol24hQuote,
			String ts
	) {}

	public record Level(double priceUsd, double size) {}

	public record OrderBook(String instId, List<Level> asks, List<Level> bids, String ts) {}

	public record CandlePoint(String ts, double closeUsd) {}
}
