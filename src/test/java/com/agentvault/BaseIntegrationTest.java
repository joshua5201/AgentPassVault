package com.agentvault;

import com.agentvault.repository.RequestRepository;
import com.agentvault.repository.SecretRepository;
import com.agentvault.repository.TenantRepository;
import com.agentvault.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected TenantRepository tenantRepository;

    @Autowired
    protected SecretRepository secretRepository;

    @Autowired
    protected RequestRepository requestRepository;

    @BeforeEach
    void clearDatabase() {
        userRepository.deleteAll();
        tenantRepository.deleteAll();
        secretRepository.deleteAll();
        requestRepository.deleteAll();
    }
}
