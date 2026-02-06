/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault;

import com.agentpassvault.config.VaultUiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties(VaultUiProperties.class)
@EnableScheduling
public class AgentPassVaultApplication {

  public static void main(String[] args) {

    SpringApplication.run(AgentPassVaultApplication.class, args);
  }
}
