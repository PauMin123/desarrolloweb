package com.desweb.facturacion.service;

import com.desweb.facturacion.dto.S3UploadResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);

    private final S3Client s3Client;

    @Value("${aws.s3.bucket.name}")
    private String bucketName;

    @Value("${aws.region:us-east-2}")
    private String region;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"
    );

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public S3UploadResponse uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de imagen no puede estar vacío");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, WEBP, GIF)");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generar clave única con UUID
        String s3Key = "productos/" + UUID.randomUUID() + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Construir URL pública directa
            String publicUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, s3Key);
            log.info("Imagen subida exitosamente a S3: {}", publicUrl);

            return new S3UploadResponse(publicUrl, s3Key);

        } catch (IOException e) {
            log.error("Error al leer el stream del archivo para S3: {}", e.getMessage());
            throw new RuntimeException("Error al procesar el archivo de imagen: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error al subir archivo a AWS S3: {}", e.getMessage());
            throw new RuntimeException("Error al comunicarse con AWS S3: " + e.getMessage(), e);
        }
    }

    public void deleteImage(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) {
            return;
        }

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();
            s3Client.deleteObject(deleteRequest);
            log.info("Objeto eliminado de S3: {}", s3Key);
        } catch (Exception e) {
            log.warn("No se pudo eliminar el objeto de S3 ({}): {}", s3Key, e.getMessage());
        }
    }
}
