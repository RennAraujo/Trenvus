package trenvus.Exchange.money;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MoneyCentsTests {
	@Test
	void parseToCents_acceptsTwoDecimalPlaces() {
		assertEquals(1234, MoneyCents.parseToCents("12.34"));
	}

	@Test
	void parseToCents_rejectsMoreThanTwoDecimals() {
		var ex = assertThrows(IllegalArgumentException.class, () -> MoneyCents.parseToCents("1.234"));
		assertTrue(ex.getMessage().toLowerCase().contains("casas"));
	}
}

