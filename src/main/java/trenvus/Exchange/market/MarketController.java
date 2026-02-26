package trenvus.Exchange.market;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/market")
public class MarketController {
	private final MarketDataService marketDataService;

	public MarketController(MarketDataService marketDataService) {
		this.marketDataService = marketDataService;
	}

	@GetMapping("/tickers")
	public ResponseEntity<List<MarketDataService.MarketTicker>> getTickers() {
		return ResponseEntity.ok(marketDataService.getAllTickers());
	}

	@GetMapping("/tickers/crypto")
	public ResponseEntity<List<MarketDataService.MarketTicker>> getCryptoTickers() {
		return ResponseEntity.ok(marketDataService.getCryptoTickers());
	}

	@GetMapping("/tickers/fiat")
	public ResponseEntity<List<MarketDataService.MarketTicker>> getFiatTickers() {
		return ResponseEntity.ok(marketDataService.getFiatTickers());
	}

	@GetMapping("/orderbook")
	public ResponseEntity<MarketDataService.OrderBook> getOrderBook(
			@RequestParam String instId,
			@RequestParam(defaultValue = "10") int size
	) {
		return ResponseEntity.ok(marketDataService.getOrderBook(instId, size));
	}

	@GetMapping("/candles")
	public ResponseEntity<List<MarketDataService.CandlePoint>> getCandles(
			@RequestParam String instId,
			@RequestParam(defaultValue = "1H") String bar,
			@RequestParam(defaultValue = "24") int limit
	) {
		return ResponseEntity.ok(marketDataService.getCandles(instId, bar, limit));
	}
}
