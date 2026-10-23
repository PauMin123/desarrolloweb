package com.desweb.facturacion.dto;

public class S3UploadResponse {
    private String url;
    private String key;

    public S3UploadResponse() {
    }

    public S3UploadResponse(String url, String key) {
        this.url = url;
        this.key = key;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}
