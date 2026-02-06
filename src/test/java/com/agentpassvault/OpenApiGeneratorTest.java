/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.BufferedWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiGeneratorTest {

  @Autowired private MockMvc mockMvc;

  @Test
  void generateOpenApiYaml() throws Exception {
    mockMvc
        .perform(get("/v3/api-docs.yaml"))
        .andExpect(status().isOk())
        .andDo(
            result -> {
              String content = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
              try (BufferedWriter writer =
                  Files.newBufferedWriter(Paths.get("docs/openapi.yaml"), StandardCharsets.UTF_8)) {
                writer.write(content);
              }
            });
  }
}
