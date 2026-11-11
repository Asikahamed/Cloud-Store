package com.example.demo;

import com.example.demo.dto.ProductDto;
import com.example.demo.model.Product;
import com.example.demo.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class DemoApplicationTests {

    @Autowired
    private ProductService productService;

    @Test
    void contextLoads() {
        assertNotNull(productService, "ProductService bean should be loaded");
    }

    @Test
    void testCreateAndRetrieveProduct() {
        ProductDto dto = new ProductDto(
                "Automated Test Product",
                "Created during JUnit execution",
                new BigDecimal("19.95"),
                10
        );

        Product saved = productService.createProduct(dto);
        assertNotNull(saved.getId(), "Generated ID should not be null");
        assertEquals("Automated Test Product", saved.getName());

        List<Product> results = productService.getAllProducts();
        assertFalse(results.isEmpty(), "Product list should contain saved items");

        Product retrieved = productService.getProductById(saved.getId());
        assertEquals(saved.getId(), retrieved.getId());
    }
}
