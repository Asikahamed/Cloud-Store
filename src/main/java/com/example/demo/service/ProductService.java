package com.example.demo.service;

import com.example.demo.dto.ProductDto;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        log.debug("Fetching all products");
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        log.debug("Fetching product with id: {}", id);
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public List<Product> searchProducts(String name) {
        log.debug("Searching products containing: {}", name);
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    @Transactional
    public Product createProduct(ProductDto dto) {
        log.info("Creating new product: {}", dto.getName());
        Product product = new Product(
                dto.getName(),
                dto.getDescription(),
                dto.getPrice(),
                dto.getStockQuantity()
        );
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductDto dto) {
        log.info("Updating product id: {}", id);
        Product product = getProductById(id);
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        log.info("Deleting product id: {}", id);
        Product product = getProductById(id);
        productRepository.delete(product);
    }
}
