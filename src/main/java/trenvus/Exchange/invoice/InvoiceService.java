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
        QrPayload qrData = parseQrPayload(request.qrPayload());

        // Validate QR data
        if (!"INVOICE".equals(qrData.type())) {
            throw new IllegalArgumentException("Tipo de QR Code não suportado");
        }

        if (payerUserId.equals(qrData.recipientId())) {
            throw new IllegalArgumentException("Não é possível pagar sua própria invoice");
        }

        // Validate that request amount and currency match QR payload
        if (!request.amount().equals(qrData.amount())) {
            throw new IllegalArgumentException(
                String.format("Amount mismatch: QR code amount is %s %s but request amount is %s %s",
                    qrData.amount(), qrData.currency(), request.amount(), request.currency()));
        }
        
        if (!request.currency().equals(qrData.currency())) {
            throw new IllegalArgumentException(
                String.format("Currency mismatch: QR code currency is %s but request currency is %s",
                    qrData.currency(), request.currency()));
        }

        return processPaymentInternal(payerUserId, qrData.recipientId(), request);
    }
    
    /**
     * Simulate a payment for demo purposes.
     * This creates a simulated payer and processes the payment to the recipient.
     */
    @Transactional
    public InvoiceController.SimulatePayResponse simulateQrPayment(Long recipientId, PayInvoiceRequest request) {
        // Parse QR payload
        QrPayload qrData = parseQrPayload(request.qrPayload());

        // Validate QR data
        if (!"INVOICE".equals(qrData.type())) {
            throw new IllegalArgumentException("Tipo de QR Code não suportado");
        }

        // Validate that request amount and currency match QR payload
        if (!request.amount().equals(qrData.amount())) {
            throw new IllegalArgumentException(
                String.format("Amount mismatch: QR code amount is %s %s but request amount is %s %s",
                    qrData.amount(), qrData.currency(), request.amount(), request.currency()));
        }
        
        if (!request.currency().equals(qrData.currency())) {
            throw new IllegalArgumentException(
                String.format("Currency mismatch: QR code currency is %s but request currency is %s",
                    qrData.currency(), request.currency()));
        }

        // Use a simulated payer (ID 999999) for demo
        Long simulatedPayerId = 999999L;
        String simulatedPayerEmail = "payer@demo.com";
        
        // Ensure simulated payer exists
        UserEntity simulatedPayer = users.findById(simulatedPayerId)
            .orElseGet(() -> {
                UserEntity newUser = new UserEntity();
                newUser.setEmail(simulatedPayerEmail);
                newUser.setPasswordHash("DEMO");
                return users.save(newUser);
            });
        
        // Ensure simulated payer has sufficient balance
        Currency currency = Currency.valueOf(request.currency());
        ensureWalletExists(simulatedPayerId, currency);
        ensureWalletExists(recipientId, currency);
        
        // Credit the simulated payer with enough funds
        var payerWallet = wallets.findByUserIdAndCurrency(simulatedPayerId, currency).orElseThrow();
        long amountCents = request.amount().multiply(BigDecimal.valueOf(100)).longValue();
        payerWallet.setBalanceCents(payerWallet.getBalanceCents() + amountCents + 10000); // Add extra buffer
        wallets.save(payerWallet);

        // Process the payment
        processPaymentInternal(simulatedPayerId, recipientId, request);

        // Return updated recipient balance
        long newBalanceCents = wallets.findByUserIdAndCurrency(recipientId, currency)
                .map(WalletEntity::getBalanceCents)
                .orElse(0L);

        return new InvoiceController.SimulatePayResponse(
            simulatedPayerId,
            simulatedPayerEmail,
            recipientId,
            request.amount(),
            request.currency(),
            newBalanceCents
        );
    }
    
    private QrPayload parseQrPayload(String qrPayload) {
        try {
            String decoded = new String(Base64.getDecoder().decode(qrPayload));
            return objectMapper.readValue(decoded, QrPayload.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("QR Code inválido");
        }
    }
    
    private WalletResponse processPaymentInternal(Long payerUserId, Long recipientId, PayInvoiceRequest request) {
        // Convert amount to cents
        long amountCents = request.amount().multiply(BigDecimal.valueOf(100)).longValue();
        if (amountCents <= 0) {
            throw new IllegalArgumentException("Valor deve ser maior que zero");
        }

        Currency currency = Currency.valueOf(request.currency());
        
        // Ensure wallets exist
        ensureWalletExists(payerUserId, currency);
        ensureWalletExists(recipientId, currency);

        // Get wallets with locking
        Long first = payerUserId < recipientId ? payerUserId : recipientId;
        Long second = payerUserId < recipientId ? recipientId : payerUserId;

        var firstLocked = wallets.findForUpdate(first, List.of(currency));
        var secondLocked = wallets.findForUpdate(second, List.of(currency));

        var payerWallet = (payerUserId.equals(first) ? firstLocked : secondLocked).stream()
                .filter(w -> w.getCurrency() == currency)
                .findFirst()
                .orElseThrow();
        var recipientWallet = (recipientId.equals(first) ? firstLocked : secondLocked).stream()
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
        outTx.setSourceUserId(recipientId);
        transactions.save(outTx);

        var inTx = new TransactionEntity();
        inTx.setUserId(recipientId);
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
