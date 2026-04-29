package com.verifyauth.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class GeoCodingService {

    private static final String NOMINATIM_URL =
        "https://nominatim.openstreetmap.org/reverse" +
        "?lat={lat}&lon={lon}&format=json&addressdetails=1";

    public Map getAddress(double latitude, double longitude) {

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "ProductAuthentication/1.0 (support@thegrehvitti.com)");

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                NOMINATIM_URL,
                HttpMethod.GET,
                entity,
                Map.class,
                latitude,
                longitude
        );

        if (response.getStatusCode() == HttpStatus.OK) {
            Map body = response.getBody();
            if (body != null && body.containsKey("address")) {
                return (Map) body.get("address");
            }
        }

        return null;
    }
}
