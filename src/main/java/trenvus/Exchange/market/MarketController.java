package trenvus.Exchange.market;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
		return ResponseEntity.ok(marketDataService.getTickers());
	}
}

