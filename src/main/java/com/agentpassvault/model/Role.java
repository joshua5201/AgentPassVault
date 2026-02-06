/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
  ADMIN("ADMIN"),
  AGENT("AGENT");

  private final String value;

  Role(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }

  public static Role fromString(String text) {
    for (Role b : Role.values()) {
      if (b.value.equalsIgnoreCase(text)) {
        return b;
      }
    }
    throw new IllegalArgumentException("No constant with text " + text + " found");
  }
}
