/*
 * Copyright (C) 2026 Tsung-en Hsiao
 *
 * Licensed under the GNU Affero General Public License v3.0 or later.
 * See LICENSE file in the project root for full license information.
 */
package com.agentpassvault.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum RequestStatus {
  pending("pending"),
  fulfilled("fulfilled"),
  rejected("rejected"),
  abandoned("abandoned");

  private final String value;

  RequestStatus(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }
}
