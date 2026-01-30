package trenvus.Exchange.market;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class MarketDataService {
	private final RestClient restClient;
	private final List<String> assets;
	private final Duration cacheTtl;

	private volatile CacheEntry cache = null;

	public MarketDataService(
			@Value("${MARKET_ASSETS:bitcoin,ethereum,tether}") String assetsRaw,
			@Value("${MARKET_CACHE_TTL_SECONDS:60}") long ttlSeconds
	) {
		this.restClient = RestClient.builder().baseUrl("https://api.coingecko.com/api/v3").build();
		this.assets = parseAssets(assetsRaw);
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
		String ids = String.join(",", assets);
		@SuppressWarnings("unchecked")
		Map<String, Object> body = restClient.get()
				.uri(uriBuilder -> uriBuilder
						.path("/simple/price")
						.queryParam("ids", ids)
						.queryParam("vs_currencies", "usd")
						.queryParam("include_24hr_change", "true")
						.build())
				.accept(MediaType.APPLICATION_JSON)
				.retrieve()
				.body(Map.class);

		var result = new ArrayList<MarketTicker>();
		if (body == null) {
			return result;
		}

		for (var assetId : assets) {
			Object raw = body.get(assetId);
			if (!(raw instanceof Map<?, ?> assetMap)) {
				continue;
			}
			Double price = asDouble(assetMap.get("usd"));
			Double change = asDouble(assetMap.get("usd_24h_change"));
			if (price == null) {
				continue;
			}
			result.add(new MarketTicker(assetId, price, change));
		}
		return result;
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

	private static List<String> parseAssets(String raw) {
		if (raw == null || raw.isBlank()) {
			return List.of("bitcoin", "ethereum", "tether");
		}
		return java.util.Arrays.stream(raw.split(","))
				.map(String::trim)
				.filter(s -> !s.isBlank())
				.distinct()
				.toList();
	}

	private record CacheEntry(List<MarketTicker> value, Instant expiresAt) {}

	public record MarketTicker(String assetId, double priceUsd, Double change24hPercent) {}
}

