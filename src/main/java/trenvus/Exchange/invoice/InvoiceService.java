package trenvus.Exchange.invoice;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import trenvus.Exchange.invoice.InvoiceController.GenerateInvoiceRequest;
import trenvus.Exchange.invoice.InvoiceController.InvoiceQrResponse;
import trenvus.Exchange.invoice.InvoiceController.PayInvoiceRequest;
import trenvus.Exchange.tx.TransactionEntity;
import trenvus.Exchange.tx.TransactionRepository;
import trenvus.Exchange.tx.TransactionType;
import trenvus.Exchange.user.UserEntity;
import trenvus.Exchange.user.UserRepository;
import trenvus.Exchange.wallet.Currency;
import trenvus.Exchange.wallet.WalletEntity;
import trenvus.Exchange.wallet.WalletRepository;
import trenvus.Exchange.wallet.WalletController.WalletResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class InvoiceService {
    private final WalletRepository wallets;
    private final TransactionRepository transactions;
    private final UserRepository users;
    private final ObjectMapper objectMapper;

    public InvoiceService(WalletRepository wallets, TransactionRepository transactions, 
                         UserRepository users, ObjectMapper objectMapper) {
        this.wallets = wallets;
        this.transactions = transactions;
        this.users = users;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public WalletResponse processQrPayment(Long payerUserId, PayInvoiceRequest request) {
        // Parse QR payload
        QrPayload qrData;
        try {
            String decoded = new String(Base64.getDecoder().decode(request.qrPayload()));
            qrData = objectMapper.readValue(decoded, QrPayload.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("QR Code inválido");
        }

        // Validate QR data
        if (!"INVOICE".equals(qrData.type())) {
            throw new IllegalArgumentException("Tipo de QR Code não suportado");
        }

        if (payerUserId.equals(qrData.recipientId())) {
            throw new IllegalArgumentException("Não é possível pagar sua própria invoice");
        }

        // Convert amount to cents
        long amountCents = request.amount().multiply(BigDecimal.valueOf(100)).longValue();
        if (amountCents <= 0) {
            throw new IllegalArgumentException("Valor deve ser maior que zero");
        }

        Currency currency = Currency.valueOf(request.currency());
        
        // Ensure wallets exist
        ensureWalletExists(payerUserId, currency);
        ensureWalletExists(qrData.recipientId(), currency);

        // Get wallets with locking
        Long first = payerUserId < qrData.recipientId() ? payerUserId : qrData.recipientId();
        Long second = payerUserId < qrData.recipientId() ? qrData.recipientId() : payerUserId;

        var firstLocked = wallets.findForUpdate(first, List.of(currency));
        var secondLocked = wallets.findForUpdate(second, List.of(currency));

        var payerWallet = (payerUserId.equals(first) ? firstLocked : secondLocked).stream()
                .filter(w -> w.getCurrency() == currency)
                .findFirst()
                .orElseThrow();
        var recipientWallet = (qrData.recipientId().equals(first) ? firstLocked : secondLocked).stream()
                .filter(w -> w.getCurrency() == currency)
                .findFirst()
                .orElseThrow();

        // Check balance
        if (payerWallet.getBalanceCents() < amountCents) {
            throw new IllegalArgumentException("Saldo insuficiente");
        }

        // Process transfer
        payerWallet.setBalanceCents(payerWallet.getBalanceCents() - amountCents);
        recipientWallet.setBalanceCents(Math.addExact(recipientWallet.getBalanceCents(), amountCents));

        // Create transactions
        var outTx = new TransactionEntity();
        outTx.setUserId(payerUserId);
        outTx.setType(TransactionType.TRANSFER_TRV_OUT);
        if (currency == Currency.USD) {
            outTx.setUsdAmountCents(amountCents);
        } else {
            outTx.setTrvAmountCents(amountCents);
        }
        outTx.setSourceUserId(qrData.recipientId());
        transactions.save(outTx);

        var inTx = new TransactionEntity();
        inTx.setUserId(qrData.recipientId());
        inTx.setType(TransactionType.TRANSFER_TRV_IN);
        if (currency == Currency.USD) {
            inTx.setUsdAmountCents(amountCents);
        } else {
            inTx.setTrvAmountCents(amountCents);
        }
        inTx.setSourceUserId(payerUserId);
        transactions.save(inTx);

        // Return updated payer wallet
        long usdCents = wallets.findByUserIdAndCurrency(payerUserId, Currency.USD)
                .map(WalletEntity::getBalanceCents)
                .orElse(0L);
        long trvCents = wallets.findByUserIdAndCurrency(payerUserId, Currency.TRV)
                .map(WalletEntity::getBalanceCents)
                .orElse(0L);

        return new WalletResponse(usdCents, trvCents);
    }

    public InvoiceQrResponse generateQrData(Long userId, String userEmail, String userNickname, 
                                           GenerateInvoiceRequest request) {
        String qrCodeId = UUID.randomUUID().toString();
        
        var payload = new QrPayload(
                "INVOICE",
                qrCodeId,
                userId,
                userEmail,
                userNickname,
                request.amount(),
                request.currency(),
                request.description(),
                Instant.now().toEpochMilli()
        );

        String jsonPayload;
        try {
            jsonPayload = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erro ao gerar QR Code", e);
        }

        String base64Payload = Base64.getEncoder().encodeToString(jsonPayload.getBytes());

        return new InvoiceQrResponse(
                base64Payload,
                qrCodeId,
                request.amount(),
                request.currency(),
                userEmail,
                userNickname
        );
    }

    private void ensureWalletExists(Long userId, Currency currency) {
        wallets.findByUserIdAndCurrency(userId, currency)
                .orElseGet(() -> {
                    var w = new WalletEntity();
                    w.setUserId(userId);
                    w.setCurrency(currency);
                    w.setBalanceCents(0L);
                    return wallets.save(w);
                });
    }

    public record QrPayload(
            String type,
            String qrCodeId,
            Long recipientId,
            String recipientEmail,
            String recipientNickname,
            BigDecimal amount,
            String currency,
            String description,
            Long timestamp
    ) {}
}
