package trenvus.Exchange.money;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class MoneyCents {
	private MoneyCents() {}

	public static long parseToCents(String value) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException("Valor inválido");
		}
		try {
			var amount = new BigDecimal(value.trim());
			amount = amount.setScale(2, RoundingMode.UNNECESSARY);
			if (amount.signum() <= 0) {
				throw new IllegalArgumentException("Valor deve ser maior que zero");
			}
			return amount.movePointRight(2).longValueExact();
		} catch (ArithmeticException ex) {
			throw new IllegalArgumentException("Valor deve ter no máximo 2 casas decimais");
		} catch (NumberFormatException ex) {
			throw new IllegalArgumentException("Valor inválido");
		}
	}

	public static String formatCents(long cents) {
		var amount = BigDecimal.valueOf(cents).movePointLeft(2);
		return amount.setScale(2, RoundingMode.UNNECESSARY).toPlainString();
	}
}

