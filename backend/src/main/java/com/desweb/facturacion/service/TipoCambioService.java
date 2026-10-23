package com.desweb.facturacion.service;

import com.desweb.facturacion.dto.TipoCambioDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TipoCambioService {

    private static final Logger log = LoggerFactory.getLogger(TipoCambioService.class);
    private static final String BANGUAT_URL = "https://banguat.gob.gt/variables/ws/TipoCambio.asmx";
    private static final BigDecimal FALLBACK_RATE = new BigDecimal("7.80");

    public TipoCambioDto getTipoCambioDia() {
        String soapRequest = """
                <?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soap:Body>
                    <TipoCambioDia xmlns="http://www.banguat.gob.gt/variables/ws/" />
                  </soap:Body>
                </soap:Envelope>
                """;

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(4))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BANGUAT_URL))
                    .header("Content-Type", "text/xml; charset=utf-8")
                    .header("SOAPAction", "http://www.banguat.gob.gt/variables/ws/TipoCambioDia")
                    .timeout(Duration.ofSeconds(4))
                    .POST(HttpRequest.BodyPublishers.ofString(soapRequest))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String xml = response.body();
                Pattern ventaPattern = Pattern.compile("<venta>([0-9.]+)</venta>");
                Pattern compraPattern = Pattern.compile("<compra>([0-9.]+)</compra>");
                Pattern fechaPattern = Pattern.compile("<fecha>([^<]+)</fecha>");

                Matcher ventaMatcher = ventaPattern.matcher(xml);
                Matcher compraMatcher = compraPattern.matcher(xml);
                Matcher fechaMatcher = fechaPattern.matcher(xml);

                BigDecimal venta = ventaMatcher.find() ? new BigDecimal(ventaMatcher.group(1)) : FALLBACK_RATE;
                BigDecimal compra = compraMatcher.find() ? new BigDecimal(compraMatcher.group(1)) : FALLBACK_RATE;
                String fecha = fechaMatcher.find() ? fechaMatcher.group(1) : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

                return new TipoCambioDto(true, fecha, compra, venta, "GTQ");
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener tipo de cambio desde Banguat WS: {}. Usando fallback 7.80", e.getMessage());
        }

        // Fallback seguro si falla el WS externo
        String hoy = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        return new TipoCambioDto(true, hoy, FALLBACK_RATE, FALLBACK_RATE, "GTQ");
    }
}
