package trenvus.Exchange.market;

import java.time.Duration;
import java.time.Instant;
import java.net.http.HttpClient;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestClient;

@Service
public class MarketDataService {
	private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MarketDataService.class);

	private final RestClient restClient;
	private final RestClient coinextClient;
	private final List<String> instIds;
	private final List<String> coinextInstIds;
	private final List<String> forexPairs;
	private final Duration cacheTtl;
	private final Duration coinextFallbackTtl;
	private final Duration forexCacheTtl;

	private volatile CacheEntry cryptoCache = null;
	private volatile CacheEntry forexCache = null;
	private final Map<String, CandleCacheEntry> candlesCache = new HashMap<>();
	private final Map<String, List<CandlePoint>> syntheticCandlesByInstId = new HashMap<>();
	private final Map<String, CoinextTickerCacheEntry> coinextTickerCache = new HashMap<>();

	public MarketDataService(
			@Value("${MARKET_OKX_INST_IDS:BTC-USDT,ETH-USDT,XRP-USDT,SOL-USDT,ADA-USDT}") String okxInstIdsRaw,
			@Value("${MARKET_ASSETS:}") String legacyAssetsRaw,
			@Value("${MARKET_FOREX_PAIRS:USD-EUR,USD-GBP,USD-JPY,USD-CNY,USD-CHF,USDT-BRL}") String forexPairsRaw,
			@Value("${MARKET_CACHE_TTL_SECONDS:10}") long ttlSeconds
	) {
		this.restClient = RestClient.builder().baseUrl("https://www.okx.com").build();
		var coinextHttpClient = HttpClient.newBuilder()
				.version(HttpClient.Version.HTTP_1_1)
				.connectTimeout(Duration.ofSeconds(6))
				.build();
		this.coinextClient = RestClient.builder()
				.baseUrl("https://api.coinext.com.br:8443")
				.requestFactory(new JdkClientHttpRequestFactory(coinextHttpClient))
				.build();
		this.instIds = parseInstIds(okxInstIdsRaw, legacyAssetsRaw);
		this.coinextInstIds = List.of("USDT-BRL");
		this.forexPairs = parseForexPairs(forexPairsRaw);
		this.cacheTtl = Duration.ofSeconds(Math.max(5, ttlSeconds));
		this.coinextFallbackTtl = Duration.ofMinutes(5);
		this.forexCacheTtl = Duration.ofMinutes(1);
	}

	public List<MarketTicker> getCryptoTickers() {
		var cached = cryptoCache;
		var now = Instant.now();
		if (cached != null && cached.expiresAt.isAfter(now)) {
			return cached.value;
		}

		synchronized (this) {
			cached = cryptoCache;
			now = Instant.now();
			if (cached != null && cached.expiresAt.isAfter(now)) {
				return cached.value;
			}

			var tickers = fetchCryptoTickers();
			cryptoCache = new CacheEntry(tickers, now.plus(cacheTtl));
			return tickers;
		}
	}

	public List<MarketTicker> getFiatTickers() {
		var cached = forexCache;
		var now = Instant.now();
		if (cached != null && cached.expiresAt.isAfter(now)) {
			return cached.value;
		}

		synchronized (this) {
			cached = forexCache;
			now = Instant.now();
			if (cached != null && cached.expiresAt.isAfter(now)) {
				return cached.value;
			}

			var tickers = fetchFiatTickers();
			forexCache = new CacheEntry(tickers, now.plus(forexCacheTtl));
			return tickers;
		}
	}

	public List<MarketTicker> getAllTickers() {
		var crypto = getCryptoTickers();
		var fiat = getFiatTickers();
		var result = new ArrayList<MarketTicker>(crypto.size() + fiat.size());
		result.addAll(crypto);
		result.addAll(fiat);
		return result;
	}

	private List<MarketTicker> fetchCryptoTickers() {
		var result = new ArrayList<MarketTicker>();
		for (var instId : instIds) {
			try {
				var t = fetchTicker(instId);
				if (t != null) {
					result.add(t);
				}
			} catch (Exception ignored) {
			}
		}
		for (var instId : coinextInstIds) {
			try {
				var t = fetchCoinextTicker(instId);
				if (t != null) {
					result.add(t);
				}
			} catch (Exception ignored) {
			}
		}
		return result;
	}

	private List<MarketTicker> fetchFiatTickers() {
		var result = new ArrayList<MarketTicker>();
		for (var pair : forexPairs) {
			try {
				var t = fetchForexTicker(pair);
				if (t != null) {
					result.add(t);
				}
			} catch (Exception ignored) {
			}
		}
		return result;
	}

	private MarketTicker fetchForexTicker(String pair) {
		// For now, return synthetic forex rates
		// In production, you would integrate with a forex API like exchangerate-api.com
		var currencies = parsePairCurrencies(pair);
		var rate = getSyntheticForexRate(pair);
		if (rate == null) return null;

		return new MarketTicker(
				pair,
				currencies.baseCurrency(),
				currencies.quoteCurrency(),
				rate,
				rate * 0.9995, // synthetic bid
				rate * 1.0005, // synthetic ask
				null, // change24hPercent
				null, // high24h
				null, // low24h
				null, // vol24hBase
				null, // vol24hQuote
				String.valueOf(System.currentTimeMillis())
		);
	}

	private Double getSyntheticForexRate(String pair) {
		// Synthetic rates for demo purposes
		// In production, integrate with a real forex API
		return switch (pair.toUpperCase()) {
			case "USD-EUR" -> 0.92;
			case "EUR-USD" -> 1.09;
			case "USD-GBP" -> 0.79;
			case "GBP-USD" -> 1.27;
			case "USD-JPY" -> 149.50;
			case "JPY-USD" -> 0.0067;
			case "USD-CNY" -> 7.19;
			case "CNY-USD" -> 0.139;
			case "USD-CHF" -> 0.88;
			case "CHF-USD" -> 1.14;
			case "USD-BRL" -> 5.05;
			case "BRL-USD" -> 0.198;
			default -> null;
		};
	}

	private static List<String> parseForexPairs(String raw) {
		String pairs = (raw == null ? "" : raw).trim();
		if (pairs.isBlank()) {
			return List.of("USD-EUR", "USD-GBP", "USD-JPY");
		}
		return java.util.Arrays.stream(pairs.split(","))
				.map(String::trim)
				.filter(s -> !s.isBlank())
				.distinct()
				.toList();
	}

	private record PairCurrencies(String baseCurrency, String quoteCurrency) {}

	private static PairCurrencies parsePairCurrencies(String pair) {
		if (pair == null) return new PairCurrencies(null, null);
		String normalized = pair.trim().toUpperCase();
		var parts = normalized.split("-");
		if (parts.length >= 2) {
			return new PairCurrencies(parts[0], parts[1]);
		}
		return new PairCurrencies(null, null);
	}

	public OrderBook getOrderBook(String instId, int size) {
		if (isCoinextInstId(instId)) {
			return fetchCoinextOrderBook(normalizeInstId(instId), size);
		}

		int sz = Math.max(1, Math.min(50, size));
		var currencies = parseInstIdCurrencies(instId);

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
			return new OrderBook(instId, currencies.baseCurrency(), currencies.quoteCurrency(), List.of(), List.of(), null);
		}

		var data = asList(body.get("data"));
		if (data.isEmpty()) {
			return new OrderBook(instId, currencies.baseCurrency(), currencies.quoteCurrency(), List.of(), List.of(), null);
		}

		var first = asMap(data.get(0));
		var asks = parseLevels(first.get("asks"));
		var bids = parseLevels(first.get("bids"));
		String ts = asString(first.get("ts"));
		return new OrderBook(instId, currencies.baseCurrency(), currencies.quoteCurrency(), asks, bids, ts);
	}

	public List<CandlePoint> getCandles(String instId, String bar, int limit) {
		// Check if it's a fiat pair
		if (isFiatPair(instId)) {
			return getFiatSyntheticCandles(instId, limit);
		}

		if (isCoinextInstId(instId)) {
			return getSyntheticCandles(normalizeInstId(instId), limit);
		}

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

	private boolean isFiatPair(String instId) {
		String normalized = normalizeInstId(instId);
		return forexPairs.contains(normalized);
	}

	private List<CandlePoint> getFiatSyntheticCandles(String instId, int limit) {
		int clampedLimit = Math.max(5, Math.min(100, limit));
		String normalized = normalizeInstId(instId);
		
		// Generate synthetic historical data based on the current rate
		Double currentRate = getSyntheticForexRate(normalized);
		if (currentRate == null) {
			return List.of();
		}

		var points = new ArrayList<CandlePoint>();
		var now = Instant.now();
		
		// Generate random walk around the current rate
		double rate = currentRate;
		for (int i = clampedLimit - 1; i >= 0; i--) {
			// Add small random variation (±0.5%)
			double variation = (Math.random() - 0.5) * 0.01;
			rate = rate * (1 + variation);
			
			String ts = String.valueOf(now.minusSeconds(i * 3600).toEpochMilli());
			points.add(new CandlePoint(ts, rate));
		}
		
		return points;
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
		var currencies = parseInstIdCurrencies(instId);

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
		return new MarketTicker(
				instId,
				currencies.baseCurrency(),
				currencies.quoteCurrency(),
				last,
				bid,
				ask,
				change24h,
				high24h,
				low24h,
				vol24h,
				volCcy24h,
				ts
		);
	}

	private MarketTicker fetchCoinextTicker(String instId) {
		String normalized = normalizeInstId(instId);
		var currencies = parseInstIdCurrencies(normalized);
		Integer instrumentId = mapCoinextInstrumentId(normalized);
		if (instrumentId == null) {
			return null;
		}

		var body = fetchCoinextL2Snapshot(instrumentId, 10);
		if (body == null) {
			try {
				Thread.sleep(150);
			} catch (InterruptedException ignored) {
			}
			body = fetchCoinextL2Snapshot(instrumentId, 1);
		}
		if (body == null) {
			return getCachedCoinextTicker(normalized);
		}

		if (body == null || body.isEmpty()) {
			return getCachedCoinextTicker(normalized);
		}

		Double last = null;
		Double bestBid = null;
		Double bestAsk = null;
		String ts = null;

		for (var row : body) {
			var cols = asList(row);
			if (cols.size() < 10) continue;

			Double lastTradePrice = asDouble(cols.get(4));
			Double price = asDouble(cols.get(6));
			Double qty = asDouble(cols.get(8));
			Integer side = asInt(cols.get(9));
			String actionTs = asString(cols.get(2));

			if (last == null && lastTradePrice != null) {
				last = lastTradePrice;
			}
			if (ts == null && actionTs != null) {
				ts = actionTs;
			}
			if (price == null || qty == null || side == null) continue;

			if (side == 0) {
				if (bestBid == null || price > bestBid) bestBid = price;
			} else if (side == 1) {
				if (bestAsk == null || price < bestAsk) bestAsk = price;
			}
		}

		if (last == null) {
			return getCachedCoinextTicker(normalized);
		}

		appendSyntheticCandle(normalized, ts, last);
		var ticker = new MarketTicker(
				normalized,
				currencies.baseCurrency(),
				currencies.quoteCurrency(),
				last,
				bestBid,
				bestAsk,
				null,
				null,
				null,
				null,
				null,
				ts
		);
		cacheCoinextTicker(normalized, ticker);
		return ticker;
	}

	private OrderBook fetchCoinextOrderBook(String instId, int size) {
		var currencies = parseInstIdCurrencies(instId);
		Integer instrumentId = mapCoinextInstrumentId(instId);
		if (instrumentId == null) {
			return new OrderBook(instId, currencies.baseCurrency(), currencies.quoteCurrency(), List.of(), List.of(), null);
		}

		int depth = Math.max(1, Math.min(50, size));
		var body = fetchCoinextL2Snapshot(instrumentId, depth);
		if (body == null) {
			try {
				Thread.sleep(150);
			} catch (InterruptedException ignored) {
			}
			body = fetchCoinextL2Snapshot(instrumentId, Math.min(10, depth));
		}
		if (body == null) {
			return new OrderBook(instId, currencies.baseCurrency(), currencies.quoteCurrency(), List.of(), List.of(), null);
		}

		if (body == null || body.isEmpty()) {
			return new OrderBook(instId, currencies.baseCurrency(), currencies.quoteCurrency(), List.of(), List.of(), null);
		}

		var asks = new ArrayList<Level>();
		var bids = new ArrayList<Level>();
		String ts = null;

		for (var row : body) {
			var cols = asList(row);
			if (cols.size() < 10) continue;
			Double price = asDouble(cols.get(6));
			Double qty = asDouble(cols.get(8));
			Integer side = asInt(cols.get(9));
			String actionTs = asString(cols.get(2));
			if (ts == null && actionTs != null) ts = actionTs;
			if (price == null || qty == null || side == null) continue;

			if (side == 0) {
				bids.add(new Level(price, qty));
			} else if (side == 1) {
				asks.add(new Level(price, qty));
			}
		}

		asks.sort(java.util.Comparator.comparingDouble(Level::price));
		bids.sort((a, b) -> Double.compare(b.price(), a.price()));

		if (asks.size() > depth) asks = new ArrayList<>(asks.subList(0, depth));
		if (bids.size() > depth) bids = new ArrayList<>(bids.subList(0, depth));

		return new OrderBook(instId, currencies.baseCurrency(), currencies.quoteCurrency(), asks, bids, ts);
	}

	private List<Object> fetchCoinextL2Snapshot(int instrumentId, int depth) {
		int safeDepth = Math.max(1, Math.min(50, depth));
		try {
			@SuppressWarnings("unchecked")
			List<Object> out = coinextClient.post()
					.uri("/AP/GetL2Snapshot")
					.contentType(MediaType.APPLICATION_JSON)
					.accept(MediaType.APPLICATION_JSON)
					.body(Map.of("OMSId", 1, "InstrumentId", instrumentId, "Depth", safeDepth))
					.retrieve()
					.body(List.class);
			return out;
		} catch (Exception e) {
			if (e instanceof RestClientResponseException rre) {
				log.warn("Coinext GetL2Snapshot failed: status={} instrumentId={} depth={}", rre.getStatusCode(), instrumentId, safeDepth);
			} else {
				log.warn("Coinext GetL2Snapshot failed: type={} instrumentId={} depth={} msg={}", e.getClass().getSimpleName(), instrumentId, safeDepth, e.getMessage());
			}
			return null;
		}
	}

	private void cacheCoinextTicker(String instId, MarketTicker ticker) {
		synchronized (coinextTickerCache) {
			coinextTickerCache.put(instId, new CoinextTickerCacheEntry(ticker, Instant.now().plus(coinextFallbackTtl)));
		}
	}

	private MarketTicker getCachedCoinextTicker(String instId) {
		var now = Instant.now();
		synchronized (coinextTickerCache) {
			var cached = coinextTickerCache.get(instId);
			if (cached == null) return null;
			if (cached.expiresAt().isBefore(now)) return null;
			return cached.ticker();
		}
	}

	private List<CandlePoint> getSyntheticCandles(String instId, int limit) {
		int clampedLimit = Math.max(5, Math.min(100, limit));
		synchronized (syntheticCandlesByInstId) {
			var series = syntheticCandlesByInstId.getOrDefault(instId, List.of());
			if (series.isEmpty()) {
				return List.of();
			}
			int from = Math.max(0, series.size() - clampedLimit);
			return new ArrayList<>(series.subList(from, series.size()));
		}
	}

	private void appendSyntheticCandle(String instId, String ts, double close) {
		String candleTs = ts != null ? ts : String.valueOf(System.currentTimeMillis());
		synchronized (syntheticCandlesByInstId) {
			var series = new ArrayList<>(syntheticCandlesByInstId.getOrDefault(instId, List.of()));
			if (!series.isEmpty() && series.get(series.size() - 1).ts().equals(candleTs)) {
				series.set(series.size() - 1, new CandlePoint(candleTs, close));
			} else {
				series.add(new CandlePoint(candleTs, close));
			}
			int maxSize = 200;
			if (series.size() > maxSize) {
				series = new ArrayList<>(series.subList(series.size() - maxSize, series.size()));
			}
			syntheticCandlesByInstId.put(instId, series);
		}
	}

	private static boolean isCoinextInstId(String instId) {
		if (instId == null) return false;
		String normalized = normalizeInstId(instId);
		return normalized.equals("USDT-BRL");
	}

	private static String normalizeInstId(String instId) {
		return instId.trim().toUpperCase().replace('/', '-');
	}

	private static Integer mapCoinextInstrumentId(String instId) {
		return switch (normalizeInstId(instId)) {
			case "USDT-BRL" -> 10;
			default -> null;
		};
	}

	private static Integer asInt(Object value) {
		if (value == null) return null;
		if (value instanceof Number n) return n.intValue();
		try {
			return Integer.parseInt(String.valueOf(value));
		} catch (Exception e) {
			return null;
		}
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
			String baseCurrency,
			String quoteCurrency,
			double last,
			Double bid,
			Double ask,
			Double change24hPercent,
			Double high24h,
			Double low24h,
			Double vol24hBase,
			Double vol24hQuote,
			String ts
	) {}

	public record Level(double price, double size) {}

	public record OrderBook(String instId, String baseCurrency, String quoteCurrency, List<Level> asks, List<Level> bids, String ts) {}

	public record CandlePoint(String ts, double close) {}

	private record CoinextTickerCacheEntry(MarketTicker ticker, Instant expiresAt) {}

	private record InstIdCurrencies(String baseCurrency, String quoteCurrency) {}

	private static InstIdCurrencies parseInstIdCurrencies(String instId) {
		if (instId == null) return new InstIdCurrencies(null, null);
		String normalized = normalizeInstId(instId);
		var parts = normalized.split("-");
		if (parts.length >= 2) {
			return new InstIdCurrencies(parts[0], parts[1]);
		}
		return new InstIdCurrencies(null, null);
	}
}
