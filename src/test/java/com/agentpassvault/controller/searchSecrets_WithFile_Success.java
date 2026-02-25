@Test
  void searchSecrets_WithFile_Success() throws Exception {
    Long tenantId = createTenant();
    userService.createAdminUser(tenantId, "admin@example.com", "password");
    String token = getAuthToken("admin@example.com", "password");

    mockMvc.perform(
        post("/api/v1/secrets")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    new CreateSecretRequest("S1", "v1", Map.of("env", "prod", "app", "web")))));

    // Search for env=prod
    SearchSecretRequest searchProd = new SearchSecretRequest(Map.of("env", "prod"));
    mockMvc
        .perform(
            post("/api/v1/secrets/search")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(searchProd)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value("S1"));
  }